import { Inject, Injectable } from "@nestjs/common";
import { and, desc, eq } from "drizzle-orm";
import type {
  ProfessionalProfile,
  ContractorProfile,
  CompanyProfile,
  UpdateProfessionalProfileInput,
} from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { professionalProfiles } from "../../../infrastructure/database/schema/professional-profiles.js";
import { contractorProfiles } from "../../../infrastructure/database/schema/contractor-profiles.js";
import { companyProfiles } from "../../../infrastructure/database/schema/company-profiles.js";
import { users } from "../../../infrastructure/database/schema/users.js";
import type { CompanyInfo, ProfilesRepository } from "../domain/ports/profiles.repository.js";

type ProRow = typeof professionalProfiles.$inferSelect;
type ContractorRow = typeof contractorProfiles.$inferSelect;
type CompanyRow = typeof companyProfiles.$inferSelect;

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
    verificado: row.verificacaoStatus === "VERIFICADO",
  };
}

export function rowToContractorProfile(row: ContractorRow): ContractorProfile {
  return {
    userId: row.userId,
    plano: row.plano as ContractorProfile["plano"],
    planoExpiraEm: row.planoExpiraEm?.toISOString() ?? null,
  };
}

export function rowToCompanyProfile(row: CompanyRow): CompanyProfile {
  return {
    userId: row.userId,
    cnpj: row.cnpj,
    razaoSocial: row.razaoSocial,
    nomeFantasia: row.nomeFantasia,
    slug: row.slug,
    criadoEm: row.criadoEm.toISOString(),
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

  async companySlugExists(slug: string): Promise<boolean> {
    const [row] = await this.db
      .select({ slug: companyProfiles.slug })
      .from(companyProfiles)
      .where(eq(companyProfiles.slug, slug))
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

  async createCompany(userId: string): Promise<CompanyProfile> {
    const [row] = await this.db.insert(companyProfiles).values({ userId }).returning();
    if (!row) throw new Error("Falha ao criar perfil de empresa.");
    return rowToCompanyProfile(row);
  }

  async setCompanyInfo(userId: string, info: CompanyInfo): Promise<CompanyProfile | null> {
    const [row] = await this.db
      .update(companyProfiles)
      .set({
        cnpj: info.cnpj,
        razaoSocial: info.razaoSocial,
        nomeFantasia: info.nomeFantasia,
        // slug só é gravado quando fornecido (gerado no cadastro; a edição não o mexe).
        ...(info.slug !== undefined && info.slug !== null ? { slug: info.slug } : {}),
      })
      .where(eq(companyProfiles.userId, userId))
      .returning();
    return row ? rowToCompanyProfile(row) : null;
  }

  async findCompanyByUserId(userId: string): Promise<CompanyProfile | null> {
    const [row] = await this.db
      .select()
      .from(companyProfiles)
      .where(eq(companyProfiles.userId, userId))
      .limit(1);
    return row ? rowToCompanyProfile(row) : null;
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

  async setVerificationPhoto(userId: string, url: string): Promise<void> {
    await this.db
      .update(professionalProfiles)
      .set({ verificacaoStatus: "EM_ANALISE", verificacaoFotoUrl: url, verificadoEm: null })
      .where(eq(professionalProfiles.userId, userId));
  }

  async getVerification(
    userId: string,
  ): Promise<{ status: string; fotoUrl: string | null; verificadoEm: string | null } | null> {
    const [row] = await this.db
      .select({
        status: professionalProfiles.verificacaoStatus,
        fotoUrl: professionalProfiles.verificacaoFotoUrl,
        verificadoEm: professionalProfiles.verificadoEm,
      })
      .from(professionalProfiles)
      .where(eq(professionalProfiles.userId, userId))
      .limit(1);
    if (!row) return null;
    return {
      status: row.status,
      fotoUrl: row.fotoUrl,
      verificadoEm: row.verificadoEm ? row.verificadoEm.toISOString() : null,
    };
  }

  async listPendingVerifications(): Promise<
    { userId: string; nome: string; fotoUrl: string | null; enviadoEm: string }[]
  > {
    const rows = await this.db
      .select({
        userId: professionalProfiles.userId,
        nome: users.nomeCompleto,
        fotoUrl: professionalProfiles.verificacaoFotoUrl,
        enviadoEm: professionalProfiles.criadoEm,
      })
      .from(professionalProfiles)
      .innerJoin(users, eq(users.id, professionalProfiles.userId))
      .where(eq(professionalProfiles.verificacaoStatus, "EM_ANALISE"))
      .orderBy(desc(professionalProfiles.criadoEm));
    return rows.map((r) => ({
      userId: r.userId,
      nome: r.nome,
      fotoUrl: r.fotoUrl,
      enviadoEm: r.enviadoEm.toISOString(),
    }));
  }

  async resolveVerification(userId: string, aprovar: boolean): Promise<boolean> {
    const [row] = await this.db
      .update(professionalProfiles)
      .set({
        verificacaoStatus: aprovar ? "VERIFICADO" : "RECUSADO",
        verificadoEm: aprovar ? new Date() : null,
      })
      .where(
        and(
          eq(professionalProfiles.userId, userId),
          eq(professionalProfiles.verificacaoStatus, "EM_ANALISE"),
        ),
      )
      .returning({ userId: professionalProfiles.userId });
    return row !== undefined;
  }
}
