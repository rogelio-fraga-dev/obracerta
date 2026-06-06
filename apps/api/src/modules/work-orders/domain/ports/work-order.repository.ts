import type { WorkOrder, WorkOrderStatus } from "@obracerta/shared";

/** Dados para abrir uma obra (status inicial ABERTA; expira_em já calculado). */
export interface CreateWorkOrderData {
  contractorId: string;
  cidadeId: string;
  especialidade: string;
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
  listOpen(filters: ListOpenWorkOrdersFilters): Promise<WorkOrderPage>;
  /** Transição guardada de status (só muda se o status atual for `from`). */
  transitionStatus(id: string, from: WorkOrderStatus, to: WorkOrderStatus): Promise<WorkOrder | null>;
  /** Atualiza o piso de dignidade (recalculado a cada lance). */
  setPiso(id: string, pisoCentavos: number | null): Promise<void>;
}

export const WORK_ORDER_REPOSITORY = Symbol("WORK_ORDER_REPOSITORY");
