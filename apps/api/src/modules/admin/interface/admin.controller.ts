import { Body, Controller, Get, Param, Put, Query, UseGuards, Post, HttpCode, HttpStatus } from "@nestjs/common";
import {
  setUserRolesSchema,
  UserRole,
  paginationQuerySchema,
  type PaginationQuery,
  type HealthSnapshot,
  type AnalyticsSnapshot,
  type SetUserRolesInput,
  type CreateAdminInput,
  createAdminSchema,
} from "@obracerta/shared";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe.js";
import { JwtAuthGuard } from "../../auth/interface/jwt-auth.guard.js";
import { Roles } from "../../auth/interface/roles.decorator.js";
import { RolesGuard } from "../../auth/interface/roles.guard.js";
import { UsersService } from "../../users/application/users.service.js";
import { WorkOrderService } from "../../work-orders/application/work-order.service.js";
import { BookingService } from "../../booking/application/booking.service.js";
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
    private readonly workOrders: WorkOrderService,
    private readonly bookings: BookingService,
  ) {}

  /** Snapshot de saúde do produto (ativação, conclusão, North Star, churn, moderação). */
  @Get("metrics")
  metrics(): Promise<HealthSnapshot> {
    return this.admin.healthSnapshot();
  }

  /** Analytics estratégico: funil de conversão, liquidez, receita (ARPA/LTV) e coorte. */
  @Get("analytics")
  analytics(): Promise<AnalyticsSnapshot> {
    return this.admin.analyticsSnapshot();
  }

  @Post("users/admin")
  @HttpCode(HttpStatus.CREATED)
  async createAdmin(
    @Body(new ZodValidationPipe(createAdminSchema)) body: CreateAdminInput,
  ) {
    const user = await this.users.createAdmin(body);
    return { message: "Admin criado com sucesso", user };
  }

  /** Lista de todos os usuários do sistema. */
  @Get("users")
  async listUsers(@Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQuery) {
    return this.users.findAllPaginated(query.page, query.limit);
  }

  /** Detalhe de um usuário. */
  @Get("users/:id")
  async getUser(@Param("id") id: string) {
    return this.users.findById(id);
  }

  /** Lista global de todas as obras (Admin only). */
  @Get("work-orders")
  async listWorkOrders(@Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQuery) {
    return this.workOrders.findAllPaginated(query.page, query.limit);
  }

  /** Detalhe de uma obra. */
  @Get("work-orders/:id")
  async getWorkOrder(@Param("id") id: string) {
    return this.workOrders.getWorkOrder(id);
  }

  /** Lista global de todos os pedidos de agendamento (Admin only). */
  @Get("bookings")
  async listBookings(@Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQuery) {
    return this.bookings.findAllPaginated(query.page, query.limit);
  }

  /** Detalhe de um pedido. */
  @Get("bookings/:id")
  async getBooking(@Param("id") id: string) {
    // Note: this should return any booking for the admin.
    // However, booking.service.ts getForParticipant is restricted.
    // I should add a method to BookingService for the admin, or findById directly?
    // Wait, BookingService.getOr404 is private. We can add a method `getBookingAdmin(id)` to bookingService, or just use it if exposed.
    // Wait, I will just call it as `getBookingForAdmin` and I'll add it to BookingService.
    return this.bookings.getBookingForAdmin(id);
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
