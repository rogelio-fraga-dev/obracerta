import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  MAX_WORK_ORDER_PHOTOS,
  ProposalStatus,
  UserType,
  WorkOrderStatus,
  canHireServices,
  type CompanyReport,
  type CreateWorkOrderInput,
  type PaginatedResponse,
  type Proposal,
  type SubmitProposalInput,
  type WorkOrder,
  type WorkOrderPhoto,
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
import {
  WORK_ORDER_PHOTOS_REPOSITORY,
  type WorkOrderPhotosRepository,
} from "../domain/ports/work-order-photos.repository.js";
import { WorkOrderScheduler } from "./work-order.scheduler.js";
import { CompanyTeamService } from "../../company/application/company-team.service.js";

import { IMAGE_MIME, sniffImageExt } from "../../../common/uploads/image-upload.js";

/** Teto de Especialistas notificados "em primeira mão" por obra (anti-spam). */
const EARLY_NOTIFY_MAX_TARGETS = 50;

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
    @Inject(WORK_ORDER_PHOTOS_REPOSITORY) private readonly photos: WorkOrderPhotosRepository,
    private readonly inbox: InboxService,
    private readonly companyTeam: CompanyTeamService,
  ) {}

  /**
   * Dono efetivo das ações de obra: a empresa pela qual o usuário age (membro
   * da equipe — homologação 18/07) ou ele mesmo. Centraliza o acesso delegado.
   */
  private async effectiveOwner(userId: string): Promise<string> {
    return (await this.companyTeam.companyActingAs(userId)) ?? userId;
  }

  /**
   * Contratante/empresa abre uma obra; a urgência define a expiração (job
   * BullMQ). Um **membro da equipe** publica em nome da empresa (a obra nasce
   * da empresa; plano e identidade são os dela).
   */
  async openWorkOrder(userId: string, input: CreateWorkOrderInput): Promise<WorkOrder> {
    const contractorId = await this.effectiveOwner(userId);
    if (contractorId === userId) {
      const user = await this.users.findById(userId);
      if (!user || !canHireServices(user.tipo)) {
        throw new BadRequestException("Apenas contratantes e empresas abrem obras.");
      }
    }
    // Gating de plano (homologação 18/07): publicar obra para receber lances é
    // exclusivo do plano Lance (contratante) / Empresa PRO (empresa). No acesso
    // delegado, vale o plano DA EMPRESA.
    if (!(await this.billing.can(contractorId, Feature.SUBMIT_BID))) {
      throw new ForbiddenException(
        "Publicar obras é exclusivo do plano Lance (Empresa PRO para empresas). Assine em Cobranças.",
      );
    }
    const expiraEm = workOrderDeadline(input.urgencia as WorkUrgency, new Date()).toISOString();
    const order = await this.orders.create({
      contractorId,
      cidadeId: input.cidadeId,
      especialidade: input.especialidade,
      subServico: input.subServico ?? null,
      titulo: input.titulo,
      descricao: input.descricao ?? null,
      urgencia: input.urgencia,
      bairro: input.bairro ?? null,
      geo: input.geo ?? null,
      expiraEm,
    });
    await this.scheduler.scheduleExpiry(order.id, expiraEm);
    await this.audit.record({
      atorUserId: userId,
      acao: "OBRA_ABERTA",
      entidade: "work_order",
      entidadeId: order.id,
      dados: {
        especialidade: input.especialidade,
        urgencia: input.urgencia,
        ...(contractorId !== userId ? { pelaEmpresa: contractorId } : {}),
      },
    });
    // "Oportunidades em primeira mão" (homologação 18/07): Especialistas da
    // cidade que atendem a especialidade sabem da obra na hora (inbox + push).
    // Best-effort — falha na notificação não desfaz a obra criada.
    await this.notifyEarlyOpportunity(order).catch(() => undefined);
    return order;
  }

  /** Notifica Especialistas elegíveis sobre a obra recém-aberta (em primeira mão). */
  private async notifyEarlyOpportunity(order: WorkOrder): Promise<void> {
    const targets = await this.orders.listEarlyNotifyTargets(
      order.especialidade,
      order.cidadeId,
      EARLY_NOTIFY_MAX_TARGETS,
    );
    await Promise.all(
      targets
        .filter((t) => t.userId !== order.contractorId)
        .map((t) =>
          this.inbox.record(t.userId, "OBRA", "Nova obra em primeira mão 🥇", {
            corpo: `${order.especialidade} — ${order.titulo}. Você viu antes: dê seu lance.`,
            link: `/obras/${order.id}`,
          }),
        ),
    );
  }

  /**
   * Dono anexa uma foto à galeria da obra (enquanto ABERTA, até
   * {@link MAX_WORK_ORDER_PHOTOS}). A primeira foto vira a capa
   * (`work_orders.foto_url`, thumbnail da lista).
   */
  async uploadFoto(
    userId: string,
    id: string,
    file: { buffer: Buffer; mimetype: string },
  ): Promise<WorkOrder> {
    const order = await this.getOrderOr404(id);
    if (order.contractorId !== (await this.effectiveOwner(userId))) {
      throw new ForbiddenException("Esta obra não é sua.");
    }
    if (order.status !== WorkOrderStatus.ABERTA) {
      throw new ConflictException("Só dá para anexar foto enquanto a obra está aberta.");
    }
    // Valida o CONTEÚDO (magic bytes), não o mimetype do cliente (falsificável).
    const ext = sniffImageExt(file.buffer);
    if (!ext) {
      throw new BadRequestException("Formato inválido. Use JPEG, PNG ou WebP.");
    }
    const total = await this.photos.countForWorkOrder(id);
    if (total >= MAX_WORK_ORDER_PHOTOS) {
      throw new BadRequestException(
        `A obra já tem o máximo de ${MAX_WORK_ORDER_PHOTOS} fotos.`,
      );
    }
    const key = `work-orders/${id}/foto-${Date.now()}.${ext}`;
    const url = await this.storage.putObject(key, file.buffer, IMAGE_MIME[ext]);
    await this.photos.add(id, url);
    if (!order.fotoUrl) {
      const updated = await this.orders.setFoto(id, url);
      if (updated) return updated;
    }
    return this.getOrderOr404(id);
  }

  /** Galeria de fotos da obra (ordem de envio). */
  listFotos(workOrderId: string): Promise<WorkOrderPhoto[]> {
    return this.photos.listForWorkOrder(workOrderId);
  }

  /**
   * Obras do contratante autenticado (todos os status), mais recentes primeiro.
   * Membro de equipe vê as obras **da empresa** (acesso delegado).
   */
  async listMine(userId: string): Promise<WorkOrder[]> {
    return this.orders.listForContractor(await this.effectiveOwner(userId));
  }

  /** Obras que o profissional autenticado venceu (lance ACEITA) — em andamento. */
  listWonByProfessional(professionalId: string): Promise<WorkOrder[]> {
    return this.orders.listWonByProfessional(professionalId);
  }

  /**
   * Relatório da operação da empresa (Empresa PRO — homologação 18/07): obras,
   * propostas, contratações e indicadores. Exige conta EMPRESA + plano com a
   * feature `company.reports` (Empresa PRO).
   */
  async companyReport(userId: string): Promise<CompanyReport> {
    // Acesso delegado: membro da equipe consulta o relatório DA EMPRESA.
    const contractorId = await this.effectiveOwner(userId);
    const user = await this.users.findById(contractorId);
    if (!user || user.tipo !== UserType.EMPRESA) {
      throw new ForbiddenException("Relatórios da operação são exclusivos de contas de empresa.");
    }
    if (!(await this.billing.can(contractorId, Feature.COMPANY_REPORTS))) {
      throw new ForbiddenException(
        "Relatórios da operação são exclusivos do plano Empresa PRO. Assine em Cobranças.",
      );
    }
    return this.orders.companyReport(contractorId);
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
    // Gating de plano (homologação 18/07): dar lances é exclusivo do Especialista.
    // A trava real é aqui — a UI só esconde o botão.
    if (!(await this.billing.can(professionalId, Feature.SUBMIT_BID))) {
      throw new ForbiddenException(
        "Dar lances em obras é exclusivo do plano Especialista. Faça upgrade em Cobranças.",
      );
    }
    const order = await this.getOrderOr404(workOrderId);
    // Inclui o acesso delegado: membro da equipe da empresa dona veria TODOS os
    // lances como dono — dar lance também quebraria o sigilo (§16).
    if (order.contractorId === (await this.effectiveOwner(professionalId))) {
      throw new ForbiddenException("Você não pode dar lance em obra da sua própria conta/empresa.");
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

  /**
   * Lances visíveis ao solicitante: o dono vê todos; o profissional, só o seu
   * (sigilo §16). Membro da equipe da empresa dona enxerga como dono.
   */
  async listProposals(userId: string, workOrderId: string): Promise<Proposal[]> {
    const order = await this.getOrderOr404(workOrderId);
    const all = await this.proposals.listForWorkOrder(workOrderId);
    const viewer =
      (await this.effectiveOwner(userId)) === order.contractorId ? order.contractorId : userId;
    return visibleProposals(viewer, order.contractorId, all);
  }

  /**
   * Contratante adjudica a obra a um lance: obra ABERTA → ADJUDICADA, o lance vira
   * ACEITA e os demais ENVIADA são RECUSADA.
   */
  async acceptProposal(userId: string, proposalId: string): Promise<Proposal> {
    const proposal = await this.proposals.findById(proposalId);
    if (!proposal) throw new NotFoundException("Lance não encontrado.");
    const order = await this.getOrderOr404(proposal.workOrderId);
    if (order.contractorId !== (await this.effectiveOwner(userId))) {
      throw new ForbiddenException("Esta obra não é sua.");
    }
    if (!canAcceptWorkOrder(order.status)) {
      throw new ConflictException("Esta obra não pode mais ser adjudicada.");
    }

    // ATÔMICO: obra→ADJUDICADA + lance→ACEITA + concorrentes→RECUSADA numa única
    // transação — crash no meio não deixa a obra adjudicada com lances pendentes.
    const resultado = await this.orders.adjudicate(order.id, proposalId);
    if (!resultado) throw new ConflictException("A obra mudou de estado; tente novamente.");
    const aceita = resultado.proposal;

    await this.audit.record({
      atorUserId: userId,
      acao: "OBRA_ADJUDICADA",
      entidade: "work_order",
      entidadeId: order.id,
      dados: { proposalId, professionalId: proposal.professionalId },
    });
    await this.inbox.record(proposal.professionalId, "OBRA", "Seu lance foi aceito 🎉", {
      corpo: `Você venceu a obra "${order.titulo}". Combine os próximos passos com o contratante.`,
      link: `/obras/${order.id}`,
    });
    return aceita;
  }

  /**
   * Participantes do chat da obra: o dono e o profissional do lance ACEITO.
   * `null` enquanto a obra não foi adjudicada (chat fechado — os lances são
   * sigilosos até lá).
   */
  async getChatParticipants(
    workOrderId: string,
  ): Promise<{ contractorId: string; professionalId: string } | null> {
    const order = await this.getOrderOr404(workOrderId);
    if (order.status !== WorkOrderStatus.ADJUDICADA) return null;
    const all = await this.proposals.listForWorkOrder(workOrderId);
    const aceita = all.find((p) => p.status === ProposalStatus.ACEITA);
    if (!aceita) return null;
    return { contractorId: order.contractorId, professionalId: aceita.professionalId };
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
