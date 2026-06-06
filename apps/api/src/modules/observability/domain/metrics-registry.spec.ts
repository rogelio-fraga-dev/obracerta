import { MetricsRegistry } from "./metrics-registry.js";

describe("MetricsRegistry", () => {
  it("acumula contagem e duração por (método, rota, status)", () => {
    const reg = new MetricsRegistry();
    reg.record("GET", "/health", 200, 10);
    reg.record("GET", "/health", 200, 20);
    reg.record("POST", "/reviews", 201, 5);

    const out = reg.render();
    expect(out).toContain('http_requests_total{method="GET",route="/health",status="200"} 2');
    expect(out).toContain(
      'http_request_duration_ms_sum{method="GET",route="/health",status="200"} 30',
    );
    expect(out).toContain('http_requests_total{method="POST",route="/reviews",status="201"} 1');
  });

  it("inclui os cabeçalhos HELP/TYPE do formato Prometheus", () => {
    const reg = new MetricsRegistry();
    reg.record("GET", "/health", 200, 1);
    const out = reg.render();
    expect(out).toContain("# TYPE http_requests_total counter");
    expect(out).toContain("# TYPE http_request_duration_ms_sum counter");
  });

  it("registro vazio renderiza só os cabeçalhos (sem séries)", () => {
    const reg = new MetricsRegistry();
    const out = reg.render();
    expect(out).toContain("# TYPE http_requests_total counter");
    expect(out).not.toContain("http_requests_total{");
  });
});
