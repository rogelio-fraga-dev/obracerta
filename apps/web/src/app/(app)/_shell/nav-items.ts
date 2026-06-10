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
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

// Itens nomeados (reutilizados nos conjuntos por persona).
const INICIO: NavItem = { href: "/inicio", label: "Início", Icon: Home };
const PERFIL: NavItem = { href: "/perfil", label: "Perfil", Icon: User };
const PEDIDOS: NavItem = { href: "/pedidos", label: "Pedidos", Icon: ClipboardList };
const OBRAS: NavItem = { href: "/obras", label: "Obras", Icon: HardHat };
const BUSCAR: NavItem = { href: "/buscar", label: "Buscar profissionais", Icon: Search };
const AGENDA: NavItem = { href: "/agenda", label: "Minha agenda", Icon: CalendarDays };
const FERRAMENTAS: NavItem = { href: "/ferramentas", label: "Orçamentos e recibos", Icon: FileText };
const COBRANCAS: NavItem = { href: "/cobrancas", label: "Cobranças", Icon: Receipt };

export interface NavSet {
  primary: NavItem[];
  secondary: NavItem[];
}

// Conjuntos por persona — a navegação reflete o que cada conta faz no sistema.
const NAV_PROFISSIONAL: NavSet = {
  primary: [INICIO, PEDIDOS, OBRAS, PERFIL], // recebe pedidos, dá lances em obras
  secondary: [AGENDA, FERRAMENTAS, COBRANCAS],
};

const NAV_CONTRATANTE: NavSet = {
  primary: [INICIO, BUSCAR, PEDIDOS, PERFIL], // busca profissionais, agenda, publica obras
  secondary: [OBRAS, COBRANCAS],
};

/**
 * Navegação contextual por tipo de conta. Profissional recebe pedidos/dá lances e
 * tem ferramentas + agenda; contratante e **empresa** buscam profissionais e
 * publicam obras. Mantém a fonte única para Sidebar (desktop) e TabBar (mobile).
 */
export function navForTipo(tipo: string | undefined): NavSet {
  return tipo === "PROFISSIONAL" ? NAV_PROFISSIONAL : NAV_CONTRATANTE;
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

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Painel", Icon: LayoutDashboard },
  { href: "/admin/obras", label: "Obras", Icon: HardHat },
  { href: "/admin/pedidos", label: "Pedidos", Icon: ClipboardList },
  { href: "/admin/usuarios", label: "Usuários", Icon: Users },
];
