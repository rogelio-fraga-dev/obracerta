import { z } from "zod";
import { uuidSchema, isoTimestampSchema } from "./primitives.js";

/**
 * Endereços salvos do usuário (aba Endereços). Atalho para preencher obra/pedido
 * e referência de atendimento. O CEP habilita o preenchimento automático (ViaCEP
 * no cliente) — aqui só validamos o formato.
 */

/** UFs do Brasil. */
export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;
export const ufSchema = z.enum(UFS);
export type UF = z.infer<typeof ufSchema>;

/** CEP normalizado: 8 dígitos, sem hífen. */
export const cepSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .pipe(z.string().regex(/^\d{8}$/, "CEP deve ter 8 dígitos."));

/** Endereço salvo (visão do dono). */
export const addressSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  apelido: z.string().trim().min(1).max(40),
  cep: z.string().regex(/^\d{8}$/),
  logradouro: z.string().trim().min(1).max(200),
  numero: z.string().trim().max(20).nullable(),
  complemento: z.string().trim().max(100).nullable(),
  bairro: z.string().trim().max(120).nullable(),
  cidade: z.string().trim().min(1).max(120),
  uf: ufSchema,
  principal: z.boolean(),
  criadoEm: isoTimestampSchema,
  atualizadoEm: isoTimestampSchema,
});
export type Address = z.infer<typeof addressSchema>;

/** Criação de endereço. */
export const createAddressSchema = z.object({
  apelido: z.string().trim().min(1, "Dê um nome ao endereço (ex.: Casa).").max(40),
  cep: cepSchema,
  logradouro: z.string().trim().min(1, "Informe a rua/avenida.").max(200),
  numero: z.string().trim().max(20).optional(),
  complemento: z.string().trim().max(100).optional(),
  bairro: z.string().trim().max(120).optional(),
  cidade: z.string().trim().min(1, "Informe a cidade.").max(120),
  uf: ufSchema,
  principal: z.boolean().optional(),
});
export type CreateAddressInput = z.infer<typeof createAddressSchema>;

/** Edição parcial de endereço. */
export const updateAddressSchema = createAddressSchema.partial();
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
