import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import type {
  User,
  ProfessionalProfile,
  ContractorProfile,
  CompanyProfile,
  UpdateProfessionalProfileInput,
} from "@obracerta/shared";
import { UserType } from "@obracerta/shared";
import { STORAGE_PORT, type StoragePort } from "../../storage/domain/storage.port.js";
import { buildChecklist, type ChecklistItem } from "../../onboarding/domain/onboarding.js";
import { slugify, slugWithSuffix } from "../domain/slug.js";
import { computeProfessionalCompletude } from "../domain/completude.js";
import {
  PROFILES_REPOSITORY,
  type CompanyInfo,
  type ProfilesRepository,
} from "../domain/ports/profiles.repository.js";

const MAX_SLUG_ATTEMPTS = 50;
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

@Injectable()
export class ProfilesService {
  constructor(
    @Inject(PROFILES_REPOSITORY) private readonly profiles: ProfilesRepository,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
  ) {}

  /** Cria o perfil correspondente ao tipo do usuário (chamado no cadastro). */
  async createForUser(
    user: User,
  ): Promise<ProfessionalProfile | ContractorProfile | CompanyProfile> {
    if (user.tipo === UserType.PROFISSIONAL) {
      const slug = await this.generateUniqueSlug(user.nomeCompleto);
      return this.profiles.createProfessional(user.id, slug);
    }
    if (user.tipo === UserType.EMPRESA) {
      return this.profiles.createCompany(user.id);
    }
    return this.profiles.createContractor(user.id);
  }

  /** Perfil de empresa (CNPJ + razão social) do usuário EMPRESA. */
  getCompany(userId: string): Promise<CompanyProfile | null> {
    return this.profiles.findCompanyByUserId(userId);
  }

  /** Define/atualiza os dados da empresa (no cadastro ou na edição do perfil). */
  setCompanyInfo(userId: string, info: CompanyInfo): Promise<CompanyProfile | null> {
    return this.profiles.setCompanyInfo(userId, info);
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

  /** Checklist de onboarding derivado do estado do perfil profissional. */
  async getChecklist(userId: string): Promise<{ items: ChecklistItem[]; completudePct: number }> {
    const profile = await this.profiles.findProfessionalByUserId(userId);
    const completudePct = profile?.completudePct ?? 0;
    const items = buildChecklist({
      temPerfil: Boolean(profile),
      temEspecialidades: (profile?.especialidades.length ?? 0) > 0,
      temFoto: Boolean(profile?.fotoUrl),
      completudePct,
    });
    return { items, completudePct };
  }

  async updateProfessional(
    userId: string,
    patch: UpdateProfessionalProfileInput,
  ): Promise<ProfessionalProfile | null> {
    const updated = await this.profiles.updateProfessional(userId, patch);
    return updated ? this.recompute(updated) : null;
  }

  /** Define a foto e recalcula a completude. */
  async setFoto(userId: string, url: string): Promise<ProfessionalProfile | null> {
    const updated = await this.profiles.setFotoUrl(userId, url);
    return updated ? this.recompute(updated) : null;
  }

  /** Faz upload da foto para o storage e persiste a URL no perfil. */
  async uploadFoto(
    userId: string,
    file: { buffer: Buffer; mimetype: string },
  ): Promise<ProfessionalProfile | null> {
    const ext = ALLOWED_IMAGE_TYPES[file.mimetype];
    if (!ext) {
      throw new BadRequestException("Formato inválido. Use JPEG, PNG ou WebP.");
    }
    const key = `profiles/${userId}/foto-${Date.now()}.${ext}`;
    const url = await this.storage.putObject(key, file.buffer, file.mimetype);
    return this.setFoto(userId, url);
  }

  /** Recalcula `completudePct` e persiste se mudou; devolve o perfil coerente. */
  private async recompute(profile: ProfessionalProfile): Promise<ProfessionalProfile> {
    const pct = computeProfessionalCompletude(profile);
    if (pct !== profile.completudePct) {
      await this.profiles.setCompletude(profile.userId, pct);
    }
    return { ...profile, completudePct: pct };
  }
}
