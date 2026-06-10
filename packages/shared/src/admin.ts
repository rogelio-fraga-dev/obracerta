import { z } from "zod";
import { userRoleSchema } from "./enums.js";

/**
 * Contratos administrativos (roadmap Fase 6). Definição dos papéis de um usuário
 * (substitui o conjunto inteiro — idempotente). Ação restrita a ADMIN (RolesGuard).
 */
export const setUserRolesSchema = z.object({
  roles: z.array(userRoleSchema).max(3),
});
export type SetUserRolesInput = z.infer<typeof setUserRolesSchema>;

const contagem = z.number().int().nonnegative();
const taxa = z.number().min(0).max(1);

/**
 * Snapshot de saúde do produto (roadmap §10/Melhoria #4). Métricas agregadas
 * (read-only) para o dashboard admin: ativação, conclusão, North Star (obras
 * concluídas e avaliadas pelos dois lados), churn de assinatura, moderação e obras.
 */
export const healthSnapshotSchema = z.object({
  usuarios: z.object({
    total: contagem,
    profissionais: contagem,
    contratantes: contagem,
    ativos: contagem,
    suspensos: contagem,
  }),
  ativacao: z.object({
    profissionaisComPerfil: contagem,
    profissionaisAtivados: contagem, // completude >= 50%
  }),
  agendamentos: z.object({
    total: contagem,
    concluidos: contagem,
    taxaConclusao: taxa,
  }),
  reputacao: z.object({
    avaliacoesReveladas: contagem,
    /** North Star: pedidos com avaliação dos DOIS lados (revelada). */
    obrasAvaliadasBilateralmente: contagem,
  }),
  monetizacao: z.object({
    assinaturasAtivas: contagem, // EM_GRACA + ATIVA
    assinaturasCanceladas: contagem,
    churnPct: taxa,
    mrrCentavos: contagem, // soma do valor das assinaturas ATIVA
  }),
  moderacao: z.object({
    denunciasAbertas: contagem,
    suspensoesAtivas: contagem,
  }),
  obras: z.object({
    abertas: contagem,
    adjudicadas: contagem,
  }),
});
export type HealthSnapshot = z.infer<typeof healthSnapshotSchema>;

const valor = z.number().nonnegative(); // média/derivado: não inteiro

/** Ponto de uma série temporal de coorte (mês `YYYY-MM`). */
export const cohortPointSchema = z.object({
  mes: z.string(), // "YYYY-MM"
  cadastros: contagem,
  profissionais: contagem,
  contratantes: contagem,
});
export type CohortPoint = z.infer<typeof cohortPointSchema>;

/**
 * Analytics estratégico do admin (roadmap §10). Métricas de crescimento e
 * liquidez derivadas read-only:
 *
 * - **funil**: cadastro → perfil → ativação → engajamento (lance) → conversão
 *   (obra adjudicada), com as taxas de passagem entre etapas;
 * - **liquidez**: fração das obras que recebem ≥1 lance e densidade de lances;
 * - **receita**: ARPA e LTV ESTIMADO (projeção, não realizado) + churn;
 * - **coorte**: cadastros por mês (últimos meses) para leitura de tendência.
 */
export const analyticsSnapshotSchema = z.object({
  funil: z.object({
    cadastros: contagem,
    profissionaisComPerfil: contagem,
    profissionaisAtivados: contagem, // completude >= 50%
    profissionaisComLance: contagem, // enviaram ≥1 proposta
    contratantesComObra: contagem, // publicaram ≥1 obra
    obrasAdjudicadas: contagem,
    taxaPerfil: taxa, // comPerfil / profissionais
    taxaAtivacao: taxa, // ativados / comPerfil
    taxaEngajamento: taxa, // comLance / ativados
  }),
  liquidez: z.object({
    obrasTotal: contagem,
    obrasComLance: contagem,
    taxaLiquidez: taxa, // comLance / total
    lancesPorObra: valor, // média de lances por obra com lance
    taxaAdjudicacao: taxa, // adjudicadas / total
  }),
  receita: z.object({
    assinantesAtivos: contagem,
    arpaCentavos: contagem, // mrr / assinantes ativos
    ltvEstimadoCentavos: contagem, // ESTIMATIVA: arpa projetado pela vida útil
    churnPct: taxa,
  }),
  coorte: z.array(cohortPointSchema),
});
export type AnalyticsSnapshot = z.infer<typeof analyticsSnapshotSchema>;
