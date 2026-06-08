import type { Refund, RefundStatus } from "@obracerta/shared";

/** Dados para registrar uma solicitação de reembolso (status inicial SOLICITADO). */
export interface CreateRefundData {
  invoiceId: string;
  userId: string;
  valorCentavos: number;
  motivo: string;
}

/** Porta de saída dos reembolsos. */
export interface RefundRepository {
  create(data: CreateRefundData): Promise<Refund>;
  findById(id: string): Promise<Refund | null>;
  /** Resolve o reembolso (CONCLUIDO/RECUSADO): grava status, gatewayId e processadoEm. */
  resolve(id: string, status: RefundStatus, gatewayId: string | null): Promise<Refund | null>;
  listForUser(userId: string): Promise<Refund[]>;
  /** Reembolsos SOLICITADO aguardando decisão do financeiro. */
  listPending(): Promise<Refund[]>;
}

export const REFUND_REPOSITORY = Symbol("REFUND_REPOSITORY");
