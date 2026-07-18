import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import type { ProfessionalAnalytics } from "@obracerta/shared";
import { BillingService } from "../../billing/application/billing.service.js";
import { Feature } from "../../entitlements/domain/entitlements.js";
import {
  ANALYTICS_REPOSITORY,
  type AnalyticsRepository,
} from "../domain/ports/analytics.repository.js";

/**
 * Analytics do perfil do profissional (homologação 18/07). O bloco base vem com
 * a feature `profile.analytics` (Profissional+); o bloco `avancado` (lances,
 * ganho estimado, tendência mensal) é do Especialista
 * (`profile.analytics.advanced`) — sem a feature, vem `null` e a UI mostra o
 * cadeado. A trava real é aqui, não na UI.
 */
@Injectable()
export class ProfileAnalyticsService {
  constructor(
    @Inject(ANALYTICS_REPOSITORY) private readonly repo: AnalyticsRepository,
    private readonly billing: BillingService,
  ) {}

  async forProfessional(professionalId: string): Promise<ProfessionalAnalytics> {
    if (!(await this.billing.can(professionalId, Feature.ANALYTICS))) {
      throw new ForbiddenException(
        "Analytics do perfil é dos planos Profissional e Especialista. Faça upgrade em Cobranças.",
      );
    }
    const agg = await this.repo.aggregatesFor(professionalId);

    const respondidos = agg.pedidos.aprovados + agg.pedidos.recusados + agg.pedidos.expirados;
    const taxaAceitacao =
      respondidos > 0 ? Math.round((agg.pedidos.aprovados / respondidos) * 100) : null;

    const avancadoLiberado = await this.billing.can(professionalId, Feature.ADVANCED_ANALYTICS);
    const avancado = avancadoLiberado
      ? {
          lances: {
            enviados: agg.lances.enviados,
            aceitos: agg.lances.aceitos,
            taxaConversao:
              agg.lances.enviados > 0
                ? Math.round((agg.lances.aceitos / agg.lances.enviados) * 100)
                : null,
          },
          ganhoEstimadoCentavos: agg.lances.valorAceitoCentavos,
          pedidosPorMes: agg.pedidosPorMes,
        }
      : null;

    return {
      pedidos: agg.pedidos,
      taxaAceitacao,
      avaliacoes: agg.avaliacoes,
      avancado,
    };
  }
}
