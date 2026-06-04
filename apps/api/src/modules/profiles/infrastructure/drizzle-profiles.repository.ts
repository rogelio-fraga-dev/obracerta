import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import type {
  ProfessionalProfile,
  ContractorProfile,
  UpdateProfessionalProfileInput,
} from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { professionalProfiles } from "../../../infrastructure/database/schema/professional-profiles.js";
import { contractorProfiles } from "../../../infrastructure/database/schema/contractor-profiles.js";
import type { ProfilesRepository } from "../domain/ports/profiles.repository.js";

type ProRow = typeof professionalProfiles.$inferSelect;
type ContractorRow = typeof contractorProfiles.$inferSelect;

/** Mapeia a linha do perfil profissional para o contrato público (puro). */
export function rowToProfessionalProfile(row: ProRow): ProfessionalProfile {
  return {
    userId: row.userId,
    especialidades: row.especialidades,
    anosExperiencia: row.anosExperiencia,
    bairro: row.bairro,
    fotoUrl: row.fotoUrl,
    valores: row.valores,
    formacaoDeclarada: row.formacaoDeclarada,
    completudePct: row.completudePct,
    plano: row.plano as ProfessionalProfile["plano"],
    slugPublico: row.slugPublico,
  };
}

export function rowToContractorProfile(row: ContractorRow): ContractorProfile {
  return {
    userId: row.userId,
    plano: row.plano as ContractorProfile["plano"],
    planoExpiraEm: row.planoExpiraEm?.toISOString() ?? null,
  };
}

@Injectable()
export class DrizzleProfilesRepository implements ProfilesRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async slugExists(slug: string): Promise<boolean> {
    const [row] = await this.db
      .select({ slug: professionalProfiles.slugPublico })
      .from(professionalProfiles)
      .where(eq(professionalProfiles.slugPublico, slug))
      .limit(1);
    return Boolean(row);
  }

  async createProfessional(userId: string, slugPublico: string): Promise<ProfessionalProfile> {
    const [row] = await this.db
      .insert(professionalProfiles)
      .values({ userId, slugPublico })
      .returning();
    if (!row) throw new Error("Falha ao criar perfil profissional.");
    return rowToProfessionalProfile(row);
  }

  async createContractor(userId: string): Promise<ContractorProfile> {
    const [row] = await this.db.insert(contractorProfiles).values({ userId }).returning();
    if (!row) throw new Error("Falha ao criar perfil de contratante.");
    return rowToContractorProfile(row);
  }

  async findProfessionalByUserId(userId: string): Promise<ProfessionalProfile | null> {
    const [row] = await this.db
      .select()
      .from(professionalProfiles)
      .where(eq(professionalProfiles.userId, userId))
      .limit(1);
    return row ? rowToProfessionalProfile(row) : null;
  }

  async findProfessionalBySlug(slug: string): Promise<ProfessionalProfile | null> {
    const [row] = await this.db
      .select()
      .from(professionalProfiles)
      .where(eq(professionalProfiles.slugPublico, slug))
      .limit(1);
    return row ? rowToProfessionalProfile(row) : null;
  }

  async updateProfessional(
    userId: string,
    patch: UpdateProfessionalProfileInput,
  ): Promise<ProfessionalProfile | null> {
    const [row] = await this.db
      .update(professionalProfiles)
      .set(patch)
      .where(eq(professionalProfiles.userId, userId))
      .returning();
    return row ? rowToProfessionalProfile(row) : null;
  }

  async setFotoUrl(userId: string, url: string): Promise<ProfessionalProfile | null> {
    const [row] = await this.db
      .update(professionalProfiles)
      .set({ fotoUrl: url })
      .where(eq(professionalProfiles.userId, userId))
      .returning();
    return row ? rowToProfessionalProfile(row) : null;
  }

  async setCompletude(userId: string, pct: number): Promise<void> {
    await this.db
      .update(professionalProfiles)
      .set({ completudePct: pct })
      .where(eq(professionalProfiles.userId, userId));
  }
}
