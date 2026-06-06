import { Module } from "@nestjs/common";
import { MetricsService } from "./application/metrics.service.js";
import { MetricsController } from "./interface/metrics.controller.js";

/**
 * Observabilidade (roadmap §10, Fase 6). Métricas HTTP no formato Prometheus
 * (`GET /metrics`) alimentadas pelo MetricsInterceptor global. Exporta o
 * MetricsService para o interceptor (registrado em AppModule via APP_INTERCEPTOR).
 */
@Module({
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class ObservabilityModule {}
