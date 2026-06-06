import { Controller, Get, Param } from "@nestjs/common";
import type { PublicProfile } from "@obracerta/shared";
import { PublicProfileService } from "../application/public-profile.service.js";

/**
 * Perfil público (roadmap §18, Etapa 5.2). SEM autenticação — é a página pública
 * (SEO, compartilhável). Retorna a view limitada (anti-desintermediação §24).
 */
@Controller("public")
export class PublicProfileController {
  constructor(private readonly publicProfile: PublicProfileService) {}

  /** Perfil público por slug (dados limitados + reputação). */
  @Get("p/:slug")
  bySlug(@Param("slug") slug: string): Promise<PublicProfile> {
    return this.publicProfile.getBySlug(slug);
  }
}
