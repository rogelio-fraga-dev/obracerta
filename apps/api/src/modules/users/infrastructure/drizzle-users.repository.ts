import { Inject, Injectable } from "@nestjs/common";
import { eq, count, inArray, sql } from "drizzle-orm";
import type { User } from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { users } from "../../../infrastructure/database/schema/users.js";
import type {
  CreateUserData,
  UserCredentials,
  UsersRepository,
} from "../domain/ports/users.repository.js";

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
    fotoUrl: row.fotoUrl,
    tipo: row.tipo as User["tipo"],
    status: row.status as User["status"],
    criadoEm: row.criadoEm.toISOString(),
  };
}

/** Adapter Drizzle que implementa a porta `UsersRepository`. */
@Injectable()
export class DrizzleUsersRepository implements UsersRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(input: CreateUserData): Promise<User> {
    const [row] = await this.db
      .insert(users)
      .values({
        nomeCompleto: input.nomeCompleto,
        whatsapp: input.whatsapp,
        email: input.email,
        senhaHash: input.senhaHash,
        tipo: input.tipo,
        cidadeId: input.cidadeId,
      })
      .returning();
    if (!row) {
      throw new Error("Falha ao inserir usuário: nenhuma linha retornada.");
    }
    return rowToUser(row);
  }

  async findById(id: string): Promise<User | null> {
    const res = await this.db.select().from(users).where(eq(users.id, id));
    return res.length > 0 ? rowToUser(res[0]!) : null;
  }

  async findByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];
    const res = await this.db.select().from(users).where(inArray(users.id, ids));
    return res.map(rowToUser);
  }

  async findAll(): Promise<User[]> {
    const rows = await this.db.select().from(users).orderBy(users.criadoEm);
    return rows.map(rowToUser);
  }

  async findAllPaginated(limit: number, offset: number): Promise<{ items: User[], total: number }> {
    const rows = await this.db.select().from(users).orderBy(users.criadoEm).limit(limit).offset(offset);
    const [c] = await this.db.select({ total: count() }).from(users);
    return { items: rows.map(rowToUser), total: c?.total ?? 0 };
  }

  async findByWhatsapp(whatsapp: string): Promise<User | null> {
    const [row] = await this.db.select().from(users).where(eq(users.whatsapp, whatsapp)).limit(1);
    return row ? rowToUser(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [row] = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return row ? rowToUser(row) : null;
  }

  async findCredentialsByEmail(email: string): Promise<UserCredentials | null> {
    const [row] = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return row ? { user: rowToUser(row), senhaHash: row.senhaHash ?? null } : null;
  }

  async findRoles(id: string): Promise<string[] | null> {
    const [row] = await this.db
      .select({ roles: users.roles })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return row ? row.roles : null;
  }

  async setRoles(id: string, roles: string[]): Promise<void> {
    await this.db.update(users).set({ roles }).where(eq(users.id, id));
  }

  async setStatus(id: string, status: string): Promise<void> {
    await this.db
      .update(users)
      .set({ status: status as (typeof users.$inferInsert)["status"] })
      .where(eq(users.id, id));
  }

  async updateProfile(id: string, data: { nomeCompleto?: string; email?: string }): Promise<User | null> {
    const res = await this.db
      .update(users)
      .set({
        ...(data.nomeCompleto ? { nomeCompleto: data.nomeCompleto } : {}),
        ...(data.email ? { email: data.email } : {}),
      })
      .where(eq(users.id, id))
      .returning();
    return res.length > 0 ? rowToUser(res[0]!) : null;
  }

  async setFotoUrl(id: string, url: string): Promise<User | null> {
    const res = await this.db
      .update(users)
      .set({ fotoUrl: url })
      .where(eq(users.id, id))
      .returning();
    // A foto da conta é a mesma exibida na busca e no perfil público, que leem
    // `professional_profiles.foto_url` — espelha para manter as duas em sincronia.
    await this.db.execute(
      sql`update professional_profiles set foto_url = ${url} where user_id = ${id}`,
    );
    return res.length > 0 ? rowToUser(res[0]!) : null;
  }

  async updatePasswordHash(id: string, hash: string): Promise<void> {
    await this.db
      .update(users)
      .set({ senhaHash: hash })
      .where(eq(users.id, id));
  }

  async findAdmins(): Promise<User[]> {
    const rows = await this.db
      .select()
      .from(users)
      .where(sql`'ADMIN' = any(${users.roles})`);
    return rows.map(rowToUser);
  }
}
