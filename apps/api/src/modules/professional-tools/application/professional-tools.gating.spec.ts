import { ForbiddenException } from "@nestjs/common";
import {
  DocumentType,
  UserType,
  type CreateDocumentInput,
  type ProfessionalDocument,
  type User,
} from "@obracerta/shared";
import type { BillingService } from "../../billing/application/billing.service.js";
import { Feature } from "../../entitlements/domain/entitlements.js";
import type { UsersService } from "../../users/application/users.service.js";
import type { DocumentRepository } from "../domain/ports/document.repository.js";
import { ProfessionalToolsService } from "./professional-tools.service.js";

/**
 * Gating premium das ferramentas (§8.5): emitir orçamento/recibo exige a feature
 * `tools.documents` (Especialista). E o total é sempre recalculado no servidor.
 */
describe("ProfessionalToolsService — gating tools.documents", () => {
  const professionalId = "pro-1";
  const professional = { id: professionalId, tipo: UserType.PROFISSIONAL } as User;

  const input: CreateDocumentInput = {
    tipo: DocumentType.ORCAMENTO,
    clienteNome: "Dona Maria",
    titulo: "Reforma da cozinha",
    itens: [
      { descricao: "Mão de obra", quantidade: 2, valorUnitarioCentavos: 15000 },
      { descricao: "Material", quantidade: 3, valorUnitarioCentavos: 5000 },
    ],
  };

  function build(can: boolean) {
    const repo = {
      create: jest.fn(async (data) => ({ id: "doc-1", ...data, criadoEm: "x" }) as ProfessionalDocument),
    } as unknown as DocumentRepository;
    const users = { findById: jest.fn().mockResolvedValue(professional) } as unknown as UsersService;
    const billing = { can: jest.fn().mockResolvedValue(can) } as unknown as BillingService;
    return { service: new ProfessionalToolsService(repo, users, billing), repo, billing };
  }

  it("recusa quando o profissional não tem tools.documents (não-Especialista)", async () => {
    const { service, repo, billing } = build(false);
    await expect(service.createDocument(professionalId, input)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(billing.can).toHaveBeenCalledWith(professionalId, Feature.PRO_TOOLS);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("cria e recalcula o total no servidor quando liberado", async () => {
    const { service, repo } = build(true);
    const doc = await service.createDocument(professionalId, input);
    expect(doc.totalCentavos).toBe(2 * 15000 + 3 * 5000); // 45000
    expect(repo.create).toHaveBeenCalledTimes(1);
  });
});
