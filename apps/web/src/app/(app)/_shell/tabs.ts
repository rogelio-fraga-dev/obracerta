/** Abas da área logada (PWA), na linguagem visual do `prototipo2` (§6.2). */
export interface TabItem {
  href: string;
  label: string;
  /** Glifo simples (sem dependência de lib de ícones nesta fase). */
  icon: string;
}

export const TABS: readonly TabItem[] = [
  { href: "/inicio", label: "Início", icon: "◆" },
  { href: "/pedidos", label: "Pedidos", icon: "◷" },
  { href: "/obras", label: "Obras", icon: "⬢" },
  { href: "/perfil", label: "Perfil", icon: "◉" },
] as const;
