/**
 * Agregados brutos do analytics do profissional (homologação 18/07). O adapter
 * só conta/soma; a composição (e o gating do bloco avançado) é do service.
 */
export interface ProfessionalAnalyticsAggregates {
  pedidos: {
    total: number;
    ultimos30d: number;
    aprovados: number;
    concluidos: number;
    recusados: number;
    expirados: number;
  };
  avaliacoes: { media: number | null; total: number };
  lances: { enviados: number; aceitos: number; valorAceitoCentavos: number };
  /** Pedidos recebidos por mês (últimos 6, mais antigo primeiro). */
  pedidosPorMes: { mes: string; total: number }[];
}

export interface AnalyticsRepository {
  aggregatesFor(professionalId: string): Promise<ProfessionalAnalyticsAggregates>;
}

export const ANALYTICS_REPOSITORY = Symbol("ANALYTICS_REPOSITORY");
