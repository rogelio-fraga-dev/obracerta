import { Inject, Injectable } from "@nestjs/common";
import type { AnalyticsSnapshot, HealthSnapshot } from "@obracerta/shared";
import { rate, media, estimateLtvCentavos } from "../domain/metrics-rules.js";
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

  /**
   * Analytics estratégico (funil/liquidez/receita/coorte). Pega os agregados
   * crus do repositório e deriva taxas, ARPA e LTV estimado no domínio
   * (funções puras testáveis), sem regra de negócio no SQL.
   */
  async analyticsSnapshot(): Promise<AnalyticsSnapshot> {
    const a = await this.metrics.analytics();

    const churnPct = rate(
      a.assinaturasCanceladas,
      a.assinaturasAtivas + a.assinaturasCanceladas,
    );
    const arpaCentavos =
      a.assinaturasAtivas > 0 ? Math.round(a.mrrCentavos / a.assinaturasAtivas) : 0;

    return {
      funil: {
        cadastros: a.cadastros,
        profissionaisComPerfil: a.profissionaisComPerfil,
        profissionaisAtivados: a.profissionaisAtivados,
        profissionaisComLance: a.profissionaisComLance,
        contratantesComObra: a.contratantesComObra,
        obrasAdjudicadas: a.obrasAdjudicadas,
        taxaPerfil: rate(a.profissionaisComPerfil, a.usuariosProfissionais),
        taxaAtivacao: rate(a.profissionaisAtivados, a.profissionaisComPerfil),
        taxaEngajamento: rate(a.profissionaisComLance, a.profissionaisAtivados),
      },
      liquidez: {
        obrasTotal: a.obrasTotal,
        obrasComLance: a.obrasComLance,
        taxaLiquidez: rate(a.obrasComLance, a.obrasTotal),
        lancesPorObra: media(a.lancesTotal, a.obrasComLance),
        taxaAdjudicacao: rate(a.obrasAdjudicadas, a.obrasTotal),
      },
      receita: {
        assinantesAtivos: a.assinaturasAtivas,
        arpaCentavos,
        ltvEstimadoCentavos: estimateLtvCentavos(arpaCentavos, churnPct),
        churnPct,
      },
      coorte: a.coorte,
    };
  }
}
