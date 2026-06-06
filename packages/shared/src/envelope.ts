import type { ApiResponse } from "./api-response.js";

/**
 * Erro tipado de uma resposta da API fora do caminho feliz — carrega o `code` da
 * API (ex.: "NOT_FOUND") e, quando conhecido, o status HTTP. Front e back podem
 * tratar/serializar de forma consistente.
 */
export class ApiEnvelopeError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiEnvelopeError";
  }
}

function isEnvelope(value: unknown): value is ApiResponse<unknown> {
  return typeof value === "object" && value !== null && "success" in value;
}

/**
 * Desembrulha o envelope `{ success, data, error }` retornado por todo endpoint:
 * devolve `data` no sucesso e lança {@link ApiEnvelopeError} no erro. Único ponto
 * de tradução envelope→valor/erro, reutilizado pelo client do front e pelo BFF.
 *
 * @param body  corpo já parseado (JSON) da resposta.
 * @param status status HTTP, opcional, anexado ao erro para diagnóstico.
 */
export function unwrapEnvelope<T>(body: unknown, status?: number): T {
  if (!isEnvelope(body)) {
    throw new ApiEnvelopeError("INVALID_ENVELOPE", "Resposta inesperada do servidor.", status);
  }
  if (body.success) {
    return body.data as T;
  }
  throw new ApiEnvelopeError(body.error.code, body.error.message, status);
}
