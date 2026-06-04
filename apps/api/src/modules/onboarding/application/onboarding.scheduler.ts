import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";
import type { AppConfig } from "../../../config/configuration.js";
import { ONBOARDING_SEQUENCE, stepDelayMs } from "../domain/onboarding.js";

export const ONBOARDING_QUEUE = "onboarding";

/** Payload de um job de onboarding. */
export interface OnboardingJobData {
  whatsapp: string;
  chave: string;
  texto: string;
}

/**
 * Agenda a sequência de mensagens progressivas (D1/D3/D5/D7) numa fila durável
 * (BullMQ/Redis). `jobId` determinístico torna o agendamento idempotente — não
 * duplica se o cadastro for reprocessado.
 */
@Injectable()
export class OnboardingScheduler {
  constructor(
    @InjectQueue(ONBOARDING_QUEUE) private readonly queue: Queue<OnboardingJobData>,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async scheduleSequence(userId: string, whatsapp: string): Promise<void> {
    const speedup = this.config.get("onboardingSpeedup", { infer: true });
    await Promise.all(
      ONBOARDING_SEQUENCE.map((step) =>
        this.queue.add(
          step.chave,
          { whatsapp, chave: step.chave, texto: step.texto },
          {
            delay: stepDelayMs(step.dia, speedup),
            jobId: `onb:${userId}:${step.chave}`,
            removeOnComplete: true,
            removeOnFail: 100,
          },
        ),
      ),
    );
  }
}
