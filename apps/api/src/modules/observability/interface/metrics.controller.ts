import { Controller, Get, Header } from "@nestjs/common";
import { RawResponse } from "../../../common/decorators/raw-response.decorator.js";
import { MetricsService } from "../application/metrics.service.js";

/**
 * Exposição das métricas no formato Prometheus (roadmap §10). Aberto (sem JWT) —
 * em produção, restrinja por rede/scraper. NOTA: o envelope global de resposta NÃO
 * se aplica aqui (texto puro, não JSON) — por isso o Content-Type explícito.
 */
@Controller("metrics")
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  @RawResponse()
  @Header("Content-Type", "text/plain; version=0.0.4")
  scrape(): string {
    return this.metrics.render();
  }
}
