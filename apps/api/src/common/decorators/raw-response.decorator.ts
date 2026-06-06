import { SetMetadata } from "@nestjs/common";

/** Chave de metadata que marca um handler para NÃO receber o envelope de resposta. */
export const RAW_RESPONSE_KEY = "raw_response";

/**
 * Marca uma rota cujo retorno NÃO deve ser embrulhado no envelope `{ success, data }`
 * — para respostas que não são JSON da API (ex.: `/metrics` em texto Prometheus).
 */
export const RawResponse = () => SetMetadata(RAW_RESPONSE_KEY, true);
