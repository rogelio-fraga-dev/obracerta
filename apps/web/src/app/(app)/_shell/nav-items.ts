import type { LucideIcon } from "lucide-react";
import {
  Home,
  ClipboardList,
  HardHat,
  User,
  Search,
  CalendarDays,
  Receipt,
  FileText,
  LayoutDashboard,
  Users,
  ShieldAlert,
  Landmark,
  Star,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  /** Rótulo curto (≤8 chars) para contextos apertados. */
  shortLabel?: string;
  Icon: LucideIcon;
}

// Itens nomeados (reutilizados nos conjuntos por persona).
const INICIO: NavItem = { href: "/inicio", label: "Início", Icon: Home };
const PERFIL: NavItem = { href: "/perfil", label: "Perfil", Icon: User };
const PEDIDOS: NavItem = { href: "/pedidos", label: "Pedidos", Icon: ClipboardList };
const OBRAS: NavItem = { href: "/obras", label: "Obras", Icon: HardHat };
const BUSCAR: NavItem = { href: "/buscar", label: "Buscar profissionais", shortLabel: "Buscar", Icon: Search };
const AGENDA: NavItem = { href: "/agenda", label: "Minha agenda", shortLabel: "Agenda", Icon: CalendarDays };
const FERRAMENTAS: NavItem = { href: "/ferramentas", label: "Orçamentos e recibos", shortLabel: "Docs", Icon: FileText };
const COBRANCAS: NavItem = { href: "/cobrancas", label: "Cobranças", Icon: Receipt };
const AVALIACOES: NavItem = { href: "/avaliacoes", label: "Avaliações", Icon: Star };

export interface NavSet {
  primary: NavItem[];
  secondary: NavItem[];
}

// Conjuntos por persona — a navegação reflete o que cada conta faz no sistema.
const NAV_PROFISSIONAL: NavSet = {
  primary: [INICIO, PEDIDOS, OBRAS, PERFIL], // recebe pedidos, dá lances em obras
  secondary: [AGENDA, FERRAMENTAS, AVALIACOES, COBRANCAS],
};

const NAV_CONTRATANTE: NavSet = {
  primary: [INICIO, BUSCAR, PEDIDOS, PERFIL], // busca profissionais, agenda, publica obras
  secondary: [OBRAS, AVALIACOES, COBRANCAS],
};

// Empresa publica obras em escala — Obras vai para a navegação primária.
const NAV_EMPRESA: NavSet = {
  primary: [INICIO, BUSCAR, OBRAS, PERFIL],
  secondary: [PEDIDOS, AVALIACOES, COBRANCAS],
};

/**
 * Navegação contextual por tipo de conta. Profissional recebe pedidos/dá lances e
 * tem ferramentas + agenda; contratante busca e agenda; **empresa** publica obras em
 * escala (Obras na primária). Fonte única para Sidebar (desktop) e drawer (mobile).
 */
export function navForTipo(tipo: string | undefined): NavSet {
  switch (tipo) {
    case "PROFISSIONAL":
      return NAV_PROFISSIONAL;
    case "EMPRESA":
      return NAV_EMPRESA;
    default:
      return NAV_CONTRATANTE;
  }
}

/** Rótulo amigável do tipo de conta (inclui EMPRESA). */
export function tipoLabel(tipo: string | undefined, isAdmin = false): string {
  if (isAdmin) return "Administração";
  switch (tipo) {
    case "PROFISSIONAL":
      return "Profissional";
    case "EMPRESA":
      return "Empresa";
    default:
      return "Contratante";
  }
}

// Itens nomeados do painel administrativo (compostos abaixo p/ Sidebar e drawer).
const ADM_PAINEL: NavItem = { href: "/admin", label: "Painel admin", shortLabel: "Painel", Icon: LayoutDashboard };
const ADM_USUARIOS: NavItem = { href: "/admin/usuarios", label: "Gestão de usuários", shortLabel: "Usuários", Icon: Users };
const ADM_OBRAS: NavItem = { href: "/admin/obras", label: "Gestão de obras", shortLabel: "Obras", Icon: HardHat };
const ADM_PEDIDOS: NavItem = { href: "/admin/pedidos", label: "Gestão de pedidos", shortLabel: "Pedidos", Icon: ClipboardList };
const ADM_AVALIACOES: NavItem = { href: "/admin/avaliacoes", label: "Gestão de avaliações", shortLabel: "Reviews", Icon: Star };
const ADM_MODERACAO: NavItem = { href: "/admin/moderacao", label: "Moderação", Icon: ShieldAlert };
const ADM_FINANCEIRO: NavItem = { href: "/admin/financeiro", label: "Financeiro", shortLabel: "Financ.", Icon: Landmark };

/**
 * Painel administrativo — **fonte única** (Sidebar desktop + drawer mobile), com
 * todos os itens acessíveis nas duas superfícies.
 */
export const ADMIN_NAV: NavItem[] = [
  ADM_PAINEL,
  ADM_USUARIOS,
  ADM_OBRAS,
  ADM_PEDIDOS,
  ADM_AVALIACOES,
  ADM_MODERACAO,
  ADM_FINANCEIRO,
];
