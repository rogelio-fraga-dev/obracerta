import { z } from "zod";

/**
 * Environment schema — validated at boot (fail fast, plan §2.5 / nestjs-patterns).
 * Zod is used here too so validation is consistent front↔back↔config.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(3333),
  API_CORS_ORIGINS: z
    .string()
    .default("http://localhost:3000")
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  // Auth (roadmap §6)
  JWT_SECRET: z.string().min(16, "JWT_SECRET deve ter ao menos 16 caracteres"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),
  OTP_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),

  // Login com Google (opcional — sem as credenciais, o adapter fake simula o fluxo)
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),

  // Object storage S3-compatível (roadmap §4.2)
  S3_ENDPOINT: z.string().url().default("http://localhost:9000"),
  S3_REGION: z.string().default("us-east-1"),
  S3_BUCKET: z.string().default("obracerta"),
  S3_ACCESS_KEY: z.string().default("obracerta"),
  S3_SECRET_KEY: z.string().default("obracerta123"),
  S3_PUBLIC_URL: z.string().url().default("http://localhost:9000"),

  // Onboarding (roadmap §5). speedup>1 acelera as mensagens em dev (1 = dias reais).
  ONBOARDING_SPEEDUP: z.coerce.number().positive().default(1),

  // Web Push (PWA). Sem as chaves VAPID, o push fica desabilitado (in-app segue).
  // Gerar par: npx web-push generate-vapid-keys
  VAPID_PUBLIC_KEY: z.string().min(1).optional(),
  VAPID_PRIVATE_KEY: z.string().min(1).optional(),
  VAPID_SUBJECT: z.string().default("mailto:produtoobra@gmail.com"),

  // Billing (roadmap §7.1). Segredo HMAC dos webhooks do gateway de pagamento.
  PAYMENT_WEBHOOK_SECRET: z
    .string()
    .min(16, "PAYMENT_WEBHOOK_SECRET deve ter ao menos 16 caracteres")
    .default("dev-webhook-secret-change-me"),
});

/**
 * Defaults de DEV que jamais podem valer em produção. Com qualquer um deles
 * ativo e NODE_ENV=production, o boot FALHA (fail-fast) — um webhook de
 * pagamento com segredo público conhecido é fraude financeira esperando
 * acontecer. O deploy (infra/deploy/remote-deploy.sh) gera o segredo na
 * primeira subida, então isso só dispara se a env for removida à mão.
 */
const DEV_ONLY_DEFAULTS: ReadonlyArray<{ key: keyof Env; devDefault: string }> = [
  { key: "PAYMENT_WEBHOOK_SECRET", devDefault: "dev-webhook-secret-change-me" },
];

export type Env = z.infer<typeof envSchema>;

/**
 * NestJS ConfigModule `validate` hook. Throws (and aborts boot) on invalid env.
 */
export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }

  if (parsed.data.NODE_ENV === "production") {
    const vazados = DEV_ONLY_DEFAULTS.filter(
      ({ key, devDefault }) => parsed.data[key] === devDefault,
    );
    if (vazados.length > 0) {
      throw new Error(
        `Segredos com valor default de DEV em produção (defina valores reais):\n` +
          vazados.map(({ key }) => `  - ${String(key)}`).join("\n"),
      );
    }
    // S3 com credenciais de exemplo em prod: alerta alto, sem derrubar (o MinIO
    // local do host usa essas credenciais desde o primeiro volume — rotacionar
    // exige migração do storage, ver roadmap §13.4).
    if (parsed.data.S3_SECRET_KEY === "obracerta123") {
      console.warn(
        "[env] AVISO: S3_SECRET_KEY está com o valor de exemplo em produção — rotacione junto com a migração para R2 (§13.4).",
      );
    }
  }
  return parsed.data;
}
