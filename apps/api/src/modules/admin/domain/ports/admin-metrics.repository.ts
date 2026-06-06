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

/** Porta de saída das métricas admin (consultas de agregação). */
export interface AdminMetricsRepository {
  counts(): Promise<AdminCounts>;
}

export const ADMIN_METRICS_REPOSITORY = Symbol("ADMIN_METRICS_REPOSITORY");
