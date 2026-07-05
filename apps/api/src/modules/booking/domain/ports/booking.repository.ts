import type { BookingRequest, BookingStatus } from "@obracerta/shared";

/** Dados para persistir um novo pedido (já com os derivados calculados). */
export interface CreateBookingData {
  contractorId: string;
  professionalId: string;
  especialidade: string;
  descricao: string | null;
  dataServico: string; // ISO
  expiraEm: string; // ISO
}

/** Porta de saída para os pedidos de agendamento. */
export interface BookingRepository {
  create(data: CreateBookingData): Promise<BookingRequest>;
  /** Anexa a foto (URL no storage) a um pedido e devolve o pedido atualizado. */
  setFoto(id: string, url: string): Promise<BookingRequest | null>;
  findById(id: string): Promise<BookingRequest | null>;
  countPending(contractorId: string, especialidade: string): Promise<number>;
  listForProfessional(professionalId: string): Promise<BookingRequest[]>;
  listForContractor(contractorId: string): Promise<BookingRequest[]>;
  findAll(): Promise<BookingRequest[]>;
  findAllPaginated(limit: number, offset: number): Promise<{ items: BookingRequest[], total: number }>;
  /**
   * Transição atômica e guardada: muda o status só se o atual for `expectedFrom`
   * (UPDATE ... WHERE status = expectedFrom), evitando corrida entre atores.
   * Devolve o pedido atualizado, ou null se o estado não batia. Atualiza atualizadoEm.
   */
  transitionStatus(
    id: string,
    expectedFrom: BookingStatus,
    to: BookingStatus,
    patch?: { motivoRecusa?: string },
  ): Promise<BookingRequest | null>;
  /** Registra uma proposta de reagendamento (só enquanto APROVADO). */
  proposeReschedule(
    id: string,
    novaData: string,
    porUserId: string,
  ): Promise<BookingRequest | null>;
  /** Aplica o reagendamento aceito: move `dataServico` e limpa a proposta. */
  applyReschedule(id: string, novaData: string): Promise<BookingRequest | null>;
  /** Limpa a proposta de reagendamento (recusa). */
  clearReschedule(id: string): Promise<BookingRequest | null>;
}

export const BOOKING_REPOSITORY = Symbol("BOOKING_REPOSITORY");
