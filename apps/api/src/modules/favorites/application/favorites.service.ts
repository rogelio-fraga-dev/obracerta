import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { SearchResult } from "@obracerta/shared";
import {
  FAVORITES_REPOSITORY,
  type FavoritesRepository,
} from "../domain/ports/favorites.repository.js";

@Injectable()
export class FavoritesService {
  constructor(@Inject(FAVORITES_REPOSITORY) private readonly repo: FavoritesRepository) {}

  /** Favorita um profissional (idempotente; alvo precisa ter perfil profissional). */
  async add(userId: string, professionalId: string): Promise<void> {
    const exists = await this.repo.professionalExists(professionalId);
    if (!exists) throw new NotFoundException("Profissional não encontrado.");
    await this.repo.add(userId, professionalId);
  }

  remove(userId: string, professionalId: string): Promise<void> {
    return this.repo.remove(userId, professionalId);
  }

  list(userId: string): Promise<SearchResult[]> {
    return this.repo.listProfessionals(userId);
  }

  ids(userId: string): Promise<string[]> {
    return this.repo.idsForUser(userId);
  }
}
