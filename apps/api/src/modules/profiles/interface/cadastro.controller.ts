import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import {
  type CadastroInput,
  type CadastroResult,
  cadastroSchema,
  type RegisterInput,
  registerSchema,
} from "@obracerta/shared";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe.js";
import { CadastroService } from "../application/cadastro.service.js";

/** Cadastro de usuário (roadmap §4/§6/§14). */
@Controller("cadastro")
export class CadastroController {
  constructor(private readonly cadastro: CadastroService) {}

  /** Cadastro com WhatsApp já verificado por OTP. */
  @Post()
  register(
    @Body(new ZodValidationPipe(cadastroSchema)) body: CadastroInput,
  ): Promise<CadastroResult> {
    return this.cadastro.register(body);
  }

  /** Cadastro "conta normal" (e-mail + senha). */
  @Post("email")
  @HttpCode(HttpStatus.CREATED)
  registerWithPassword(
    @Body(new ZodValidationPipe(registerSchema)) body: RegisterInput,
  ): Promise<CadastroResult> {
    return this.cadastro.registerWithPassword(body);
  }
}
