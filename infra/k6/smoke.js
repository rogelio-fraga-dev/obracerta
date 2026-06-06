// Teste de carga (smoke) com k6 — roadmap §10 (Fase 6).
// Requer o binário k6 instalado (https://k6.io). NÃO roda no CI.
//   API rodando local:  pnpm --filter @obracerta/api dev
//   k6 run infra/k6/smoke.js
//   k6 run -e BASE_URL=http://127.0.0.1:3333 infra/k6/smoke.js
import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://127.0.0.1:3333";

export const options = {
  // sobe até 20 VUs, sustenta, e desce — smoke/baseline, não estresse
  stages: [
    { duration: "15s", target: 20 },
    { duration: "30s", target: 20 },
    { duration: "15s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"], // < 1% de erro
    http_req_duration: ["p(95)<300"], // p95 < 300ms (alvo CWV/§10 para a API local)
  },
};

export default function () {
  // endpoints públicos (sem auth) — health e métricas
  const health = http.get(`${BASE_URL}/health`);
  check(health, { "health 200": (r) => r.status === 200 });

  const metrics = http.get(`${BASE_URL}/metrics`);
  check(metrics, { "metrics 200": (r) => r.status === 200 });

  sleep(1);
}
