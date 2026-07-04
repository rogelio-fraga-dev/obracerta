import { Inject, Injectable } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import type { WorkOrderMessage } from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { workOrderMessages } from "../../../infrastructure/database/schema/work-order-messages.js";
import { users } from "../../../infrastructure/database/schema/users.js";
import type {
  CreateWorkOrderMessageData,
  WorkOrderChatRepository,
} from "../domain/ports/work-order-chat.repository.js";

@Injectable()
export class DrizzleWorkOrderChatRepository implements WorkOrderChatRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(data: CreateWorkOrderMessageData): Promise<WorkOrderMessage> {
    const [row] = await this.db
      .insert(workOrderMessages)
      .values({ workOrderId: data.workOrderId, senderId: data.senderId, texto: data.texto })
      .returning();
    if (!row) throw new Error("Falha ao enviar a mensagem.");
    const [sender] = await this.db
      .select({ nome: users.nomeCompleto })
      .from(users)
      .where(eq(users.id, data.senderId))
      .limit(1);
    return {
      id: row.id,
      workOrderId: row.workOrderId,
      senderId: row.senderId,
      senderNome: sender?.nome ?? null,
      texto: row.texto,
      criadoEm: row.criadoEm.toISOString(),
    };
  }

  async listForWorkOrder(workOrderId: string): Promise<WorkOrderMessage[]> {
    const rows = await this.db
      .select({
        id: workOrderMessages.id,
        workOrderId: workOrderMessages.workOrderId,
        senderId: workOrderMessages.senderId,
        senderNome: users.nomeCompleto,
        texto: workOrderMessages.texto,
        criadoEm: workOrderMessages.criadoEm,
      })
      .from(workOrderMessages)
      .leftJoin(users, eq(users.id, workOrderMessages.senderId))
      .where(eq(workOrderMessages.workOrderId, workOrderId))
      .orderBy(asc(workOrderMessages.criadoEm));
    return rows.map((r) => ({
      id: r.id,
      workOrderId: r.workOrderId,
      senderId: r.senderId,
      senderNome: r.senderNome,
      texto: r.texto,
      criadoEm: r.criadoEm.toISOString(),
    }));
  }
}
