import type {
  ProfessionalProfile,
  ContractorProfile,
  UpdateProfessionalProfileInput,
} from "@obracerta/shared";

/** Porta de saída para persistência de perfis (profissional/contratante). */
export interface ProfilesRepository {
  slugExists(slug: string): Promise<boolean>;
  createProfessional(userId: string, slugPublico: string): Promise<ProfessionalProfile>;
  createContractor(userId: string): Promise<ContractorProfile>;
  findProfessionalByUserId(userId: string): Promise<ProfessionalProfile | null>;
  findProfessionalBySlug(slug: string): Promise<ProfessionalProfile | null>;
  updateProfessional(
    userId: string,
    patch: UpdateProfessionalProfileInput,
  ): Promise<ProfessionalProfile | null>;
}

export const PROFILES_REPOSITORY = Symbol("PROFILES_REPOSITORY");
