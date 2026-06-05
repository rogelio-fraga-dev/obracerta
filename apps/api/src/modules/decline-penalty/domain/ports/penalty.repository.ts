import type { Penalty } from "@obracerta/shared";

/** Dados para registrar uma penalidade (pontos já calculados pela escala). */
export interface CreatePenaltyData {
  professionalId: string;
  bookingId: string | null;
  motivo: string;
  pontos: number;
  detalhe: string | null;
}

/** Contagem de pedidos por desfecho, para a taxa de aceitação. */
export interface ProfessionalBookingCounts {
  total: number;
  aprovados: number;
  recusados: number;
  expirados: number;
}

/** Porta de saída das penalidades (append-only) + agregados de comportamento. */
export interface PenaltyRepository {
  create(data: CreatePenaltyData): Promise<Penalty>;
  /** Nº de penalidades já existentes do profissional (base da escala). */
  countForProfessional(professionalId: string): Promise<number>;
  /** Soma dos pontos de penalidade do profissional. */
  sumPoints(professionalId: string): Promise<number>;
  listForProfessional(professionalId: string): Promise<Penalty[]>;
  /** Contagem de pedidos por desfecho (lê booking_requests, só leitura). */
  bookingCounts(professionalId: string): Promise<ProfessionalBookingCounts>;
}

export const PENALTY_REPOSITORY = Symbol("PENALTY_REPOSITORY");
