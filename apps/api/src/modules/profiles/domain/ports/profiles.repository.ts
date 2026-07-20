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
  /** Slug público — gerado uma vez no cadastro; não sobrescrito na edição se ausente. */
  slug?: string | null;
}

/** Porta de saída para persistência de perfis (profissional/contratante/empresa). */
export interface ProfilesRepository {
  slugExists(slug: string): Promise<boolean>;
  /** Um slug de empresa já existe? (namespace separado do profissional). */
  companySlugExists(slug: string): Promise<boolean>;
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

  /** Verificação por foto — grava a foto e coloca EM_ANALISE. */
  setVerificationPhoto(userId: string, url: string): Promise<void>;
  /** Estado + foto da verificação do profissional. */
  getVerification(
    userId: string,
  ): Promise<{ status: string; fotoUrl: string | null; verificadoEm: string | null } | null>;
  /** Fila da moderação: profissionais EM_ANALISE (foto + nome). */
  listPendingVerifications(): Promise<
    { userId: string; nome: string; fotoUrl: string | null; enviadoEm: string }[]
  >;
  /** Aprova/recusa uma verificação (VERIFICADO/RECUSADO). Guardado por status EM_ANALISE. */
  resolveVerification(userId: string, aprovar: boolean): Promise<boolean>;
}

export const PROFILES_REPOSITORY = Symbol("PROFILES_REPOSITORY");
