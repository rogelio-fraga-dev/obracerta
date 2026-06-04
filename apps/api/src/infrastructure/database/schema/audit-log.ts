import { pgTable, uuid, varchar, jsonb, timestamp, bigserial, index, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";

/**
 * Trilha de auditoria imutável e tamper-evident (roadmap §9). APPEND-ONLY.
 * Cada linha encadeia `hash = sha256(hashPrev + payload canônico)`, formando uma
 * hash-chain: alterar qualquer registro antigo quebra a cadeia. `seq` (bigserial,
 * UNIQUE) dá ordem total estável; o CHECK garante que só a 1ª linha pode ter
 * `hash_prev` nulo — qualquer outra sem predecessor quebraria a cadeia.
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
    check("audit_chain_continuity_check", sql`${t.seq} = 1 or ${t.hashPrev} is not null`),
  ],
);
