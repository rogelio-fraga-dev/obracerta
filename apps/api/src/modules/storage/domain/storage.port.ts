/**
 * Porta de saída para armazenamento de objetos (fotos, anexos). A
 * implementação concreta (S3/MinIO em dev, Cloudflare R2 em prod) fica atrás
 * desta interface — trocar provedor não toca a regra de negócio.
 */
export interface StoragePort {
  /** Salva o objeto e devolve a URL pública. */
  putObject(key: string, body: Buffer, contentType: string): Promise<string>;
}

export const STORAGE_PORT = Symbol("STORAGE_PORT");
