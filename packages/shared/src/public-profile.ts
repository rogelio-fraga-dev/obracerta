import { z } from "zod";
import { slugSchema } from "./primitives.js";
import { professionalPlanSchema } from "./enums.js";
import { reputationSummarySchema } from "./reputation.js";

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
  reputacao: reputationSummarySchema,
});
export type PublicProfile = z.infer<typeof publicProfileSchema>;
