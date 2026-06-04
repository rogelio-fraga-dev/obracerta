import { Injectable } from "@nestjs/common";
import { type Feature, type Plan, planAllows } from "../domain/entitlements.js";

/**
 * Serviço de gating. Consultar `can(plan, feature)` em vez de checar o plano
 * diretamente nas regras de negócio — mantém a política num lugar só.
 */
@Injectable()
export class EntitlementsService {
  can(plan: Plan, feature: Feature): boolean {
    return planAllows(plan, feature);
  }
}
