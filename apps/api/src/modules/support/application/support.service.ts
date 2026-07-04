import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type {
  AdminSupportTicket,
  CreateSupportTicketInput,
  SupportStatus,
  SupportTicket,
} from "@obracerta/shared";
import { InboxService } from "../../notifications/application/inbox.service.js";
import { UsersService } from "../../users/application/users.service.js";
import {
  SUPPORT_REPOSITORY,
  type SupportRepository,
} from "../domain/ports/support.repository.js";

/**
 * Suporte (central de ajuda): usuário abre chamado; admin responde pelo painel.
 * A resposta gera notificação in-app/push para o autor.
 */
@Injectable()
export class SupportService {
  constructor(
    @Inject(SUPPORT_REPOSITORY) private readonly repo: SupportRepository,
    private readonly inbox: InboxService,
    private readonly users: UsersService,
  ) {}

  async create(userId: string, input: CreateSupportTicketInput): Promise<SupportTicket> {
    const ticket = await this.repo.create(userId, input);
    try {
      const admins = await this.users.listAdmins();
      for (const admin of admins) {
        await this.inbox.record(admin.id, "SISTEMA", "Novo chamado de suporte 💬", {
          corpo: `Um chamado com o assunto "${ticket.assunto}" foi criado por um usuário.`,
          link: "/admin/suporte",
        });
      }
    } catch {
      // Best effort notification
    }
    return ticket;
  }

  listMine(userId: string): Promise<SupportTicket[]> {
    return this.repo.listForUser(userId);
  }

  listForAdmin(status: SupportStatus | null): Promise<AdminSupportTicket[]> {
    return this.repo.listForAdmin(status);
  }

  /** Admin responde: status → RESPONDIDO + aviso ao autor. */
  async respond(id: string, resposta: string): Promise<SupportTicket> {
    const updated = await this.repo.respond(id, resposta);
    if (!updated) throw new NotFoundException("Chamado não encontrado.");
    await this.inbox.record(updated.userId, "SISTEMA", "Seu chamado foi respondido 💬", {
      corpo: `"${updated.assunto}" — veja a resposta do suporte.`,
      link: "/ajuda",
    });
    return updated;
  }

  /** Admin fecha o chamado (sem nova notificação). */
  async close(id: string): Promise<SupportTicket> {
    const updated = await this.repo.setStatus(id, "FECHADO");
    if (!updated) throw new NotFoundException("Chamado não encontrado.");
    return updated;
  }
}
