import { Module } from "@nestjs/common";
import { ProfilesModule } from "../profiles/profiles.module.js";
import { ReputationModule } from "../reputation/reputation.module.js";
import { UsersModule } from "../users/users.module.js";
import { PublicProfileService } from "./application/public-profile.service.js";
import { PublicProfileController } from "./interface/public-profile.controller.js";

/**
 * Perfil público (roadmap §18/§24, Etapa 5.2). Compõe perfil (ProfilesModule),
 * identidade (UsersModule) e reputação (ReputationModule) na view pública limitada.
 */
@Module({
  imports: [ProfilesModule, UsersModule, ReputationModule],
  controllers: [PublicProfileController],
  providers: [PublicProfileService],
  exports: [PublicProfileService],
})
export class PublicProfileModule {}
