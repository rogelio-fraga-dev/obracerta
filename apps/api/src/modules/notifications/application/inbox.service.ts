import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import type {
  Notification,
  NotificationSummary,
  NotificationType,
} from "@obracerta/shared";
import {
  NOTIFICATIONS_REPOSITORY,
  type NotificationsRepository,
} from "../domain/ports/notifications.repository.js";
import { PushService } from "./push.service.js";

/** Quantas notificações a página mostra (não é histórico infinito). */
const LIST_LIMIT = 50;

/**
 * Notificações in-app (sino + /notificacoes). `record` é **best-effort**: uma
 * falha ao registrar aviso nunca pode derrubar o fluxo de negócio que o gerou
 * (mesma filosofia do provedor externo de WhatsApp/SMS).
 */
@Injectable()
export class InboxService {
  private readonly logger = new Logger(InboxService.name);

  constructor(
    @Inject(NOTIFICATIONS_REPOSITORY) private readonly repo: NotificationsRepository,
    private readonly push: PushService,
  ) {}

  /**
   * Registra um aviso para o usuário (in-app) e replica via Web Push quando
   * habilitado. Nunca lança — loga e segue.
   */
  async record(
    userId: string,
    tipo: NotificationType,
    titulo: string,
    opts: { corpo?: string; link?: string } = {},
  ): Promise<void> {
    try {
      await this.repo.create({ userId, tipo, titulo, corpo: opts.corpo, link: opts.link });
    } catch (error: unknown) {
      this.logger.warn(`Falha ao registrar notificação p/ ${userId}: ${String(error)}`);
    }
    await this.push.sendToUser(userId, { titulo, corpo: opts.corpo, link: opts.link });
  }

  list(userId: string): Promise<Notification[]> {
    return this.repo.listForUser(userId, LIST_LIMIT);
  }

  async summary(userId: string): Promise<NotificationSummary> {
    return { naoLidas: await this.repo.countUnread(userId) };
  }

  async markRead(userId: string, id: string): Promise<void> {
    const changed = await this.repo.markRead(userId, id);
    if (!changed) throw new NotFoundException("Notificação não encontrada.");
  }

  markAllRead(userId: string): Promise<void> {
    return this.repo.markAllRead(userId);
  }
}
