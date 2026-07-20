import type { CompanyReport, Proposal, WorkOrder, WorkOrderStatus } from "@obracerta/shared";

/** Dados para abrir uma obra (status inicial ABERTA; expira_em já calculado). */
export interface CreateWorkOrderData {
  contractorId: string;
  cidadeId: string;
  especialidade: string;
  subServico: string | null;
  titulo: string;
  descricao: string | null;
  urgencia: string;
  bairro: string | null;
  geo: { lng: number; lat: number } | null;
  expiraEm: string; // ISO
}

/** Filtros + paginação da descoberta de obras abertas. */
export interface ListOpenWorkOrdersFilters {
  cidadeId: string | null;
  especialidade: string | null;
  limit: number;
  offset: number;
}

/** Página de obras + total. */
export interface WorkOrderPage {
  items: WorkOrder[];
  total: number;
}

/** Porta de saída das obras. */
export interface WorkOrderRepository {
  create(data: CreateWorkOrderData): Promise<WorkOrder>;
  findById(id: string): Promise<WorkOrder | null>;
  findAll(): Promise<WorkOrder[]>;
  findAllPaginated(limit: number, offset: number): Promise<{ items: WorkOrder[], total: number }>;
  listOpen(filters: ListOpenWorkOrdersFilters): Promise<WorkOrderPage>;
  /** Obras de um contratante (todos os status), mais recentes primeiro. */
  listForContractor(contractorId: string): Promise<WorkOrder[]>;
  /** Obras adjudicadas a um profissional (lance ACEITA) — as que ele venceu. */
  listWonByProfessional(professionalId: string): Promise<WorkOrder[]>;
  /** Transição guardada de status (só muda se o status atual for `from`). */
  transitionStatus(id: string, from: WorkOrderStatus, to: WorkOrderStatus): Promise<WorkOrder | null>;
  /**
   * Adjudica ATOMICAMENTE: obra ABERTA→ADJUDICADA + lance→ACEITA + demais
   * ENVIADA→RECUSADA, numa única transação (crash no meio não deixa a obra
   * adjudicada com concorrentes pendentes). `null` = a obra não estava ABERTA.
   */
  adjudicate(
    orderId: string,
    proposalId: string,
  ): Promise<{ order: WorkOrder; proposal: Proposal } | null>;
  /** Persiste a URL da foto ilustrativa da obra. */
  setFoto(id: string, url: string): Promise<WorkOrder | null>;
  /** Atualiza o piso de dignidade (recalculado a cada lance). */
  setPiso(id: string, pisoCentavos: number | null): Promise<void>;
  /**
   * Especialistas ativos da cidade que atendem a especialidade — alvos da
   * notificação "em primeira mão" (homologação 18/07). Limitado (anti-spam).
   */
  listEarlyNotifyTargets(
    especialidade: string,
    cidadeId: string,
    limit: number,
  ): Promise<{ userId: string }[]>;
  /** Relatório da operação de uma empresa (agregado read-only das obras dela). */
  companyReport(contractorId: string): Promise<CompanyReport>;
}

export const WORK_ORDER_REPOSITORY = Symbol("WORK_ORDER_REPOSITORY");
