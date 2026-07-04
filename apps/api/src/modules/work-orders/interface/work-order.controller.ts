import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  createWorkOrderSchema,
  submitProposalSchema,
  workOrderQuerySchema,
  type CreateWorkOrderInput,
  type JwtClaims,
  type Proposal,
  type SubmitProposalInput,
  type WorkOrder,
  type WorkOrderPhoto,
  type WorkOrderQuery,
  type WorkOrdersPage,
} from "@obracerta/shared";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe.js";
import { CurrentUser } from "../../auth/interface/current-user.decorator.js";
import { JwtAuthGuard } from "../../auth/interface/jwt-auth.guard.js";
import { WorkOrderService } from "../application/work-order.service.js";

/** Arquivo recebido via multipart (subset do que o Multer entrega). */
interface MultipartFile {
  buffer: Buffer;
  mimetype: string;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class WorkOrderController {
  constructor(private readonly orders: WorkOrderService) {}

  /** Contratante abre uma obra. */
  @Post("work-orders")
  open(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(createWorkOrderSchema)) input: CreateWorkOrderInput,
  ): Promise<WorkOrder> {
    return this.orders.openWorkOrder(user.sub, input);
  }

  /** Dono anexa a foto ilustrativa da obra (multipart, campo `file`). */
  @Post("work-orders/:id/foto")
  @UseInterceptors(FileInterceptor("file"))
  uploadFoto(
    @CurrentUser() user: JwtClaims,
    @Param("id") id: string,
    @UploadedFile() file: MultipartFile | undefined,
  ): Promise<WorkOrder> {
    if (!file) throw new BadRequestException("Arquivo ausente (campo 'file').");
    return this.orders.uploadFoto(user.sub, id, { buffer: file.buffer, mimetype: file.mimetype });
  }

  /** Galeria de fotos da obra (ordem de envio). */
  @Get("work-orders/:id/fotos")
  fotos(@Param("id") id: string): Promise<WorkOrderPhoto[]> {
    return this.orders.listFotos(id);
  }

  /** Descoberta: obras abertas (filtro por cidade/especialidade), paginado. */
  @Get("work-orders")
  list(
    @Query(new ZodValidationPipe(workOrderQuerySchema)) query: WorkOrderQuery,
  ): Promise<WorkOrdersPage> {
    return this.orders.listOpen(query);
  }

  /** Obras do contratante autenticado (todos os status). Antes de `:id` por roteamento. */
  @Get("work-orders/me")
  mine(@CurrentUser() user: JwtClaims): Promise<WorkOrder[]> {
    return this.orders.listMine(user.sub);
  }

  /** Obras que o profissional autenticado venceu (em andamento). Antes de `:id`. */
  @Get("work-orders/me/professional")
  mineWon(@CurrentUser() user: JwtClaims): Promise<WorkOrder[]> {
    return this.orders.listWonByProfessional(user.sub);
  }

  /** Detalhe de uma obra. */
  @Get("work-orders/:id")
  get(@Param("id") id: string): Promise<WorkOrder> {
    return this.orders.getWorkOrder(id);
  }

  /** Profissional envia (ou atualiza) um lance sigiloso. */
  @Post("work-orders/:id/proposals")
  submit(
    @CurrentUser() user: JwtClaims,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(submitProposalSchema)) input: SubmitProposalInput,
  ): Promise<Proposal> {
    return this.orders.submitProposal(user.sub, id, input);
  }

  /** Lances da obra — sigilo: o dono vê todos; o profissional, só o seu. */
  @Get("work-orders/:id/proposals")
  proposals(@CurrentUser() user: JwtClaims, @Param("id") id: string): Promise<Proposal[]> {
    return this.orders.listProposals(user.sub, id);
  }

  /** Contratante adjudica a obra a um lance. */
  @Post("proposals/:id/accept")
  accept(@CurrentUser() user: JwtClaims, @Param("id") id: string): Promise<Proposal> {
    return this.orders.acceptProposal(user.sub, id);
  }
}
