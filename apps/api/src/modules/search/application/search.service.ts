import { Inject, Injectable } from "@nestjs/common";
import type {
  PriceReference,
  SearchProfessionalsQuery,
  SearchProfessionalsResult,
} from "@obracerta/shared";
import {
  publicFoto,
  publicName,
} from "../../public-profile/domain/public-profile-rules.js";
import { buildMeta, geoFilter, offsetFor } from "../domain/search-rules.js";
import { SEARCH_REPOSITORY, type SearchRepository } from "../domain/ports/search.repository.js";

/** Mínimo de lances para a faixa de preço ser estatisticamente apresentável. */
const PRICE_REFERENCE_MIN_SAMPLES = 2;

@Injectable()
export class SearchService {
  constructor(@Inject(SEARCH_REPOSITORY) private readonly repo: SearchRepository) {}

  /** Busca paginada de profissionais (texto + geo + filtros), §17. */
  async searchProfessionals(query: SearchProfessionalsQuery): Promise<SearchProfessionalsResult> {
    const { page, limit } = query;
    const [{ items, total }, faixaPreco] = await Promise.all([
      this.repo.searchProfessionals({
        q: query.q ?? null,
        especialidade: query.especialidade ?? null,
        plano: query.plano ?? null,
        geo: geoFilter(query.lat, query.lng, query.raioKm),
        notaMin: query.notaMin ?? null,
        ordem: query.ordem,
        limit,
        offset: offsetFor(page, limit),
      }),
      this.priceReference(query.especialidade ?? null),
    ]);
    // Régua de visibilidade por plano (homologação 18/07) também na listagem:
    // Iniciante aparece com primeiro nome e sem foto; pagos com nome completo.
    const masked = items.map((i) => ({
      ...i,
      nome: publicName(i.nome, i.plano) ?? "Profissional",
      fotoUrl: publicFoto(i.fotoUrl, i.plano),
    }));
    return { items: masked, meta: buildMeta(total, page, limit), faixaPreco };
  }

  /** Faixa de preço anônima da especialidade filtrada (null sem amostra mínima). */
  private async priceReference(especialidade: string | null): Promise<PriceReference | null> {
    if (!especialidade) return null;
    const agg = await this.repo.priceReference(especialidade);
    if (!agg || agg.amostras < PRICE_REFERENCE_MIN_SAMPLES) return null;
    return { especialidade, ...agg };
  }
}
