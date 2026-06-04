import { Body, Controller, Post } from "@nestjs/common";
import { type CadastroInput, type CadastroResult, cadastroSchema } from "@obracerta/shared";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe.js";
import { CadastroService } from "../application/cadastro.service.js";

/** Cadastro de usuário (roadmap §4/§14). WhatsApp já verificado por OTP. */
@Controller("cadastro")
export class CadastroController {
  constructor(private readonly cadastro: CadastroService) {}

  @Post()
  register(
    @Body(new ZodValidationPipe(cadastroSchema)) body: CadastroInput,
  ): Promise<CadastroResult> {
    return this.cadastro.register(body);
  }
}
