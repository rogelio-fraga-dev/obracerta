import { Inject, Injectable } from "@nestjs/common";
import { asc, count, eq } from "drizzle-orm";
import type { WorkOrderPhoto } from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { workOrderPhotos } from "../../../infrastructure/database/schema/work-order-photos.js";
import type { WorkOrderPhotosRepository } from "../domain/ports/work-order-photos.repository.js";

type PhotoRow = typeof workOrderPhotos.$inferSelect;

function rowToPhoto(row: PhotoRow): WorkOrderPhoto {
  return {
    id: row.id,
    workOrderId: row.workOrderId,
    url: row.url,
    criadoEm: row.criadoEm.toISOString(),
  };
}

@Injectable()
export class DrizzleWorkOrderPhotosRepository implements WorkOrderPhotosRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async add(workOrderId: string, url: string): Promise<WorkOrderPhoto> {
    const [row] = await this.db.insert(workOrderPhotos).values({ workOrderId, url }).returning();
    if (!row) throw new Error("Falha ao salvar a foto da obra.");
    return rowToPhoto(row);
  }

  async listForWorkOrder(workOrderId: string): Promise<WorkOrderPhoto[]> {
    const rows = await this.db
      .select()
      .from(workOrderPhotos)
      .where(eq(workOrderPhotos.workOrderId, workOrderId))
      .orderBy(asc(workOrderPhotos.criadoEm));
    return rows.map(rowToPhoto);
  }

  async countForWorkOrder(workOrderId: string): Promise<number> {
    const [row] = await this.db
      .select({ total: count() })
      .from(workOrderPhotos)
      .where(eq(workOrderPhotos.workOrderId, workOrderId));
    return row?.total ?? 0;
  }
}
