import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";

export const MODERATION_RESTORE_QUEUE = "moderation-restore";
export const SUSPENSION_LIFT_QUEUE = "suspension-lift";

/** Payload do job que expira a ocultação precaucional de uma denúncia. */
export interface ModerationRestoreJobData {
  reportId: string;
}

/** Payload do job que expira automaticamente uma suspensão vencida. */
export interface SuspensionLiftJobData {
  suspensionId: string;
}

/**
 * Agenda os jobs de moderação em filas duráveis (BullMQ/Redis): o fim da ocultação
 * precaucional (48h) de uma denúncia e o **auto-lift** de uma suspensão no `fim_em`.
 * `jobId` determinístico = idempotente. As ações são guardadas (só agem se o estado
 * ainda for o esperado), então rodar tarde é inofensivo.
 */
@Injectable()
export class ModerationScheduler {
  constructor(
    @InjectQueue(MODERATION_RESTORE_QUEUE)
    private readonly restoreQueue: Queue<ModerationRestoreJobData>,
    @InjectQueue(SUSPENSION_LIFT_QUEUE)
    private readonly liftQueue: Queue<SuspensionLiftJobData>,
  ) {}

  async scheduleRestore(reportId: string, ocultarAte: string): Promise<void> {
    await this.restoreQueue.add(
      "restore",
      { reportId },
      {
        delay: Math.max(0, Date.parse(ocultarAte) - Date.now()),
        jobId: `moderation:restore:${reportId}`,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
  }

  async scheduleSuspensionLift(suspensionId: string, fimEm: string): Promise<void> {
    await this.liftQueue.add(
      "lift",
      { suspensionId },
      {
        delay: Math.max(0, Date.parse(fimEm) - Date.now()),
        jobId: `suspension:lift:${suspensionId}`,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
  }
}
