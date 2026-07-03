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
/** Ordenações disponíveis (distância exige busca geográfica). */
export const searchOrderSchema = z.enum(["relevancia", "nota", "distancia"]);
export type SearchOrder = z.infer<typeof searchOrderSchema>;

export const searchProfessionalsQuerySchema = z
  .object({
    q: z.string().trim().min(1).max(80).optional(),
    especialidade: z.string().trim().min(2).max(60).optional(),
    plano: professionalPlanSchema.optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    raioKm: z.coerce.number().positive().max(MAX_SEARCH_RADIUS_KM).optional(),
    /** Nota média mínima (1–5) — considera só avaliações reveladas. */
    notaMin: z.coerce.number().min(1).max(5).optional(),
    ordem: searchOrderSchema.default("relevancia"),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(MAX_SEARCH_LIMIT).default(DEFAULT_SEARCH_LIMIT),
  })
  .refine((q) => (q.lat === undefined) === (q.lng === undefined), {
    message: "Informe lat e lng juntos para a busca geográfica.",
    path: ["lat"],
  });
export type SearchProfessionalsQuery = z.infer<typeof searchProfessionalsQuerySchema>;

/**
 * Faixa de preço de referência de uma especialidade — agregado **anônimo** dos
 * lances dados em obras dessa especialidade (o sigilo individual é preservado;
 * só estatística). Ataca a dor "não sei quanto devia custar".
 */
export const priceReferenceSchema = z.object({
  especialidade: z.string(),
  minCentavos: z.number().int().positive(),
  medianaCentavos: z.number().int().positive(),
  maxCentavos: z.number().int().positive(),
  amostras: z.number().int().positive(),
});
export type PriceReference = z.infer<typeof priceReferenceSchema>;

/** Resposta paginada da busca (+ faixa de preço quando filtrada por especialidade). */
export const searchProfessionalsResultSchema = z.object({
  items: z.array(searchResultSchema),
  meta: paginationMetaSchema,
  faixaPreco: priceReferenceSchema.nullable(),
});
export type SearchProfessionalsResult = z.infer<typeof searchProfessionalsResultSchema>;

/** Entrada para favoritar/desfavoritar um profissional. */
export const favoriteInputSchema = z.object({ professionalId: uuidSchema });
export type FavoriteInput = z.infer<typeof favoriteInputSchema>;
