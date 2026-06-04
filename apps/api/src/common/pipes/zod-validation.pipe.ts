import { BadRequestException, type PipeTransform } from "@nestjs/common";
import type { ZodSchema } from "zod";

/**
 * Valida o input da borda HTTP contra um schema Zod do `@obracerta/shared`.
 * Mantém a validação alinhada ao contrato único front↔back (em vez de
 * class-validator). Uso: `@Body(new ZodValidationPipe(otpRequestSchema))`.
 *
 * Em caso de erro, lança 400 com os problemas no envelope (o AllExceptionsFilter
 * formata a resposta); `details` carrega os erros estruturados do Zod.
 */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: "Dados inválidos",
        details: result.error.flatten(),
      });
    }
    return result.data;
  }
}
