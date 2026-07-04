import { Inject, Injectable } from "@nestjs/common";
import { count, desc, eq } from "drizzle-orm";
import type { Address, CreateAddressInput, UpdateAddressInput, UF } from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { addresses } from "../../../infrastructure/database/schema/addresses.js";
import type { AddressesRepository } from "../domain/ports/addresses.repository.js";

type AddressRow = typeof addresses.$inferSelect;

export function rowToAddress(row: AddressRow): Address {
  return {
    id: row.id,
    userId: row.userId,
    apelido: row.apelido,
    cep: row.cep,
    logradouro: row.logradouro,
    numero: row.numero,
    complemento: row.complemento,
    bairro: row.bairro,
    cidade: row.cidade,
    uf: row.uf as UF,
    principal: row.principal,
    criadoEm: row.criadoEm.toISOString(),
    atualizadoEm: row.atualizadoEm.toISOString(),
  };
}

@Injectable()
export class DrizzleAddressesRepository implements AddressesRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async listForUser(userId: string): Promise<Address[]> {
    const rows = await this.db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, userId))
      .orderBy(desc(addresses.principal), desc(addresses.criadoEm));
    return rows.map(rowToAddress);
  }

  async findById(id: string): Promise<Address | null> {
    const [row] = await this.db.select().from(addresses).where(eq(addresses.id, id)).limit(1);
    return row ? rowToAddress(row) : null;
  }

  async countForUser(userId: string): Promise<number> {
    const [row] = await this.db
      .select({ total: count() })
      .from(addresses)
      .where(eq(addresses.userId, userId));
    return row?.total ?? 0;
  }

  async create(userId: string, data: CreateAddressInput): Promise<Address> {
    const [row] = await this.db
      .insert(addresses)
      .values({
        userId,
        apelido: data.apelido,
        cep: data.cep,
        logradouro: data.logradouro,
        numero: data.numero ?? null,
        complemento: data.complemento ?? null,
        bairro: data.bairro ?? null,
        cidade: data.cidade,
        uf: data.uf,
        principal: data.principal ?? false,
      })
      .returning();
    if (!row) throw new Error("Falha ao salvar o endereço.");
    return rowToAddress(row);
  }

  async update(id: string, patch: UpdateAddressInput): Promise<Address | null> {
    const [row] = await this.db
      .update(addresses)
      .set({
        ...(patch.apelido !== undefined ? { apelido: patch.apelido } : {}),
        ...(patch.cep !== undefined ? { cep: patch.cep } : {}),
        ...(patch.logradouro !== undefined ? { logradouro: patch.logradouro } : {}),
        ...(patch.numero !== undefined ? { numero: patch.numero ?? null } : {}),
        ...(patch.complemento !== undefined ? { complemento: patch.complemento ?? null } : {}),
        ...(patch.bairro !== undefined ? { bairro: patch.bairro ?? null } : {}),
        ...(patch.cidade !== undefined ? { cidade: patch.cidade } : {}),
        ...(patch.uf !== undefined ? { uf: patch.uf } : {}),
        atualizadoEm: new Date(),
      })
      .where(eq(addresses.id, id))
      .returning();
    return row ? rowToAddress(row) : null;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(addresses).where(eq(addresses.id, id));
  }

  async clearPrincipal(userId: string): Promise<void> {
    await this.db
      .update(addresses)
      .set({ principal: false, atualizadoEm: new Date() })
      .where(eq(addresses.userId, userId));
  }

  async setPrincipal(id: string): Promise<Address | null> {
    const [row] = await this.db
      .update(addresses)
      .set({ principal: true, atualizadoEm: new Date() })
      .where(eq(addresses.id, id))
      .returning();
    return row ? rowToAddress(row) : null;
  }
}
