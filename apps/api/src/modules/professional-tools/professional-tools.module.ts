import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { BillingModule } from "../billing/billing.module.js";
import { UsersModule } from "../users/users.module.js";
import { ProfessionalToolsService } from "./application/professional-tools.service.js";
import { DOCUMENT_REPOSITORY } from "./domain/ports/document.repository.js";
import { DrizzleDocumentRepository } from "./infrastructure/drizzle-document.repository.js";
import { ProfessionalToolsController } from "./interface/professional-tools.controller.js";

/**
 * Ferramentas de gestão do profissional (roadmap §8.5): orçamentos e recibos.
 * Tier premium — o gating (feature `tools.documents`) é aplicado no serviço via
 * BillingModule. UsersModule valida o tipo do ator.
 */
@Module({
  imports: [AuthModule, UsersModule, BillingModule],
  controllers: [ProfessionalToolsController],
  providers: [
    ProfessionalToolsService,
    { provide: DOCUMENT_REPOSITORY, useClass: DrizzleDocumentRepository },
  ],
  exports: [ProfessionalToolsService],
})
export class ProfessionalToolsModule {}
