import { Inject, Injectable, Logger } from "@nestjs/common";
import { InboxService } from "../../notifications/application/inbox.service.js";
import {
  ENGAGEMENT_REPOSITORY,
  type EngagementRepository,
} from "../domain/ports/engagement.repository.js";

/** Janela do lembrete de expiração (pedido PENDENTE expira em até N horas). */
const EXPIRING_WINDOW_HOURS = 6;
/** Perfil/agenda: só lembra contas com mais de N dias (não atropela o onboarding). */
const MIN_ACCOUNT_AGE_DAYS = 3;
/** Anti-spam: o mesmo lembrete não repete dentro desta janela. */
const DEDUPE_DAYS = 7;

/**
 * Lembretes diários de engajamento (in-app). Regras conservadoras: cada
 * lembrete tem dedupe por janela — ninguém recebe o mesmo aviso duas vezes
 * na semana. Lembretes de avaliação NÃO entram aqui (já existem no
 * ReviewReminderScheduler, D1/D5/D7 pós-conclusão).
 */
@Injectable()
export class EngagementService {
  private readonly logger = new Logger(EngagementService.name);

  constructor(
    @Inject(ENGAGEMENT_REPOSITORY) private readonly repo: EngagementRepository,
    private readonly inbox: InboxService,
  ) {}

  /** Varredura diária. Cada bloco é isolado: uma falha não derruba os demais. */
  async runDaily(): Promise<void> {
    await this.remindExpiringBookings().catch((e: unknown) => this.warn("pedidos expirando", e));
    await this.remindIncompleteProfiles().catch((e: unknown) => this.warn("perfil incompleto", e));
    await this.remindMissingAgenda().catch((e: unknown) => this.warn("agenda vazia", e));
  }

  private async remindExpiringBookings(): Promise<void> {
    const bookings = await this.repo.pendingExpiringSoon(EXPIRING_WINDOW_HOURS);
    for (const b of bookings) {
      const titulo = "Pedido prestes a expirar ⏳";
      const link = `/pedidos/${b.bookingId}`;
      if (await this.repo.hasRecentNotification(b.professionalId, titulo, link, 1)) continue;
      await this.inbox.record(b.professionalId, "PEDIDO", titulo, {
        corpo: `O pedido de ${b.especialidade} expira em poucas horas — responda para não perder o cliente (e não ser penalizado).`,
        link,
      });
    }
    if (bookings.length > 0) this.logger.log(`${bookings.length} lembrete(s) de expiração.`);
  }

  private async remindIncompleteProfiles(): Promise<void> {
    const alvos = await this.repo.incompleteProfiles(MIN_ACCOUNT_AGE_DAYS);
    const titulo = "Complete seu perfil e apareça mais 📈";
    for (const alvo of alvos) {
      if (await this.repo.hasRecentNotification(alvo.userId, titulo, null, DEDUPE_DAYS)) continue;
      await this.inbox.record(alvo.userId, "SISTEMA", titulo, {
        corpo: "Perfis completos (foto, especialidades, bairro) aparecem melhor na busca e recebem mais pedidos.",
        link: "/perfil",
      });
    }
  }

  private async remindMissingAgenda(): Promise<void> {
    const alvos = await this.repo.withoutAgenda(MIN_ACCOUNT_AGE_DAYS);
    const titulo = "Defina sua agenda semanal 🗓️";
    for (const alvo of alvos) {
      if (await this.repo.hasRecentNotification(alvo.userId, titulo, null, DEDUPE_DAYS)) continue;
      await this.inbox.record(alvo.userId, "SISTEMA", titulo, {
        corpo: "Sem agenda definida os contratantes não sabem quando você pode. Leva 2 minutos.",
        link: "/agenda",
      });
    }
  }

  private warn(bloco: string, e: unknown): void {
    this.logger.warn(`Lembretes (${bloco}) falharam: ${String(e)}`);
  }
}
