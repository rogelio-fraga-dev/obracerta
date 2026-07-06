import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { IMAGE_UPLOAD_OPTIONS } from "../../../common/uploads/image-upload.js";
import {
  type CompanyProfile,
  type JwtClaims,
  type PortfolioPhoto,
  type ProfessionalProfile,
  type UpdatePortfolioPhotoInput,
  updatePortfolioPhotoSchema,
  type UpdateProfessionalProfileInput,
  updateProfessionalProfileSchema,
} from "@obracerta/shared";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe.js";
import { CurrentUser } from "../../auth/interface/current-user.decorator.js";
import { JwtAuthGuard } from "../../auth/interface/jwt-auth.guard.js";
import { PortfolioService } from "../application/portfolio.service.js";
import { ProfilesService } from "../application/profiles.service.js";

/** Subconjunto do arquivo multipart que usamos (evita depender de @types/multer global). */
interface MultipartFile {
  buffer: Buffer;
  mimetype: string;
}

@Controller("profiles")
export class ProfilesController {
  constructor(
    private readonly profiles: ProfilesService,
    private readonly portfolio: PortfolioService,
  ) {}

  /** Perfil profissional do usuário autenticado. */
  @Get("professional/me")
  @UseGuards(JwtAuthGuard)
  async myProfessional(@CurrentUser() user: JwtClaims): Promise<ProfessionalProfile> {
    const profile = await this.profiles.getProfessional(user.sub);
    if (!profile) throw new NotFoundException("Perfil profissional não encontrado.");
    return profile;
  }

  /** Perfil de empresa (PJ) do usuário autenticado (§8.6). */
  @Get("company/me")
  @UseGuards(JwtAuthGuard)
  async myCompany(@CurrentUser() user: JwtClaims): Promise<CompanyProfile> {
    const company = await this.profiles.getCompany(user.sub);
    if (!company) throw new NotFoundException("Perfil de empresa não encontrado.");
    return company;
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
  @UseInterceptors(FileInterceptor("file", IMAGE_UPLOAD_OPTIONS))
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

  /** Portfólio de obras do profissional autenticado. */
  @Get("professional/me/portfolio")
  @UseGuards(JwtAuthGuard)
  listPortfolio(@CurrentUser() user: JwtClaims): Promise<PortfolioPhoto[]> {
    return this.portfolio.list(user.sub);
  }

  /** Adiciona uma foto ao portfólio (multipart, campo `file`; `legenda` opcional). Gated. */
  @Post("professional/me/portfolio")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("file", IMAGE_UPLOAD_OPTIONS))
  addPortfolioPhoto(
    @CurrentUser() user: JwtClaims,
    @UploadedFile() file: MultipartFile | undefined,
    @Body("legenda") legenda: string | undefined,
  ): Promise<PortfolioPhoto> {
    if (!file) throw new BadRequestException("Arquivo ausente (campo 'file').");
    return this.portfolio.addPhoto(
      user.sub,
      { buffer: file.buffer, mimetype: file.mimetype },
      legenda ?? null,
    );
  }

  /** Edita a legenda de uma foto do portfólio. */
  @Patch("professional/me/portfolio/:photoId")
  @UseGuards(JwtAuthGuard)
  updatePortfolioPhoto(
    @CurrentUser() user: JwtClaims,
    @Param("photoId") photoId: string,
    @Body(new ZodValidationPipe(updatePortfolioPhotoSchema)) body: UpdatePortfolioPhotoInput,
  ): Promise<PortfolioPhoto> {
    return this.portfolio.updateLegenda(user.sub, photoId, body.legenda);
  }

  /** Remove uma foto do portfólio; devolve a galeria atualizada. */
  @Delete("professional/me/portfolio/:photoId")
  @UseGuards(JwtAuthGuard)
  async removePortfolioPhoto(
    @CurrentUser() user: JwtClaims,
    @Param("photoId") photoId: string,
  ): Promise<PortfolioPhoto[]> {
    await this.portfolio.removePhoto(user.sub, photoId);
    return this.portfolio.list(user.sub);
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
