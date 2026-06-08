import type { User, CreateUserInput } from "@obracerta/shared";

/**
 * Porta de saída (hexagonal) do domínio de usuários. A aplicação depende desta
 * interface, nunca da implementação concreta (Drizzle/Postgres). Trocar o
 * mecanismo de persistência não afeta a regra de negócio.
 */
/** Dados aceitos na criação: contrato público + cidade (FK opcional) + hash de senha. */
export type CreateUserData = CreateUserInput & { cidadeId?: string; senhaHash?: string };

/** Credenciais para login por e-mail+senha: usuário + hash armazenado (pode ser null). */
export interface UserCredentials {
  user: User;
  senhaHash: string | null;
}

export interface UsersRepository {
  create(input: CreateUserData): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByWhatsapp(whatsapp: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  findAllPaginated(limit: number, offset: number): Promise<{ items: User[], total: number }>;
  /** Usuário + hash de senha por e-mail (login "conta normal"). `null` se não existe. */
  findCredentialsByEmail(email: string): Promise<UserCredentials | null>;
  /** Papéis administrativos do usuário (Fase 6). `null` se o usuário não existe. */
  findRoles(id: string): Promise<string[] | null>;
  /** Substitui o conjunto de papéis do usuário (idempotente). */
  setRoles(id: string, roles: string[]): Promise<void>;
  /** Atualiza o status da conta (ATIVO/SUSPENSO/REMOVIDO) — denormalização da moderação. */
  setStatus(id: string, status: string): Promise<void>;
  updateProfile(id: string, data: { nomeCompleto?: string; email?: string }): Promise<User | null>;
  setFotoUrl(id: string, url: string): Promise<User | null>;
  updatePasswordHash(id: string, hash: string): Promise<void>;
}

/** Token de DI para a porta (a interface some no runtime; o Symbol não). */
export const USERS_REPOSITORY = Symbol("USERS_REPOSITORY");
