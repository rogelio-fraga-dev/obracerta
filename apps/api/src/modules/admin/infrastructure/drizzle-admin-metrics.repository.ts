import { Inject, Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import type {
  AdminAnalyticsAggregates,
  AdminCohortRow,
  AdminCounts,
  AdminMetricsRepository,
} from "../domain/ports/admin-metrics.repository.js";

const num = (v: unknown): number => Number(v ?? 0);

@Injectable()
export class DrizzleAdminMetricsRepository implements AdminMetricsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  /**
   * Agrega as métricas de saúde em consultas read-only paralelas. `count(*) filter`
   * (Postgres) conta condicionalmente numa varredura só. North Star = pedidos com
   * avaliação revelada dos DOIS lados (group by booking having count >= 2).
   */
  async counts(): Promise<AdminCounts> {
    const [usuarios, perfis, bookings, reviews, bilateral, subs, mod, obras] = await Promise.all([
      this.db.execute(sql`
        select count(*) total,
               count(*) filter (where tipo = 'PROFISSIONAL') prof,
               count(*) filter (where tipo = 'CONTRATANTE') cont,
               count(*) filter (where status = 'ATIVO') ativos,
               count(*) filter (where status = 'SUSPENSO') suspensos
        from users`),
      this.db.execute(sql`
        select count(*) com_perfil,
               count(*) filter (where completude_pct >= 50) ativados
        from professional_profiles`),
      this.db.execute(sql`
        select count(*) total,
               count(*) filter (where status = 'CONCLUIDO') concluidos
        from booking_requests`),
      this.db.execute(sql`select count(*) reveladas from reviews where status = 'REVELADA'`),
      this.db.execute(sql`
        select count(*) bilaterais from (
          select booking_id from reviews where status = 'REVELADA'
          group by booking_id having count(*) >= 2
        ) t`),
      this.db.execute(sql`
        select count(*) filter (where status in ('EM_GRACA', 'ATIVA')) ativas,
               count(*) filter (where status = 'CANCELADA') canceladas,
               coalesce(sum(valor_centavos) filter (where status = 'ATIVA'), 0) mrr
        from subscriptions`),
      this.db.execute(sql`
        select (select count(*) from reports where status = 'ABERTA') denuncias,
               (select count(*) from account_suspensions where status = 'ATIVA') suspensoes`),
      this.db.execute(sql`
        select count(*) filter (where status = 'ABERTA') abertas,
               count(*) filter (where status = 'ADJUDICADA') adjudicadas
        from work_orders`),
    ]);

    const u = usuarios.rows[0] as Record<string, unknown>;
    const p = perfis.rows[0] as Record<string, unknown>;
    const b = bookings.rows[0] as Record<string, unknown>;
    const r = reviews.rows[0] as Record<string, unknown>;
    const bi = bilateral.rows[0] as Record<string, unknown>;
    const s = subs.rows[0] as Record<string, unknown>;
    const m = mod.rows[0] as Record<string, unknown>;
    const o = obras.rows[0] as Record<string, unknown>;

    return {
      usuariosTotal: num(u.total),
      usuariosProfissionais: num(u.prof),
      usuariosContratantes: num(u.cont),
      usuariosAtivos: num(u.ativos),
      usuariosSuspensos: num(u.suspensos),
      profissionaisComPerfil: num(p.com_perfil),
      profissionaisAtivados: num(p.ativados),
      agendamentosTotal: num(b.total),
      agendamentosConcluidos: num(b.concluidos),
      avaliacoesReveladas: num(r.reveladas),
      obrasAvaliadasBilateralmente: num(bi.bilaterais),
      assinaturasAtivas: num(s.ativas),
      assinaturasCanceladas: num(s.canceladas),
      mrrCentavos: num(s.mrr),
      denunciasAbertas: num(m.denuncias),
      suspensoesAtivas: num(m.suspensoes),
      obrasAbertas: num(o.abertas),
      obrasAdjudicadas: num(o.adjudicadas),
    };
  }

  /**
   * Agregados do analytics estratégico (funil/liquidez/receita/coorte) em
   * consultas read-only paralelas. Liquidez/lances usam `proposals`
   * (lance sigiloso por obra). Coorte = cadastros por mês (últimos 6) via
   * `date_trunc`. ARPA/LTV são derivados no domínio a partir destes crus.
   */
  async analytics(): Promise<AdminAnalyticsAggregates> {
    const [usuarios, perfis, engaj, contratantes, obras, lances, subs, coorte] =
      await Promise.all([
        this.db.execute(sql`
          select count(*) cadastros,
                 count(*) filter (where tipo = 'PROFISSIONAL') prof
          from users`),
        this.db.execute(sql`
          select count(*) com_perfil,
                 count(*) filter (where completude_pct >= 50) ativados
          from professional_profiles`),
        this.db.execute(
          sql`select count(distinct professional_id) com_lance from proposals`,
        ),
        this.db.execute(
          sql`select count(distinct contractor_id) com_obra from work_orders`,
        ),
        this.db.execute(sql`
          select count(*) total,
                 count(*) filter (where status = 'ADJUDICADA') adjudicadas
          from work_orders`),
        this.db.execute(sql`
          select count(*) lances_total,
                 count(distinct work_order_id) obras_com_lance
          from proposals`),
        this.db.execute(sql`
          select count(*) filter (where status in ('EM_GRACA', 'ATIVA')) ativas,
                 count(*) filter (where status = 'CANCELADA') canceladas,
                 coalesce(sum(valor_centavos) filter (where status = 'ATIVA'), 0) mrr
          from subscriptions`),
        this.db.execute(sql`
          select to_char(date_trunc('month', criado_em), 'YYYY-MM') mes,
                 count(*) cadastros,
                 count(*) filter (where tipo = 'PROFISSIONAL') profissionais,
                 count(*) filter (where tipo = 'CONTRATANTE') contratantes
          from users
          group by 1
          order by 1 desc
          limit 6`),
      ]);

    const u = usuarios.rows[0] as Record<string, unknown>;
    const p = perfis.rows[0] as Record<string, unknown>;
    const e = engaj.rows[0] as Record<string, unknown>;
    const ct = contratantes.rows[0] as Record<string, unknown>;
    const o = obras.rows[0] as Record<string, unknown>;
    const l = lances.rows[0] as Record<string, unknown>;
    const s = subs.rows[0] as Record<string, unknown>;

    // coorte volta em ordem decrescente (mais recente primeiro) -> reverte p/ leitura cronológica
    const coorteRows: AdminCohortRow[] = (coorte.rows as Record<string, unknown>[])
      .map((row) => ({
        mes: String(row.mes),
        cadastros: num(row.cadastros),
        profissionais: num(row.profissionais),
        contratantes: num(row.contratantes),
      }))
      .reverse();

    return {
      cadastros: num(u.cadastros),
      usuariosProfissionais: num(u.prof),
      profissionaisComPerfil: num(p.com_perfil),
      profissionaisAtivados: num(p.ativados),
      profissionaisComLance: num(e.com_lance),
      contratantesComObra: num(ct.com_obra),
      obrasTotal: num(o.total),
      obrasAdjudicadas: num(o.adjudicadas),
      obrasComLance: num(l.obras_com_lance),
      lancesTotal: num(l.lances_total),
      assinaturasAtivas: num(s.ativas),
      assinaturasCanceladas: num(s.canceladas),
      mrrCentavos: num(s.mrr),
      coorte: coorteRows,
    };
  }

  async listReviewsPaginated(
    page: number,
    limit: number,
  ): Promise<{
    items: Array<{
      id: string;
      bookingId: string;
      autorNome: string;
      alvoNome: string;
      nota: number;
      comentario: string | null;
      status: string;
      criadoEm: string;
    }>;
    total: number;
  }> {
    const offset = (page - 1) * limit;
    const itemsResult = await this.db.execute(sql`
      select r.id, r.booking_id as "bookingId", 
             u1.nome_completo as "autorNome", 
             u2.nome_completo as "alvoNome", 
             r.nota, r.comentario, r.status, 
             r.criado_em as "criadoEm"
      from reviews r
      left join users u1 on u1.id = r.autor_id
      left join users u2 on u2.id = r.alvo_id
      order by r.criado_em desc
      limit ${limit} offset ${offset}
    `);
    const countResult = await this.db.execute(sql`select count(*) as total from reviews`);

    const items = (itemsResult.rows as any[]).map((row) => ({
      id: String(row.id),
      bookingId: String(row.bookingId),
      autorNome: String(row.autorNome ?? "Desconhecido"),
      alvoNome: String(row.alvoNome ?? "Desconhecido"),
      nota: Number(row.nota),
      comentario: row.comentario ? String(row.comentario) : null,
      status: String(row.status),
      criadoEm: new Date(row.criadoEm).toISOString(),
    }));
    const total = Number(countResult.rows[0]?.total ?? 0);

    return { items, total };
  }
}
