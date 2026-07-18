import type { Purchase } from "@obracerta/shared";

/** Dados para registrar uma compra avulsa (status inicial PENDENTE). */
export interface CreatePurchaseData {
  userId: string;
  plano: string;
  gateway: string;
  gatewayId: string;
  valorCentavos: number;
}

/** Porta de saída dos planos de acesso (assinatura mensal de contratante/empresa). */
export interface PurchaseRepository {
  create(data: CreatePurchaseData): Promise<Purchase>;
  findById(id: string): Promise<Purchase | null>;
  /**
   * Plano vigente mais recente do usuário: ATIVO ou CANCELADO com vigência restante
   * (cancelar interrompe a renovação, não o período já pago). O prazo (`expiraEm`)
   * é avaliado no service.
   */
  findActiveByUser(userId: string): Promise<Purchase | null>;
  /** Marca como ATIVO e define a expiração (após confirmação do pagamento). */
  activate(id: string, expiraEm: string): Promise<Purchase | null>;
  /** Expira a compra ATIVO → EXPIRADO (job de expiração / estorno). Guardado. */
  expire(id: string): Promise<Purchase | null>;
  /** Cancela a renovação: ATIVO → CANCELADO (acesso segue até `expiraEm`). Guardado. */
  cancel(id: string): Promise<Purchase | null>;
}

export const PURCHASE_REPOSITORY = Symbol("PURCHASE_REPOSITORY");
