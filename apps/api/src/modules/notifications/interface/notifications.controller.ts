import { Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from "@nestjs/common";
import {
  type JwtClaims,
  type Notification,
  type NotificationSummary,
  uuidSchema,
} from "@obracerta/shared";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe.js";
import { CurrentUser } from "../../auth/interface/current-user.decorator.js";
import { JwtAuthGuard } from "../../auth/interface/jwt-auth.guard.js";
import { InboxService } from "../application/inbox.service.js";

/** Notificações in-app do usuário autenticado. */
@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly inbox: InboxService) {}

  /** Últimas notificações (mais recentes primeiro). */
  @Get("me")
  list(@CurrentUser() user: JwtClaims): Promise<Notification[]> {
    return this.inbox.list(user.sub);
  }

  /** Contador de não lidas (sino do shell). */
  @Get("me/summary")
  summary(@CurrentUser() user: JwtClaims): Promise<NotificationSummary> {
    return this.inbox.summary(user.sub);
  }

  /** Marca uma notificação como lida. */
  @Post(":id/read")
  @HttpCode(HttpStatus.OK)
  async markRead(
    @CurrentUser() user: JwtClaims,
    @Param("id", new ZodValidationPipe(uuidSchema)) id: string,
  ): Promise<{ read: true }> {
    await this.inbox.markRead(user.sub, id);
    return { read: true };
  }

  /** Marca todas como lidas. */
  @Post("read-all")
  @HttpCode(HttpStatus.OK)
  async markAllRead(@CurrentUser() user: JwtClaims): Promise<{ read: true }> {
    await this.inbox.markAllRead(user.sub);
    return { read: true };
  }
}
