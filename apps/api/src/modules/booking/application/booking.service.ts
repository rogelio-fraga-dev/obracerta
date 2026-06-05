import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { BookingStatus, UserType, type BookingRequest, type CreateBookingInput } from "@obracerta/shared";
import { AvailabilityService } from "../../availability/application/availability.service.js";
import {
  NOTIFICATION_PROVIDER,
  type NotificationProvider,
} from "../../notifications/domain/notification.provider.js";
import { UsersService } from "../../users/application/users.service.js";
import { computeExpiry, exceedsPendingLimit, serviceBlockWindow } from "../domain/booking-state.js";
import { BOOKING_REPOSITORY, type BookingRepository } from "../domain/ports/booking.repository.js";
import { BookingScheduler } from "./booking.scheduler.js";

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    @Inject(BOOKING_REPOSITORY) private readonly repo: BookingRepository,
    private readonly users: UsersService,
    private readonly availability: AvailabilityService,
    private readonly scheduler: BookingScheduler,
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

  /** Profissional recusa com motivo (PENDENTE → RECUSADO). */
  async decline(professionalId: string, id: string, motivo: string): Promise<BookingRequest> {
    const booking = await this.getProfessionalBooking(professionalId, id);
    if (booking.status !== BookingStatus.PENDENTE) {
      throw new ConflictException("Só pedidos pendentes podem ser recusados.");
    }
    const updated = await this.repo.transitionStatus(
      id,
      BookingStatus.PENDENTE,
      BookingStatus.RECUSADO,
      { motivoRecusa: motivo },
    );
    if (!updated) throw new ConflictException("O pedido não está mais pendente.");
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

  /** Expira um pedido se ainda estiver PENDENTE (chamado pelo job de 24h). */
  expireIfPending(id: string): Promise<BookingRequest | null> {
    return this.repo.transitionStatus(id, BookingStatus.PENDENTE, BookingStatus.EXPIRADO);
  }

  /** Detalhe de um pedido (apenas participantes). */
  async getForParticipant(userId: string, id: string): Promise<BookingRequest> {
    const booking = await this.getOr404(id);
    if (booking.contractorId !== userId && booking.professionalId !== userId) {
      throw new ForbiddenException("Você não participa deste pedido.");
    }
    return booking;
  }

  listForContractor(contractorId: string): Promise<BookingRequest[]> {
    return this.repo.listForContractor(contractorId);
  }

  listForProfessional(professionalId: string): Promise<BookingRequest[]> {
    return this.repo.listForProfessional(professionalId);
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
