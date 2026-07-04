import { Inject, Injectable } from "@nestjs/common";
import { count, desc, eq } from "drizzle-orm";
import type { PortfolioPhoto } from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { portfolioPhotos } from "../../../infrastructure/database/schema/portfolio-photos.js";
import type {
  CreatePortfolioPhotoData,
  PortfolioRepository,
} from "../domain/ports/portfolio.repository.js";

type PortfolioRow = typeof portfolioPhotos.$inferSelect;

export function rowToPortfolioPhoto(row: PortfolioRow): PortfolioPhoto {
  return {
    id: row.id,
    professionalId: row.professionalId,
    url: row.url,
    legenda: row.legenda,
    criadoEm: row.criadoEm.toISOString(),
  };
}

@Injectable()
export class DrizzlePortfolioRepository implements PortfolioRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(data: CreatePortfolioPhotoData): Promise<PortfolioPhoto> {
    const [row] = await this.db
      .insert(portfolioPhotos)
      .values({ professionalId: data.professionalId, url: data.url, legenda: data.legenda })
      .returning();
    if (!row) throw new Error("Falha ao salvar a foto do portfólio.");
    return rowToPortfolioPhoto(row);
  }

  async listForProfessional(professionalId: string): Promise<PortfolioPhoto[]> {
    const rows = await this.db
      .select()
      .from(portfolioPhotos)
      .where(eq(portfolioPhotos.professionalId, professionalId))
      .orderBy(desc(portfolioPhotos.criadoEm));
    return rows.map(rowToPortfolioPhoto);
  }

  async countForProfessional(professionalId: string): Promise<number> {
    const [row] = await this.db
      .select({ total: count() })
      .from(portfolioPhotos)
      .where(eq(portfolioPhotos.professionalId, professionalId));
    return row?.total ?? 0;
  }

  async findById(id: string): Promise<PortfolioPhoto | null> {
    const [row] = await this.db
      .select()
      .from(portfolioPhotos)
      .where(eq(portfolioPhotos.id, id))
      .limit(1);
    return row ? rowToPortfolioPhoto(row) : null;
  }

  async updateLegenda(id: string, legenda: string | null): Promise<PortfolioPhoto | null> {
    const [row] = await this.db
      .update(portfolioPhotos)
      .set({ legenda })
      .where(eq(portfolioPhotos.id, id))
      .returning();
    return row ? rowToPortfolioPhoto(row) : null;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(portfolioPhotos).where(eq(portfolioPhotos.id, id));
  }
}
