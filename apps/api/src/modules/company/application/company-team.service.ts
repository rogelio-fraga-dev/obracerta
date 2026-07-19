import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  UserType,
  UserStatus,
  type AddCompanyMemberInput,
  type AddCompanyProfessionalInput,
  type CompanyDirectoryItem,
  type CompanyInvite,
  type CompanyMember,
  type CompanyProfessional,
  type CompanyTeam,
  type PublicCompanyProfile,
} from "@obracerta/shared";
import { AuditService } from "../../audit/application/audit.service.js";
import { BillingService } from "../../billing/application/billing.service.js";
import { Feature } from "../../entitlements/domain/entitlements.js";
import { InboxService } from "../../notifications/application/inbox.service.js";
import { UsersService } from "../../users/application/users.service.js";
import { canBeMember, normalizeInviteEmail } from "../domain/team-rules.js";
import {
  COMPANY_TEAM_REPOSITORY,
  type CompanyTeamRepository,
} from "../domain/ports/company-team.repository.js";

/** Teto de resultados do diretório público de empresas. */
const DIRECTORY_LIMIT = 60;

/**
 * Equipe da empresa (homologação 18/07 — evolução do modelo 1-admin). Só o
 * **administrador** (a conta EMPRESA) gerencia a equipe; membros vinculados
 * agem pela empresa nas obras/relatórios via {@link companyActingAs} (consumido
 * pelo work-orders). O roster de profissionais é interno (só a empresa vê).
 */
@Injectable()
export class CompanyTeamService {
  constructor(
    @Inject(COMPANY_TEAM_REPOSITORY) private readonly repo: CompanyTeamRepository,
    private readonly users: UsersService,
    private readonly billing: BillingService,
    private readonly audit: AuditService,
    private readonly inbox: InboxService,
  ) {}

  /** Visão completa da equipe (membros + profissionais). Só a conta EMPRESA. */
  async team(companyId: string): Promise<CompanyTeam> {
    await this.requireCompanyWithTeam(companyId);
    const [membros, profissionais] = await Promise.all([
      this.repo.listMembers(companyId),
      this.repo.listProfessionals(companyId),
    ]);
    return { membros, profissionais };
  }

  /**
   * Convida/registra um membro por e-mail. Se o e-mail já tem conta na
   * plataforma (pessoa física), o vínculo é imediato e o membro passa a agir
   * pela empresa; sem conta, fica registrado e o vínculo acontece quando a
   * pessoa se cadastrar com este e-mail (resolvido na leitura do acesso).
   */
  async addMember(companyId: string, input: AddCompanyMemberInput): Promise<CompanyMember> {
    await this.requireCompanyWithTeam(companyId);
    const email = normalizeInviteEmail(input.email);

    const linked = await this.users.findByEmail(email);
    if (linked) {
      if (linked.id === companyId) {
        throw new BadRequestException("Você já é o administrador da conta.");
      }
      if (!canBeMember(linked.tipo)) {
        throw new BadRequestException("Contas de empresa não podem ser membros de outra empresa.");
      }
    }

    const member = await this.repo.upsertMember({
      companyId,
      nome: input.nome,
      email,
      papel: input.papel,
      userId: linked?.id ?? null,
    });

    await this.audit.record({
      atorUserId: companyId,
      acao: "EQUIPE_MEMBRO_ADICIONADO",
      entidade: "company_member",
      entidadeId: member.id,
      dados: { email, papel: input.papel, vinculado: linked !== null },
    });
    if (linked) {
      await this.inbox.record(linked.id, "SISTEMA", "Você entrou numa equipe 🏢", {
        corpo: "Uma empresa adicionou você como gestor(a): agora você pode publicar e acompanhar as obras dela na aba Obras.",
        link: "/obras",
      });
    }
    return member;
  }

  /** Remove um membro da equipe (só o administrador). */
  async removeMember(companyId: string, memberId: string): Promise<void> {
    await this.requireCompanyWithTeam(companyId);
    const removed = await this.repo.removeMember(companyId, memberId);
    if (!removed) throw new NotFoundException("Membro não encontrado.");
    await this.audit.record({
      atorUserId: companyId,
      acao: "EQUIPE_MEMBRO_REMOVIDO",
      entidade: "company_member",
      entidadeId: memberId,
      dados: { email: removed.email },
    });
  }

  /** Vincula um profissional da plataforma ao roster interno da equipe. */
  async addProfessional(
    companyId: string,
    input: AddCompanyProfessionalInput,
  ): Promise<CompanyProfessional> {
    await this.requireCompanyWithTeam(companyId);
    const professional = await this.users.findById(input.professionalId);
    if (
      !professional ||
      professional.tipo !== UserType.PROFISSIONAL ||
      professional.status !== UserStatus.ATIVO
    ) {
      throw new NotFoundException("Profissional não encontrado.");
    }
    const link = await this.repo.addProfessional(companyId, input.professionalId);
    await this.audit.record({
      atorUserId: companyId,
      acao: "EQUIPE_PROFISSIONAL_VINCULADO",
      entidade: "company_professional",
      entidadeId: link.id,
      dados: { professionalId: input.professionalId, confirmado: link.confirmado },
    });
    // Convite: o profissional confirma para aparecer no perfil público da empresa
    // (opt-in). Vínculos já confirmados (re-add) não geram novo convite.
    if (!link.confirmado) {
      const company = await this.users.findById(companyId);
      await this.inbox.record(input.professionalId, "SISTEMA", "Convite de equipe 🏢", {
        corpo: `${company?.nomeCompleto ?? "Uma empresa"} quer listar você na equipe pública dela. Confirme no seu perfil para aparecer.`,
        link: "/perfil",
      });
    }
    return link;
  }

