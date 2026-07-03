import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from "@nestjs/common";
import {
  favoriteInputSchema,
  uuidSchema,
  type FavoriteInput,
  type JwtClaims,
  type SearchResult,
} from "@obracerta/shared";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe.js";
import { CurrentUser } from "../../auth/interface/current-user.decorator.js";
import { JwtAuthGuard } from "../../auth/interface/jwt-auth.guard.js";
import { FavoritesService } from "../application/favorites.service.js";

/** Favoritos do usuário autenticado (salvar profissionais para depois). */
@Controller("favorites")
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  /** Favorita um profissional (idempotente). */
  @Post()
  @HttpCode(HttpStatus.OK)
  async add(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(favoriteInputSchema)) body: FavoriteInput,
  ): Promise<{ favorited: true }> {
    await this.favorites.add(user.sub, body.professionalId);
    return { favorited: true };
  }

  /** Remove dos favoritos (idempotente). */
  @Delete(":professionalId")
  async remove(
    @CurrentUser() user: JwtClaims,
    @Param("professionalId", new ZodValidationPipe(uuidSchema)) professionalId: string,
  ): Promise<{ favorited: false }> {
    await this.favorites.remove(user.sub, professionalId);
    return { favorited: false };
  }

  /** Lista os profissionais favoritados (shape da busca). */
  @Get("me")
  list(@CurrentUser() user: JwtClaims): Promise<SearchResult[]> {
    return this.favorites.list(user.sub);
  }

  /** Só os ids — marca os corações na busca. */
  @Get("me/ids")
  ids(@CurrentUser() user: JwtClaims): Promise<string[]> {
    return this.favorites.ids(user.sub);
  }
}
