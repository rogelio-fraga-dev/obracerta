import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Job } from "bullmq";
import { WorkOrderService } from "../application/work-order.service.js";
import {
  WORK_ORDER_EXPIRY_QUEUE,
  type WorkOrderExpiryJobData,
} from "../application/work-order.scheduler.js";

/**
 * Worker que expira a obra quando a janela da urgência fecha. A transição é guardada
 * (só expira se ainda ABERTA), então é seguro rodar mesmo após adjudicação/cancelamento.
 */
@Processor(WORK_ORDER_EXPIRY_QUEUE)
export class WorkOrderExpiryProcessor extends WorkerHost {
  private readonly logger = new Logger(WorkOrderExpiryProcessor.name);

  constructor(private readonly orders: WorkOrderService) {
    super();
  }

  async process(job: Job<WorkOrderExpiryJobData>): Promise<void> {
    if (await this.orders.expireIfOpen(job.data.workOrderId)) {
      this.logger.log(`Obra ${job.data.workOrderId} expirada (sem adjudicação na janela).`);
    }
  }
}
