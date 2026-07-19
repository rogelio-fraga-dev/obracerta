import { Inject, Injectable } from "@nestjs/common";
import { and, desc, eq, isNull } from "drizzle-orm";
import type { CompanyMember, CompanyMemberRole, CompanyProfessional } from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { companyMembers } from "../../../infrastructure/database/schema/company-members.js";
import { companyProfessionals } from "../../../infrastructure/database/schema/company-professionals.js";
import { professionalProfiles } from "../../../infrastructure/database/schema/professional-profiles.js";
import { users } from "../../../infrastructure/database/schema/users.js";
import type {
  CompanyTeamRepository,
  UpsertMemberData,
} from "../domain/ports/company-team.repository.js";

type MemberRow = typeof companyMembers.$inferSelect;

function rowToMember(row: MemberRow): CompanyMember {
  return {
    id: row.id,
    companyId: row.companyId,
    nome: row.nome,
    email: row.email,
    papel: row.papel as CompanyMemberRole,
    userId: row.userId,
    criadoEm: row.criadoEm.toISOString(),
  };
}

@Injectable()
export class DrizzleCompanyTeamRepository implements CompanyTeamRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async listMembers(companyId: string): Promise<CompanyMember[]> {
    const rows = await this.db
      .select()
      .from(companyMembers)
      .where(eq(companyMembers.companyId, companyId))
      .orderBy(desc(companyMembers.criadoEm));
    return rows.map(rowToMember);
  }

  async upsertMember(data: UpsertMemberData): Promise<CompanyMember> {
    const [row] = await this.db
      .insert(companyMembers)
      .values({
        companyId: data.companyId,
        nome: data.nome,
        email: data.email,
        papel: data.papel,
        userId: data.userId,
      })
      .onConflictDoUpdate({
        target: [companyMembers.companyId, companyMembers.email],
        set: { nome: data.nome, papel: data.papel, userId: data.userId },
      })
      .returning();
    if (!row) throw new Error("Falha ao registrar o membro da equipe.");
    return rowToMember(row);
  }

  async removeMember(companyId: string, memberId: string): Promise<CompanyMember | null> {
    const [row] = await this.db
      .delete(companyMembers)
      .where(and(eq(companyMembers.id, memberId), eq(companyMembers.companyId, companyId)))
      .returning();
    return row ? rowToMember(row) : null;
  }

  async findCompanyForMember(userId: string): Promise<string | null> {
    const [row] = await this.db
      .select({ companyId: companyMembers.companyId })
      .from(companyMembers)
      .where(eq(companyMembers.userId, userId))
      .orderBy(desc(companyMembers.criadoEm))
      .limit(1);
    return row?.companyId ?? null;
  }

  async linkMemberByEmail(email: string, userId: string): Promise<string | null> {
    const rows = await this.db
      .update(companyMembers)
      .set({ userId })
      .where(and(eq(companyMembers.email, email), isNull(companyMembers.userId)))
      .returning({ companyId: companyMembers.companyId, criadoEm: companyMembers.criadoEm });
    if (rows.length === 0) return null;
    rows.sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime());
    return rows[0]?.companyId ?? null;
  }

  async listProfessionals(companyId: string): Promise<CompanyProfessional[]> {
    const rows = await this.db
      .select({
        link: companyProfessionals,
        nome: users.nomeCompleto,
        especialidades: professionalProfiles.especialidades,
      })
      .from(companyProfessionals)
      .innerJoin(users, eq(users.id, companyProfessionals.professionalId))
      .leftJoin(
        professionalProfiles,
        eq(professionalProfiles.userId, companyProfessionals.professionalId),
      )
      .where(eq(companyProfessionals.companyId, companyId))
      .orderBy(desc(companyProfessionals.criadoEm));
    return rows.map((r) => ({
      id: r.link.id,
      companyId: r.link.companyId,
      professionalId: r.link.professionalId,
      nome: r.nome,
      especialidades: r.especialidades ?? [],
      criadoEm: r.link.criadoEm.toISOString(),
    }));
  }

  async addProfessional(companyId: string, professionalId: string): Promise<CompanyProfessional> {
    await this.db
      .insert(companyProfessionals)
      .values({ companyId, professionalId })
      .onConflictDoNothing();
    const all = await this.listProfessionals(companyId);
    const found = all.find((p) => p.professionalId === professionalId);
    if (!found) throw new Error("Falha ao vincular o profissional à equipe.");
    return found;
  }

  async removeProfessional(companyId: string, linkId: string): Promise<boolean> {
    const [row] = await this.db
      .delete(companyProfessionals)
      .where(
        and(eq(companyProfessionals.id, linkId), eq(companyProfessionals.companyId, companyId)),
      )
      .returning();
    return row !== undefined;
  }
}
