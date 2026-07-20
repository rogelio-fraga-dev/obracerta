import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  geometry,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";
import { cities } from "./cities.js";
import { workUrgencyEnum, workOrderStatusEnum } from "./enums.js";

/**
 * Obra/pedido de orçamento publicado pelo contratante (roadmap §4.4/§16). `urgencia`
 * define a janela (URGENTE 48h / NORMAL 7d / FLEXIVEL 15d) — `expira_em` é calculado
 * no domínio. `geo` (PostGIS) localiza a obra p/ casar com o raio do profissional;
 * `piso_centavos` é o piso de dignidade (média). FKs em RESTRICT (contas soft-delete).
 *
 * Índices: descoberta por cidade+especialidade; varredura de expiração (parcial em
 * ABERTA); GIST em `geo` para a busca por raio.
 */
export const workOrders = pgTable(
  "work_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contractorId: uuid("contractor_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    cidadeId: uuid("cidade_id")
      .notNull()
      .references(() => cities.id, { onDelete: "restrict" }),
    especialidade: varchar("especialidade", { length: 60 }).notNull(),
    titulo: varchar("titulo", { length: 140 }).notNull(),
    descricao: text("descricao"),
    urgencia: workUrgencyEnum("urgencia").notNull(),
    bairro: varchar("bairro", { length: 120 }),
    /** Foto ilustrativa da obra (URL no storage) — anexada pelo dono após criar. */
    fotoUrl: text("foto_url"),
    geo: geometry("geo", { type: "point", mode: "xy", srid: 4326 }),
    pisoCentavos: integer("piso_centavos"),
    subServico: varchar("sub_servico", { length: 80 }),
    status: workOrderStatusEnum("status").notNull().default("ABERTA"),
    expiraEm: timestamp("expira_em", { withTimezone: true }).notNull(),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("work_orders_contractor_idx").on(t.contractorId),
    index("work_orders_cidade_esp_idx").on(t.cidadeId, t.especialidade),
    index("work_orders_open_expiry_idx").on(t.expiraEm).where(sql`${t.status} = 'ABERTA'`),
    index("work_orders_geo_idx").using("gist", t.geo),
    check("work_orders_piso_check", sql`${t.pisoCentavos} is null or ${t.pisoCentavos} > 0`),
  ],
);
