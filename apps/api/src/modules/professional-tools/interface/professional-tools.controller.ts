import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import {
  createDocumentSchema,
  type CreateDocumentInput,
  type JwtClaims,
  type ProfessionalDocument,
} from "@obracerta/shared";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe.js";
import { CurrentUser } from "../../auth/interface/current-user.decorator.js";
import { JwtAuthGuard } from "../../auth/interface/jwt-auth.guard.js";
import { ProfessionalToolsService } from "../application/professional-tools.service.js";

/** Ferramentas do profissional: orçamentos e recibos (roadmap §8.5). */
@Controller("tools/documents")
@UseGuards(JwtAuthGuard)
export class ProfessionalToolsController {
  constructor(private readonly tools: ProfessionalToolsService) {}

  /** Emite um orçamento ou recibo (gated: plano Especialista). */
  @Post()
  create(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(createDocumentSchema)) input: CreateDocumentInput,
  ): Promise<ProfessionalDocument> {
    return this.tools.createDocument(user.sub, input);
  }

  /** Meus documentos. */
  @Get()
  list(@CurrentUser() user: JwtClaims): Promise<ProfessionalDocument[]> {
    return this.tools.listDocuments(user.sub);
  }

  /** Detalhe de um documento meu. */
  @Get(":id")
  get(@CurrentUser() user: JwtClaims, @Param("id") id: string): Promise<ProfessionalDocument> {
    return this.tools.getDocument(user.sub, id);
  }
}
