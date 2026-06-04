import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { configuration } from "./config/configuration.js";
import { validateEnv } from "./config/env.validation.js";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter.js";
import { ResponseEnvelopeInterceptor } from "./common/interceptors/response-envelope.interceptor.js";
import { DatabaseModule } from "./infrastructure/database/database.module.js";
import { RedisModule } from "./infrastructure/cache/redis.module.js";
import { HealthModule } from "./modules/health/health.module.js";

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
    DatabaseModule,
    RedisModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: ResponseEnvelopeInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
