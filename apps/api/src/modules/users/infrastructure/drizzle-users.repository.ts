import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import type { User, CreateUserInput } from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { users } from "../../../infrastructure/database/schema/users.js";
import type { UsersRepository } from "../domain/ports/users.repository.js";

/** Linha crua da tabela `users` (o que o Drizzle devolve no `select`). */
type UserRow = typeof users.$inferSelect;

/**
 * Converte a linha do banco no contrato público `User` (@obracerta/shared).
 * Função PURA (sem I/O) de propósito — fácil de testar sem banco. Note que
 * `cpf` e `cidadeId` NÃO entram no contrato público (LGPD, roadmap §9).
 */
export function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    nomeCompleto: row.nomeCompleto,
    whatsapp: row.whatsapp,
    email: row.email ?? undefined,
    tipo: row.tipo as User["tipo"],
    status: row.status as User["status"],
    criadoEm: row.criadoEm.toISOString(),
  };
}

/** Adapter Drizzle que implementa a porta `UsersRepository`. */
@Injectable()
export class DrizzleUsersRepository implements UsersRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(input: CreateUserInput): Promise<User> {
    const [row] = await this.db
      .insert(users)
      .values({
        nomeCompleto: input.nomeCompleto,
        whatsapp: input.whatsapp,
        email: input.email,
        tipo: input.tipo,
      })
      .returning();
    if (!row) {
      throw new Error("Falha ao inserir usuário: nenhuma linha retornada.");
    }
    return rowToUser(row);
  }

  async findById(id: string): Promise<User | null> {
    const [row] = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return row ? rowToUser(row) : null;
  }

  async findByWhatsapp(whatsapp: string): Promise<User | null> {
    const [row] = await this.db.select().from(users).where(eq(users.whatsapp, whatsapp)).limit(1);
    return row ? rowToUser(row) : null;
  }
}
