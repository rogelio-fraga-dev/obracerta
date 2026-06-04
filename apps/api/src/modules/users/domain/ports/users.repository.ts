import type { User, CreateUserInput } from "@obracerta/shared";

/**
 * Porta de saída (hexagonal) do domínio de usuários. A aplicação depende desta
 * interface, nunca da implementação concreta (Drizzle/Postgres). Trocar o
 * mecanismo de persistência não afeta a regra de negócio.
 */
export interface UsersRepository {
  create(input: CreateUserInput): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByWhatsapp(whatsapp: string): Promise<User | null>;
}

/** Token de DI para a porta (a interface some no runtime; o Symbol não). */
export const USERS_REPOSITORY = Symbol("USERS_REPOSITORY");
