import { z } from "zod";
import { uuidSchema, slugSchema } from "./primitives.js";
import { professionalPlanSchema } from "./enums.js";
import { paginationMetaSchema } from "./pagination.js";

/**
 * Contratos de busca de profissionais (roadmap §17, Fase 5). Combina texto
 * (pg_trgm), geo (raio via PostGIS) e filtros por especialidade/plano, paginado.
 */

/** Um profissional no resultado da busca (dados de descoberta). */
export const searchResultSchema = z.object({
  userId: uuidSchema,
  nome: z.string(),
  slug: slugSchema,
  especialidades: z.array(z.string()),
  bairro: z.string().nullable(),
  plano: professionalPlanSchema,
  anosExperiencia: z.number().int().nullable(),
  fotoUrl: z.string().nullable(),
  /** Reputação (avaliações reveladas): média 0–5 e total. 0/0 quando ainda não avaliado. */
  mediaNota: z.number().min(0).max(5),
  totalAvaliacoes: z.number().int().min(0),
  /** Distância em km do ponto buscado (null quando a busca não é geográfica). */
  distanciaKm: z.number().nullable(),
});
export type SearchResult = z.infer<typeof searchResultSchema>;

/** Limites da busca de profissionais. */
export const MAX_SEARCH_LIMIT = 50;
export const DEFAULT_SEARCH_LIMIT = 20;
export const MAX_SEARCH_RADIUS_KM = 200;
export const DEFAULT_SEARCH_RADIUS_KM = 25;

/**
 * Query da busca. `lat`+`lng` (juntos) ligam a busca geográfica; `raioKm` é
 * opcional (default no servidor). Coerções tratam query string (`?lat=...`).
 */
export const searchProfessionalsQuerySchema = z
  .object({
    q: z.string().trim().min(1).max(80).optional(),
    especialidade: z.string().trim().min(2).max(60).optional(),
    plano: professionalPlanSchema.optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    raioKm: z.coerce.number().positive().max(MAX_SEARCH_RADIUS_KM).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(MAX_SEARCH_LIMIT).default(DEFAULT_SEARCH_LIMIT),
  })
  .refine((q) => (q.lat === undefined) === (q.lng === undefined), {
    message: "Informe lat e lng juntos para a busca geográfica.",
    path: ["lat"],
  });
export type SearchProfessionalsQuery = z.infer<typeof searchProfessionalsQuerySchema>;

/** Resposta paginada da busca. */
export const searchProfessionalsResultSchema = z.object({
  items: z.array(searchResultSchema),
  meta: paginationMetaSchema,
});
export type SearchProfessionalsResult = z.infer<typeof searchProfessionalsResultSchema>;
