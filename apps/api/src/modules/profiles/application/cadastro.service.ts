import { ForbiddenException, Injectable } from "@nestjs/common";
import type { CadastroInput, CadastroResult } from "@obracerta/shared";
import { AuthService } from "../../auth/application/auth.service.js";
import { OtpService } from "../../auth/application/otp.service.js";
import { OnboardingScheduler } from "../../onboarding/application/onboarding.scheduler.js";
import { UsersService } from "../../users/application/users.service.js";
import { ProfilesService } from "./profiles.service.js";

/**
 * Orquestra o cadastro (roadmap §4/§14). Exige que o WhatsApp tenha sido
 * verificado por OTP (fatia 1.1), cria o usuário e o perfil correspondente,
 * e devolve tokens (auto-login). O front conduz os 4 passos; o back garante a
 * integridade da transação de identidade.
 */
@Injectable()
export class CadastroService {
  constructor(
    private readonly otp: OtpService,
    private readonly users: UsersService,
    private readonly profiles: ProfilesService,
    private readonly auth: AuthService,
    private readonly onboarding: OnboardingScheduler,
  ) {}

  async register(input: CadastroInput): Promise<CadastroResult> {
    const verified = await this.otp.consumeVerified(input.whatsapp);
    if (!verified) {
      throw new ForbiddenException("WhatsApp não verificado. Refaça a verificação por OTP.");
    }

    const user = await this.users.create(input);
    await this.profiles.createForUser(user);
    await this.onboarding.scheduleSequence(user.id, user.whatsapp);
    const tokens = await this.auth.login(user);

    return { user, tokens };
  }
}
