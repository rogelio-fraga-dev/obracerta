import type { WorkOrderPhoto } from "@obracerta/shared";

/** Porta de saída da galeria de fotos da obra. */
export interface WorkOrderPhotosRepository {
  add(workOrderId: string, url: string): Promise<WorkOrderPhoto>;
  listForWorkOrder(workOrderId: string): Promise<WorkOrderPhoto[]>;
  countForWorkOrder(workOrderId: string): Promise<number>;
}

export const WORK_ORDER_PHOTOS_REPOSITORY = Symbol("WORK_ORDER_PHOTOS_REPOSITORY");
