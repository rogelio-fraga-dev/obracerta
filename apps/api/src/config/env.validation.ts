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

  // Object storage S3-compatível (roadmap §4.2)
  S3_ENDPOINT: z.string().url().default("http://localhost:9000"),
  S3_REGION: z.string().default("us-east-1"),
  S3_BUCKET: z.string().default("obracerta"),
  S3_ACCESS_KEY: z.string().default("obracerta"),
  S3_SECRET_KEY: z.string().default("obracerta123"),
  S3_PUBLIC_URL: z.string().url().default("http://localhost:9000"),
});

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
  return parsed.data;
}
