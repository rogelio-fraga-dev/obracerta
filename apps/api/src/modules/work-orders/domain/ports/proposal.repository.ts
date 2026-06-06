import type { Proposal, ProposalStatus } from "@obracerta/shared";

/** Dados de um lance (insere ou atualiza — UNIQUE obra+profissional). */
export interface UpsertProposalData {
  workOrderId: string;
  professionalId: string;
  valorCentavos: number;
  prazoDias: number | null;
  mensagem: string | null;
}

/** Porta de saída dos lances (propostas sigilosas). */
export interface ProposalRepository {
  /** Cria o lance, ou atualiza o existente (reenviar = atualizar, volta a ENVIADA). */
  upsert(data: UpsertProposalData): Promise<Proposal>;
  findById(id: string): Promise<Proposal | null>;
  listForWorkOrder(workOrderId: string): Promise<Proposal[]>;
  /** Valores dos lances da obra (base do piso de dignidade). */
  valuesForWorkOrder(workOrderId: string): Promise<number[]>;
  setStatus(id: string, status: ProposalStatus): Promise<Proposal | null>;
  /** Recusa todos os lances ENVIADA da obra, exceto o aceito (na adjudicação). */
  rejectOthers(workOrderId: string, exceptId: string): Promise<void>;
}

export const PROPOSAL_REPOSITORY = Symbol("PROPOSAL_REPOSITORY");
