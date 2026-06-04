import { Global, Module } from "@nestjs/common";
import { STORAGE_PORT } from "./domain/storage.port.js";
import { S3StorageAdapter } from "./infrastructure/s3-storage.adapter.js";

/**
 * Storage de objetos (S3/MinIO). @Global para que os módulos de domínio injetem
 * a porta `STORAGE_PORT` sem reimportar. Cross-cutting, como DB e cache.
 */
@Global()
@Module({
  providers: [{ provide: STORAGE_PORT, useClass: S3StorageAdapter }],
  exports: [STORAGE_PORT],
})
export class StorageModule {}
