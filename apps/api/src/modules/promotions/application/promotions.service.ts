import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  Coupon,
  CouponPreview,
  CouponType,
  CreateCouponInput,
  ReferralSummary,
} from "@obracerta/shared";
import { UsersService } from "../../users/application/users.service.js";
import {
  COUPONS_REPOSITORY,
  type CouponsRepository,
} from "../domain/ports/coupons.repository.js";
import {
  REFERRALS_REPOSITORY,
  type ReferralsRepository,
} from "../domain/ports/referrals.repository.js";
import {
  applyCouponToCentavos,
  couponResumo,
  couponUnusableReason,
  generateReferralCode,
  normalizeCode,
  REFERRAL_REWARD,
  type CouponEffect,
} from "../domain/promotions-rules.js";

/** Resultado de um resgate para a assinatura: efeito no valor + cupom resgatado. */
export interface SubscriptionCouponResult extends CouponEffect {
  couponId: string;
  codigo: string;
}

@Injectable()
export class PromotionsService {
  constructor(
    private readonly users: UsersService,
    @Inject(COUPONS_REPOSITORY) private readonly coupons: CouponsRepository,
    @Inject(REFERRALS_REPOSITORY) private readonly referrals: ReferralsRepository,
  ) {}

  /**
   * Código de indicação do usuário — gera na 1ª vez (com retentativa em caso de
   * colisão). Idempotente: chamadas seguintes devolvem o mesmo código.
   */
  async getOrCreateReferralCode(userId: string): Promise<string> {
    const existing = await this.users.getCodigoIndicacao(userId);
    if (existing) return existing;

    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateReferralCode();
      const owner = await this.users.findByCodigoIndicacao(candidate);
      if (owner) continue; // colisão — tenta outro
      await this.users.setCodigoIndicacao(userId, candidate);
      const saved = await this.users.getCodigoIndicacao(userId);
      if (saved) return saved; // outra corrida pode ter gravado o dela; devolve a vencedora
    }
    throw new ConflictException("Não foi possível gerar seu código de indicação. Tente novamente.");
  }

  /** Painel de indicação: código próprio, total de indicados e cupons disponíveis. */
  async getReferralSummary(userId: string): Promise<ReferralSummary> {
    const [codigo, totalIndicados, cupons] = await Promise.all([
      this.getOrCreateReferralCode(userId),
      this.referrals.countByReferrer(userId),
      this.referrals.listMyRewardCoupons(userId),
    ]);
    return {
      codigo,
      totalIndicados,
      cuponsDisponiveis: cupons.map((c) => this.toPreview(c)),
    };
  }

  /**
   * Processa o código de indicação informado no cadastro (best-effort — nunca
   * deve derrubar o registro). Vincula indicador→indicado, emite os dois cupons
   * de recompensa e registra a indicação. Ignora auto-indicação e re-indicação.
   */
  async processReferral(referredId: string, codigo: string | undefined): Promise<void> {
    if (!codigo) return;
    try {
      const owner = await this.users.findByCodigoIndicacao(normalizeCode(codigo));
      if (!owner || owner.id === referredId) return;
      if (await this.referrals.referredExists(referredId)) return;

      const [cupomIndicador, cupomIndicado] = await Promise.all([
        this.issueRewardCoupon("IND", REFERRAL_REWARD.indicador, "Recompensa por indicar um amigo"),
        this.issueRewardCoupon("BEM", REFERRAL_REWARD.indicado, "Bônus de boas-vindas por indicação"),
      ]);

      await this.referrals.create({
        referrerId: owner.id,
        referredId,
        cupomIndicadorId: cupomIndicador.id,
        cupomIndicadoId: cupomIndicado.id,
      });
      await this.users.setIndicadoPor(referredId, owner.id);
    } catch {
      // indicação é bônus: qualquer falha aqui não invalida o cadastro
    }
  }

  /** Cria um cupom (admin). Rejeita código duplicado. */
  async createCoupon(input: CreateCouponInput): Promise<Coupon> {
    const codigo = normalizeCode(input.codigo);
    const existing = await this.coupons.findByCodigo(codigo);
    if (existing) throw new ConflictException("Já existe um cupom com este código.");
    return this.coupons.create({
      codigo,
      descricao: input.descricao?.trim() || null,
      tipo: input.tipo,
      valor: input.valor,
      validoAte: input.validoAte ? new Date(input.validoAte) : null,
      usosMax: input.usosMax ?? null,
    });
  }

  listCoupons(): Promise<Coupon[]> {
    return this.coupons.listAll();
  }

  async toggleCoupon(id: string, ativo: boolean): Promise<void> {
    const coupon = await this.coupons.findById(id);
    if (!coupon) throw new NotFoundException("Cupom não encontrado.");
    await this.coupons.setAtivo(id, ativo);
  }

  /** Prévia de um cupom para o usuário (valida disponibilidade). */
  async previewCoupon(userId: string, codigo: string): Promise<CouponPreview> {
    const coupon = await this.validateForUser(userId, codigo);
    return this.toPreview(coupon);
  }

  /**
   * Valida e resgata um cupom no contexto de uma assinatura, devolvendo o efeito
   * no valor (ou dias grátis). O resgate é atômico; se o cupom já foi usado pelo
   * usuário entre a validação e o resgate, lança conflito.
   */
  async redeemForSubscription(
    userId: string,
    codigo: string,
    valorCentavos: number,
  ): Promise<SubscriptionCouponResult> {
    const coupon = await this.validateForUser(userId, codigo);
    const ok = await this.coupons.redeem(coupon.id, userId);
    if (!ok) throw new ConflictException("Você já utilizou este cupom.");
    const effect = applyCouponToCentavos(coupon.tipo, coupon.valor, valorCentavos);
    return { ...effect, couponId: coupon.id, codigo: coupon.codigo };
  }

  /** Emite um cupom de recompensa pessoal (uso único), com código único. */
  private async issueRewardCoupon(
    prefixo: string,
    reward: { tipo: CouponType; valor: number },
    descricao: string,
  ): Promise<Coupon> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const codigo = `${prefixo}-${generateReferralCode()}`;
      const existing = await this.coupons.findByCodigo(codigo);
      if (existing) continue;
      return this.coupons.create({
        codigo,
        descricao,
        tipo: reward.tipo,
        valor: reward.valor,
        validoAte: null,
        usosMax: 1,
      });
    }
    throw new ConflictException("Não foi possível emitir o cupom de indicação.");
  }

  /** Busca o cupom pelo código e valida se o usuário pode usá-lo agora. */
  private async validateForUser(userId: string, codigo: string): Promise<Coupon> {
    const coupon = await this.coupons.findByCodigo(normalizeCode(codigo));
    if (!coupon) throw new NotFoundException("Cupom não encontrado.");
    const jaUsado = await this.coupons.hasRedeemed(coupon.id, userId);
    const reason = couponUnusableReason(
      {
        ativo: coupon.ativo,
        validoAte: coupon.validoAte ? new Date(coupon.validoAte) : null,
        usosMax: coupon.usosMax,
        usosCount: coupon.usosCount,
        jaUsadoPeloUsuario: jaUsado,
      },
      new Date(),
    );
    if (reason) throw new BadRequestException(UNUSABLE_MESSAGE[reason]);
    return coupon;
  }

  private toPreview(c: Coupon): CouponPreview {
    return {
      codigo: c.codigo,
      tipo: c.tipo,
      valor: c.valor,
      descricao: c.descricao,
      resumo: couponResumo(c.tipo, c.valor),
    };
  }
}

/** Mensagens amigáveis por motivo de bloqueio do cupom. */
const UNUSABLE_MESSAGE = {
  INATIVO: "Este cupom não está mais ativo.",
  EXPIRADO: "Este cupom expirou.",
  ESGOTADO: "Este cupom atingiu o limite de usos.",
  JA_USADO: "Você já utilizou este cupom.",
} as const;
