import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import {
  setUserRolesSchema,
  UserRole,
  type HealthSnapshot,
  type SetUserRolesInput,
} from "@obracerta/shared";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe.js";
import { JwtAuthGuard } from "../../auth/interface/jwt-auth.guard.js";
import { Roles } from "../../auth/interface/roles.decorator.js";
import { RolesGuard } from "../../auth/interface/roles.guard.js";
import { UsersService } from "../../users/application/users.service.js";
import { AdminService } from "../application/admin.service.js";

/**
 * Painel administrativo (roadmap Fase 6). Todas as rotas exigem o papel ADMIN.
 * O **primeiro** admin é semeado direto no banco (`update users set roles='{ADMIN}'`),
 * já que conceder papéis é, ele próprio, uma ação de admin.
 */
@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private readonly users: UsersService,
    private readonly admin: AdminService,
  ) {}

  /** Snapshot de saúde do produto (ativação, conclusão, North Star, churn, moderação). */
  @Get("metrics")
  metrics(): Promise<HealthSnapshot> {
    return this.admin.healthSnapshot();
  }

  /** Papéis atuais de um usuário. */
  @Get("users/:id/roles")
  async getRoles(@Param("id") id: string): Promise<{ roles: string[] }> {
    return { roles: await this.users.getRoles(id) };
  }

  /** Define (substitui) os papéis de um usuário. */
  @Put("users/:id/roles")
  async setRoles(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(setUserRolesSchema)) body: SetUserRolesInput,
  ): Promise<{ roles: string[] }> {
    await this.users.setRoles(id, body.roles);
    return { roles: body.roles };
  }
}
