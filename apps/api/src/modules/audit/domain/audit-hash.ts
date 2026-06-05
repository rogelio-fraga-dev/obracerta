import { createHash } from "node:crypto";

/**
 * Domínio puro da trilha de auditoria (roadmap §9). Hash-chain tamper-evident:
 * cada registro encadeia `hash = sha256(hashPrev + payload canônico)`. Alterar
 * qualquer linha antiga quebra a cadeia a partir dali. Sem I/O — testável.
 */

/** Campos que entram no hash (o que de fato "aconteceu"). */
export interface AuditEntryData {
  atorUserId: string | null;
  acao: string;
  entidade: string;
  entidadeId: string | null;
  dados: unknown;
  criadoEm: string; // ISO
}

/**
 * Serialização determinística e independente da ordem das chaves. Necessária
 * porque o `dados` vai para uma coluna `jsonb` (o Postgres NÃO preserva a ordem
 * das chaves) — ordenar recursivamente garante que recomputar o hash bata.
 */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const body = Object.keys(obj)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`)
    .join(",");
  return `{${body}}`;
}

/** Forma canônica do payload de um registro (entrada do sha256). */
export function canonicalize(entry: AuditEntryData): string {
  return stableStringify({
    acao: entry.acao,
    atorUserId: entry.atorUserId,
    criadoEm: entry.criadoEm,
    dados: entry.dados ?? null,
    entidade: entry.entidade,
    entidadeId: entry.entidadeId,
  });
}

/** sha256(hashPrev + payload canônico) em hex. `hashPrev` nulo na 1ª linha. */
export function computeHash(hashPrev: string | null, entry: AuditEntryData): string {
  return createHash("sha256")
    .update(`${hashPrev ?? ""}${canonicalize(entry)}`)
    .digest("hex");
}

/** Um elo da cadeia como lido do banco (já ordenado por seq ascendente). */
export interface ChainLink extends AuditEntryData {
  seq: number;
  hashPrev: string | null;
  hash: string;
}

/**
 * Verifica a integridade da cadeia inteira (em ordem de seq). Devolve o seq do
 * primeiro elo adulterado, ou null se tudo bate.
 */
export function verifyChain(links: readonly ChainLink[]): {
  ok: boolean;
  brokenAtSeq: number | null;
} {
  let prevHash: string | null = null;
  for (const link of links) {
    if (link.hashPrev !== prevHash || computeHash(prevHash, link) !== link.hash) {
      return { ok: false, brokenAtSeq: link.seq };
    }
    prevHash = link.hash;
  }
  return { ok: true, brokenAtSeq: null };
}
