import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  UserType,
  documentTotalCentavos,
  type CreateDocumentInput,
  type ProfessionalDocument,
} from "@obracerta/shared";
import { BillingService } from "../../billing/application/billing.service.js";
import { Feature } from "../../entitlements/domain/entitlements.js";
import { UsersService } from "../../users/application/users.service.js";
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
} from "../domain/ports/document.repository.js";

@Injectable()
export class ProfessionalToolsService {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly repo: DocumentRepository,
    private readonly users: UsersService,
    private readonly billing: BillingService,
  ) {}

  /**
   * Profissional emite um orçamento ou recibo. Gating de plano: ferramentas são
   * exclusivas de quem tem `tools.documents` (Especialista). O total é sempre
   * recalculado aqui — o cliente nunca define o total.
   */
  async createDocument(
    professionalId: string,
    input: CreateDocumentInput,
  ): Promise<ProfessionalDocument> {
    const user = await this.users.findById(professionalId);
    if (!user || user.tipo !== UserType.PROFISSIONAL) {
      throw new BadRequestException("Apenas profissionais emitem orçamentos e recibos.");
    }
    if (!(await this.billing.can(professionalId, Feature.PRO_TOOLS))) {
      throw new ForbiddenException(
        "Orçamentos e recibos são do plano Especialista. Faça upgrade em Cobranças.",
      );
    }
    return this.repo.create({
      professionalId,
      tipo: input.tipo,
      clienteNome: input.clienteNome,
      titulo: input.titulo,
      observacoes: input.observacoes ?? null,
      itens: input.itens,
      totalCentavos: documentTotalCentavos(input.itens),
    });
  }

  /** Lista os documentos do profissional (mais recentes primeiro). */
  listDocuments(professionalId: string): Promise<ProfessionalDocument[]> {
    return this.repo.listForProfessional(professionalId);
  }

  /** Detalhe de um documento — só o profissional dono o vê. */
  async getDocument(professionalId: string, id: string): Promise<ProfessionalDocument> {
    const doc = await this.repo.findById(id);
    if (!doc) throw new NotFoundException("Documento não encontrado.");
    if (doc.professionalId !== professionalId) {
      throw new ForbiddenException("Este documento não é seu.");
    }
    return doc;
  }
}
