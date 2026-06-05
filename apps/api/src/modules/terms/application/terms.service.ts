import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { AcceptTermsInput, TermsAcceptance } from "@obracerta/shared";
import { AuditService } from "../../audit/application/audit.service.js";
import { BookingService } from "../../booking/application/booking.service.js";
import { UsersService } from "../../users/application/users.service.js";
import { TERMS_REPOSITORY, type TermsRepository } from "../domain/ports/terms.repository.js";

@Injectable()
export class TermsService {
  constructor(
    @Inject(TERMS_REPOSITORY) private readonly repo: TermsRepository,
    private readonly users: UsersService,
    private readonly bookings: BookingService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Registra o aceite do usuário autenticado para um pedido. Append-only +
   * idempotente (UNIQUE booking+user) e gera o evento na trilha de auditoria.
   */
  async accept(
    userId: string,
    input: AcceptTermsInput,
    ip: string | null,
  ): Promise<TermsAcceptance> {
    // autoriza: só participantes do pedido (também valida que o pedido existe)
    await this.bookings.getForParticipant(userId, input.bookingId);

    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException("Usuário não encontrado.");

    const existing = await this.repo.findByBookingAndUser(input.bookingId, userId);
    if (existing) {
      throw new ConflictException("Você já aceitou os termos deste pedido.");
    }

    const acceptance = await this.repo.accept({
      bookingId: input.bookingId,
      userId,
      papel: user.tipo,
      termoVersao: input.termoVersao,
      ip,
    });

    await this.audit.record({
      atorUserId: userId,
      acao: "TERMO_ACEITO",
      entidade: "booking",
      entidadeId: input.bookingId,
      dados: { papel: user.tipo, termoVersao: input.termoVersao },
    });

    return acceptance;
  }

  /** Lista os aceites de um pedido (apenas participantes). */
  async listForBooking(userId: string, bookingId: string): Promise<TermsAcceptance[]> {
    await this.bookings.getForParticipant(userId, bookingId);
    return this.repo.listForBooking(bookingId);
  }
}
