import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type {
  User,
  ProfessionalProfile,
  ContractorProfile,
  CompanyProfile,
  MyVerification,
  PendingVerification,
  UpdateProfessionalProfileInput,
} from "@obracerta/shared";
import { UserType, VerificationStatus } from "@obracerta/shared";
import { STORAGE_PORT, type StoragePort } from "../../storage/domain/storage.port.js";
import { InboxService } from "../../notifications/application/inbox.service.js";
import { buildChecklist, type ChecklistItem } from "../../onboarding/domain/onboarding.js";
import { slugify, slugWithSuffix } from "../domain/slug.js";
import { computeProfessionalCompletude } from "../domain/completude.js";
import {
  PROFILES_REPOSITORY,
  type CompanyInfo,
  type ProfilesRepository,
} from "../domain/ports/profiles.repository.js";

import { IMAGE_MIME, sniffImageExt } from "../../../common/uploads/image-upload.js";

const MAX_SLUG_ATTEMPTS = 50;

@Injectable()
export class ProfilesService {
  constructor(
    @Inject(PROFILES_REPOSITORY) private readonly profiles: ProfilesRepository,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    private readonly inbox: InboxService,
  ) {}

  /**
   * Verificação por foto (selfie): o profissional envia uma foto e o perfil vai
   * para EM_ANALISE. A moderação aprova/recusa; só VERIFICADO exibe o selo. A
   * foto fica no storage (privada — só a moderação a vê pela fila).
   */
  async submitVerification(
    userId: string,
    file: { buffer: Buffer; mimetype: string },
  ): Promise<MyVerification> {
    const ext = sniffImageExt(file.buffer);
    if (!ext) throw new BadRequestException("Formato inválido. Use JPEG, PNG ou WebP.");
    const key = `verificacao/${userId}/selfie-${Date.now()}.${ext}`;
    const url = await this.storage.putObject(key, file.buffer, IMAGE_MIME[ext]);
    await this.profiles.setVerificationPhoto(userId, url);
    return { status: VerificationStatus.EM_ANALISE, verificadoEm: null };
  }

  async myVerification(userId: string): Promise<MyVerification> {
    const v = await this.profiles.getVerification(userId);
    if (!v) throw new NotFoundException("Perfil profissional não encontrado.");
    return { status: v.status as MyVerification["status"], verificadoEm: v.verificadoEm };
  }

  /** Fila da moderação: verificações pendentes (foto + nome). */
  listPendingVerifications(): Promise<PendingVerification[]> {
    return this.profiles.listPendingVerifications();
  }

  /** A moderação aprova/recusa; notifica o profissional do resultado. */
  async resolveVerification(userId: string, aprovar: boolean): Promise<void> {
    const ok = await this.profiles.resolveVerification(userId, aprovar);
    if (!ok) throw new NotFoundException("Verificação não encontrada ou já resolvida.");
    await this.inbox.record(
      userId,
      "SISTEMA",
      aprovar ? "Perfil verificado ✔" : "Verificação não aprovada",
      {
        corpo: aprovar
          ? "Seu selo de verificação já aparece no seu perfil e nas buscas."
          : "A foto enviada não pôde ser validada. Reenvie uma selfie nítida pelo seu perfil.",
        link: "/perfil",
      },
    );
  }

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
    // fallback altamente improvável: sufixo aleatório sem risco de colisão
    const { randomUUID } = await import("node:crypto");
    return `${base}-${randomUUID().slice(0, 8)}`;
  }

  /** Slug único de empresa (namespace próprio — diretório de empresas). */
  async generateUniqueCompanySlug(nome: string): Promise<string> {
    const base = slugify(nome);
    for (let n = 1; n <= MAX_SLUG_ATTEMPTS; n++) {
      const candidate = slugWithSuffix(base, n);
      if (!(await this.profiles.companySlugExists(candidate))) {
        return candidate;
      }
    }
    const { randomUUID } = await import("node:crypto");
    return `${base}-${randomUUID().slice(0, 8)}`;
  }

  /** Recomputa a completude na leitura (self-heal: a foto pode ter sido espelhada da conta). */
  async getProfessional(userId: string): Promise<ProfessionalProfile | null> {
    const profile = await this.profiles.findProfessionalByUserId(userId);
    return profile ? this.recompute(profile) : null;
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
    // Valida o CONTEÚDO (magic bytes), não o mimetype do cliente (falsificável).
    const ext = sniffImageExt(file.buffer);
    if (!ext) {
      throw new BadRequestException("Formato inválido. Use JPEG, PNG ou WebP.");
    }
    const key = `profiles/${userId}/foto-${Date.now()}.${ext}`;
    const url = await this.storage.putObject(key, file.buffer, IMAGE_MIME[ext]);
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
