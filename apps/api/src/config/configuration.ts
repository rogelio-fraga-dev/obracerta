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
  jwtSecret: string;
  jwtAccessTtl: string;
  jwtRefreshTtlDays: number;
  otpTtlSeconds: number;
  otpMaxAttempts: number;
  google: {
    clientId: string | null;
    clientSecret: string | null;
  };
  s3: {
    endpoint: string;
    region: string;
    bucket: string;
    accessKey: string;
    secretKey: string;
    publicUrl: string;
  };
  onboardingSpeedup: number;
  paymentWebhookSecret: string;
  vapid: {
    publicKey: string | null;
    privateKey: string | null;
    subject: string;
  };
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
    jwtSecret: env.JWT_SECRET,
    jwtAccessTtl: env.JWT_ACCESS_TTL,
    jwtRefreshTtlDays: env.JWT_REFRESH_TTL_DAYS,
    otpTtlSeconds: env.OTP_TTL_SECONDS,
    otpMaxAttempts: env.OTP_MAX_ATTEMPTS,
    google: {
      clientId: env.GOOGLE_CLIENT_ID ?? null,
      clientSecret: env.GOOGLE_CLIENT_SECRET ?? null,
    },
    s3: {
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      bucket: env.S3_BUCKET,
      accessKey: env.S3_ACCESS_KEY,
      secretKey: env.S3_SECRET_KEY,
      publicUrl: env.S3_PUBLIC_URL,
    },
    onboardingSpeedup: env.ONBOARDING_SPEEDUP,
    paymentWebhookSecret: env.PAYMENT_WEBHOOK_SECRET,
    vapid: {
      publicKey: env.VAPID_PUBLIC_KEY ?? null,
      privateKey: env.VAPID_PRIVATE_KEY ?? null,
      subject: env.VAPID_SUBJECT,
    },
  };
}
