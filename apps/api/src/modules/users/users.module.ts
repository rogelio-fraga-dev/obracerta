import { Module } from "@nestjs/common";
import { UsersService } from "./application/users.service.js";
import { USERS_REPOSITORY } from "./domain/ports/users.repository.js";
import { DrizzleUsersRepository } from "./infrastructure/drizzle-users.repository.js";

/**
 * Módulo de usuários (bounded context). Faz o binding da porta → adapter:
 * a aplicação pede `USERS_REPOSITORY`, o Nest entrega o adapter Drizzle.
 * Controllers e fluxo de cadastro chegam na fatia 1.2.
 */
@Module({
  providers: [
    UsersService,
    { provide: USERS_REPOSITORY, useClass: DrizzleUsersRepository },
  ],
  exports: [UsersService, USERS_REPOSITORY],
})
export class UsersModule {}
