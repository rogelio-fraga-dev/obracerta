import type { CompanyMember, CompanyProfessional } from "@obracerta/shared";

/** Dados para registrar/atualizar um membro (upsert por empresa+e-mail). */
export interface UpsertMemberData {
  companyId: string;
  nome: string;
  email: string;
  papel: string;
  /** Usuário da plataforma vinculado pelo e-mail (null = ainda sem conta). */
  userId: string | null;
}

/** Porta de saída da equipe da empresa (membros + roster de profissionais). */
export interface CompanyTeamRepository {
  listMembers(companyId: string): Promise<CompanyMember[]>;
  /** Upsert por (companyId, email): re-convite atualiza nome/papel/vínculo. */
  upsertMember(data: UpsertMemberData): Promise<CompanyMember>;
  /** Remove o membro se pertencer à empresa. `null` = não encontrado. */
  removeMember(companyId: string, memberId: string): Promise<CompanyMember | null>;
  /** Empresa pela qual o usuário age (vínculo de membro por user_id); null = nenhuma. */
  findCompanyForMember(userId: string): Promise<string | null>;
  /**
   * Vínculo preguiçoso: convites feitos antes da conta existir — grava o
   * `user_id` nos membros com este e-mail ainda sem vínculo e devolve a
   * empresa mais recente (null se nenhum convite casar).
   */
  linkMemberByEmail(email: string, userId: string): Promise<string | null>;

  listProfessionals(companyId: string): Promise<CompanyProfessional[]>;
  addProfessional(companyId: string, professionalId: string): Promise<CompanyProfessional>;
  removeProfessional(companyId: string, linkId: string): Promise<boolean>;
}

export const COMPANY_TEAM_REPOSITORY = Symbol("COMPANY_TEAM_REPOSITORY");
