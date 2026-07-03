import { AdminService } from "./admin.service.js";
import type {
  AdminAnalyticsAggregates,
  AdminCounts,
  AdminMetricsRepository,
} from "../domain/ports/admin-metrics.repository.js";
import { MAX_MESES_VIDA } from "../domain/metrics-rules.js";

const baseAggregates: AdminAnalyticsAggregates = {
  cadastros: 100,
  usuariosProfissionais: 40,
  profissionaisComPerfil: 30,
  profissionaisAtivados: 20,
  profissionaisComLance: 10,
  contratantesComObra: 25,
  obrasTotal: 50,
  obrasComLance: 20,
  obrasAdjudicadas: 15,
  lancesTotal: 60,
  assinaturasAtivas: 8,
  assinaturasCanceladas: 2,
  mrrCentavos: 39920, // 8 * 4990
  coorte: [{ mes: "2026-06", cadastros: 100, profissionais: 40, contratantes: 60 }],
};

function makeService(aggregates: AdminAnalyticsAggregates): AdminService {
  const repo: AdminMetricsRepository = {
    counts: () => Promise.resolve({} as AdminCounts),
    analytics: () => Promise.resolve(aggregates),
    listReviewsPaginated: () => Promise.resolve({ items: [], total: 0 }),
  };
  return new AdminService(repo);
}

describe("AdminService.analyticsSnapshot", () => {
  it("deriva as taxas do funil a partir dos agregados crus", async () => {
    const snap = await makeService(baseAggregates).analyticsSnapshot();

    expect(snap.funil.taxaPerfil).toBe(0.75); // 30/40
    expect(snap.funil.taxaAtivacao).toBe(0.67); // 20/30 arredondado
    expect(snap.funil.taxaEngajamento).toBe(0.5); // 10/20
  });

  it("deriva liquidez (taxa, densidade de lances e adjudicação)", async () => {
    const snap = await makeService(baseAggregates).analyticsSnapshot();

    expect(snap.liquidez.taxaLiquidez).toBe(0.4); // 20/50
    expect(snap.liquidez.lancesPorObra).toBe(3); // 60/20
    expect(snap.liquidez.taxaAdjudicacao).toBe(0.3); // 15/50
  });

  it("deriva ARPA e churn da receita", async () => {
    const snap = await makeService(baseAggregates).analyticsSnapshot();

    expect(snap.receita.assinantesAtivos).toBe(8);
    expect(snap.receita.arpaCentavos).toBe(4990); // 39920/8
    expect(snap.receita.churnPct).toBe(0.2); // 2/(8+2)
    // LTV estimado = arpa / churn = 4990 / 0.2 = 24950
    expect(snap.receita.ltvEstimadoCentavos).toBe(24950);
  });

  it("base nova (sem assinantes/churn) não divide por zero e usa o teto de LTV", async () => {
    const vazio: AdminAnalyticsAggregates = {
      ...baseAggregates,
      assinaturasAtivas: 0,
      assinaturasCanceladas: 0,
      mrrCentavos: 0,
    };
    const snap = await makeService(vazio).analyticsSnapshot();

    expect(snap.receita.arpaCentavos).toBe(0);
    expect(snap.receita.churnPct).toBe(0);
    expect(snap.receita.ltvEstimadoCentavos).toBe(0); // ARPA 0 -> LTV 0
  });

  it("churn zero com receita usa o teto de meses de vida no LTV", async () => {
    const semChurn: AdminAnalyticsAggregates = {
      ...baseAggregates,
      assinaturasCanceladas: 0,
    };
    const snap = await makeService(semChurn).analyticsSnapshot();

    expect(snap.receita.churnPct).toBe(0);
    expect(snap.receita.ltvEstimadoCentavos).toBe(4990 * MAX_MESES_VIDA);
  });

  it("repassa a série de coorte", async () => {
    const snap = await makeService(baseAggregates).analyticsSnapshot();
    expect(snap.coorte).toHaveLength(1);
    expect(snap.coorte[0]?.mes).toBe("2026-06");
  });
});
