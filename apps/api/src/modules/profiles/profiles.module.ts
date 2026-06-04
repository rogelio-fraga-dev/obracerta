import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { UsersModule } from "../users/users.module.js";
import { CadastroService } from "./application/cadastro.service.js";
import { ProfilesService } from "./application/profiles.service.js";
import { PROFILES_REPOSITORY } from "./domain/ports/profiles.repository.js";
import { DrizzleProfilesRepository } from "./infrastructure/drizzle-profiles.repository.js";
import { CadastroController } from "./interface/cadastro.controller.js";
import { ProfilesController } from "./interface/profiles.controller.js";

/**
 * Perfis + cadastro (roadmap §4/§14). Importa AuthModule (OTP verificado +
 * auto-login) e UsersModule (criação de usuário). JwtAuthGuard vem do AuthModule.
 */
@Module({
  imports: [AuthModule, UsersModule],
  controllers: [CadastroController, ProfilesController],
  providers: [
    CadastroService,
    ProfilesService,
    { provide: PROFILES_REPOSITORY, useClass: DrizzleProfilesRepository },
  ],
  exports: [ProfilesService],
})
export class ProfilesModule {}
