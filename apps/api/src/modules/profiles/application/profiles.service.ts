import { Inject, Injectable } from "@nestjs/common";
import type {
  User,
  ProfessionalProfile,
  ContractorProfile,
  UpdateProfessionalProfileInput,
} from "@obracerta/shared";
import { UserType } from "@obracerta/shared";
import { slugify, slugWithSuffix } from "../domain/slug.js";
import { PROFILES_REPOSITORY, type ProfilesRepository } from "../domain/ports/profiles.repository.js";

const MAX_SLUG_ATTEMPTS = 50;

@Injectable()
export class ProfilesService {
  constructor(@Inject(PROFILES_REPOSITORY) private readonly profiles: ProfilesRepository) {}

  /** Cria o perfil correspondente ao tipo do usuário (chamado no cadastro). */
  async createForUser(user: User): Promise<ProfessionalProfile | ContractorProfile> {
    if (user.tipo === UserType.PROFISSIONAL) {
      const slug = await this.generateUniqueSlug(user.nomeCompleto);
      return this.profiles.createProfessional(user.id, slug);
    }
    return this.profiles.createContractor(user.id);
  }

  /** Resolve colisão de slug incrementando sufixo até achar um livre. */
  async generateUniqueSlug(nome: string): Promise<string> {
    const base = slugify(nome);
    for (let n = 1; n <= MAX_SLUG_ATTEMPTS; n++) {
      const candidate = slugWithSuffix(base, n);
      if (!(await this.profiles.slugExists(candidate))) {
        return candidate;
      }
    }
    // fallback altamente improvável: sufixo aleatório
    return slugWithSuffix(base, Date.now() % 100_000);
  }

  getProfessional(userId: string): Promise<ProfessionalProfile | null> {
    return this.profiles.findProfessionalByUserId(userId);
  }

  getProfessionalBySlug(slug: string): Promise<ProfessionalProfile | null> {
    return this.profiles.findProfessionalBySlug(slug);
  }

  updateProfessional(
    userId: string,
    patch: UpdateProfessionalProfileInput,
  ): Promise<ProfessionalProfile | null> {
    return this.profiles.updateProfessional(userId, patch);
  }
}
