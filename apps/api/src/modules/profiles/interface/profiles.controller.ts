import { Body, Controller, Get, NotFoundException, Param, Patch, UseGuards } from "@nestjs/common";
import {
  type JwtClaims,
  type ProfessionalProfile,
  type UpdateProfessionalProfileInput,
  updateProfessionalProfileSchema,
} from "@obracerta/shared";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe.js";
import { CurrentUser } from "../../auth/interface/current-user.decorator.js";
import { JwtAuthGuard } from "../../auth/interface/jwt-auth.guard.js";
import { ProfilesService } from "../application/profiles.service.js";

@Controller("profiles")
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  /** Perfil profissional do usuário autenticado. */
  @Get("professional/me")
  @UseGuards(JwtAuthGuard)
  async myProfessional(@CurrentUser() user: JwtClaims): Promise<ProfessionalProfile> {
    const profile = await this.profiles.getProfessional(user.sub);
    if (!profile) throw new NotFoundException("Perfil profissional não encontrado.");
    return profile;
  }

  /** Atualiza campos do perfil profissional (passos 3–4 do cadastro). */
  @Patch("professional/me")
  @UseGuards(JwtAuthGuard)
  async updateProfessional(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(updateProfessionalProfileSchema))
    patch: UpdateProfessionalProfileInput,
  ): Promise<ProfessionalProfile> {
    const updated = await this.profiles.updateProfessional(user.sub, patch);
    if (!updated) throw new NotFoundException("Perfil profissional não encontrado.");
    return updated;
  }

  /** Perfil público por slug (anti-desintermediação completa na Fase 5). */
  @Get("p/:slug")
  async publicBySlug(@Param("slug") slug: string): Promise<ProfessionalProfile> {
    const profile = await this.profiles.getProfessionalBySlug(slug);
    if (!profile) throw new NotFoundException("Perfil não encontrado.");
    return profile;
  }
}
