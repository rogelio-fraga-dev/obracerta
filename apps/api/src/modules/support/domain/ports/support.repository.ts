import type {
  AdminSupportTicket,
  CreateSupportTicketInput,
  SupportStatus,
  SupportTicket,
} from "@obracerta/shared";

/** Porta de saída dos tickets de suporte. */
export interface SupportRepository {
  create(userId: string, input: CreateSupportTicketInput): Promise<SupportTicket>;
  listForUser(userId: string): Promise<SupportTicket[]>;
  findById(id: string): Promise<SupportTicket | null>;
  /** Visão do admin (com autor), filtrável por status; mais antigos primeiro. */
  listForAdmin(status: SupportStatus | null): Promise<AdminSupportTicket[]>;
  respond(id: string, resposta: string): Promise<SupportTicket | null>;
  setStatus(id: string, status: SupportStatus): Promise<SupportTicket | null>;
}

export const SUPPORT_REPOSITORY = Symbol("SUPPORT_REPOSITORY");
