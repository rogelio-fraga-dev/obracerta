import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { ApiEnvelopeError } from "@obracerta/shared";

/**
 * Utilitários dos route handlers do BFF. As respostas usam o **mesmo envelope**
 * `{ success, data, error }` da API, então o client do browser desembrulha com a
 * mesma lógica ({@link ../lib/api}).
 */

/** Resposta de sucesso no envelope padrão. */
export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data, error: null }, { status });
}

/** Resposta de erro no envelope padrão. */
export function jsonError(code: string, message: string, status = 400): NextResponse {
  return NextResponse.json({ success: false, data: null, error: { code, message } }, { status });
}

/**
 * Envolve um handler do BFF: traduz `ApiEnvelopeError` (erro vindo da API) e erros
 * inesperados para o envelope, sem vazar stack. Mantém os handlers enxutos.
 */
export async function handle(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ApiEnvelopeError) {
      return jsonError(e.code, e.message, e.status && e.status >= 400 ? e.status : 400);
    }
    return jsonError("INTERNAL", "Erro inesperado. Tente novamente.", 500);
  }
}

/** Lê e valida o corpo JSON com um schema Zod; lança `ApiEnvelopeError` (400) se inválido. */
export async function parseBody<S extends z.ZodTypeAny>(
  request: Request,
  schema: S,
): Promise<z.infer<S>> {
  const raw: unknown = await request.json().catch(() => null);
  const result = schema.safeParse(raw);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new ApiEnvelopeError("VALIDATION", first?.message ?? "Dados inválidos.", 400);
  }
  return result.data;
}
