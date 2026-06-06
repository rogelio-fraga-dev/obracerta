import { z } from "zod";
import { userRoleSchema } from "./enums.js";

/**
 * Contratos administrativos (roadmap Fase 6). Definição dos papéis de um usuário
 * (substitui o conjunto inteiro — idempotente). Ação restrita a ADMIN (RolesGuard).
 */
export const setUserRolesSchema = z.object({
  roles: z.array(userRoleSchema).max(3),
});
export type SetUserRolesInput = z.infer<typeof setUserRolesSchema>;

const contagem = z.number().int().nonnegative();
const taxa = z.number().min(0).max(1);

/**
 * Snapshot de saúde do produto (roadmap §10/Melhoria #4). Métricas agregadas
 * (read-only) para o dashboard admin: ativação, conclusão, North Star (obras
 * concluídas e avaliadas pelos dois lados), churn de assinatura, moderação e obras.
 */
export const healthSnapshotSchema = z.object({
  usuarios: z.object({
    total: contagem,
    profissionais: contagem,
    contratantes: contagem,
    ativos: contagem,
    suspensos: contagem,
  }),
  ativacao: z.object({
    profissionaisComPerfil: contagem,
    profissionaisAtivados: contagem, // completude >= 50%
  }),
  agendamentos: z.object({
    total: contagem,
    concluidos: contagem,
    taxaConclusao: taxa,
  }),
  reputacao: z.object({
    avaliacoesReveladas: contagem,
    /** North Star: pedidos com avaliação dos DOIS lados (revelada). */
    obrasAvaliadasBilateralmente: contagem,
  }),
  monetizacao: z.object({
    assinaturasAtivas: contagem, // EM_GRACA + ATIVA
    assinaturasCanceladas: contagem,
    churnPct: taxa,
    mrrCentavos: contagem, // soma do valor das assinaturas ATIVA
  }),
  moderacao: z.object({
    denunciasAbertas: contagem,
    suspensoesAtivas: contagem,
  }),
  obras: z.object({
    abertas: contagem,
    adjudicadas: contagem,
  }),
});
export type HealthSnapshot = z.infer<typeof healthSnapshotSchema>;
