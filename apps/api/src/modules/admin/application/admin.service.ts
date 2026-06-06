import { Inject, Injectable } from "@nestjs/common";
import type { HealthSnapshot } from "@obracerta/shared";
import { rate } from "../domain/metrics-rules.js";
import {
  ADMIN_METRICS_REPOSITORY,
  type AdminMetricsRepository,
} from "../domain/ports/admin-metrics.repository.js";

@Injectable()
export class AdminService {
  constructor(
    @Inject(ADMIN_METRICS_REPOSITORY) private readonly metrics: AdminMetricsRepository,
  ) {}

  /** Snapshot de saúde do produto (agregações + razões derivadas). */
  async healthSnapshot(): Promise<HealthSnapshot> {
    const c = await this.metrics.counts();
    return {
      usuarios: {
        total: c.usuariosTotal,
        profissionais: c.usuariosProfissionais,
        contratantes: c.usuariosContratantes,
        ativos: c.usuariosAtivos,
        suspensos: c.usuariosSuspensos,
      },
      ativacao: {
        profissionaisComPerfil: c.profissionaisComPerfil,
        profissionaisAtivados: c.profissionaisAtivados,
      },
      agendamentos: {
        total: c.agendamentosTotal,
        concluidos: c.agendamentosConcluidos,
        taxaConclusao: rate(c.agendamentosConcluidos, c.agendamentosTotal),
      },
      reputacao: {
        avaliacoesReveladas: c.avaliacoesReveladas,
        obrasAvaliadasBilateralmente: c.obrasAvaliadasBilateralmente,
      },
      monetizacao: {
        assinaturasAtivas: c.assinaturasAtivas,
        assinaturasCanceladas: c.assinaturasCanceladas,
        churnPct: rate(c.assinaturasCanceladas, c.assinaturasAtivas + c.assinaturasCanceladas),
        mrrCentavos: c.mrrCentavos,
      },
      moderacao: {
        denunciasAbertas: c.denunciasAbertas,
        suspensoesAtivas: c.suspensoesAtivas,
      },
      obras: {
        abertas: c.obrasAbertas,
        adjudicadas: c.obrasAdjudicadas,
      },
    };
  }
}
