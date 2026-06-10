import type { ContractorPlan, ProfessionalPlan } from "@obracerta/shared";

/**
 * Porta de saída para sincronizar o **plano desnormalizado** nos perfis. A coluna
 * `plano` de `professional_profiles`/`contractor_profiles` alimenta a busca e o perfil
 * público (§17/§5) e precisa refletir o plano vigente que o billing concede.
 *
 * Pertence ao billing (não acopla ProfilesModule, que já importa BillingModule —
 * evita ciclo). O adapter escreve direto nas tabelas de perfil.
 */
export interface PlanSyncPort {
  /** Reflete o plano do profissional (assinatura EM_GRACA/ATIVA ou upgrade). */
  setProfessionalPlano(userId: string, plano: ProfessionalPlan): Promise<void>;
  /** Volta o profissional ao tier gratuito (cancelamento/estorno). */
  resetProfessionalPlano(userId: string): Promise<void>;
  /** Reflete o plano avulso vigente do contratante/empresa + sua expiração. */
  setContractorPlano(userId: string, plano: ContractorPlan, expiraEm: string): Promise<void>;
  /** Marca o plano do contratante como expirado (zera a vigência). */
  expireContractorPlano(userId: string): Promise<void>;
}

export const PLAN_SYNC_PORT = Symbol("PLAN_SYNC_PORT");
