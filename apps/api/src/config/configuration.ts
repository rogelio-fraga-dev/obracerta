import { envSchema, type Env } from "./env.validation.js";

/**
 * Typed configuration shape. ConfigService<AppConfig, true> gives autocompletion
 * and type-safe `get()` calls across the app.
 */
export interface AppConfig {
  nodeEnv: Env["NODE_ENV"];
  port: number;
  corsOrigins: string[];
  databaseUrl: string;
  redisUrl: string;
}

/**
 * Config factory. Derives the typed AppConfig from the validated env — single
 * source of truth with `env.validation.ts`. Throws (aborting boot) if env is
 * invalid, so no unsafe casts or empty-string fallbacks leak downstream.
 */
export function configuration(): AppConfig {
  const env = envSchema.parse(process.env);
  return {
    nodeEnv: env.NODE_ENV,
    port: env.API_PORT,
    corsOrigins: env.API_CORS_ORIGINS,
    databaseUrl: env.DATABASE_URL,
    redisUrl: env.REDIS_URL,
  };
}
