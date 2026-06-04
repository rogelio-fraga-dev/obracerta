import { Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import { Pool } from "pg";
import { PG_POOL } from "./database.tokens.js";

/**
 * Gerencia o ciclo de vida do pool de conexões e expõe um health ping.
 *
 * O pool é provido por `DatabaseModule` (token `PG_POOL`) e compartilhado com o
 * client Drizzle (token `DRIZZLE`) — uma única fonte de conexões. As queries de
 * negócio passam pelo Drizzle atrás de repository ports, não por este serviço.
 */
@Injectable()
export class PostgresService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PostgresService.name);

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

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
