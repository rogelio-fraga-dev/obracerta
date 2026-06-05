import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";

export const MODERATION_RESTORE_QUEUE = "moderation-restore";

/** Payload do job que expira a ocultação precaucional de uma denúncia. */
export interface ModerationRestoreJobData {
  reportId: string;
}

/**
 * Agenda o fim da ocultação precaucional (48h) de uma denúncia numa fila durável
 * (BullMQ/Redis). `jobId` determinístico por denúncia = idempotente. Quando dispara,
 * o worker restaura o conteúdo SE a denúncia ainda não foi decidida (precaução, não veredito).
 */
@Injectable()
export class ModerationScheduler {
  constructor(
    @InjectQueue(MODERATION_RESTORE_QUEUE)
    private readonly queue: Queue<ModerationRestoreJobData>,
  ) {}

  async scheduleRestore(reportId: string, ocultarAte: string): Promise<void> {
    const delay = Math.max(0, Date.parse(ocultarAte) - Date.now());
    await this.queue.add(
      "restore",
      { reportId },
      {
        delay,
        jobId: `moderation:restore:${reportId}`,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
  }
}
