import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool } from "pg";
import type { AppConfig } from "../../config/configuration.js";

/**
 * Thin PostgreSQL adapter (connection pool).
 *
 * Fase 0: provides connectivity + a health ping only. The ORM (Prisma vs
 * Drizzle) is an open ADR decision (plan §13), so no schema/query layer is
 * committed yet — the rest of the app must depend on repository ports, not on
 * this client directly.
 */
@Injectable()
export class PostgresService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PostgresService.name);
  private readonly pool: Pool;

  constructor(config: ConfigService<AppConfig, true>) {
    this.pool = new Pool({ connectionString: config.get("databaseUrl", { infer: true }) });
  }

  async onModuleInit(): Promise<void> {
    if (!(await this.ping())) {
      throw new Error("PostgreSQL ping returned an unexpected result");
    }
    this.logger.log("PostgreSQL pool ready");
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  /** Returns true if the database answers a trivial query. */
  async ping(): Promise<boolean> {
    const result = await this.pool.query<{ ok: number }>("SELECT 1 AS ok");
    return result.rows[0]?.ok === 1;
  }
}
