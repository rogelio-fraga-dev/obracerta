import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { User } from "@obracerta/shared";
import {
  USERS_REPOSITORY,
  type CreateUserData,
  type UsersRepository,
} from "../domain/ports/users.repository.js";

/**
 * Casos de uso de usuário. Orquestra o domínio sobre a porta `UsersRepository`
 * (interface), sem conhecer Drizzle/Postgres. A validação de input acontece na
 * borda HTTP (DTO Zod, fatia 1.2); aqui ficam as regras de aplicação.
 */
@Injectable()
export class UsersService {
  constructor(@Inject(USERS_REPOSITORY) private readonly users: UsersRepository) {}

  /** Cria um usuário, garantindo unicidade de WhatsApp (regra de aplicação). */
  async create(input: CreateUserData): Promise<User> {
    const existing = await this.users.findByWhatsapp(input.whatsapp);
    if (existing) {
      throw new ConflictException("Já existe um usuário com este WhatsApp.");
    }
    return this.users.create(input);
  }

  findByWhatsapp(whatsapp: string): Promise<User | null> {
    return this.users.findByWhatsapp(whatsapp);
  }

  findById(id: string): Promise<User | null> {
    return this.users.findById(id);
  }

  /** Papéis administrativos do usuário (vazio se não tem ou não existe). */
  async getRoles(id: string): Promise<string[]> {
    return (await this.users.findRoles(id)) ?? [];
  }

  /** Define os papéis do usuário (ação ADMIN); 404 se o usuário não existe. */
  async setRoles(id: string, roles: string[]): Promise<void> {
    const existing = await this.users.findRoles(id);
    if (existing === null) {
      throw new NotFoundException("Usuário não encontrado.");
    }
    await this.users.setRoles(id, roles);
  }
}
