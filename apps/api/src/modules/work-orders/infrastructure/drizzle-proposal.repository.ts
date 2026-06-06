import { Inject, Injectable } from "@nestjs/common";
import { and, asc, eq, ne } from "drizzle-orm";
import type { Proposal, ProposalStatus } from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { proposals } from "../../../infrastructure/database/schema/proposals.js";
import type {
  ProposalRepository,
  UpsertProposalData,
} from "../domain/ports/proposal.repository.js";

type ProposalRow = typeof proposals.$inferSelect;

export function rowToProposal(row: ProposalRow): Proposal {
  return {
    id: row.id,
    workOrderId: row.workOrderId,
    professionalId: row.professionalId,
    valorCentavos: row.valorCentavos,
    prazoDias: row.prazoDias,
    mensagem: row.mensagem,
    status: row.status as ProposalStatus,
    criadoEm: row.criadoEm.toISOString(),
    atualizadoEm: row.atualizadoEm.toISOString(),
  };
}

@Injectable()
export class DrizzleProposalRepository implements ProposalRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async upsert(data: UpsertProposalData): Promise<Proposal> {
    const [row] = await this.db
      .insert(proposals)
      .values({
        workOrderId: data.workOrderId,
        professionalId: data.professionalId,
        valorCentavos: data.valorCentavos,
        prazoDias: data.prazoDias,
        mensagem: data.mensagem,
      })
      .onConflictDoUpdate({
        target: [proposals.workOrderId, proposals.professionalId],
        set: {
          valorCentavos: data.valorCentavos,
          prazoDias: data.prazoDias,
          mensagem: data.mensagem,
          status: "ENVIADA",
          atualizadoEm: new Date(),
        },
      })
      .returning();
    if (!row) throw new Error("Falha ao registrar o lance.");
    return rowToProposal(row);
  }

  async findById(id: string): Promise<Proposal | null> {
    const [row] = await this.db.select().from(proposals).where(eq(proposals.id, id)).limit(1);
    return row ? rowToProposal(row) : null;
  }

  async listForWorkOrder(workOrderId: string): Promise<Proposal[]> {
    const rows = await this.db
      .select()
      .from(proposals)
      .where(eq(proposals.workOrderId, workOrderId))
      .orderBy(asc(proposals.valorCentavos));
    return rows.map(rowToProposal);
  }

  async valuesForWorkOrder(workOrderId: string): Promise<number[]> {
    const rows = await this.db
      .select({ valor: proposals.valorCentavos })
      .from(proposals)
      .where(eq(proposals.workOrderId, workOrderId));
    return rows.map((r) => r.valor);
  }

  async setStatus(id: string, status: ProposalStatus): Promise<Proposal | null> {
    const [row] = await this.db
      .update(proposals)
      .set({ status, atualizadoEm: new Date() })
      .where(eq(proposals.id, id))
      .returning();
    return row ? rowToProposal(row) : null;
  }

  async rejectOthers(workOrderId: string, exceptId: string): Promise<void> {
    await this.db
      .update(proposals)
      .set({ status: "RECUSADA", atualizadoEm: new Date() })
      .where(
        and(
          eq(proposals.workOrderId, workOrderId),
          ne(proposals.id, exceptId),
          eq(proposals.status, "ENVIADA"),
        ),
      );
  }
}
