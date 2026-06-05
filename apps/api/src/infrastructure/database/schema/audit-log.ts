import { pgTable, uuid, varchar, jsonb, timestamp, bigserial, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";

/**
 * Trilha de auditoria imutável e tamper-evident (roadmap §9). APPEND-ONLY.
 * Cada linha encadeia `hash = sha256(hashPrev + payload canônico)`, formando uma
 * hash-chain: alterar qualquer registro antigo quebra a cadeia. `seq` (bigserial,
 * UNIQUE) dá ordem total estável; o índice único parcial garante que exista no
 * máximo UM registro gênese (sem predecessor) — qualquer outro sem `hash_prev`
 * quebraria a cadeia. (Antes era um CHECK `seq = 1`, que travava reinícios da
 * cadeia quando o ambiente era recriado; a ordem fica por conta do encadeamento.)
 */
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    seq: bigserial("seq", { mode: "number" }).notNull().unique(),
    atorUserId: uuid("ator_user_id").references(() => users.id, { onDelete: "set null" }),
    acao: varchar("acao", { length: 80 }).notNull(),
    entidade: varchar("entidade", { length: 60 }).notNull(),
    entidadeId: varchar("entidade_id", { length: 64 }),
    dados: jsonb("dados"),
    hashPrev: varchar("hash_prev", { length: 64 }),
    hash: varchar("hash", { length: 64 }).notNull(),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("audit_entidade_idx").on(t.entidade, t.entidadeId),
    // no máximo um registro gênese (hash_prev nulo) — tolera reinício da cadeia
    uniqueIndex("audit_single_genesis_idx")
      .on(sql`(${t.hashPrev} is null)`)
      .where(sql`${t.hashPrev} is null`),
  ],
);
