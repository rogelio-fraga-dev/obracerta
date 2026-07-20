import { ForbiddenException, Injectable } from "@nestjs/common";
import {
  UserType,
  type CadastroInput,
  type CadastroResult,
  type RegisterCompanyInput,
  type RegisterInput,
} from "@obracerta/shared";
import { AuthService } from "../../auth/application/auth.service.js";
import { OtpService } from "../../auth/application/otp.service.js";
import { hashPassword } from "../../auth/domain/password.js";
import { OnboardingScheduler } from "../../onboarding/application/onboarding.scheduler.js";
import { PromotionsService } from "../../promotions/application/promotions.service.js";
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
    private readonly promotions: PromotionsService,
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

  /**
   * Cadastro "conta normal" (e-mail + senha) — roadmap §6. Sem OTP: a senha é a
   * credencial. Coletamos só o essencial (nome, e-mail, senha, WhatsApp, tipo);
   * o restante do perfil é completado depois de entrar. Auto-login no fim.
   */
  async registerWithPassword(input: RegisterInput): Promise<CadastroResult> {
    const senhaHash = await hashPassword(input.password);
    const user = await this.users.create({
      nomeCompleto: input.nomeCompleto,
      email: input.email,
      whatsapp: input.whatsapp,
      tipo: input.tipo,
      senhaHash,
    });
    await this.profiles.createForUser(user);
    // Programa de indicação (best-effort): emite os cupons e vincula o par.
    await this.promotions.processReferral(user.id, input.codigoIndicacao);
    await this.onboarding.scheduleSequence(user.id, user.whatsapp);
    const tokens = await this.auth.login(user);

    return { user, tokens };
  }

  /**
   * Cadastro de empresa (PJ) — roadmap §8.6. Cria a conta `tipo = EMPRESA` (1
   * admin), o perfil de empresa e grava CNPJ + razão social. Auto-login no fim.
   */
  async registerCompany(input: RegisterCompanyInput): Promise<CadastroResult> {
    const senhaHash = await hashPassword(input.password);
    const user = await this.users.create({
      nomeCompleto: input.nomeCompleto,
      email: input.email,
      whatsapp: input.whatsapp,
      tipo: UserType.EMPRESA,
      senhaHash,
    });
    await this.profiles.createForUser(user);
    const slug = await this.profiles.generateUniqueCompanySlug(
      input.nomeFantasia ?? input.razaoSocial,
    );
    await this.profiles.setCompanyInfo(user.id, {
      cnpj: input.cnpj,
      razaoSocial: input.razaoSocial,
      nomeFantasia: input.nomeFantasia ?? null,
      slug,
    });
    await this.onboarding.scheduleSequence(user.id, user.whatsapp);
    const tokens = await this.auth.login(user);

    return { user, tokens };
  }
}
