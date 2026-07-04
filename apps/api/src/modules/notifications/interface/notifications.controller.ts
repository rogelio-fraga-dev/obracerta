import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from "@nestjs/common";
import {
  type JwtClaims,
  type Notification,
  type NotificationSummary,
  type PushPublicKey,
  pushSubscribeSchema,
  type PushSubscribeInput,
  uuidSchema,
  z,
} from "@obracerta/shared";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe.js";
import { CurrentUser } from "../../auth/interface/current-user.decorator.js";
import { JwtAuthGuard } from "../../auth/interface/jwt-auth.guard.js";
import { InboxService } from "../application/inbox.service.js";
import { PushService } from "../application/push.service.js";

const unsubscribeSchema = z.object({ endpoint: z.string().url().max(2000) });

/** Notificações in-app + Web Push do usuário autenticado. */
@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly inbox: InboxService,
    private readonly push: PushService,
  ) {}

  /** Chave pública VAPID (null = push desabilitado no servidor). */
  @Get("push/public-key")
  publicKey(): PushPublicKey {
    return { key: this.push.getPublicKey() };
  }

  /** Registra a inscrição de push deste browser. */
  @Post("push/subscribe")
  @HttpCode(HttpStatus.OK)
  async subscribe(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(pushSubscribeSchema)) body: PushSubscribeInput,
  ): Promise<{ subscribed: true }> {
    await this.push.subscribe(user.sub, body.endpoint, body.keys);
    return { subscribed: true };
  }

  /** Remove a inscrição de push deste browser. */
  @Delete("push/subscribe")
  @HttpCode(HttpStatus.OK)
  async unsubscribe(
    @Body(new ZodValidationPipe(unsubscribeSchema)) body: { endpoint: string },
  ): Promise<{ subscribed: false }> {
    await this.push.unsubscribe(body.endpoint);
    return { subscribed: false };
  }

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
