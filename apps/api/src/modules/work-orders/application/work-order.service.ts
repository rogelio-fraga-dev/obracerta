import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ProposalStatus,
  UserType,
  WorkOrderStatus,
  canHireServices,
  type CreateWorkOrderInput,
  type PaginatedResponse,
  type Proposal,
  type SubmitProposalInput,
  type WorkOrder,
  type WorkOrderQuery,
  type WorkOrdersPage,
  type WorkUrgency,
} from "@obracerta/shared";
import { AuditService } from "../../audit/application/audit.service.js";
import { BillingService } from "../../billing/application/billing.service.js";
import { Feature } from "../../entitlements/domain/entitlements.js";
import { InboxService } from "../../notifications/application/inbox.service.js";
import { STORAGE_PORT, type StoragePort } from "../../storage/domain/storage.port.js";
import { UsersService } from "../../users/application/users.service.js";
import {
  canAcceptWorkOrder,
  canSubmitProposal,
  dignityFloorCentavos,
  meetsDignityFloor,
  visibleProposals,
  workOrderDeadline,
} from "../domain/work-order-rules.js";
import {
  WORK_ORDER_REPOSITORY,
  type WorkOrderRepository,
} from "../domain/ports/work-order.repository.js";
import {
  PROPOSAL_REPOSITORY,
  type ProposalRepository,
} from "../domain/ports/proposal.repository.js";
import { WorkOrderScheduler } from "./work-order.scheduler.js";

/** Formatos aceitos na foto da obra → extensão do objeto no storage. */
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

@Injectable()
export class WorkOrderService {
  constructor(
    @Inject(WORK_ORDER_REPOSITORY) private readonly orders: WorkOrderRepository,
    @Inject(PROPOSAL_REPOSITORY) private readonly proposals: ProposalRepository,
    private readonly users: UsersService,
    private readonly scheduler: WorkOrderScheduler,
    private readonly audit: AuditService,
    private readonly billing: BillingService,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    private readonly inbox: InboxService,
  ) {}

  /** Contratante abre uma obra; a urgência define a expiração (job BullMQ). */
  async openWorkOrder(contractorId: string, input: CreateWorkOrderInput): Promise<WorkOrder> {
    const user = await this.users.findById(contractorId);
    if (!user || !canHireServices(user.tipo)) {
      throw new BadRequestException("Apenas contratantes e empresas abrem obras.");
    }
    const expiraEm = workOrderDeadline(input.urgencia as WorkUrgency, new Date()).toISOString();
    const order = await this.orders.create({
      contractorId,
      cidadeId: input.cidadeId,
      especialidade: input.especialidade,
      titulo: input.titulo,
      descricao: input.descricao ?? null,
      urgencia: input.urgencia,
      bairro: input.bairro ?? null,
      geo: input.geo ?? null,
      expiraEm,
    });
    await this.scheduler.scheduleExpiry(order.id, expiraEm);
    await this.audit.record({
      atorUserId: contractorId,
      acao: "OBRA_ABERTA",
      entidade: "work_order",
      entidadeId: order.id,
      dados: { especialidade: input.especialidade, urgencia: input.urgencia },
    });
    return order;
  }

  /**
   * Dono anexa uma foto ilustrativa à obra (enquanto ABERTA). A imagem vai pro
   * storage; persistimos só a URL — mesmo padrão da foto do pedido (§8.4).
   */
  async uploadFoto(
    contractorId: string,
    id: string,
    file: { buffer: Buffer; mimetype: string },
  ): Promise<WorkOrder> {
    const order = await this.getOrderOr404(id);
    if (order.contractorId !== contractorId) {
      throw new ForbiddenException("Esta obra não é sua.");
    }
    if (order.status !== WorkOrderStatus.ABERTA) {
      throw new ConflictException("Só dá para anexar foto enquanto a obra está aberta.");
    }
    const ext = ALLOWED_IMAGE_TYPES[file.mimetype];
    if (!ext) {
      throw new BadRequestException("Formato inválido. Use JPEG, PNG ou WebP.");
    }
    const key = `work-orders/${id}/foto-${Date.now()}.${ext}`;
    const url = await this.storage.putObject(key, file.buffer, file.mimetype);
    const updated = await this.orders.setFoto(id, url);
    if (!updated) throw new NotFoundException("Obra não encontrada.");
    return updated;
  }

  /** Obras do contratante autenticado (todos os status), mais recentes primeiro. */
  listMine(contractorId: string): Promise<WorkOrder[]> {
    return this.orders.listForContractor(contractorId);
  }

