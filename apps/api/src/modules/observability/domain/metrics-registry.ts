/**
 * Registro de métricas HTTP em memória (roadmap §10, observabilidade Fase 6). Conta
 * requisições e soma durações por (método, rota, status) e renderiza no formato
 * texto do Prometheus. Sem dependência externa — um scraper (Prometheus) lê `/metrics`.
 * A cardinalidade fica baixa porque a `rota` é o PADRÃO (`/work-orders/:id`), não a URL.
 */

interface Serie {
  method: string;
  route: string;
  status: number;
  count: number;
  sumMs: number;
}

export class MetricsRegistry {
  private readonly series = new Map<string, Serie>();

  /** Registra uma requisição concluída. */
  record(method: string, route: string, status: number, durationMs: number): void {
    const key = `${method}|${route}|${status}`;
    const serie = this.series.get(key) ?? { method, route, status, count: 0, sumMs: 0 };
    serie.count += 1;
    serie.sumMs += durationMs;
    this.series.set(key, serie);
  }

  /** Renderiza as métricas no formato texto do Prometheus. */
  render(): string {
    const lines: string[] = [
      "# HELP http_requests_total Total de requisições HTTP",
      "# TYPE http_requests_total counter",
    ];
    for (const s of this.series.values()) {
      lines.push(`http_requests_total${labels(s)} ${s.count}`);
    }
    lines.push(
      "# HELP http_request_duration_ms_sum Soma das durações das requisições (ms)",
      "# TYPE http_request_duration_ms_sum counter",
    );
    for (const s of this.series.values()) {
      lines.push(`http_request_duration_ms_sum${labels(s)} ${round2(s.sumMs)}`);
    }
    return `${lines.join("\n")}\n`;
  }
}

function labels(s: Serie): string {
  return `{method="${s.method}",route="${s.route}",status="${s.status}"}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
