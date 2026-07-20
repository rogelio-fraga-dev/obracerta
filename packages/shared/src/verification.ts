import { z } from "zod";

/**
 * Verificação de identidade por foto (selfie) do profissional. Fluxo:
 * NAO_ENVIADO → EM_ANALISE (enviou a foto) → VERIFICADO / RECUSADO (moderação).
 * Só VERIFICADO exibe o selo público. A foto é privada (só a moderação vê).
 */
export const VerificationStatus = {
  NAO_ENVIADO: "NAO_ENVIADO",
  EM_ANALISE: "EM_ANALISE",
  VERIFICADO: "VERIFICADO",
  RECUSADO: "RECUSADO",
} as const;
export const verificationStatusSchema = z.nativeEnum(VerificationStatus);
export type VerificationStatus = z.infer<typeof verificationStatusSchema>;

/** Estado da verificação do próprio profissional (tela de perfil). */
export const myVerificationSchema = z.object({
  status: verificationStatusSchema,
  verificadoEm: z.string().nullable(),
});
export type MyVerification = z.infer<typeof myVerificationSchema>;

/** Item da fila de verificação da moderação (foto + dados do profissional). */
export const pendingVerificationSchema = z.object({
  userId: z.string().uuid(),
  nome: z.string(),
  fotoUrl: z.string().nullable(),
  enviadoEm: z.string(),
});
export type PendingVerification = z.infer<typeof pendingVerificationSchema>;

/** Decisão da moderação sobre uma verificação. */
export const resolveVerificationSchema = z.object({ aprovar: z.boolean() });
export type ResolveVerificationInput = z.infer<typeof resolveVerificationSchema>;
