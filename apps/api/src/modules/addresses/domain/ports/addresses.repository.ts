import type { Address, CreateAddressInput, UpdateAddressInput } from "@obracerta/shared";

/** Porta de saída para os endereços salvos do usuário. */
export interface AddressesRepository {
  listForUser(userId: string): Promise<Address[]>;
  findById(id: string): Promise<Address | null>;
  countForUser(userId: string): Promise<number>;
  create(userId: string, data: CreateAddressInput): Promise<Address>;
  update(id: string, patch: UpdateAddressInput): Promise<Address | null>;
  delete(id: string): Promise<void>;
  /** Zera o `principal` de todos os endereços do usuário (antes de eleger outro). */
  clearPrincipal(userId: string): Promise<void>;
  setPrincipal(id: string): Promise<Address | null>;
}

export const ADDRESSES_REPOSITORY = Symbol("ADDRESSES_REPOSITORY");
