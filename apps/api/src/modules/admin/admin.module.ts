import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { UsersModule } from "../users/users.module.js";
import { AdminController } from "./interface/admin.controller.js";

/**
 * Admin (roadmap Fase 6). Por ora, gestão de papéis (RolesGuard). O dashboard de
 * saúde (ativação/churn/NPS) entra numa etapa seguinte. Importa AuthModule (guards)
 * e UsersModule (UsersService).
 */
@Module({
  imports: [AuthModule, UsersModule],
  controllers: [AdminController],
})
export class AdminModule {}
