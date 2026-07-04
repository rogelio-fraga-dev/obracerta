import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { SupportService } from "./application/support.service.js";
import { SUPPORT_REPOSITORY } from "./domain/ports/support.repository.js";
import { DrizzleSupportRepository } from "./infrastructure/drizzle-support.repository.js";
import { AdminSupportController } from "./interface/admin-support.controller.js";
import { SupportController } from "./interface/support.controller.js";

/** Suporte (central de ajuda): chamados do usuário + gestão pelo admin. */
@Module({
  imports: [AuthModule],
  controllers: [SupportController, AdminSupportController],
  providers: [
    SupportService,
    { provide: SUPPORT_REPOSITORY, useClass: DrizzleSupportRepository },
  ],
})
export class SupportModule {}
