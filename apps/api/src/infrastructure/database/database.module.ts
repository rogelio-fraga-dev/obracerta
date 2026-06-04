import { Global, Module } from "@nestjs/common";
import { PostgresService } from "./postgres.service.js";

/**
 * Global database module. Exposes the Postgres adapter to feature modules.
 * Marked @Global so the single pool is shared; later domain repositories will
 * be provided here behind their domain ports.
 */
@Global()
@Module({
  providers: [PostgresService],
  exports: [PostgresService],
})
export class DatabaseModule {}
