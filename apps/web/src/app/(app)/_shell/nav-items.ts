import { Home, ClipboardList, HardHat, User, Search, CalendarDays, Receipt, LayoutDashboard, Users } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  Icon: any;
}

/**
 * Navegação primária — compartilhada entre a Sidebar (desktop) e a TabBar (mobile),
 * para as duas nunca divergirem. A TabBar usa só estes 4 itens (protótipo mobile).
 */
export const PRIMARY_NAV: NavItem[] = [
  { href: "/inicio", label: "Início", Icon: Home },
  { href: "/pedidos", label: "Pedidos", Icon: ClipboardList },
  { href: "/obras", label: "Obras", Icon: HardHat },
  { href: "/perfil", label: "Perfil", Icon: User },
];

/** Navegação secundária — só na Sidebar (desktop tem espaço para mais atalhos). */
export const SECONDARY_NAV: NavItem[] = [
  { href: "/buscar", label: "Buscar profissionais", Icon: Search },
  { href: "/agenda", label: "Minha agenda", Icon: CalendarDays },
  { href: "/cobrancas", label: "Cobranças", Icon: Receipt },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Painel", Icon: LayoutDashboard },
  { href: "/admin/obras", label: "Obras", Icon: HardHat },
  { href: "/admin/pedidos", label: "Pedidos", Icon: ClipboardList },
  { href: "/admin/usuarios", label: "Usuários", Icon: Users },
];
