import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { BookingModule } from "../booking/booking.module.js";
import { UsersModule } from "../users/users.module.js";
import { TermsService } from "./application/terms.service.js";
import { TERMS_REPOSITORY } from "./domain/ports/terms.repository.js";
import { DrizzleTermsRepository } from "./infrastructure/drizzle-terms.repository.js";
import { TermsController } from "./interface/terms.controller.js";

/**
 * Aceite de termos bilateral (roadmap §7.4/§9, Etapa 2.3). Append-only e
 * vinculado à trilha: cada aceite grava um evento na hash-chain (AuditModule).
 * Importa BookingModule (autorização por participante) e UsersModule (papel).
 */
@Module({
  imports: [AuthModule, UsersModule, BookingModule, AuditModule],
  controllers: [TermsController],
  providers: [
    TermsService,
    { provide: TERMS_REPOSITORY, useClass: DrizzleTermsRepository },
  ],
  exports: [TermsService],
})
export class TermsModule {}
