import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { FavoritesService } from "./application/favorites.service.js";
import { FAVORITES_REPOSITORY } from "./domain/ports/favorites.repository.js";
import { DrizzleFavoritesRepository } from "./infrastructure/drizzle-favorites.repository.js";
import { FavoritesController } from "./interface/favorites.controller.js";

/**
 * Favoritos (UX do segmento): contratante/empresa salva profissionais para
 * contratar depois. Leituras no shape da busca (`SearchResult`).
 */
@Module({
  imports: [AuthModule],
  controllers: [FavoritesController],
  providers: [
    FavoritesService,
    { provide: FAVORITES_REPOSITORY, useClass: DrizzleFavoritesRepository },
  ],
})
export class FavoritesModule {}
