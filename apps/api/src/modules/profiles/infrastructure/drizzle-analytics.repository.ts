import { Inject, Injectable } from "@nestjs/common";
import { and, count, eq, gte, sql } from "drizzle-orm";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { bookingRequests } from "../../../infrastructure/database/schema/booking-requests.js";
import { proposals } from "../../../infrastructure/database/schema/proposals.js";
import { reviews } from "../../../infrastructure/database/schema/reviews.js";
import type {
  AnalyticsRepository,
  ProfessionalAnalyticsAggregates,
} from "../domain/ports/analytics.repository.js";

const DIAS_30_MS = 30 * 24 * 60 * 60 * 1000;
const MESES_TENDENCIA = 6;

/**
 * Agregados read-only do analytics do profissional (mesma receita do
 * admin/metrics): `count(*) filter` em consultas paralelas — sem tabela nova,
 * sem tracking extra; tudo deriva do que o produto já registra.
 */
@Injectable()
export class DrizzleAnalyticsRepository implements AnalyticsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async aggregatesFor(professionalId: string): Promise<ProfessionalAnalyticsAggregates> {
    const corte30d = new Date(Date.now() - DIAS_30_MS);
    const [pedidosRow, reviewRow, lancesRow, porMes] = await Promise.all([
      this.db
        .select({
          total: count(),
          ultimos30d: sql<number>`count(*) filter (where ${bookingRequests.criadoEm} >= ${corte30d})::int`,
          aprovados: sql<number>`count(*) filter (where ${bookingRequests.status} in ('APROVADO','INICIADO','CONCLUIDO'))::int`,
          concluidos: sql<number>`count(*) filter (where ${bookingRequests.status} = 'CONCLUIDO')::int`,
          recusados: sql<number>`count(*) filter (where ${bookingRequests.status} = 'RECUSADO')::int`,
          expirados: sql<number>`count(*) filter (where ${bookingRequests.status} = 'EXPIRADO')::int`,
        })
        .from(bookingRequests)
        .where(eq(bookingRequests.professionalId, professionalId))
        .then((r) => r[0]),
      this.db
        .select({
          media: sql<number | null>`avg(${reviews.nota})`,
          total: count(),
        })
        .from(reviews)
        .where(and(eq(reviews.alvoId, professionalId), eq(reviews.status, "REVELADA")))
        .then((r) => r[0]),
      this.db
        .select({
          enviados: count(),
          aceitos: sql<number>`count(*) filter (where ${proposals.status} = 'ACEITA')::int`,
          valorAceito: sql<number>`coalesce(sum(${proposals.valorCentavos}) filter (where ${proposals.status} = 'ACEITA'), 0)::bigint`,
        })
        .from(proposals)
        .where(eq(proposals.professionalId, professionalId))
        .then((r) => r[0]),
      this.db
        .select({
          mes: sql<string>`to_char(date_trunc('month', ${bookingRequests.criadoEm}), 'YYYY-MM')`,
          total: count(),
        })
        .from(bookingRequests)
        .where(
          and(
            eq(bookingRequests.professionalId, professionalId),
            gte(
              bookingRequests.criadoEm,
              sql`date_trunc('month', now()) - interval '${sql.raw(String(MESES_TENDENCIA - 1))} months'`,
            ),
          ),
        )
        .groupBy(sql`date_trunc('month', ${bookingRequests.criadoEm})`)
        .orderBy(sql`date_trunc('month', ${bookingRequests.criadoEm})`),
    ]);

    return {
      pedidos: {
        total: pedidosRow?.total ?? 0,
        ultimos30d: pedidosRow?.ultimos30d ?? 0,
        aprovados: pedidosRow?.aprovados ?? 0,
        concluidos: pedidosRow?.concluidos ?? 0,
        recusados: pedidosRow?.recusados ?? 0,
        expirados: pedidosRow?.expirados ?? 0,
      },
      avaliacoes: {
        media: reviewRow?.media === null || reviewRow?.media === undefined
          ? null
          : Math.round(Number(reviewRow.media) * 100) / 100,
        total: reviewRow?.total ?? 0,
      },
      lances: {
        enviados: lancesRow?.enviados ?? 0,
        aceitos: lancesRow?.aceitos ?? 0,
        valorAceitoCentavos: Number(lancesRow?.valorAceito ?? 0),
      },
      pedidosPorMes: porMes.map((m) => ({ mes: m.mes, total: m.total })),
    };
  }
}
