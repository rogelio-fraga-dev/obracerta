import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { UsersModule } from "../users/users.module.js";
import { AdminService } from "./application/admin.service.js";
import { ADMIN_METRICS_REPOSITORY } from "./domain/ports/admin-metrics.repository.js";
import { DrizzleAdminMetricsRepository } from "./infrastructure/drizzle-admin-metrics.repository.js";
import { AdminController } from "./interface/admin.controller.js";

/**
 * Admin (roadmap Fase 6). Gestão de papéis (RolesGuard) + dashboard de saúde
 * (métricas agregadas read-only). Importa AuthModule (guards) e UsersModule (UsersService).
 */
@Module({
  imports: [AuthModule, UsersModule],
  controllers: [AdminController],
  providers: [
    AdminService,
    { provide: ADMIN_METRICS_REPOSITORY, useClass: DrizzleAdminMetricsRepository },
  ],
})
export class AdminModule {}
