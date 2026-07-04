import { Module } from "@nestjs/common";
import { DeclinePenaltyModule } from "../decline-penalty/decline-penalty.module.js";
import { ProfilesModule } from "../profiles/profiles.module.js";
import { ReputationModule } from "../reputation/reputation.module.js";
import { UsersModule } from "../users/users.module.js";
import { PublicProfileService } from "./application/public-profile.service.js";
import { PUBLIC_QUERY_REPOSITORY } from "./domain/ports/public-query.repository.js";
import { DrizzlePublicQueryRepository } from "./infrastructure/drizzle-public-query.repository.js";
import { PublicProfileController } from "./interface/public-profile.controller.js";

/**
 * Perfil público (roadmap §18/§24, Etapa 5.2). Compõe perfil (ProfilesModule),
 * identidade (UsersModule), reputação (ReputationModule) e comportamento
 * (DeclinePenaltyModule — taxa de aceitação) na view pública limitada.
 */
@Module({
  imports: [ProfilesModule, UsersModule, ReputationModule, DeclinePenaltyModule],
  controllers: [PublicProfileController],
  providers: [
    PublicProfileService,
    { provide: PUBLIC_QUERY_REPOSITORY, useClass: DrizzlePublicQueryRepository },
  ],
  exports: [PublicProfileService],
})
export class PublicProfileModule {}
