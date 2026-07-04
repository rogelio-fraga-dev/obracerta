import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  type Address,
  createAddressSchema,
  type CreateAddressInput,
  type JwtClaims,
  updateAddressSchema,
  type UpdateAddressInput,
  uuidSchema,
} from "@obracerta/shared";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe.js";
import { CurrentUser } from "../../auth/interface/current-user.decorator.js";
import { JwtAuthGuard } from "../../auth/interface/jwt-auth.guard.js";
import { AddressesService } from "../application/addresses.service.js";

/** Endereços salvos do usuário autenticado (aba Endereços). */
@Controller("addresses")
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  /** Lista os endereços (principal primeiro). */
  @Get("me")
  list(@CurrentUser() user: JwtClaims): Promise<Address[]> {
    return this.addresses.list(user.sub);
  }

  /** Cadastra um endereço (o primeiro vira principal). */
  @Post()
  create(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(createAddressSchema)) body: CreateAddressInput,
  ): Promise<Address> {
    return this.addresses.create(user.sub, body);
  }

  /** Edita um endereço. */
  @Patch(":id")
  update(
    @CurrentUser() user: JwtClaims,
    @Param("id", new ZodValidationPipe(uuidSchema)) id: string,
    @Body(new ZodValidationPipe(updateAddressSchema)) body: UpdateAddressInput,
  ): Promise<Address> {
    return this.addresses.update(user.sub, id, body);
  }

  /** Torna este o endereço principal. */
  @Post(":id/principal")
  @HttpCode(HttpStatus.OK)
  setPrincipal(
    @CurrentUser() user: JwtClaims,
    @Param("id", new ZodValidationPipe(uuidSchema)) id: string,
  ): Promise<Address> {
    return this.addresses.setPrincipal(user.sub, id);
  }

  /** Remove um endereço. */
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser() user: JwtClaims,
    @Param("id", new ZodValidationPipe(uuidSchema)) id: string,
  ): Promise<{ removed: true }> {
    await this.addresses.remove(user.sub, id);
    return { removed: true };
  }
}
