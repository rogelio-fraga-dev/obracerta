import { Injectable } from "@nestjs/common";
import { MetricsRegistry } from "../domain/metrics-registry.js";

/**
 * Mantém o registro de métricas como singleton da aplicação (provider Nest). O
 * interceptor registra; o controller `/metrics` renderiza.
 */
@Injectable()
export class MetricsService {
  private readonly registry = new MetricsRegistry();

  record(method: string, route: string, status: number, durationMs: number): void {
    this.registry.record(method, route, status, durationMs);
  }

  render(): string {
    return this.registry.render();
  }
}
