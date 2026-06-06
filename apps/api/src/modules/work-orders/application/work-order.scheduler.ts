import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";

export const WORK_ORDER_EXPIRY_QUEUE = "work-order-expiry";

/** Payload do job de expiração de uma obra. */
export interface WorkOrderExpiryJobData {
  workOrderId: string;
}

/**
 * Agenda a expiração da obra (BullMQ/Redis) conforme a urgência. `jobId`
 * determinístico = idempotente. A transição é guardada (só expira se ainda ABERTA),
 * então é seguro rodar mesmo que a obra já tenha sido adjudicada/cancelada.
 */
@Injectable()
export class WorkOrderScheduler {
  constructor(
    @InjectQueue(WORK_ORDER_EXPIRY_QUEUE) private readonly queue: Queue<WorkOrderExpiryJobData>,
  ) {}

  async scheduleExpiry(workOrderId: string, expiraEm: string): Promise<void> {
    await this.queue.add(
      "expire",
      { workOrderId },
      {
        delay: Math.max(0, Date.parse(expiraEm) - Date.now()),
        jobId: `work-order:expire:${workOrderId}`,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
  }
}
