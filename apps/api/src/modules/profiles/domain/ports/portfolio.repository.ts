import type { PortfolioPhoto } from "@obracerta/shared";

/** Dados para persistir uma foto do portfólio. */
export interface CreatePortfolioPhotoData {
  professionalId: string;
  url: string;
  legenda: string | null;
}

/** Porta de saída para o portfólio de obras do profissional. */
export interface PortfolioRepository {
  create(data: CreatePortfolioPhotoData): Promise<PortfolioPhoto>;
  listForProfessional(professionalId: string): Promise<PortfolioPhoto[]>;
  countForProfessional(professionalId: string): Promise<number>;
  findById(id: string): Promise<PortfolioPhoto | null>;
  delete(id: string): Promise<void>;
}

export const PORTFOLIO_REPOSITORY = Symbol("PORTFOLIO_REPOSITORY");
