import { Inject, Injectable } from "@nestjs/common";
import { asc, eq, desc } from "drizzle-orm";
import type {
  AdminSupportTicket,
  CreateSupportTicketInput,
  SupportCategory,
  SupportStatus,
  SupportTicket,
} from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { supportTickets } from "../../../infrastructure/database/schema/support-tickets.js";
import { users } from "../../../infrastructure/database/schema/users.js";
import type { SupportRepository } from "../domain/ports/support.repository.js";

type TicketRow = typeof supportTickets.$inferSelect;

function rowToTicket(row: TicketRow): SupportTicket {
  return {
    id: row.id,
    userId: row.userId,
    categoria: row.categoria as SupportCategory,
    assunto: row.assunto,
    mensagem: row.mensagem,
    status: row.status as SupportStatus,
    resposta: row.resposta,
    respondidoEm: row.respondidoEm ? row.respondidoEm.toISOString() : null,
    criadoEm: row.criadoEm.toISOString(),
  };
}

@Injectable()
export class DrizzleSupportRepository implements SupportRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(userId: string, input: CreateSupportTicketInput): Promise<SupportTicket> {
    const [row] = await this.db
      .insert(supportTickets)
      .values({
        userId,
        categoria: input.categoria,
        assunto: input.assunto,
        mensagem: input.mensagem,
      })
      .returning();
    if (!row) throw new Error("Falha ao abrir o chamado.");
    return rowToTicket(row);
  }

  async listForUser(userId: string): Promise<SupportTicket[]> {
    const rows = await this.db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.userId, userId))
      .orderBy(desc(supportTickets.criadoEm));
    return rows.map(rowToTicket);
  }

  async findById(id: string): Promise<SupportTicket | null> {
    const [row] = await this.db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, id))
      .limit(1);
    return row ? rowToTicket(row) : null;
  }

  async listForAdmin(status: SupportStatus | null): Promise<AdminSupportTicket[]> {
    const base = this.db
      .select({
        ticket: supportTickets,
        autorNome: users.nomeCompleto,
        autorEmail: users.email,
      })
      .from(supportTickets)
      .leftJoin(users, eq(users.id, supportTickets.userId));
    const rows = status
      ? await base.where(eq(supportTickets.status, status)).orderBy(asc(supportTickets.criadoEm))
      : await base.orderBy(asc(supportTickets.criadoEm));
    return rows.map((r) => ({
      ...rowToTicket(r.ticket),
      autorNome: r.autorNome,
      autorEmail: r.autorEmail ?? null,
    }));
  }

  async respond(id: string, resposta: string): Promise<SupportTicket | null> {
    const [row] = await this.db
      .update(supportTickets)
      .set({ resposta, status: "RESPONDIDO", respondidoEm: new Date() })
      .where(eq(supportTickets.id, id))
      .returning();
    return row ? rowToTicket(row) : null;
  }

  async setStatus(id: string, status: SupportStatus): Promise<SupportTicket | null> {
    const [row] = await this.db
      .update(supportTickets)
      .set({ status })
      .where(eq(supportTickets.id, id))
      .returning();
    return row ? rowToTicket(row) : null;
  }
}
