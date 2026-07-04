import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import type { WorkOrderMessage } from "@obracerta/shared";
import { InboxService } from "../../notifications/application/inbox.service.js";
import { WorkOrderService } from "../../work-orders/application/work-order.service.js";
import {
  WORK_ORDER_CHAT_REPOSITORY,
  type WorkOrderChatRepository,
} from "../domain/ports/work-order-chat.repository.js";

/**
 * Chat da obra: abre com a adjudicação (dono ↔ profissional vencedor). Antes
 * disso os lances são sigilosos e não há canal. Só os dois participantes
 * leem/escrevem.
 */
@Injectable()
export class WorkOrderChatService {
  constructor(
    @Inject(WORK_ORDER_CHAT_REPOSITORY) private readonly repo: WorkOrderChatRepository,
    private readonly orders: WorkOrderService,
    private readonly inbox: InboxService,
  ) {}

  async list(userId: string, workOrderId: string): Promise<WorkOrderMessage[]> {
    await this.getParticipants(userId, workOrderId);
    return this.repo.listForWorkOrder(workOrderId);
  }

  async send(userId: string, workOrderId: string, texto: string): Promise<WorkOrderMessage> {
    const participants = await this.getParticipants(userId, workOrderId);
    const message = await this.repo.create({ workOrderId, senderId: userId, texto });
    // Avisa a outra parte no sino (best-effort).
    const otherId =
      participants.contractorId === userId ? participants.professionalId : participants.contractorId;
    await this.inbox.record(otherId, "OBRA", "Nova mensagem na obra", {
      corpo: texto.length > 120 ? `${texto.slice(0, 120)}…` : texto,
      link: `/obras/${workOrderId}`,
    });
    return message;
  }

  /** Valida que o chat está aberto (obra adjudicada) e que o usuário participa. */
  private async getParticipants(
    userId: string,
    workOrderId: string,
  ): Promise<{ contractorId: string; professionalId: string }> {
    const participants = await this.orders.getChatParticipants(workOrderId);
    if (!participants) {
      throw new ForbiddenException("O chat abre quando a obra é adjudicada a um lance.");
    }
    if (userId !== participants.contractorId && userId !== participants.professionalId) {
      throw new ForbiddenException("Você não participa desta obra.");
    }
    return participants;
  }
}
