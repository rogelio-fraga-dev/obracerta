import { z } from "zod";

/**
 * Analytics do perfil do profissional (homologação 18/07). O bloco base vem com
 * o plano Profissional (feature `profile.analytics`); o bloco `avancado` é
 * exclusivo do Especialista (`profile.analytics.advanced`) — quando o plano não
 * o inclui, vem `null` (a UI mostra o cadeado de upgrade).
 */
export const professionalAnalyticsSchema = z.object({
  pedidos: z.object({
    total: z.number().int().min(0),
    ultimos30d: z.number().int().min(0),
    aprovados: z.number().int().min(0),
    concluidos: z.number().int().min(0),
    recusados: z.number().int().min(0),
    expirados: z.number().int().min(0),
  }),
  /** Taxa de aceitação (0–100); null sem histórico. */
  taxaAceitacao: z.number().min(0).max(100).nullable(),
  avaliacoes: z.object({
    media: z.number().min(0).max(5).nullable(),
    total: z.number().int().min(0),
  }),
  avancado: z
    .object({
      lances: z.object({
        enviados: z.number().int().min(0),
        aceitos: z.number().int().min(0),
        /** Conversão lance→contratação (0–100); null sem lances. */
        taxaConversao: z.number().min(0).max(100).nullable(),
      }),
      /** Soma dos lances aceitos (ganho estimado via plataforma). */
      ganhoEstimadoCentavos: z.number().int().min(0),
      /** Pedidos recebidos por mês (últimos 6, mais antigo primeiro). */
      pedidosPorMes: z.array(
        z.object({ mes: z.string().regex(/^\d{4}-\d{2}$/), total: z.number().int().min(0) }),
      ),
    })
    .nullable(),
});
export type ProfessionalAnalytics = z.infer<typeof professionalAnalyticsSchema>;
