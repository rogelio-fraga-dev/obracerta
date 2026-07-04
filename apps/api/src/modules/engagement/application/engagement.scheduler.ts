import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { Queue } from "bullmq";

export const ENGAGEMENT_QUEUE = "engagement";

/** Cron do job diário: 12:00 UTC ≈ 09:00 em São Paulo (hora útil, não madrugada). */
const DAILY_CRON = "0 12 * * *";

/**
 * Registra o job diário de lembretes (BullMQ repeatable). Idempotente: o
 * `jobId` fixo faz o BullMQ substituir o agendamento em vez de duplicar a cada
 * boot da API.
 */
@Injectable()
export class EngagementScheduler implements OnModuleInit {
  private readonly logger = new Logger(EngagementScheduler.name);

  constructor(@InjectQueue(ENGAGEMENT_QUEUE) private readonly queue: Queue) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.queue.add(
        "daily",
        {},
        {
          repeat: { pattern: DAILY_CRON },
          jobId: "engagement:daily",
          removeOnComplete: true,
          removeOnFail: 20,
        },
      );
      this.logger.log(`Lembretes diários agendados (${DAILY_CRON} UTC).`);
    } catch (error: unknown) {
      // Redis fora no boot não pode derrubar a API — o job entra no próximo boot.
      this.logger.warn(`Falha ao agendar lembretes: ${String(error)}`);
    }
  }
}
