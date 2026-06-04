import { Module } from "@nestjs/common";
import { EntitlementsService } from "./application/entitlements.service.js";

/** Gating de features por plano (base — roadmap §3/§17). */
@Module({
  providers: [EntitlementsService],
  exports: [EntitlementsService],
})
export class EntitlementsModule {}
