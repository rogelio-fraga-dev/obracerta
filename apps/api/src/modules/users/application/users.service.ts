import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { PaginatedResponse, User } from "@obracerta/shared";
import {
  USERS_REPOSITORY,
  type CreateUserData,
  type UsersRepository,
} from "../domain/ports/users.repository.js";
import { STORAGE_PORT, type StoragePort } from "../../storage/domain/storage.port.js";
import { IMAGE_MIME, sniffImageExt } from "../../../common/uploads/image-upload.js";

/**
 * Casos de uso de usuário. Orquestra o domínio sobre a porta `UsersRepository`
 * (interface), sem conhecer Drizzle/Postgres. A validação de input acontece na
 * borda HTTP (DTO Zod, fatia 1.2); aqui ficam as regras de aplicação.
 */
@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY) private readonly users: UsersRepository,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
  ) {}

  /** Cria um usuário, garantindo unicidade de WhatsApp e e-mail (regra de aplicação). */
  async create(input: CreateUserData): Promise<User> {
    const byWhats = await this.users.findByWhatsapp(input.whatsapp);
    if (byWhats) throw new ConflictException("WhatsApp já cadastrado");

    if (input.email) {
      const byEmail = await this.users.findByEmail(input.email);
      if (byEmail) throw new ConflictException("E-mail já cadastrado");
    }

    return this.users.create(input);
  }

  async createAdmin(input: { nomeCompleto: string; whatsapp: string; email?: string; password?: string }): Promise<User> {
    const user = await this.create({
      nomeCompleto: input.nomeCompleto,
      whatsapp: input.whatsapp,
      email: input.email,
      tipo: "CONTRATANTE",
    });

    if (input.password) {
      const { hashPassword } = await import("../../auth/domain/password.js");
      const hash = await hashPassword(input.password);
      await this.users.updatePasswordHash(user.id, hash);
    }

    await this.users.setRoles(user.id, ["ADMIN"]);
    return user;
  }

  findByWhatsapp(whatsapp: string): Promise<User | null> {
    return this.users.findByWhatsapp(whatsapp);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.users.findByEmail(email);
  }

  /** Usuário + hash de senha por e-mail (consumido pelo login "conta normal"). */
  findCredentialsByEmail(email: string) {
    return this.users.findCredentialsByEmail(email);
  }

  findById(id: string): Promise<User | null> {
    return this.users.findById(id);
  }

  /** Vários usuários numa única query (anexar contrapartes em listas). */
  findByIds(ids: string[]): Promise<User[]> {
    return this.users.findByIds(ids);
  }

  findAll(): Promise<User[]> {
    return this.users.findAll();
  }

  async findAllPaginated(page: number, limit: number): Promise<PaginatedResponse<User>> {
    const offset = (page - 1) * limit;
    const { items, total } = await this.users.findAllPaginated(limit, offset);
    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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

  /** Atualiza o status da conta (usado pela moderação para suspender/reativar). */
  setStatus(id: string, status: string): Promise<void> {
    return this.users.setStatus(id, status);
  }

  async updateProfile(id: string, data: { nomeCompleto?: string; email?: string }): Promise<User> {
    // garante unicidade de e-mail antes de gravar (evita 500 por violação de constraint)
    if (data.email) {
      const byEmail = await this.users.findByEmail(data.email);
      if (byEmail && byEmail.id !== id) throw new ConflictException("E-mail já cadastrado");
    }
    const updated = await this.users.updateProfile(id, data);
    if (!updated) throw new NotFoundException("Usuário não encontrado");
    return updated;
  }

  async updatePasswordHash(id: string, hash: string): Promise<void> {
    await this.users.updatePasswordHash(id, hash);
  }

  async setFoto(id: string, url: string): Promise<User> {
    const updated = await this.users.setFotoUrl(id, url);
    if (!updated) throw new NotFoundException("Usuário não encontrado");
    return updated;
  }

  async uploadFoto(
    id: string,
    file: { buffer: Buffer; mimetype: string },
  ): Promise<User> {
    // Valida o CONTEÚDO (magic bytes), não o mimetype do cliente (falsificável).
    const ext = sniffImageExt(file.buffer);
    if (!ext) throw new BadRequestException("Formato inválido. Use JPEG, PNG ou WebP.");
    const key = `users/${id}/foto-${Date.now()}.${ext}`;
    const url = await this.storage.putObject(key, file.buffer, IMAGE_MIME[ext]);
    return this.setFoto(id, url);
  }

  listAdmins(): Promise<User[]> {
    return this.users.findAdmins();
  }
}
