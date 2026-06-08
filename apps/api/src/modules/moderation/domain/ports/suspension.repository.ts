import type { Suspension, SuspensionStatus } from "@obracerta/shared";

/** Dados para criar uma suspensão (automática ou manual). */
export interface CreateSuspensionData {
  userId: string;
  reportId: string | null;
  motivo: string;
  fimEm: string | null; // ISO; null = indeterminada
}

/** Porta de saída das suspensões de conta (moderação). */
export interface SuspensionRepository {
  create(data: CreateSuspensionData): Promise<Suspension>;
  findById(id: string): Promise<Suspension | null>;
  /** Suspensão ATIVA do usuário (a vigência por prazo é avaliada no domínio). */
  activeForUser(userId: string): Promise<Suspension | null>;
  /** Registra a apelação: ATIVA → APELADA + texto + data. */
  appeal(id: string, texto: string): Promise<Suspension | null>;
  /** Resolve (apelação/expiração): move o status; quando `resolvido`, carimba `resolvido_em`. */
  resolve(id: string, status: SuspensionStatus, resolvido: boolean): Promise<Suspension | null>;
  listForUser(userId: string): Promise<Suspension[]>;
  /** Suspensões APELADA aguardando julgamento do moderador. */
  listAppealed(): Promise<Suspension[]>;
}

export const SUSPENSION_REPOSITORY = Symbol("SUSPENSION_REPOSITORY");
