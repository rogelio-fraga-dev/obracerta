import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Logger } from "@nestjs/common";
import type { Job } from "bullmq";
import {
  NOTIFICATION_PROVIDER,
  type NotificationProvider,
} from "../../notifications/domain/notification.provider.js";
import { ONBOARDING_QUEUE, type OnboardingJobData } from "../application/onboarding.scheduler.js";

/**
 * Worker que consome a fila de onboarding e dispara a mensagem via porta de
 * notificação. BullMQ cuida de retry/backoff e dead-letter (roadmap §3.2).
 */
@Processor(ONBOARDING_QUEUE)
export class OnboardingProcessor extends WorkerHost {
  private readonly logger = new Logger(OnboardingProcessor.name);

  constructor(
    @Inject(NOTIFICATION_PROVIDER) private readonly notifications: NotificationProvider,
  ) {
    super();
  }

  async process(job: Job<OnboardingJobData>): Promise<void> {
    const { whatsapp, texto, chave } = job.data;
    this.logger.log(`Onboarding "${chave}" → ${whatsapp}`);
    await this.notifications.sendMessage(whatsapp, texto);
  }
}
