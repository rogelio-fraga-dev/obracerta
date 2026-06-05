import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { type AppConfig, configuration } from "./config/configuration.js";
import { validateEnv } from "./config/env.validation.js";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter.js";
import { ResponseEnvelopeInterceptor } from "./common/interceptors/response-envelope.interceptor.js";
import { DatabaseModule } from "./infrastructure/database/database.module.js";
import { RedisModule } from "./infrastructure/cache/redis.module.js";
import { HealthModule } from "./modules/health/health.module.js";
import { UsersModule } from "./modules/users/users.module.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { EntitlementsModule } from "./modules/entitlements/entitlements.module.js";
import { ProfilesModule } from "./modules/profiles/profiles.module.js";
import { StorageModule } from "./modules/storage/storage.module.js";
import { NotificationsModule } from "./modules/notifications/notifications.module.js";
import { OnboardingModule } from "./modules/onboarding/onboarding.module.js";
import { AvailabilityModule } from "./modules/availability/availability.module.js";
import { BookingModule } from "./modules/booking/booking.module.js";
import { AuditModule } from "./modules/audit/audit.module.js";
import { TermsModule } from "./modules/terms/terms.module.js";
import { DeclinePenaltyModule } from "./modules/decline-penalty/decline-penalty.module.js";
import { ReputationModule } from "./modules/reputation/reputation.module.js";

/**
 * Root module of the modular monolith. Feature/domain modules are registered
 * here; each owns its own ports/adapters and stays extractable (plan §5).
 *
 * The global filter and interceptor are registered via APP_FILTER/APP_INTERCEPTOR
 * so they participate in DI (can inject services as the app grows).
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // Monorepo: prefer the repo-root .env, fall back to a package-local one.
      envFilePath: ["../../.env", ".env", ".env.local"],
      load: [configuration],
      validate: validateEnv,
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => {
        const url = new URL(config.get("redisUrl", { infer: true }));
        return {
          // Opções (não instância) evitam acoplar a versão do ioredis do bullmq.
          connection: {
            host: url.hostname,
            port: Number(url.port) || 6379,
            maxRetriesPerRequest: null,
          },
        };
      },
    }),
    DatabaseModule,
    RedisModule,
    StorageModule,
    NotificationsModule,
    HealthModule,
    UsersModule,
    AuthModule,
    EntitlementsModule,
    ProfilesModule,
    OnboardingModule,
    AvailabilityModule,
    BookingModule,
    AuditModule,
    TermsModule,
    DeclinePenaltyModule,
    ReputationModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: ResponseEnvelopeInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