  /** Remove um profissional do roster. */
  async removeProfessional(companyId: string, linkId: string): Promise<void> {
    await this.requireCompanyWithTeam(companyId);
    const removed = await this.repo.removeProfessional(companyId, linkId);
    if (!removed) throw new NotFoundException("Vínculo não encontrado.");
    await this.audit.record({
      atorUserId: companyId,
      acao: "EQUIPE_PROFISSIONAL_REMOVIDO",
      entidade: "company_professional",
      entidadeId: linkId,
      dados: null,
    });
  }

  /** Convites de empresa pendentes que o profissional recebeu. */
  pendingInvites(professionalId: string): Promise<CompanyInvite[]> {
    return this.repo.listPendingInvites(professionalId);
  }

  /**
   * Profissional confirma o vínculo com uma empresa (opt-in público). Só o dono
   * do vínculo confirma — o repositório escopa por `professionalId`.
   */
  async confirmInvite(professionalId: string, linkId: string): Promise<void> {
    const ok = await this.repo.confirmInvite(professionalId, linkId);
    if (!ok) throw new NotFoundException("Convite não encontrado.");
    await this.audit.record({
      atorUserId: professionalId,
      acao: "EQUIPE_VINCULO_CONFIRMADO",
      entidade: "company_professional",
      entidadeId: linkId,
      dados: null,
    });
  }

  /** Profissional recusa (remove) um convite pendente. */
  async rejectInvite(professionalId: string, linkId: string): Promise<void> {
    const ok = await this.repo.rejectInvite(professionalId, linkId);
    if (!ok) throw new NotFoundException("Convite não encontrado.");
    await this.audit.record({
      atorUserId: professionalId,
      acao: "EQUIPE_VINCULO_RECUSADO",
      entidade: "company_professional",
      entidadeId: linkId,
      dados: null,
    });
  }

  /** Diretório público de empresas (busca por nome/cidade). Sem login. */
  directory(q: string | null, cidadeId: string | null): Promise<CompanyDirectoryItem[]> {
    return this.repo.directory(q, cidadeId, DIRECTORY_LIMIT);
  }

  /** Perfil público de uma empresa por slug (só profissionais confirmados). */
  async publicProfile(slug: string): Promise<PublicCompanyProfile> {
    const profile = await this.repo.publicProfile(slug);
    if (!profile) throw new NotFoundException("Empresa não encontrada.");
    return profile;
  }

  /**
   * Empresa pela qual o usuário **age** (acesso delegado): a própria conta se
   * for EMPRESA; a empresa que o vinculou como membro (por user_id, ou por
   * e-mail resolvido preguiçosamente) se for pessoa física; `null` caso
   * contrário. Consumido pelo work-orders para escopar obras/relatórios.
   */
  async companyActingAs(userId: string): Promise<string | null> {
    const direct = await this.repo.findCompanyForMember(userId);
    if (direct) return direct;
    // Vínculo preguiçoso: convite feito antes da pessoa criar a conta — o
    // e-mail casa agora e o vínculo é gravado na primeira resolução.
    const user = await this.users.findById(userId);
    if (!user?.email || user.tipo === UserType.EMPRESA) return null;
    return this.repo.linkMemberByEmail(normalizeInviteEmail(user.email), userId);
  }

  /**
   * Contexto de delegação para a UI: por qual empresa o usuário age e quais
   * features o plano DELA libera (ex.: o botão "Nova obra" de um gestor depende
   * do `bid.submit` da empresa, não do plano pessoal dele).
   */
  async actingContext(userId: string): Promise<{ companyId: string | null; features: string[] }> {
    const companyId = await this.companyActingAs(userId);
    if (!companyId) return { companyId: null, features: [] };
    const ent = await this.billing.getEntitlements(companyId);
    return { companyId, features: [...ent.features] };
  }

  /** Garante conta EMPRESA com plano de acesso que inclui a equipe. */
  private async requireCompanyWithTeam(companyId: string): Promise<void> {
    const user = await this.users.findById(companyId);
    if (!user || user.tipo !== UserType.EMPRESA) {
      throw new ForbiddenException("A gestão de equipe é exclusiva de contas de empresa.");
    }
    if (!(await this.billing.can(companyId, Feature.COMPANY_TEAM))) {
      throw new ForbiddenException(
        "A gestão de equipe faz parte dos planos de empresa. Assine um plano em Cobranças.",
      );
    }
  }
}
