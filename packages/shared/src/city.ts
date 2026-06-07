import { z } from "zod";
import { uuidSchema } from "./primitives.js";

/**
 * Cidade (dado de referência). Usada como `cidadeId` ao abrir uma obra (Fase 5) e
 * no cadastro. Lista pública e read-only — sem dados sensíveis.
 */
export const citySchema = z.object({
  id: uuidSchema,
  nome: z.string().trim().min(1).max(120),
  uf: z.string().trim().length(2),
});
export type City = z.infer<typeof citySchema>;
