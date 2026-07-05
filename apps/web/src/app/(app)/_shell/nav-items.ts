import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Home,
  ClipboardList,
  HardHat,
  Heart,
  LifeBuoy,
  MapPin,
  User,
  Search,
  CalendarDays,
  Receipt,
  FileText,
  ScrollText,
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
const ORCAMENTOS: NavItem = { href: "/orcamentos", label: "Orçamentos", shortLabel: "Orçam.", Icon: ScrollText };
const COBRANCAS: NavItem = { href: "/cobrancas", label: "Cobranças", Icon: Receipt };
const AVALIACOES: NavItem = { href: "/avaliacoes", label: "Avaliações", Icon: Star };
const FAVORITOS: NavItem = { href: "/favoritos", label: "Favoritos", Icon: Heart };
const ENDERECOS: NavItem = { href: "/enderecos", label: "Endereços", shortLabel: "Endereços", Icon: MapPin };
const NOTIFICACOES: NavItem = { href: "/notificacoes", label: "Notificações", shortLabel: "Avisos", Icon: Bell };
const AJUDA: NavItem = { href: "/ajuda", label: "Ajuda e suporte", shortLabel: "Ajuda", Icon: LifeBuoy };

export interface NavSet {
  primary: NavItem[];
  secondary: NavItem[];
}

// Conjuntos por persona — a navegação reflete o que cada conta faz no sistema.
const NAV_PROFISSIONAL: NavSet = {
  primary: [INICIO, PEDIDOS, OBRAS, PERFIL], // recebe pedidos, dá lances em obras
  // "Orçamentos e recibos" (FERRAMENTAS) já reúne os serviços fechados + o gerador
  // de documentos — sem item "Orçamentos" separado para não duplicar.
  secondary: [NOTIFICACOES, AGENDA, FERRAMENTAS, AVALIACOES, ENDERECOS, COBRANCAS, AJUDA],
};

const NAV_CONTRATANTE: NavSet = {
  primary: [INICIO, BUSCAR, PEDIDOS, PERFIL], // busca profissionais, agenda, publica obras
  secondary: [NOTIFICACOES, OBRAS, ORCAMENTOS, FAVORITOS, AVALIACOES, ENDERECOS, COBRANCAS, AJUDA],
};

// Empresa publica obras em escala — Obras vai para a navegação primária.
const NAV_EMPRESA: NavSet = {
  primary: [INICIO, BUSCAR, OBRAS, PERFIL],
  secondary: [NOTIFICACOES, PEDIDOS, ORCAMENTOS, FAVORITOS, AVALIACOES, ENDERECOS, COBRANCAS, AJUDA],
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
const ADM_SUPORTE: NavItem = { href: "/admin/suporte", label: "Suporte", Icon: LifeBuoy };

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
  ADM_SUPORTE,
];
