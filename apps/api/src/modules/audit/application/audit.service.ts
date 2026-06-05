import { Inject, Injectable } from "@nestjs/common";
import { verifyChain } from "../domain/audit-hash.js";
import {
  AUDIT_REPOSITORY,
  type AppendAuditData,
  type AuditEntry,
  type AuditRepository,
} from "../domain/ports/audit.repository.js";

/** Resultado da verificação de integridade da trilha. */
export interface AuditIntegrity {
  ok: boolean;
  total: number;
  brokenAtSeq: number | null;
}

@Injectable()
export class AuditService {
  constructor(@Inject(AUDIT_REPOSITORY) private readonly repo: AuditRepository) {}

  /** Registra um evento na trilha (encadeado). Reutilizável por outros módulos. */
  record(data: AppendAuditData): Promise<AuditEntry> {
    return this.repo.append(data);
  }

  /** Verifica a integridade da hash-chain inteira. */
  async verify(): Promise<AuditIntegrity> {
    const entries = await this.repo.listOrdered();
    const { ok, brokenAtSeq } = verifyChain(entries);
    return { ok, total: entries.length, brokenAtSeq };
  }
}
