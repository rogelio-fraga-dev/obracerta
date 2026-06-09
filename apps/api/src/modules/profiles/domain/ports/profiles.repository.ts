import type {
  ProfessionalProfile,
  ContractorProfile,
  CompanyProfile,
  UpdateProfessionalProfileInput,
} from "@obracerta/shared";

/** Campos do perfil de empresa preenchidos no cadastro/edição. */
export interface CompanyInfo {
  cnpj: string | null;
  razaoSocial: string | null;
  nomeFantasia: string | null;
}

/** Porta de saída para persistência de perfis (profissional/contratante/empresa). */
export interface ProfilesRepository {
  slugExists(slug: string): Promise<boolean>;
  createProfessional(userId: string, slugPublico: string): Promise<ProfessionalProfile>;
  createContractor(userId: string): Promise<ContractorProfile>;
  createCompany(userId: string): Promise<CompanyProfile>;
  setCompanyInfo(userId: string, info: CompanyInfo): Promise<CompanyProfile | null>;
  findCompanyByUserId(userId: string): Promise<CompanyProfile | null>;
  findProfessionalByUserId(userId: string): Promise<ProfessionalProfile | null>;
  findProfessionalBySlug(slug: string): Promise<ProfessionalProfile | null>;
  updateProfessional(
    userId: string,
    patch: UpdateProfessionalProfileInput,
  ): Promise<ProfessionalProfile | null>;
  setFotoUrl(userId: string, url: string): Promise<ProfessionalProfile | null>;
  setCompletude(userId: string, pct: number): Promise<void>;
}

export const PROFILES_REPOSITORY = Symbol("PROFILES_REPOSITORY");
