import { Inject, Injectable } from "@nestjs/common";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import type {
  CompanyDirectoryItem,
  CompanyInvite,
  CompanyMember,
  CompanyMemberRole,
  CompanyProfessional,
  PublicCompanyProfile,
} from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { companyMembers } from "../../../infrastructure/database/schema/company-members.js";
import { companyProfiles } from "../../../infrastructure/database/schema/company-profiles.js";
import { companyProfessionals } from "../../../infrastructure/database/schema/company-professionals.js";
import { cities } from "../../../infrastructure/database/schema/cities.js";
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
        slug: professionalProfiles.slugPublico,
        fotoUrl: sql<string | null>`coalesce(${professionalProfiles.fotoUrl}, ${users.fotoUrl})`,
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
      slug: r.slug,
      fotoUrl: r.fotoUrl,
      confirmado: r.link.confirmado,
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

  async listPendingInvites(professionalId: string): Promise<CompanyInvite[]> {
    const rows = await this.db
      .select({
        id: companyProfessionals.id,
        criadoEm: companyProfessionals.criadoEm,
        empresaNome: sql<string>`coalesce(${companyProfiles.nomeFantasia}, ${companyProfiles.razaoSocial}, ${users.nomeCompleto})`,
      })
      .from(companyProfessionals)
      .innerJoin(users, eq(users.id, companyProfessionals.companyId))
      .leftJoin(companyProfiles, eq(companyProfiles.userId, companyProfessionals.companyId))
      .where(
        and(
          eq(companyProfessionals.professionalId, professionalId),
          eq(companyProfessionals.confirmado, false),
        ),
      )
      .orderBy(desc(companyProfessionals.criadoEm));
    return rows.map((r) => ({
      id: r.id,
      empresaNome: r.empresaNome,
      criadoEm: r.criadoEm.toISOString(),
    }));
  }

  async confirmInvite(professionalId: string, linkId: string): Promise<boolean> {
    const [row] = await this.db
      .update(companyProfessionals)
      .set({ confirmado: true, confirmadoEm: new Date() })
      .where(
        and(
          eq(companyProfessionals.id, linkId),
          eq(companyProfessionals.professionalId, professionalId),
        ),
      )
      .returning();
    return row !== undefined;
  }

  async rejectInvite(professionalId: string, linkId: string): Promise<boolean> {
    const [row] = await this.db
      .delete(companyProfessionals)
      .where(
        and(
          eq(companyProfessionals.id, linkId),
          eq(companyProfessionals.professionalId, professionalId),
          eq(companyProfessionals.confirmado, false),
        ),
      )
      .returning();
    return row !== undefined;
  }

  async directory(
    q: string | null,
    cidadeId: string | null,
    limit: number,
  ): Promise<CompanyDirectoryItem[]> {
    const conds = [
      eq(users.tipo, "EMPRESA"),
      eq(users.status, "ATIVO"),
      sql`${companyProfiles.slug} is not null`,
    ];
    if (q) conds.push(sql`coalesce(${companyProfiles.nomeFantasia}, ${companyProfiles.razaoSocial}, ${users.nomeCompleto}) ilike ${`%${q}%`}`);
    if (cidadeId) conds.push(eq(users.cidadeId, cidadeId));

    const confirmados = sql<number>`(select count(*)::int from ${companyProfessionals} cp where cp.company_id = ${users.id} and cp.confirmado = true)`;
    const obras = sql<number>`(select count(*)::int from work_orders w where w.contractor_id = ${users.id} and w.status = 'CONCLUIDA')`;

    const rows = await this.db
      .select({
        slug: companyProfiles.slug,
        nome: sql<string>`coalesce(${companyProfiles.nomeFantasia}, ${companyProfiles.razaoSocial}, ${users.nomeCompleto})`,
        cidade: cities.nome,
        uf: cities.uf,
        totalProfissionais: confirmados,
        obrasConcluidas: obras,
      })
      .from(users)
      .innerJoin(companyProfiles, eq(companyProfiles.userId, users.id))
      .leftJoin(cities, eq(cities.id, users.cidadeId))
      .where(and(...conds))
      .orderBy(desc(confirmados), desc(obras))
      .limit(limit);

    return rows.map((r) => ({
      slug: r.slug ?? "",
      nome: r.nome,
      cidade: r.cidade,
      uf: r.uf,
      totalProfissionais: Number(r.totalProfissionais ?? 0),
      obrasConcluidas: Number(r.obrasConcluidas ?? 0),
    }));
  }

  async publicProfile(slug: string): Promise<PublicCompanyProfile | null> {
    const [company] = await this.db
      .select({
        userId: companyProfiles.userId,
        nome: sql<string>`coalesce(${companyProfiles.nomeFantasia}, ${companyProfiles.razaoSocial}, ${users.nomeCompleto})`,
        cidade: cities.nome,
        uf: cities.uf,
      })
      .from(companyProfiles)
      .innerJoin(users, eq(users.id, companyProfiles.userId))
      .leftJoin(cities, eq(cities.id, users.cidadeId))
      .where(and(eq(companyProfiles.slug, slug), eq(users.status, "ATIVO")))
      .limit(1);
    if (!company) return null;

    const [obras] = await this.db.execute(
      sql`select count(*)::int as total from work_orders where contractor_id = ${company.userId} and status = 'CONCLUIDA'`,
    ).then((r) => r.rows as { total: number }[]);

    const pros = await this.db
      .select({
        slug: professionalProfiles.slugPublico,
        nome: users.nomeCompleto,
        especialidades: professionalProfiles.especialidades,
        fotoUrl: sql<string | null>`coalesce(${professionalProfiles.fotoUrl}, ${users.fotoUrl})`,
      })
      .from(companyProfessionals)
      .innerJoin(users, eq(users.id, companyProfessionals.professionalId))
      .leftJoin(
        professionalProfiles,
        eq(professionalProfiles.userId, companyProfessionals.professionalId),
      )
      .where(
        and(
          eq(companyProfessionals.companyId, company.userId),
          eq(companyProfessionals.confirmado, true),
          eq(users.status, "ATIVO"),
        ),
      )
      .orderBy(desc(companyProfessionals.confirmadoEm));

    return {
      slug,
      nome: company.nome,
      cidade: company.cidade,
      uf: company.uf,
      obrasConcluidas: Number(obras?.total ?? 0),
      profissionais: pros.map((p) => ({
        slug: p.slug,
        nome: p.nome,
        especialidades: p.especialidades ?? [],
        fotoUrl: p.fotoUrl,
      })),
    };
  }
}
