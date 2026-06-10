import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import {
  BookingStatus,
  UserType,
  isBookingContactReleased,
  type BookingContact,
  type BookingRequest,
  type CreateBookingInput,
  type DeclineReason,
  type PaginatedResponse,
} from "@obracerta/shared";
import { AvailabilityService } from "../../availability/application/availability.service.js";
import { BillingService } from "../../billing/application/billing.service.js";
import { PenaltyService } from "../../decline-penalty/application/penalty.service.js";
import { Feature } from "../../entitlements/domain/entitlements.js";
import {
  NOTIFICATION_PROVIDER,
  type NotificationProvider,
} from "../../notifications/domain/notification.provider.js";
import { UsersService } from "../../users/application/users.service.js";
import { STORAGE_PORT, type StoragePort } from "../../storage/domain/storage.port.js";
import { computeExpiry, exceedsPendingLimit, serviceBlockWindow } from "../domain/booking-state.js";
import { BOOKING_REPOSITORY, type BookingRepository } from "../domain/ports/booking.repository.js";
import { BookingScheduler } from "./booking.scheduler.js";
import { ReviewReminderScheduler } from "./review-reminder.scheduler.js";

/** Formatos de imagem aceitos no anexo do pedido → extensão do objeto. */
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    @Inject(BOOKING_REPOSITORY) private readonly repo: BookingRepository,
    private readonly users: UsersService,
    private readonly availability: AvailabilityService,
    private readonly scheduler: BookingScheduler,
    private readonly reviewReminders: ReviewReminderScheduler,
    private readonly penalties: PenaltyService,
    private readonly billing: BillingService,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    @Inject(NOTIFICATION_PROVIDER) private readonly notifications: NotificationProvider,
  ) {}

  /** Contratante cria um pedido para um profissional (estado inicial PENDENTE). */
  async createForContractor(
    contractorId: string,
    input: CreateBookingInput,
  ): Promise<BookingRequest> {
    if (input.professionalId === contractorId) {
      throw new BadRequestException("Você não pode agendar consigo mesmo.");
    }
    const professional = await this.users.findById(input.professionalId);
    if (!professional || professional.tipo !== UserType.PROFISSIONAL) {
      throw new NotFoundException("Profissional não encontrado.");
    }
    // Gating de plano: o alvo precisa da feature RECEIVE_BOOKINGS para receber
    // agendamentos. Após a reprecificação (Fase 8+) o INICIANTE já tem a feature
    // (receber pedidos virou grátis) — o gate permanece como trava do mecanismo
    // (data-driven via ENTITLEMENTS), barrando apenas quem não a tiver.
    if (!(await this.billing.can(input.professionalId, Feature.RECEIVE_BOOKINGS))) {
      throw new ForbiddenException("Este profissional não está habilitado a receber pedidos.");
    }
    if (Date.parse(input.dataServico) <= Date.now()) {
      throw new BadRequestException("A data do serviço deve ser no futuro.");
    }

    const pendentes = await this.repo.countPending(contractorId, input.especialidade);
    if (exceedsPendingLimit(pendentes)) {
      throw new ConflictException(
        "Você já tem 2 pedidos pendentes nesta especialidade. Aguarde a resposta antes de abrir outro.",
      );
    }

    const expiraEm = computeExpiry(new Date());
    const booking = await this.repo.create({
      contractorId,
      professionalId: input.professionalId,
      especialidade: input.especialidade,
      descricao: input.descricao ?? null,
      dataServico: input.dataServico,
      expiraEm,
    });

    await this.scheduler.scheduleExpiry(booking.id, expiraEm);
    await this.notify(professional.whatsapp, "Você recebeu um novo pedido de agendamento.");
    return booking;
  }

  /**
   * Contratante anexa uma foto do serviço ao próprio pedido (enquanto PENDENTE).
   * A imagem vai pro storage; persistimos só a URL. Mesma validação de formato
   * da foto de perfil (§8.4).
   */
  async uploadFoto(
    contractorId: string,
    id: string,
    file: { buffer: Buffer; mimetype: string },
  ): Promise<BookingRequest> {
    const booking = await this.getOr404(id);
    if (booking.contractorId !== contractorId) {
      throw new ForbiddenException("Este pedido não é seu.");
    }
    if (booking.status !== BookingStatus.PENDENTE) {
      throw new ConflictException("Só dá para anexar foto enquanto o pedido está pendente.");
    }
    const ext = ALLOWED_IMAGE_TYPES[file.mimetype];
    if (!ext) {
      throw new BadRequestException("Formato inválido. Use JPEG, PNG ou WebP.");
    }
    const key = `bookings/${id}/foto-${Date.now()}.${ext}`;
    const url = await this.storage.putObject(key, file.buffer, file.mimetype);
    const updated = await this.repo.setFoto(id, url);
    if (!updated) throw new NotFoundException("Pedido de agendamento não encontrado.");
    return updated;
  }

  /**
   * Contato da outra parte, liberado **só após o aceite** (double-blind §24):
   * antes de APROVADO ninguém vê WhatsApp/e-mail do outro — a plataforma só
   * intermedia a conexão. Restrito aos participantes do pedido.
   */
  async getContact(userId: string, id: string): Promise<BookingContact> {
    const booking = await this.getForParticipant(userId, id);
    if (!isBookingContactReleased(booking.status)) {
      throw new ForbiddenException(
        "O contato é liberado só depois que o profissional aceita o pedido.",
      );
    }
    const otherId =
      booking.contractorId === userId ? booking.professionalId : booking.contractorId;
    const other = await this.users.findById(otherId);
    if (!other) throw new NotFoundException("Usuário não encontrado.");
    return { nome: other.nomeCompleto, whatsapp: other.whatsapp, email: other.email ?? null };
  }

  /** Profissional aprova: gera o bloqueio bilateral e transita PENDENTE → APROVADO. */
  async approve(professionalId: string, id: string): Promise<BookingRequest> {
    const booking = await this.getProfessionalBooking(professionalId, id);
    if (booking.status !== BookingStatus.PENDENTE) {
      throw new ConflictException("Só pedidos pendentes podem ser aprovados.");
    }

    const window = serviceBlockWindow(booking.dataServico);
    if (await this.availability.conflictsWith(professionalId, window)) {
      throw new ConflictException("Sua agenda já está bloqueada nesse horário.");
    }

    // Bloqueia primeiro; se a transição falhar (corrida), compensa removendo o bloqueio.
    await this.availability.blockForBooking(professionalId, window.inicio, window.fim, id);
    const updated = await this.repo.transitionStatus(
      id,
      BookingStatus.PENDENTE,
      BookingStatus.APROVADO,
    );
    if (!updated) {
      await this.availability.removeBlocksForBooking(id);
      throw new ConflictException("O pedido não está mais pendente.");
    }

    await this.notifyUser(updated.contractorId, "Seu pedido de agendamento foi aprovado.");
    return updated;
  }

  /**
   * Profissional recusa com motivo categorizado (PENDENTE → RECUSADO). Motivos
   * não-legítimos geram penalidade (escala por reincidência) + evento na trilha.
   */
  async decline(
    professionalId: string,
    id: string,
    reason: DeclineReason,
    detalhe: string | null,
  ): Promise<BookingRequest> {
    const booking = await this.getProfessionalBooking(professionalId, id);
    if (booking.status !== BookingStatus.PENDENTE) {
      throw new ConflictException("Só pedidos pendentes podem ser recusados.");
    }
    const motivoRecusa = detalhe ? `${reason}: ${detalhe}` : reason;
    const updated = await this.repo.transitionStatus(
      id,
      BookingStatus.PENDENTE,
      BookingStatus.RECUSADO,
      { motivoRecusa },
    );
    if (!updated) throw new ConflictException("O pedido não está mais pendente.");

    await this.penalties.penalizeDecline(professionalId, id, reason, detalhe);
    await this.notifyUser(updated.contractorId, "Seu pedido de agendamento foi recusado.");
    return updated;
  }

  /** Profissional inicia a obra (APROVADO → INICIADO). */
  async start(professionalId: string, id: string): Promise<BookingRequest> {
    const booking = await this.getProfessionalBooking(professionalId, id);
    if (booking.status !== BookingStatus.APROVADO) {
      throw new ConflictException("Só pedidos aprovados podem ser iniciados.");
    }
    const updated = await this.repo.transitionStatus(
      id,
      BookingStatus.APROVADO,
      BookingStatus.INICIADO,
    );
    if (!updated) throw new ConflictException("O pedido não está mais aprovado.");
    return updated;
  }

  /** Profissional conclui a obra (INICIADO → CONCLUIDO). */
  async complete(professionalId: string, id: string): Promise<BookingRequest> {
    const booking = await this.getProfessionalBooking(professionalId, id);
    if (booking.status !== BookingStatus.INICIADO) {
      throw new ConflictException("Só pedidos iniciados podem ser concluídos.");
    }
    const updated = await this.repo.transitionStatus(
      id,
      BookingStatus.INICIADO,
      BookingStatus.CONCLUIDO,
    );
    if (!updated) throw new ConflictException("O pedido não está mais iniciado.");
    await this.notifyUser(updated.contractorId, "Sua obra foi marcada como concluída.");
    await this.scheduleReviewReminders(updated.id, updated.contractorId, updated.professionalId);
    return updated;
  }

  /** Contratante cancela (PENDENTE ou APROVADO → CANCELADO; libera a agenda). */
  async cancel(contractorId: string, id: string): Promise<BookingRequest> {
    const booking = await this.getOr404(id);
    if (booking.contractorId !== contractorId) {
      throw new ForbiddenException("Este pedido não é seu.");
    }
    if (booking.status !== BookingStatus.PENDENTE && booking.status !== BookingStatus.APROVADO) {
      throw new ConflictException("Não é possível cancelar um pedido neste estado.");
    }
    const updated = await this.repo.transitionStatus(id, booking.status, BookingStatus.CANCELADO);
    if (!updated) throw new ConflictException("O estado do pedido mudou; tente novamente.");
    if (booking.status === BookingStatus.APROVADO) {
      await this.availability.removeBlocksForBooking(id);
    }
    await this.notifyUser(updated.professionalId, "Um pedido de agendamento foi cancelado.");
    return updated;
  }

  /**
   * Expira um pedido se ainda estiver PENDENTE (job de 24h) e penaliza a
   * não-resposta do profissional.
   */
  async expireIfPending(id: string): Promise<BookingRequest | null> {
    const updated = await this.repo.transitionStatus(
      id,
      BookingStatus.PENDENTE,
      BookingStatus.EXPIRADO,
    );
    if (updated) {
      await this.penalties.penalizeExpiration(updated.professionalId, updated.id);
    }
    return updated;
  }

  /** Detalhe de um pedido (apenas participantes). */
  async getForParticipant(userId: string, id: string): Promise<BookingRequest> {
    const booking = await this.getOr404(id);
    if (booking.contractorId !== userId && booking.professionalId !== userId) {
      throw new ForbiddenException("Você não participa deste pedido.");
    }
    return booking;
  }

  /** Detalhe de um pedido para o Admin. */
  async getBookingForAdmin(id: string): Promise<BookingRequest> {
    return this.getOr404(id);
  }

  listForContractor(contractorId: string): Promise<BookingRequest[]> {
    return this.repo.listForContractor(contractorId);
  }

  listForProfessional(professionalId: string): Promise<BookingRequest[]> {
    return this.repo.listForProfessional(professionalId);
  }

  findAll(): Promise<BookingRequest[]> {
    return this.repo.findAll();
  }

  async findAllPaginated(page: number, limit: number): Promise<PaginatedResponse<BookingRequest>> {
    const offset = (page - 1) * limit;
    const { items, total } = await this.repo.findAllPaginated(limit, offset);
    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async getOr404(id: string): Promise<BookingRequest> {
    const booking = await this.repo.findById(id);
    if (!booking) throw new NotFoundException("Pedido de agendamento não encontrado.");
    return booking;
  }

  /** Carrega o pedido e exige que o ator seja o profissional alvo. */
  private async getProfessionalBooking(
    professionalId: string,
    id: string,
  ): Promise<BookingRequest> {
    const booking = await this.getOr404(id);
    if (booking.professionalId !== professionalId) {
      throw new ForbiddenException("Este pedido não é seu.");
    }
    return booking;
  }

  /** Agenda os lembretes de avaliação (D1/D5/D7) para os dois lados da obra. */
  private async scheduleReviewReminders(
    bookingId: string,
    contractorId: string,
    professionalId: string,
  ): Promise<void> {
    const [contractor, professional] = await Promise.all([
      this.users.findById(contractorId),
      this.users.findById(professionalId),
    ]);
    if (contractor) await this.reviewReminders.schedule(bookingId, contractor.id, contractor.whatsapp);
    if (professional)
      await this.reviewReminders.schedule(bookingId, professional.id, professional.whatsapp);
  }

  /** Notifica um usuário pelo id (busca o WhatsApp). Best-effort: loga e segue. */
  private async notifyUser(userId: string, text: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (user) await this.notify(user.whatsapp, text);
  }

  private async notify(whatsapp: string, text: string): Promise<void> {
    try {
      await this.notifications.sendMessage(whatsapp, text);
    } catch (error: unknown) {
      this.logger.warn(`Falha ao notificar ${whatsapp}: ${String(error)}`);
    }
  }
}
