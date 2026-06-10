import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { ProfessionalPlan, type ContractorPlan } from "@obracerta/shared";
import { DRIZZLE } from "../../../infrastructure/database/database.tokens.js";
import type { Database } from "../../../infrastructure/database/drizzle.js";
import { professionalProfiles } from "../../../infrastructure/database/schema/professional-profiles.js";
import { contractorProfiles } from "../../../infrastructure/database/schema/contractor-profiles.js";
import type { PlanSyncPort } from "../domain/ports/plan-sync.port.js";

/**
 * Adapter Drizzle da {@link PlanSyncPort}: escreve a coluna `plano` desnormalizada
 * nos perfis. Mantém o dado que alimenta busca/perfil público em sincronia com o
 * plano vigente concedido pelo billing.
 */
@Injectable()
export class DrizzlePlanSyncAdapter implements PlanSyncPort {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async setProfessionalPlano(userId: string, plano: ProfessionalPlan): Promise<void> {
    await this.db
      .update(professionalProfiles)
      .set({ plano })
      .where(eq(professionalProfiles.userId, userId));
  }

  async resetProfessionalPlano(userId: string): Promise<void> {
    await this.db
      .update(professionalProfiles)
      .set({ plano: ProfessionalPlan.INICIANTE })
      .where(eq(professionalProfiles.userId, userId));
  }

  async setContractorPlano(userId: string, plano: ContractorPlan, expiraEm: string): Promise<void> {
    await this.db
      .update(contractorProfiles)
      .set({ plano, planoExpiraEm: new Date(expiraEm) })
      .where(eq(contractorProfiles.userId, userId));
  }

  async expireContractorPlano(userId: string): Promise<void> {
    await this.db
      .update(contractorProfiles)
      .set({ planoExpiraEm: new Date() })
      .where(eq(contractorProfiles.userId, userId));
  }
}
