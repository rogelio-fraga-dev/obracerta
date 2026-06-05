/** Registro de auditoria como persistido (inclui os campos da hash-chain). */
export interface AuditEntry {
  id: string;
  seq: number;
  atorUserId: string | null;
  acao: string;
  entidade: string;
  entidadeId: string | null;
  dados: unknown;
  hashPrev: string | null;
  hash: string;
  criadoEm: string; // ISO
}

/** Dados de entrada para registrar um evento (o hash/seq são derivados). */
export interface AppendAuditData {
  atorUserId: string | null;
  acao: string;
  entidade: string;
  entidadeId: string | null;
  dados: unknown;
}

/** Porta de saída da trilha de auditoria (append-only). */
export interface AuditRepository {
  /** Acrescenta um registro encadeado (calcula hashPrev/hash sob lock serial). */
  append(data: AppendAuditData): Promise<AuditEntry>;
  /** Todos os registros em ordem de seq (para verificação da cadeia). */
  listOrdered(): Promise<AuditEntry[]>;
}

export const AUDIT_REPOSITORY = Symbol("AUDIT_REPOSITORY");