  /** Descoberta: obras abertas (filtro por cidade/especialidade), paginado. */
  async listOpen(query: WorkOrderQuery): Promise<WorkOrdersPage> {
    const { page, limit } = query;
    const { items, total } = await this.orders.listOpen({
      cidadeId: query.cidadeId ?? null,
      especialidade: query.especialidade ?? null,
      limit,
      offset: (page - 1) * limit,
    });
    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  getWorkOrder(id: string): Promise<WorkOrder> {
    return this.getOrderOr404(id);
  }

  findAll(): Promise<WorkOrder[]> {
    return this.orders.findAll();
  }

  async findAllPaginated(page: number, limit: number): Promise<PaginatedResponse<WorkOrder>> {
    const offset = (page - 1) * limit;
    const { items, total } = await this.orders.findAllPaginated(limit, offset);
    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Profissional envia (ou atualiza) um lance. Recusa lances abaixo do piso de
   * dignidade (fração da média), recalcula o piso e o persiste na obra.
   */
  async submitProposal(
    professionalId: string,
    workOrderId: string,
    input: SubmitProposalInput,
  ): Promise<Proposal> {
    const user = await this.users.findById(professionalId);
    if (!user || user.tipo !== UserType.PROFISSIONAL) {
      throw new BadRequestException("Apenas profissionais enviam lances.");
    }
    // Gating de plano: dar lances exige a feature SUBMIT_BID (planos pagos, Pro+).
    // A trava real é aqui — a UI só esconde o botão.
    if (!(await this.billing.can(professionalId, Feature.SUBMIT_BID))) {
      throw new ForbiddenException(
        "Dar lances em obras é dos planos pagos (Pro ou Especialista). Faça upgrade em Cobranças.",
      );
    }
    const order = await this.getOrderOr404(workOrderId);
    if (order.contractorId === professionalId) {
      throw new ForbiddenException("Você não pode dar lance na própria obra.");
    }
    if (!canSubmitProposal(order.status)) {
      throw new ConflictException("Esta obra não está aberta a lances.");
    }

    const valores = await this.proposals.valuesForWorkOrder(workOrderId);
    if (!meetsDignityFloor(input.valorCentavos, dignityFloorCentavos(valores))) {
      throw new BadRequestException("Lance abaixo do piso de dignidade desta obra.");
    }

    const proposal = await this.proposals.upsert({
      workOrderId,
      professionalId,
      valorCentavos: input.valorCentavos,
      prazoDias: input.prazoDias ?? null,
      mensagem: input.mensagem ?? null,
    });

    // recalcula o piso já com o novo lance e persiste (para exibição/validações)
    const atualizados = await this.proposals.valuesForWorkOrder(workOrderId);
    await this.orders.setPiso(workOrderId, dignityFloorCentavos(atualizados));

    await this.audit.record({
      atorUserId: professionalId,
      acao: "LANCE_ENVIADO",
      entidade: "work_order",
      entidadeId: workOrderId,
      dados: { valorCentavos: input.valorCentavos },
    });
    await this.inbox.record(order.contractorId, "OBRA", "Novo lance na sua obra", {
      corpo: `"${order.titulo}" recebeu um lance. Compare as propostas com calma.`,
      link: `/obras/${order.id}`,
    });
    return proposal;
  }

  /** Lances visíveis ao solicitante: o dono vê todos; o profissional, só o seu (sigilo §16). */
  async listProposals(userId: string, workOrderId: string): Promise<Proposal[]> {
    const order = await this.getOrderOr404(workOrderId);
    const all = await this.proposals.listForWorkOrder(workOrderId);
    return visibleProposals(userId, order.contractorId, all);
  }

  /**
   * Contratante adjudica a obra a um lance: obra ABERTA → ADJUDICADA, o lance vira
   * ACEITA e os demais ENVIADA são RECUSADA.
   */
  async acceptProposal(contractorId: string, proposalId: string): Promise<Proposal> {
    const proposal = await this.proposals.findById(proposalId);
    if (!proposal) throw new NotFoundException("Lance não encontrado.");
    const order = await this.getOrderOr404(proposal.workOrderId);
    if (order.contractorId !== contractorId) {
      throw new ForbiddenException("Esta obra não é sua.");
    }
    if (!canAcceptWorkOrder(order.status)) {
      throw new ConflictException("Esta obra não pode mais ser adjudicada.");
    }

    const adjudicada = await this.orders.transitionStatus(
      order.id,
      WorkOrderStatus.ABERTA,
      WorkOrderStatus.ADJUDICADA,
    );
    if (!adjudicada) throw new ConflictException("A obra mudou de estado; tente novamente.");

    const aceita = await this.proposals.setStatus(proposalId, ProposalStatus.ACEITA);
    await this.proposals.rejectOthers(order.id, proposalId);

    await this.audit.record({
      atorUserId: contractorId,
      acao: "OBRA_ADJUDICADA",
      entidade: "work_order",
      entidadeId: order.id,
      dados: { proposalId, professionalId: proposal.professionalId },
    });
    await this.inbox.record(proposal.professionalId, "OBRA", "Seu lance foi aceito 🎉", {
      corpo: `Você venceu a obra "${order.titulo}". Combine os próximos passos com o contratante.`,
      link: `/obras/${order.id}`,
    });
    return aceita ?? proposal;
  }

  /** Job: expira a obra se ainda ABERTA (transição guardada). */
  async expireIfOpen(workOrderId: string): Promise<boolean> {
    const updated = await this.orders.transitionStatus(
      workOrderId,
      WorkOrderStatus.ABERTA,
      WorkOrderStatus.EXPIRADA,
    );
    return updated !== null;
  }

  private async getOrderOr404(id: string): Promise<WorkOrder> {
    const order = await this.orders.findById(id);
    if (!order) throw new NotFoundException("Obra não encontrada.");
    return order;
  }
}
