import { Inject, Injectable } from "@nestjs/common";
import { and, desc, eq } from "drizzle-orm";
import type { Invoice, InvoiceStatus, PaymentMethod } from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { invoices } from "../../../infrastructure/database/schema/invoices.js";
import type {
  CreateInvoiceData,
  InvoiceRepository,
} from "../domain/ports/invoice.repository.js";

type InvoiceRow = typeof invoices.$inferSelect;

export function rowToInvoice(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    userId: row.userId,
    subscriptionId: row.subscriptionId,
    purchaseId: row.purchaseId,
    gateway: row.gateway,
    gatewayId: row.gatewayId,
    valorCentavos: row.valorCentavos,
    status: row.status as InvoiceStatus,
    metodo: (row.metodo as PaymentMethod | null) ?? null,
    vencimentoEm: row.vencimentoEm.toISOString(),
    pagoEm: row.pagoEm ? row.pagoEm.toISOString() : null,
    criadoEm: row.criadoEm.toISOString(),
    atualizadoEm: row.atualizadoEm.toISOString(),
  };
}

@Injectable()
export class DrizzleInvoiceRepository implements InvoiceRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(data: CreateInvoiceData): Promise<Invoice> {
    const [row] = await this.db
      .insert(invoices)
      .values({
        userId: data.userId,
        subscriptionId: data.subscriptionId,
        purchaseId: data.purchaseId,
        gateway: data.gateway,
        gatewayId: data.gatewayId,
        valorCentavos: data.valorCentavos,
        vencimentoEm: new Date(data.vencimentoEm),
      })
      .returning();
    if (!row) throw new Error("Falha ao emitir a fatura.");
    return rowToInvoice(row);
  }

  async findById(id: string): Promise<Invoice | null> {
    const [row] = await this.db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
    return row ? rowToInvoice(row) : null;
  }

  async findByGatewayCharge(gateway: string, gatewayId: string): Promise<Invoice | null> {
    const [row] = await this.db
      .select()
      .from(invoices)
      .where(and(eq(invoices.gateway, gateway), eq(invoices.gatewayId, gatewayId)))
      .limit(1);
    return row ? rowToInvoice(row) : null;
  }

  async markPaid(id: string, metodo: PaymentMethod | null): Promise<Invoice | null> {
    const [row] = await this.db
      .update(invoices)
      .set({ status: "PAGA", metodo, pagoEm: new Date(), atualizadoEm: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return row ? rowToInvoice(row) : null;
  }

  async attachGatewayCharge(id: string, gateway: string, gatewayId: string): Promise<Invoice | null> {
    const [row] = await this.db
      .update(invoices)
      .set({ gateway, gatewayId, atualizadoEm: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return row ? rowToInvoice(row) : null;
  }

  async transition(id: string, from: InvoiceStatus, to: InvoiceStatus): Promise<Invoice | null> {
    const [row] = await this.db
      .update(invoices)
      .set({ status: to, atualizadoEm: new Date() })
      .where(and(eq(invoices.id, id), eq(invoices.status, from)))
      .returning();
    return row ? rowToInvoice(row) : null;
  }

  async listForUser(userId: string): Promise<Invoice[]> {
    const rows = await this.db
      .select()
      .from(invoices)
      .where(eq(invoices.userId, userId))
      .orderBy(desc(invoices.criadoEm));
    return rows.map(rowToInvoice);
  }
}
