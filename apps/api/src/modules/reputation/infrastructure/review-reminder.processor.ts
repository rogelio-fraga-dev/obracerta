import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Logger } from "@nestjs/common";
import type { Job } from "bullmq";
import {
  REVIEW_REMINDER_QUEUE,
  type ReviewReminderJobData,
} from "../../booking/application/review-reminder.scheduler.js";
import {
  NOTIFICATION_PROVIDER,
  type NotificationProvider,
} from "../../notifications/domain/notification.provider.js";
import { REVIEW_REPOSITORY, type ReviewRepository } from "../domain/ports/review.repository.js";

/**
 * Consumidor dos lembretes de avaliação (D1/D5/D7). Vive no ReputationModule porque
 * é ele que sabe se o usuário **já avaliou** (ReviewRepository) — produtor é o
 * BookingModule. Se ainda não avaliou, notifica; senão, não faz nada (idempotente).
 */
@Processor(REVIEW_REMINDER_QUEUE)
export class ReviewReminderProcessor extends WorkerHost {
  private readonly logger = new Logger(ReviewReminderProcessor.name);

  constructor(
    @Inject(REVIEW_REPOSITORY) private readonly reviews: ReviewRepository,
    @Inject(NOTIFICATION_PROVIDER) private readonly notifications: NotificationProvider,
  ) {
    super();
  }

  async process(job: Job<ReviewReminderJobData>): Promise<void> {
    const { bookingId, userId, whatsapp, dia } = job.data;
    const jaAvaliou = await this.reviews.findByBookingAndAuthor(bookingId, userId);
    if (jaAvaliou) return; // já avaliou: nada a lembrar

    this.logger.log(`Lembrete de avaliação D${dia} → ${whatsapp} (pedido ${bookingId})`);
    await this.notifications.sendMessage(
      whatsapp,
      "Como foi o serviço? Avalie a outra parte — sua avaliação fica oculta até os dois avaliarem.",
    );
  }
}
