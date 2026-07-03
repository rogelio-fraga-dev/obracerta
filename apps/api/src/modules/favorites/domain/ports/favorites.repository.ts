import type { SearchResult } from "@obracerta/shared";

/**
 * Porta dos favoritos (contratante/empresa salva profissionais). Leituras
 * devolvem o mesmo shape da busca (`SearchResult`) — a lista de favoritos é,
 * na prática, uma busca pré-filtrada pelo usuário.
 */
export interface FavoritesRepository {
  /** Insere (idempotente — duplicata é ignorada). */
  add(userId: string, professionalId: string): Promise<void>;
  remove(userId: string, professionalId: string): Promise<void>;
  /** Profissionais favoritados com os dados de descoberta (distância sempre null). */
  listProfessionals(userId: string): Promise<SearchResult[]>;
  /** Só os ids — para marcar corações na busca sem carga extra. */
  idsForUser(userId: string): Promise<string[]>;
  /** O alvo é um profissional com perfil? (valida antes de favoritar). */
  professionalExists(professionalId: string): Promise<boolean>;
}

export const FAVORITES_REPOSITORY = Symbol("FAVORITES_REPOSITORY");
