import type { WorkOrderMessage } from "@obracerta/shared";

/** Dados para persistir uma mensagem do chat da obra. */
export interface CreateWorkOrderMessageData {
  workOrderId: string;
  senderId: string;
  texto: string;
}

/** Porta de saída do chat da obra. */
export interface WorkOrderChatRepository {
  create(data: CreateWorkOrderMessageData): Promise<WorkOrderMessage>;
  /** Mensagens da obra em ordem cronológica (com o nome do autor). */
  listForWorkOrder(workOrderId: string): Promise<WorkOrderMessage[]>;
}

export const WORK_ORDER_CHAT_REPOSITORY = Symbol("WORK_ORDER_CHAT_REPOSITORY");
