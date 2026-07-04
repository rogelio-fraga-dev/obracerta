import type { Notification, NotificationType } from "@obracerta/shared";

/** Dados para registrar uma notificação in-app. */
export interface CreateNotificationData {
  userId: string;
  tipo: NotificationType;
  titulo: string;
  corpo?: string | null;
  link?: string | null;
}

/** Porta de saída das notificações in-app (sino + /notificacoes). */
export interface NotificationsRepository {
  create(data: CreateNotificationData): Promise<Notification>;
  /** Mais recentes primeiro, limitadas (a página não é um histórico infinito). */
  listForUser(userId: string, limit: number): Promise<Notification[]>;
  countUnread(userId: string): Promise<number>;
  /** Marca como lida se pertencer ao usuário; devolve se algo mudou. */
  markRead(userId: string, id: string): Promise<boolean>;
  markAllRead(userId: string): Promise<void>;
}

export const NOTIFICATIONS_REPOSITORY = Symbol("NOTIFICATIONS_REPOSITORY");
