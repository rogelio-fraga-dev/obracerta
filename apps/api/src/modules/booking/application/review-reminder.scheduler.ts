import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";
import type { AppConfig } from "../../../config/configuration.js";
import { REVIEW_REMINDER_DAYS, reminderDelayMs } from "../domain/review-reminder.js";

export const REVIEW_REMINDER_QUEUE = "review-reminder";

/** Payload de um lembrete de avaliação. */
export interface ReviewReminderJobData {
  bookingId: string;
  userId: string;
  whatsapp: string;
  dia: number;
}

/**
 * Agenda os lembretes de avaliação (D1/D5/D7) numa fila durável (BullMQ/Redis).
 * **Produtor**: o BookingModule agenda na conclusão; o **consumidor** vive no
 * ReputationModule (que sabe se o usuário já avaliou) — split via fila compartilhada
 * para evitar o ciclo booking↔reputation. `jobId` determinístico = idempotente.
 */
@Injectable()
export class ReviewReminderScheduler {
  constructor(
    @InjectQueue(REVIEW_REMINDER_QUEUE) private readonly queue: Queue<ReviewReminderJobData>,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async schedule(bookingId: string, userId: string, whatsapp: string): Promise<void> {
    const speedup = this.config.get("onboardingSpeedup", { infer: true });
    await Promise.all(
      REVIEW_REMINDER_DAYS.map((dia) =>
        this.queue.add(
          "reminder",
          { bookingId, userId, whatsapp, dia },
          {
            delay: reminderDelayMs(dia, speedup),
            jobId: `review-reminder:${bookingId}:${userId}:d${dia}`,
            removeOnComplete: true,
            removeOnFail: 100,
          },
        ),
      ),
    );
  }
}
