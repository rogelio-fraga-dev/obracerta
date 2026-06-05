import type { TermsAcceptance, UserType } from "@obracerta/shared";

/** Dados de um aceite (o `ip` é interno/LGPD, fora do contrato público). */
export interface AcceptTermsData {
  bookingId: string;
  userId: string;
  papel: UserType;
  termoVersao: string;
  ip: string | null;
}

/** Porta de saída dos aceites de termo. APPEND-ONLY: sem update/delete. */
export interface TermsRepository {
  accept(data: AcceptTermsData): Promise<TermsAcceptance>;
  findByBookingAndUser(bookingId: string, userId: string): Promise<TermsAcceptance | null>;
  listForBooking(bookingId: string): Promise<TermsAcceptance[]>;
}

export const TERMS_REPOSITORY = Symbol("TERMS_REPOSITORY");
