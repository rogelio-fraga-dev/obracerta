import type { Purchase } from "@obracerta/shared";

/** Dados para registrar uma compra avulsa (status inicial PENDENTE). */
export interface CreatePurchaseData {
  userId: string;
  plano: string;
  gateway: string;
  gatewayId: string;
  valorCentavos: number;
}

/** Porta de saída das compras avulsas. */
export interface PurchaseRepository {
  create(data: CreatePurchaseData): Promise<Purchase>;
  findById(id: string): Promise<Purchase | null>;
  /** Marca como ATIVO e define a expiração (após confirmação do pagamento). */
  activate(id: string, expiraEm: string): Promise<Purchase | null>;
}

export const PURCHASE_REPOSITORY = Symbol("PURCHASE_REPOSITORY");
