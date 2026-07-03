/** Contagens cruas agregadas do banco (read-only) para o snapshot de saúde. */
export interface AdminCounts {
  usuariosTotal: number;
  usuariosProfissionais: number;
  usuariosContratantes: number;
  usuariosAtivos: number;
  usuariosSuspensos: number;
  profissionaisComPerfil: number;
  profissionaisAtivados: number;
  agendamentosTotal: number;
  agendamentosConcluidos: number;
  avaliacoesReveladas: number;
  obrasAvaliadasBilateralmente: number;
  assinaturasAtivas: number;
  assinaturasCanceladas: number;
  mrrCentavos: number;
  denunciasAbertas: number;
  suspensoesAtivas: number;
  obrasAbertas: number;
  obrasAdjudicadas: number;
}

/** Ponto cru de coorte (mês `YYYY-MM`) agregado do banco. */
export interface AdminCohortRow {
  mes: string;
  cadastros: number;
  profissionais: number;
  contratantes: number;
}

/** Agregados crus para o analytics estratégico (funil/liquidez/receita). */
export interface AdminAnalyticsAggregates {
  cadastros: number;
  usuariosProfissionais: number;
  profissionaisComPerfil: number;
  profissionaisAtivados: number;
  profissionaisComLance: number;
  contratantesComObra: number;
  obrasTotal: number;
  obrasComLance: number;
  obrasAdjudicadas: number;
  lancesTotal: number;
  assinaturasAtivas: number;
  assinaturasCanceladas: number;
  mrrCentavos: number;
  coorte: AdminCohortRow[];
}

/** Porta de saída das métricas admin (consultas de agregação). */
export interface AdminMetricsRepository {
  counts(): Promise<AdminCounts>;
  analytics(): Promise<AdminAnalyticsAggregates>;
  listReviewsPaginated(
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
  }>;
}

export const ADMIN_METRICS_REPOSITORY = Symbol("ADMIN_METRICS_REPOSITORY");
