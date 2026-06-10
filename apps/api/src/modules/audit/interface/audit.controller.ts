import { Controller, Get, UseGuards } from "@nestjs/common";
import { UserRole } from "@obracerta/shared";
import { JwtAuthGuard } from "../../auth/interface/jwt-auth.guard.js";
import { Roles } from "../../auth/interface/roles.decorator.js";
import { RolesGuard } from "../../auth/interface/roles.guard.js";
import { AuditService, type AuditIntegrity } from "../application/audit.service.js";

@Controller("audit")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  /**
   * Verifica a integridade da trilha (só ADMIN; não vaza dados — só ok/total/brokenAtSeq).
   */
  @Get("verify")
  verify(): Promise<AuditIntegrity> {
    return this.audit.verify();
  }
}
