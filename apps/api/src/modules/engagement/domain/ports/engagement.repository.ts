/** Pedido pendente perto de expirar (lembrete ao profissional). */
export interface ExpiringBooking {
  bookingId: string;
  professionalId: string;
  especialidade: string;
}

/** Profissional-alvo de um lembrete de ativação (perfil/agenda). */
export interface ProfessionalTarget {
  userId: string;
}

/**
 * Leituras dos lembretes de engajamento. Consultas read-only e enxutas —
 * este módulo não escreve nos domínios, só observa e avisa.
 */
export interface EngagementRepository {
  /** Pedidos PENDENTE que expiram nas próximas `withinHours` horas. */
  pendingExpiringSoon(withinHours: number): Promise<ExpiringBooking[]>;
  /** Profissionais ativos com perfil incompleto criados há mais de `olderThanDays`. */
  incompleteProfiles(olderThanDays: number): Promise<ProfessionalTarget[]>;
  /** Profissionais ativos sem nenhuma faixa na agenda semanal. */
  withoutAgenda(olderThanDays: number): Promise<ProfessionalTarget[]>;
  /** Já existe notificação igual (mesmo título+link) nos últimos `days` dias? Anti-spam. */
  hasRecentNotification(userId: string, titulo: string, link: string | null, days: number): Promise<boolean>;
}

export const ENGAGEMENT_REPOSITORY = Symbol("ENGAGEMENT_REPOSITORY");
