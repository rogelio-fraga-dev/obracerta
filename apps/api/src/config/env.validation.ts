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
