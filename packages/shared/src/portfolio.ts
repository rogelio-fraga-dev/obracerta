import { z } from "zod";
import { uuidSchema, isoTimestampSchema } from "./primitives.js";

/**
 * Portfólio de obras do profissional (roadmap §8.5 backlog / §18). Galeria de
 * fotos dos trabalhos, exibida no perfil público. É um benefício de plano pago
 * (feature `profile.portfolio`) — o upload é gated; a exibição segue o plano.
 */

/** Máximo de fotos no portfólio (anti-abuso + foco na curadoria). */
export const MAX_PORTFOLIO_PHOTOS = 12;

/** Foto do portfólio (visão do dono). */
export const portfolioPhotoSchema = z.object({
  id: uuidSchema,
  professionalId: uuidSchema,
  url: z.string().url(),
  legenda: z.string().nullable(),
  criadoEm: isoTimestampSchema,
});
export type PortfolioPhoto = z.infer<typeof portfolioPhotoSchema>;

/** Edição de uma foto do portfólio (por ora, só a legenda). */
export const updatePortfolioPhotoSchema = z.object({
  legenda: z.string().trim().max(140).nullable(),
});
export type UpdatePortfolioPhotoInput = z.infer<typeof updatePortfolioPhotoSchema>;

/** Foto do portfólio como exibida publicamente (sem ids internos). */
export const publicPortfolioPhotoSchema = z.object({
  url: z.string().url(),
  legenda: z.string().nullable(),
});
export type PublicPortfolioPhoto = z.infer<typeof publicPortfolioPhotoSchema>;
