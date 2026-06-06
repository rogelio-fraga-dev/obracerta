import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
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

/** Subconjunto do arquivo multipart que usamos (evita depender de @types/multer global). */
interface MultipartFile {
  buffer: Buffer;
  mimetype: string;
}

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

  /** Upload da foto de perfil (multipart, campo `file`). Recalcula completude. */
  @Post("professional/me/foto")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("file"))
  async uploadFoto(
    @CurrentUser() user: JwtClaims,
    @UploadedFile() file: MultipartFile | undefined,
  ): Promise<ProfessionalProfile> {
    if (!file) throw new BadRequestException("Arquivo ausente (campo 'file').");
    const updated = await this.profiles.uploadFoto(user.sub, {
      buffer: file.buffer,
      mimetype: file.mimetype,
    });
    if (!updated) throw new NotFoundException("Perfil profissional não encontrado.");
    return updated;
  }

  /** Checklist de onboarding do usuário autenticado (roadmap §5). */
  @Get("onboarding/me")
  @UseGuards(JwtAuthGuard)
  getOnboarding(@CurrentUser() user: JwtClaims) {
    return this.profiles.getChecklist(user.sub);
  }

  // Perfil público movido p/ PublicProfileModule (GET /public/p/:slug) na Etapa 5.2,
  // com view limitada (anti-desintermediação §24) — o antigo /profiles/p/:slug vazava `valores`.
}
