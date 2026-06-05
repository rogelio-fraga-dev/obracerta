import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/interface/jwt-auth.guard.js";
import { AuditService, type AuditIntegrity } from "../application/audit.service.js";

@Controller("audit")
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  /**
   * Verifica a integridade da trilha (não vaza dados — só ok/total/brokenAtSeq).
   * A restrição a admin entra quando houver papel administrativo (Fase posterior).
   */
  @Get("verify")
  verify(): Promise<AuditIntegrity> {
    return this.audit.verify();
  }
}
