import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import {
  createWorkOrderSchema,
  submitProposalSchema,
  workOrderQuerySchema,
  type CreateWorkOrderInput,
  type JwtClaims,
  type Proposal,
  type SubmitProposalInput,
  type WorkOrder,
  type WorkOrderQuery,
  type WorkOrdersPage,
} from "@obracerta/shared";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe.js";
import { CurrentUser } from "../../auth/interface/current-user.decorator.js";
import { JwtAuthGuard } from "../../auth/interface/jwt-auth.guard.js";
import { WorkOrderService } from "../application/work-order.service.js";

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

  /** Descoberta: obras abertas (filtro por cidade/especialidade), paginado. */
  @Get("work-orders")
  list(
    @Query(new ZodValidationPipe(workOrderQuerySchema)) query: WorkOrderQuery,
  ): Promise<WorkOrdersPage> {
    return this.orders.listOpen(query);
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
