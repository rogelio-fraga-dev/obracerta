import type { Address, CreateAddressInput, UpdateAddressInput } from "@obracerta/shared";

/** Porta de saída para os endereços salvos do usuário. */
export interface AddressesRepository {
  listForUser(userId: string): Promise<Address[]>;
  findById(id: string): Promise<Address | null>;
  countForUser(userId: string): Promise<number>;
  /** Cria o endereço; se `principal`, zera os demais NA MESMA transação. */
  create(userId: string, data: CreateAddressInput): Promise<Address>;
  update(id: string, patch: UpdateAddressInput): Promise<Address | null>;
  delete(id: string): Promise<void>;
  /** Elege o principal ATOMICAMENTE (zera os demais + marca este, numa tx). */
  setPrincipal(userId: string, id: string): Promise<Address | null>;
}

export const ADDRESSES_REPOSITORY = Symbol("ADDRESSES_REPOSITORY");
