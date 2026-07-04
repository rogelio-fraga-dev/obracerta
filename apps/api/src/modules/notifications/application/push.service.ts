import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import webpush from "web-push";
import type { AppConfig } from "../../../config/configuration.js";
import {
  PUSH_SUBSCRIPTIONS_REPOSITORY,
  type PushSubscriptionsRepository,
} from "../domain/ports/push-subscriptions.repository.js";

/**
 * Web Push (PWA): entrega a notificação na tela do aparelho mesmo com o app
 * fechado. Habilitado só com as chaves VAPID no env (gerar com
 * `npx web-push generate-vapid-keys`); sem elas, tudo vira no-op e o in-app
 * continua funcionando sozinho. Envio é sempre best-effort.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly enabled: boolean;
  private readonly publicKey: string | null;

  constructor(
    @Inject(PUSH_SUBSCRIPTIONS_REPOSITORY) private readonly repo: PushSubscriptionsRepository,
    config: ConfigService<AppConfig, true>,
  ) {
    const vapid = config.get("vapid", { infer: true });
    this.publicKey = vapid.publicKey;
    this.enabled = Boolean(vapid.publicKey && vapid.privateKey);
    if (this.enabled) {
      webpush.setVapidDetails(vapid.subject, vapid.publicKey!, vapid.privateKey!);
      this.logger.log("Web Push habilitado (chaves VAPID presentes).");
    } else {
      this.logger.log("Web Push desabilitado (sem chaves VAPID) — só in-app.");
    }
  }

  /** Chave pública para o browser se inscrever; null = push desabilitado. */
  getPublicKey(): string | null {
    return this.enabled ? this.publicKey : null;
  }

  /** Registra (upsert) a inscrição do browser do usuário. */
  async subscribe(
    userId: string,
    endpoint: string,
    keys: { p256dh: string; auth: string },
  ): Promise<void> {
    await this.repo.upsert(userId, endpoint, keys.p256dh, keys.auth);
  }

  /** Remove a inscrição (logout/opt-out do aparelho). */
  async unsubscribe(endpoint: string): Promise<void> {
    await this.repo.removeByEndpoint(endpoint);
  }

  /**
   * Envia para todos os aparelhos do usuário. Nunca lança; inscrições mortas
   * (404/410 do serviço de push) são removidas na hora.
   */
  async sendToUser(
    userId: string,
    payload: { titulo: string; corpo?: string | null; link?: string | null },
  ): Promise<void> {
    if (!this.enabled) return;
    try {
      const subs = await this.repo.listForUser(userId);
      const body = JSON.stringify({
        title: payload.titulo,
        body: payload.corpo ?? "",
        link: payload.link ?? "/notificacoes",
      });
      await Promise.all(
        subs.map(async (sub) => {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              body,
            );
          } catch (error: unknown) {
            const status = (error as { statusCode?: number }).statusCode;
            if (status === 404 || status === 410) {
              await this.repo.removeByEndpoint(sub.endpoint);
            } else {
              this.logger.warn(`Push falhou p/ ${userId}: ${String(error)}`);
            }
          }
        }),
      );
    } catch (error: unknown) {
      this.logger.warn(`Push (lista de inscrições) falhou p/ ${userId}: ${String(error)}`);
    }
  }
}
