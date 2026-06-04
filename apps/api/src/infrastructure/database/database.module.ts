import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { AppConfig } from "../../config/configuration.js";
import { PG_POOL, DRIZZLE } from "./database.tokens.js";
import { PostgresService } from "./postgres.service.js";
import * as schema from "./schema/index.js";

/**
 * Módulo global de banco. Provê um pool `pg` único e o client Drizzle montado
 * sobre ele, expostos por token para os repositórios de domínio (fatias 1.0+).
 * @Global para que o pool seja compartilhado por toda a aplicação.
 */
@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) =>
        new Pool({ connectionString: config.get("databaseUrl", { infer: true }) }),
    },
    {
      provide: DRIZZLE,
      inject: [PG_POOL],
      useFactory: (pool: Pool) => drizzle(pool, { schema }),
    },
    PostgresService,
  ],
  exports: [PG_POOL, DRIZZLE, PostgresService],
})
export class DatabaseModule {}
