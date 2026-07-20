import { Inject, Injectable } from "@nestjs/common";
import { and, count, desc, eq, ne, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type {
  CompanyReport,
  Proposal,
  WorkOrder,
  WorkOrderStatus,
  WorkUrgency,
} from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { workOrders } from "../../../infrastructure/database/schema/work-orders.js";
import { proposals } from "../../../infrastructure/database/schema/proposals.js";
import { users } from "../../../infrastructure/database/schema/users.js";
import { contractorProfiles } from "../../../infrastructure/database/schema/contractor-profiles.js";
import { companyProfiles } from "../../../infrastructure/database/schema/company-profiles.js";
import { professionalProfiles } from "../../../infrastructure/database/schema/professional-profiles.js";
import { rowToProposal } from "./drizzle-proposal.repository.js";
import type {
  CreateWorkOrderData,
  ListOpenWorkOrdersFilters,
  WorkOrderPage,
  WorkOrderRepository,
} from "../domain/ports/work-order.repository.js";

type WorkOrderRow = typeof workOrders.$inferSelect;

export function rowToWorkOrder(row: WorkOrderRow): WorkOrder {
  return {
    id: row.id,
    contractorId: row.contractorId,
    cidadeId: row.cidadeId,
    especialidade: row.especialidade,
    subServico: row.subServico,
    titulo: row.titulo,
    descricao: row.descricao,
    urgencia: row.urgencia as WorkUrgency,
    bairro: row.bairro,
    fotoUrl: row.fotoUrl,
    geo: row.geo ? { lng: row.geo.x, lat: row.geo.y } : null,
    pisoCentavos: row.pisoCentavos,
    status: row.status as WorkOrderStatus,
    expiraEm: row.expiraEm.toISOString(),
    criadoEm: row.criadoEm.toISOString(),
    atualizadoEm: row.atualizadoEm.toISOString(),
  };
}

@Injectable()
export class DrizzleWorkOrderRepository implements WorkOrderRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(data: CreateWorkOrderData): Promise<WorkOrder> {
    const [row] = await this.db
      .insert(workOrders)
      .values({
        contractorId: data.contractorId,
        cidadeId: data.cidadeId,
        especialidade: data.especialidade,
        subServico: data.subServico,
        titulo: data.titulo,
        descricao: data.descricao,
        urgencia: data.urgencia,
        bairro: data.bairro,
        geo: data.geo ? { x: data.geo.lng, y: data.geo.lat } : null,
        expiraEm: new Date(data.expiraEm),
      })
      .returning();
    if (!row) throw new Error("Falha ao abrir a obra.");
    return rowToWorkOrder(row);
  }

  async findById(id: string): Promise<WorkOrder | null> {
    // Mesmo enriquecimento da listagem (identidade da empresa/destaque) — o
    // detalhe da obra mostra a mesma vitrine que o card.
    const planoVigente = sql`${contractorProfiles.planoExpiraEm} is not null and ${contractorProfiles.planoExpiraEm} > now()`;
    const destaque = sql<boolean>`(${users.tipo} = 'EMPRESA' and ${contractorProfiles.plano} = 'LANCE' and ${planoVigente})`;
    const empresaVisivel = sql<boolean>`(${users.tipo} = 'EMPRESA' and ${contractorProfiles.plano} in ('COMPLETO','LANCE') and ${planoVigente})`;
    const [row] = await this.db
      .select({
        wo: workOrders,
        destaque,
        empresaVisivel,
        empresaNome: sql<string | null>`coalesce(${companyProfiles.nomeFantasia}, ${companyProfiles.razaoSocial})`,
      })
      .from(workOrders)
      .leftJoin(users, eq(users.id, workOrders.contractorId))
      .leftJoin(contractorProfiles, eq(contractorProfiles.userId, workOrders.contractorId))
      .leftJoin(companyProfiles, eq(companyProfiles.userId, workOrders.contractorId))
      .where(eq(workOrders.id, id))
      .limit(1);
    if (!row) return null;
    return {
      ...rowToWorkOrder(row.wo),
      destaque: Boolean(row.destaque),
      empresa: row.empresaVisivel && row.empresaNome ? { nome: row.empresaNome } : null,
    };
  }

  async findAll(): Promise<WorkOrder[]> {
    const rows = await this.db.select().from(workOrders).orderBy(desc(workOrders.criadoEm));
    return rows.map(rowToWorkOrder);
  }

  async findAllPaginated(limit: number, offset: number): Promise<{ items: WorkOrder[], total: number }> {
    const rows = await this.db.select().from(workOrders).orderBy(desc(workOrders.criadoEm)).limit(limit).offset(offset);
    const [c] = await this.db.select({ total: count() }).from(workOrders);
    return { items: rows.map(rowToWorkOrder), total: c?.total ?? 0 };
  }

  async listOpen(f: ListOpenWorkOrdersFilters): Promise<WorkOrderPage> {
    const conds: SQL[] = [eq(workOrders.status, "ABERTA")];
    if (f.cidadeId) conds.push(eq(workOrders.cidadeId, f.cidadeId));
    if (f.especialidade) conds.push(eq(workOrders.especialidade, f.especialidade));
    const where = and(...conds);

    // Vitrine da homologação 18/07: obras de EMPRESA com plano vigente carregam
    // a identidade da empresa (Completo+) e as do Empresa PRO sobem em destaque.
    const planoVigente = sql`${contractorProfiles.planoExpiraEm} is not null and ${contractorProfiles.planoExpiraEm} > now()`;
    const destaque = sql<boolean>`(${users.tipo} = 'EMPRESA' and ${contractorProfiles.plano} = 'LANCE' and ${planoVigente})`;
    const empresaVisivel = sql<boolean>`(${users.tipo} = 'EMPRESA' and ${contractorProfiles.plano} in ('COMPLETO','LANCE') and ${planoVigente})`;

    const rows = await this.db
      .select({
        wo: workOrders,
        destaque,
        empresaVisivel,
        empresaNome: sql<string | null>`coalesce(${companyProfiles.nomeFantasia}, ${companyProfiles.razaoSocial})`,
      })
      .from(workOrders)
      .leftJoin(users, eq(users.id, workOrders.contractorId))
      .leftJoin(contractorProfiles, eq(contractorProfiles.userId, workOrders.contractorId))
      .leftJoin(companyProfiles, eq(companyProfiles.userId, workOrders.contractorId))
      .where(where)
      .orderBy(sql`case when ${destaque} then 0 else 1 end`, desc(workOrders.criadoEm))
      .limit(f.limit)
      .offset(f.offset);
    const [c] = await this.db.select({ total: count() }).from(workOrders).where(where);

    const items = rows.map((r) => ({
      ...rowToWorkOrder(r.wo),
      destaque: Boolean(r.destaque),
      empresa: r.empresaVisivel && r.empresaNome ? { nome: r.empresaNome } : null,
    }));
    return { items, total: c?.total ?? 0 };
  }

  async listForContractor(contractorId: string): Promise<WorkOrder[]> {
    // Mesmo enriquecimento da descoberta: a empresa vê o próprio destaque e a
    // identidade nas obras dela (reassegura o valor do plano que ela paga).
    const planoVigente = sql`${contractorProfiles.planoExpiraEm} is not null and ${contractorProfiles.planoExpiraEm} > now()`;
    const destaque = sql<boolean>`(${users.tipo} = 'EMPRESA' and ${contractorProfiles.plano} = 'LANCE' and ${planoVigente})`;
    const empresaVisivel = sql<boolean>`(${users.tipo} = 'EMPRESA' and ${contractorProfiles.plano} in ('COMPLETO','LANCE') and ${planoVigente})`;
    const rows = await this.db
      .select({
        wo: workOrders,
        destaque,
        empresaVisivel,
        empresaNome: sql<string | null>`coalesce(${companyProfiles.nomeFantasia}, ${companyProfiles.razaoSocial})`,
      })
      .from(workOrders)
      .leftJoin(users, eq(users.id, workOrders.contractorId))
      .leftJoin(contractorProfiles, eq(contractorProfiles.userId, workOrders.contractorId))
      .leftJoin(companyProfiles, eq(companyProfiles.userId, workOrders.contractorId))
      .where(eq(workOrders.contractorId, contractorId))
      .orderBy(desc(workOrders.criadoEm));
    return rows.map((r) => ({
      ...rowToWorkOrder(r.wo),
      destaque: Boolean(r.destaque),
      empresa: r.empresaVisivel && r.empresaNome ? { nome: r.empresaNome } : null,
    }));
  }

  async listWonByProfessional(professionalId: string): Promise<WorkOrder[]> {
    const rows = await this.db
      .select({ wo: workOrders })
      .from(workOrders)
      .innerJoin(proposals, eq(proposals.workOrderId, workOrders.id))
      .where(and(eq(proposals.professionalId, professionalId), eq(proposals.status, "ACEITA")))
      .orderBy(desc(workOrders.criadoEm));
    return rows.map((r) => rowToWorkOrder(r.wo));
  }

  async transitionStatus(
    id: string,
    from: WorkOrderStatus,
    to: WorkOrderStatus,
  ): Promise<WorkOrder | null> {
    const [row] = await this.db
      .update(workOrders)
      .set({ status: to, atualizadoEm: new Date() })
      .where(and(eq(workOrders.id, id), eq(workOrders.status, from)))
      .returning();
    return row ? rowToWorkOrder(row) : null;
  }

  async adjudicate(
    orderId: string,
    proposalId: string,
  ): Promise<{ order: WorkOrder; proposal: Proposal } | null> {
    return this.db.transaction(async (tx) => {
      // Transição guardada DENTRO da tx: se a obra não está mais ABERTA, aborta tudo.
      const [orderRow] = await tx
        .update(workOrders)
        .set({ status: "ADJUDICADA", atualizadoEm: new Date() })
        .where(and(eq(workOrders.id, orderId), eq(workOrders.status, "ABERTA")))
        .returning();
      if (!orderRow) return null;

      const [proposalRow] = await tx
        .update(proposals)
        .set({ status: "ACEITA", atualizadoEm: new Date() })
        .where(eq(proposals.id, proposalId))
        .returning();
      if (!proposalRow) {
        // Lance sumiu no meio do caminho — o throw aborta a tx inteira
        // (a transição da obra é desfeita junto).
        throw new Error("Lance não encontrado durante a adjudicação.");
      }

      await tx
        .update(proposals)
        .set({ status: "RECUSADA", atualizadoEm: new Date() })
        .where(
          and(
            eq(proposals.workOrderId, orderId),
            ne(proposals.id, proposalId),
            eq(proposals.status, "ENVIADA"),
          ),
        );

      return { order: rowToWorkOrder(orderRow), proposal: rowToProposal(proposalRow) };
    });
  }

  async setFoto(id: string, url: string): Promise<WorkOrder | null> {
    const [row] = await this.db
      .update(workOrders)
      .set({ fotoUrl: url, atualizadoEm: new Date() })
      .where(eq(workOrders.id, id))
      .returning();
    return row ? rowToWorkOrder(row) : null;
  }

  async setPiso(id: string, pisoCentavos: number | null): Promise<void> {
    await this.db
      .update(workOrders)
      .set({ pisoCentavos, atualizadoEm: new Date() })
      .where(eq(workOrders.id, id));
  }

  async listEarlyNotifyTargets(
    especialidade: string,
    cidadeId: string,
    limit: number,
  ): Promise<{ userId: string }[]> {
    // Plano no perfil é sincronizado pelo billing (PlanSyncPort) — ESPECIALISTA
    // aqui = assinatura vigente. GIN `@>` no array de especialidades.
    const rows = await this.db
      .select({ userId: professionalProfiles.userId })
      .from(professionalProfiles)
      .innerJoin(users, eq(users.id, professionalProfiles.userId))
      .where(
        and(
          eq(professionalProfiles.plano, "ESPECIALISTA"),
          eq(users.status, "ATIVO"),
          eq(users.cidadeId, cidadeId),
          sql`${professionalProfiles.especialidades} @> ARRAY[${especialidade}]::text[]`,
        ),
      )
      .limit(limit);
    return rows;
  }

  async companyReport(contractorId: string): Promise<CompanyReport> {
    // Agregado read-only (mesma receita do admin/metrics): contagens por status,
    // propostas recebidas e indicadores das contratações (lances ACEITA).
    const [obras] = await this.db
      .select({
        total: count(),
        abertas: sql<number>`count(*) filter (where ${workOrders.status} = 'ABERTA')::int`,
        emAndamento: sql<number>`count(*) filter (where ${workOrders.status} = 'ADJUDICADA')::int`,
        concluidas: sql<number>`count(*) filter (where ${workOrders.status} = 'CONCLUIDA')::int`,
        encerradas: sql<number>`count(*) filter (where ${workOrders.status} in ('CANCELADA','EXPIRADA'))::int`,
      })
      .from(workOrders)
      .where(eq(workOrders.contractorId, contractorId));

    const [props] = await this.db
      .select({
        recebidas: count(),
        aceitas: sql<number>`count(*) filter (where ${proposals.status} = 'ACEITA')::int`,
        valorTotal: sql<number>`coalesce(sum(${proposals.valorCentavos}) filter (where ${proposals.status} = 'ACEITA'), 0)::bigint`,
        tempoMedioHoras: sql<
          number | null
        >`avg(extract(epoch from (${proposals.atualizadoEm} - ${workOrders.criadoEm})) / 3600) filter (where ${proposals.status} = 'ACEITA')`,
      })
      .from(proposals)
      .innerJoin(workOrders, eq(workOrders.id, proposals.workOrderId))
      .where(eq(workOrders.contractorId, contractorId));

    const top = await this.db
      .select({ especialidade: workOrders.especialidade, total: count() })
      .from(workOrders)
      .where(eq(workOrders.contractorId, contractorId))
      .groupBy(workOrders.especialidade)
      .orderBy(desc(count()))
      .limit(5);

    const totalObras = obras?.total ?? 0;
    const recebidas = props?.recebidas ?? 0;
    const aceitas = props?.aceitas ?? 0;
    const valorTotal = Number(props?.valorTotal ?? 0);
    return {
      obras: {
        total: totalObras,
        abertas: obras?.abertas ?? 0,
        emAndamento: obras?.emAndamento ?? 0,
        concluidas: obras?.concluidas ?? 0,
        encerradasSemContratacao: obras?.encerradas ?? 0,
      },
      propostas: {
        recebidas,
        mediaPorObra: totalObras > 0 ? Math.round((recebidas / totalObras) * 10) / 10 : 0,
      },
      contratacoes: {
        total: aceitas,
        valorTotalCentavos: valorTotal,
        valorMedioCentavos: aceitas > 0 ? Math.round(valorTotal / aceitas) : 0,
        tempoMedioAteContratarHoras:
          props?.tempoMedioHoras === null || props?.tempoMedioHoras === undefined
            ? null
            : Math.round(Number(props.tempoMedioHoras) * 10) / 10,
      },
      topEspecialidades: top.map((t) => ({ especialidade: t.especialidade, total: t.total })),
    };
  }
}
