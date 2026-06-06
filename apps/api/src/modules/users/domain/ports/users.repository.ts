import type { User, CreateUserInput } from "@obracerta/shared";

/**
 * Porta de saída (hexagonal) do domínio de usuários. A aplicação depende desta
 * interface, nunca da implementação concreta (Drizzle/Postgres). Trocar o
 * mecanismo de persistência não afeta a regra de negócio.
 */
/** Dados aceitos na criação: contrato público + cidade (FK opcional). */
export type CreateUserData = CreateUserInput & { cidadeId?: string };

export interface UsersRepository {
  create(input: CreateUserData): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByWhatsapp(whatsapp: string): Promise<User | null>;
  /** Papéis administrativos do usuário (Fase 6). `null` se o usuário não existe. */
  findRoles(id: string): Promise<string[] | null>;
  /** Substitui o conjunto de papéis do usuário (idempotente). */
  setRoles(id: string, roles: string[]): Promise<void>;
}

/** Token de DI para a porta (a interface some no runtime; o Symbol não). */
export const USERS_REPOSITORY = Symbol("USERS_REPOSITORY");
