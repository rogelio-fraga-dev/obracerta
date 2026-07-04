import { z } from "zod";
import { isoTimestampSchema, slugSchema } from "./primitives.js";
import { professionalPlanSchema } from "./enums.js";
import { reputationSummarySchema } from "./reputation.js";
import { publicPortfolioPhotoSchema } from "./portfolio.js";

/** Avaliação exibida no perfil público: autor parcial + nota + comentário + resposta. */
export const publicReviewSchema = z.object({
  /** Nome parcial do autor ("Maria F.") — minimização LGPD. */
  autorNome: z.string(),
  nota: z.number().int().min(1).max(5),
  comentario: z.string().nullable(),
  criadoEm: isoTimestampSchema,
  /** Resposta pública do profissional (direito de resposta), se houver. */
  resposta: z.string().nullable(),
});
export type PublicReview = z.infer<typeof publicReviewSchema>;

/**
 * Perfil público do profissional (roadmap §18/§24, Etapa 5.2). View LIMITADA para
 * SEO/descoberta sem login, com **anti-desintermediação**: nunca expõe contato
 * (WhatsApp), `valores`, agenda detalhada ou referências. Nome é **parcial**
 * (LGPD/minimização); no plano Iniciante, foto e nome ficam ocultos (`null`).
 * A reputação (média/avaliações/badges) é pública — é o que vende.
 */
export const publicProfileSchema = z.object({
  slug: slugSchema,
  /** Nome parcial ("João S."); `null` no plano Iniciante (visibilidade reduzida). */
  nome: z.string().nullable(),
  especialidades: z.array(z.string()),
  bairro: z.string().nullable(),
  anosExperiencia: z.number().int().nullable(),
  plano: professionalPlanSchema,
  /** Foto pública; `null` no plano Iniciante. */
  fotoUrl: z.string().nullable(),
  /** Galeria de obras (vazia se o plano não inclui portfólio). */
  portfolio: z.array(publicPortfolioPhotoSchema),
  reputacao: reputationSummarySchema,
  /** Últimas avaliações reveladas (comentários públicos — o que mais vende). */
  avaliacoes: z.array(publicReviewSchema),
  /** Taxa de aceitação de pedidos (0–1); null sem histórico suficiente. */
  taxaAceitacao: z.number().min(0).max(1).nullable(),
  /** Quantidade de obras concluídas na plataforma */
  obrasConcluidas: z.number().int().min(0).default(0),
});
export type PublicProfile = z.infer<typeof publicProfileSchema>;
