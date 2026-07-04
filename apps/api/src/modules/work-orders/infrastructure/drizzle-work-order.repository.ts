import { Inject, Injectable } from "@nestjs/common";
import { and, count, desc, eq } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { WorkOrder, WorkOrderStatus, WorkUrgency } from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { workOrders } from "../../../infrastructure/database/schema/work-orders.js";
import type {
  CreateWorkOrderData,
  ListOpenWorkOrdersFilters,
  WorkOrderPage,
  WorkOrderRepository,
} from "../domain/ports/work-order.repository.js";

type WorkOrderRow = typeof workOrders.$inferSelect;

export function rowToWorkOrder(row: WorkOrderRow): WorkOrder {
  return {
    id: row.id,
    contractorId: row.contractorId,
    cidadeId: row.cidadeId,
    especialidade: row.especialidade,
    titulo: row.titulo,
    descricao: row.descricao,
    urgencia: row.urgencia as WorkUrgency,
    bairro: row.bairro,
    fotoUrl: row.fotoUrl,
    geo: row.geo ? { lng: row.geo.x, lat: row.geo.y } : null,
    pisoCentavos: row.pisoCentavos,
    status: row.status as WorkOrderStatus,
    expiraEm: row.expiraEm.toISOString(),
    criadoEm: row.criadoEm.toISOString(),
    atualizadoEm: row.atualizadoEm.toISOString(),
  };
}

@Injectable()
export class DrizzleWorkOrderRepository implements WorkOrderRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(data: CreateWorkOrderData): Promise<WorkOrder> {
    const [row] = await this.db
      .insert(workOrders)
      .values({
        contractorId: data.contractorId,
        cidadeId: data.cidadeId,
        especialidade: data.especialidade,
        titulo: data.titulo,
        descricao: data.descricao,
        urgencia: data.urgencia,
        bairro: data.bairro,
        geo: data.geo ? { x: data.geo.lng, y: data.geo.lat } : null,
        expiraEm: new Date(data.expiraEm),
      })
      .returning();
    if (!row) throw new Error("Falha ao abrir a obra.");
    return rowToWorkOrder(row);
  }

  async findById(id: string): Promise<WorkOrder | null> {
    const [row] = await this.db.select().from(workOrders).where(eq(workOrders.id, id)).limit(1);
    return row ? rowToWorkOrder(row) : null;
  }

  async findAll(): Promise<WorkOrder[]> {
    const rows = await this.db.select().from(workOrders).orderBy(desc(workOrders.criadoEm));
    return rows.map(rowToWorkOrder);
  }

  async findAllPaginated(limit: number, offset: number): Promise<{ items: WorkOrder[], total: number }> {
    const rows = await this.db.select().from(workOrders).orderBy(desc(workOrders.criadoEm)).limit(limit).offset(offset);
    const [c] = await this.db.select({ total: count() }).from(workOrders);
    return { items: rows.map(rowToWorkOrder), total: c?.total ?? 0 };
  }

  async listOpen(f: ListOpenWorkOrdersFilters): Promise<WorkOrderPage> {
    const conds: SQL[] = [eq(workOrders.status, "ABERTA")];
    if (f.cidadeId) conds.push(eq(workOrders.cidadeId, f.cidadeId));
    if (f.especialidade) conds.push(eq(workOrders.especialidade, f.especialidade));
    const where = and(...conds);

    const rows = await this.db
      .select()
      .from(workOrders)
      .where(where)
      .orderBy(desc(workOrders.criadoEm))
      .limit(f.limit)
      .offset(f.offset);
    const [c] = await this.db.select({ total: count() }).from(workOrders).where(where);

    return { items: rows.map(rowToWorkOrder), total: c?.total ?? 0 };
  }

  async listForContractor(contractorId: string): Promise<WorkOrder[]> {
    const rows = await this.db
      .select()
      .from(workOrders)
      .where(eq(workOrders.contractorId, contractorId))
      .orderBy(desc(workOrders.criadoEm));
    return rows.map(rowToWorkOrder);
  }

  async transitionStatus(
    id: string,
    from: WorkOrderStatus,
    to: WorkOrderStatus,
  ): Promise<WorkOrder | null> {
    const [row] = await this.db
      .update(workOrders)
      .set({ status: to, atualizadoEm: new Date() })
      .where(and(eq(workOrders.id, id), eq(workOrders.status, from)))
      .returning();
    return row ? rowToWorkOrder(row) : null;
  }

  async setFoto(id: string, url: string): Promise<WorkOrder | null> {
    const [row] = await this.db
      .update(workOrders)
      .set({ fotoUrl: url, atualizadoEm: new Date() })
      .where(eq(workOrders.id, id))
      .returning();
    return row ? rowToWorkOrder(row) : null;
  }

  async setPiso(id: string, pisoCentavos: number | null): Promise<void> {
    await this.db
      .update(workOrders)
      .set({ pisoCentavos, atualizadoEm: new Date() })
      .where(eq(workOrders.id, id));
  }
}
