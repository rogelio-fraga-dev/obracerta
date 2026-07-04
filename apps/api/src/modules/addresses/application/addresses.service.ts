import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Address, CreateAddressInput, UpdateAddressInput } from "@obracerta/shared";
import {
  ADDRESSES_REPOSITORY,
  type AddressesRepository,
} from "../domain/ports/addresses.repository.js";

/** Limite de endereços por usuário (anti-abuso; casa/obra/trabalho já cabem). */
const MAX_ADDRESSES = 10;

@Injectable()
export class AddressesService {
  constructor(@Inject(ADDRESSES_REPOSITORY) private readonly repo: AddressesRepository) {}

  list(userId: string): Promise<Address[]> {
    return this.repo.listForUser(userId);
  }

  /** Cria um endereço. O primeiro do usuário vira `principal` automaticamente. */
  async create(userId: string, input: CreateAddressInput): Promise<Address> {
    const total = await this.repo.countForUser(userId);
    if (total >= MAX_ADDRESSES) {
      throw new BadRequestException(
        `Você já tem o máximo de ${MAX_ADDRESSES} endereços. Remova um para adicionar outro.`,
      );
    }
    const principal = input.principal || total === 0;
    if (principal) await this.repo.clearPrincipal(userId);
    return this.repo.create(userId, { ...input, principal });
  }

  /** Edita um endereço — só o dono. */
  async update(userId: string, id: string, patch: UpdateAddressInput): Promise<Address> {
    await this.getOwned(userId, id);
    const updated = await this.repo.update(id, patch);
    if (!updated) throw new NotFoundException("Endereço não encontrado.");
    return updated;
  }

  /** Elege o endereço principal (único por usuário) — só o dono. */
  async setPrincipal(userId: string, id: string): Promise<Address> {
    await this.getOwned(userId, id);
    await this.repo.clearPrincipal(userId);
    const updated = await this.repo.setPrincipal(id);
    if (!updated) throw new NotFoundException("Endereço não encontrado.");
    return updated;
  }

  /** Remove um endereço — só o dono. */
  async remove(userId: string, id: string): Promise<void> {
    await this.getOwned(userId, id);
    await this.repo.delete(id);
  }

  private async getOwned(userId: string, id: string): Promise<Address> {
    const address = await this.repo.findById(id);
    if (!address) throw new NotFoundException("Endereço não encontrado.");
    if (address.userId !== userId) throw new ForbiddenException("Este endereço não é seu.");
    return address;
  }
}
