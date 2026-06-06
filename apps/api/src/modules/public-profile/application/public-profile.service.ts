import { Injectable, NotFoundException } from "@nestjs/common";
import { UserStatus, type PublicProfile } from "@obracerta/shared";
import { ProfilesService } from "../../profiles/application/profiles.service.js";
import { ReputationService } from "../../reputation/application/reputation.service.js";
import { UsersService } from "../../users/application/users.service.js";
import { publicFoto, publicName } from "../domain/public-profile-rules.js";

@Injectable()
export class PublicProfileService {
  constructor(
    private readonly profiles: ProfilesService,
    private readonly users: UsersService,
    private readonly reputation: ReputationService,
  ) {}

  /**
   * Monta o perfil público por slug: dados limitados (anti-desintermediação §24) +
   * reputação (Fase 3). Só perfis de contas ATIVAS são públicos.
   */
  async getBySlug(slug: string): Promise<PublicProfile> {
    const profile = await this.profiles.getProfessionalBySlug(slug);
    if (!profile) throw new NotFoundException("Perfil não encontrado.");

    const user = await this.users.findById(profile.userId);
    if (!user || user.status !== UserStatus.ATIVO) {
      throw new NotFoundException("Perfil não encontrado.");
    }

    const reputacao = await this.reputation.getReputation(profile.userId);
    return {
      slug: profile.slugPublico,
      nome: publicName(user.nomeCompleto, profile.plano),
      especialidades: profile.especialidades,
      bairro: profile.bairro,
      anosExperiencia: profile.anosExperiencia,
      plano: profile.plano,
      fotoUrl: publicFoto(profile.fotoUrl, profile.plano),
      reputacao,
    };
  }
}
