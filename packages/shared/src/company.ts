import { z } from "zod";
import { uuidSchema, isoTimestampSchema, emailSchema, whatsappSchema } from "./primitives.js";
import { passwordSchema } from "./auth.js";
import { UserType, type UserType as UserTypeT } from "./enums.js";

/**
 * Conta PJ/Empresa (roadmap §8.6). Uma EMPRESA é um usuário `tipo = EMPRESA` com
 * um perfil de empresa (CNPJ + razão social). Modelo "1 admin": a conta É o
 * administrador, sem sub-contas. A empresa contrata e publica obras como um
 * contratante — daí o helper `canHireServices`.
 */

/** Quem pode contratar serviços / publicar obras: contratante ou empresa. */
export function canHireServices(tipo: UserTypeT): boolean {
  return tipo === UserType.CONTRATANTE || tipo === UserType.EMPRESA;
}

/** Valida um CNPJ (14 dígitos + dígitos verificadores). Ignora máscara. */
export function isValidCnpj(value: string): boolean {
  const cnpj = value.replace(/\D/g, "");
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false; // rejeita 00000000000000 etc.

  const digito = (base: string): number => {
    const pesos =
      base.length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = base
      .split("")
      .reduce((acc, n, i) => acc + Number(n) * pesos[i]!, 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const dv1 = digito(cnpj.slice(0, 12));
  const dv2 = digito(cnpj.slice(0, 12) + String(dv1));
  return cnpj.slice(12) === `${dv1}${dv2}`;
}

/** Normaliza um CNPJ para 14 dígitos (sem máscara). */
export function normalizeCnpj(value: string): string {
  return value.replace(/\D/g, "");
}

const cnpjSchema = z
  .string()
  .trim()
  .refine(isValidCnpj, "CNPJ inválido.")
  .transform(normalizeCnpj);

/** Perfil de empresa (1:1 com o usuário EMPRESA). */
export const companyProfileSchema = z.object({
  userId: uuidSchema,
  cnpj: z.string().nullable(),
  razaoSocial: z.string().nullable(),
  nomeFantasia: z.string().nullable(),
  criadoEm: isoTimestampSchema,
});
export type CompanyProfile = z.infer<typeof companyProfileSchema>;

/**
 * Cadastro de empresa (e-mail + senha). `nomeCompleto` é o responsável/admin; os
 * dados da empresa (CNPJ, razão social) vão no perfil.
 */
export const registerCompanySchema = z.object({
  nomeCompleto: z.string().trim().min(2, "Informe o nome do responsável").max(120),
  email: emailSchema,
  password: passwordSchema,
  whatsapp: whatsappSchema,
  cnpj: cnpjSchema,
  razaoSocial: z.string().trim().min(2, "Informe a razão social").max(160),
  nomeFantasia: z.string().trim().max(160).optional(),
});
export type RegisterCompanyInput = z.infer<typeof registerCompanySchema>;

/**
 * Equipe da empresa (homologação 18/07 — evolução do modelo 1-admin). Duas
 * relações distintas:
 * - **Membros** (`company_members`): pessoas convidadas por e-mail que acessam
 *   e gerenciam a conta — um membro vinculado (e-mail casa com um usuário) age
 *   pela empresa nas obras e relatórios.
 * - **Profissionais da equipe** (`company_professionals`): roster interno de
 *   profissionais da plataforma vinculados à empresa.
 */

/** Papel do membro na conta da empresa. */
export const CompanyMemberRole = {
  GESTOR: "GESTOR",
} as const;
export const companyMemberRoleSchema = z.nativeEnum(CompanyMemberRole);
export type CompanyMemberRole = z.infer<typeof companyMemberRoleSchema>;

/** Membro da equipe com acesso à conta da empresa. */
export const companyMemberSchema = z.object({
  id: uuidSchema,
  companyId: uuidSchema,
  nome: z.string().min(2).max(120),
  email: emailSchema,
  papel: companyMemberRoleSchema,
  /** Usuário da plataforma vinculado por e-mail (null = ainda sem conta). */
  userId: uuidSchema.nullable(),
  criadoEm: isoTimestampSchema,
});
export type CompanyMember = z.infer<typeof companyMemberSchema>;

/** Convite/registro de um membro pelo administrador da empresa. */
export const addCompanyMemberSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome").max(120),
  email: emailSchema,
  papel: companyMemberRoleSchema.default(CompanyMemberRole.GESTOR),
});
export type AddCompanyMemberInput = z.infer<typeof addCompanyMemberSchema>;

/** Profissional da plataforma vinculado à equipe da empresa (roster interno). */
export const companyProfessionalSchema = z.object({
  id: uuidSchema,
  companyId: uuidSchema,
  professionalId: uuidSchema,
  /** Dados de exibição resolvidos na leitura (nome/especialidades do perfil). */
  nome: z.string(),
  especialidades: z.array(z.string()),
  criadoEm: isoTimestampSchema,
});
export type CompanyProfessional = z.infer<typeof companyProfessionalSchema>;

/** Vínculo de um profissional à equipe (pelo id vindo da busca). */
export const addCompanyProfessionalSchema = z.object({ professionalId: uuidSchema });
export type AddCompanyProfessionalInput = z.infer<typeof addCompanyProfessionalSchema>;

/** Visão da equipe da empresa (membros + profissionais). */
export const companyTeamSchema = z.object({
  membros: z.array(companyMemberSchema),
  profissionais: z.array(companyProfessionalSchema),
});
export type CompanyTeam = z.infer<typeof companyTeamSchema>;
