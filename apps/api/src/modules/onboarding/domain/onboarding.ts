/**
 * Onboarding (roadmap §5). Sequência de mensagens progressivas e checklist —
 * tudo puro/testável. O agendamento (BullMQ) e o envio (NotificationProvider)
 * ficam na aplicação/infra.
 */

const MS_PER_DAY = 86_400_000;

export interface OnboardingStep {
  dia: number;
  chave: string;
  texto: string;
}

/** Mensagens progressivas D1/D3/D5/D7. */
export const ONBOARDING_SEQUENCE: readonly OnboardingStep[] = [
  { dia: 1, chave: "boas-vindas", texto: "Bem-vindo! Complete seu perfil para aparecer nas buscas." },
  { dia: 3, chave: "foto", texto: "Perfis com foto recebem mais contatos — adicione a sua." },
  { dia: 5, chave: "especialidades", texto: "Liste suas especialidades para ser encontrado." },
  { dia: 7, chave: "agenda", texto: "Configure sua agenda e comece a receber pedidos." },
];

/** Atraso (ms) de um passo. `speedupFactor` acelera em dev/teste (1 = real). */
export function stepDelayMs(dia: number, speedupFactor = 1): number {
  return Math.round((dia * MS_PER_DAY) / Math.max(speedupFactor, 1));
}

export interface ChecklistState {
  temPerfil: boolean;
  temEspecialidades: boolean;
  temFoto: boolean;
  completudePct: number;
}

export interface ChecklistItem {
  chave: string;
  titulo: string;
  feito: boolean;
}

export function buildChecklist(state: ChecklistState): ChecklistItem[] {
  return [
    { chave: "perfil", titulo: "Criar conta e perfil", feito: state.temPerfil },
    { chave: "especialidades", titulo: "Adicionar especialidades", feito: state.temEspecialidades },
    { chave: "foto", titulo: "Enviar foto de perfil", feito: state.temFoto },
    { chave: "completo", titulo: "Perfil 100% completo", feito: state.completudePct >= 100 },
  ];
}
