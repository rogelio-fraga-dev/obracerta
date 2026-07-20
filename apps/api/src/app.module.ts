import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import type { ExecutionContext } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";
import { ClientIpThrottlerGuard } from "./common/guards/client-ip-throttler.guard.js";
import type { Request } from "express";
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
import { BookingChatModule } from "./modules/booking-chat/booking-chat.module.js";
import { AuditModule } from "./modules/audit/audit.module.js";
import { TermsModule } from "./modules/terms/terms.module.js";
import { DeclinePenaltyModule } from "./modules/decline-penalty/decline-penalty.module.js";
import { ReputationModule } from "./modules/reputation/reputation.module.js";
import { ModerationModule } from "./modules/moderation/moderation.module.js";
import { BillingModule } from "./modules/billing/billing.module.js";
import { FavoritesModule } from "./modules/favorites/favorites.module.js";
import { PromotionsModule } from "./modules/promotions/promotions.module.js";
import { SearchModule } from "./modules/search/search.module.js";
import { PublicProfileModule } from "./modules/public-profile/public-profile.module.js";
import { WorkOrdersModule } from "./modules/work-orders/work-orders.module.js";
import { CompanyModule } from "./modules/company/company.module.js";
import { WorkOrderChatModule } from "./modules/work-order-chat/work-order-chat.module.js";
import { ProfessionalToolsModule } from "./modules/professional-tools/professional-tools.module.js";
import { CitiesModule } from "./modules/cities/cities.module.js";
import { AddressesModule } from "./modules/addresses/addresses.module.js";
import { EngagementModule } from "./modules/engagement/engagement.module.js";
import { SupportModule } from "./modules/support/support.module.js";
import { AdminModule } from "./modules/admin/admin.module.js";
import { ObservabilityModule } from "./modules/observability/observability.module.js";
import { MetricsInterceptor } from "./modules/observability/interface/metrics.interceptor.js";

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
    // Rate limiting GLOBAL (anti-abuso/scraping/brute force): 120 req/60s por IP.
    // Rotas sensíveis (login/OTP) endurecem com @Throttle. O IP real vem do
    // X-Forwarded-For (ver `trust proxy` no main.ts). Health/metrics ficam de fora
    // para não estourar o balde com uptime checks e scrapes do Prometheus. Storage
    // em memória (ok p/ instância única; trocar por Redis no deploy multi-instância).
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 120 }],
      skipIf: (ctx: ExecutionContext) => {
        const path = ctx.switchToHttp().getRequest<Request>().path ?? "";
        return path.startsWith("/health") || path.startsWith("/metrics");
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
    BookingChatModule,
    AuditModule,
    TermsModule,
    DeclinePenaltyModule,
    ReputationModule,
    ModerationModule,
    BillingModule,
    PromotionsModule,
    FavoritesModule,
    SearchModule,
    PublicProfileModule,
    WorkOrdersModule,
    CompanyModule,
    WorkOrderChatModule,
    ProfessionalToolsModule,
    CitiesModule,
    AddressesModule,
    EngagementModule,
    SupportModule,
    AdminModule,
    ObservabilityModule,
  ],
  providers: [
    // Rate limiting global por IP REAL do usuário (o BFF repassa em x-client-ip;
    // sem isso, todo o site compartilharia o balde do IP do container web).
    { provide: APP_GUARD, useClass: ClientIpThrottlerGuard },
    // Outermost: mede duração total + status final de cada requisição.
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResponseEnvelopeInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
