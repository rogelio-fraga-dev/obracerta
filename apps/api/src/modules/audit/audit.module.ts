import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { AuditService } from "./application/audit.service.js";
import { AUDIT_REPOSITORY } from "./domain/ports/audit.repository.js";
import { DrizzleAuditRepository } from "./infrastructure/drizzle-audit.repository.js";
import { AuditController } from "./interface/audit.controller.js";

/**
 * Trilha de auditoria tamper-evident (roadmap §9, Etapa 2.3). Exporta o
 * AuditService para outros módulos registrarem eventos encadeados. Importa
 * AuthModule pelo JwtAuthGuard do endpoint de verificação.
 */
@Module({
  imports: [AuthModule],
  controllers: [AuditController],
  providers: [
    AuditService,
    { provide: AUDIT_REPOSITORY, useClass: DrizzleAuditRepository },
  ],
  exports: [AuditService],
})
export class AuditModule {}
