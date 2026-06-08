import type { HTMLAttributes, Ref } from "react";
import { cn } from "./cn.js";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  /** Nome completo para gerar a inicial e a cor. */
  nome?: string;
  /** URL da imagem de perfil (fallback para inicial). */
  src?: string;
  size?: AvatarSize;
  ref?: Ref<HTMLDivElement>;
}

const sizeMap: Record<AvatarSize, { container: string; text: string; img: string }> = {
  xs: { container: "h-7 w-7", text: "text-xs", img: "h-7 w-7" },
  sm: { container: "h-9 w-9", text: "text-sm", img: "h-9 w-9" },
  md: { container: "h-11 w-11", text: "text-base", img: "h-11 w-11" },
  lg: { container: "h-14 w-14", text: "text-lg", img: "h-14 w-14" },
  xl: { container: "h-20 w-20", text: "text-2xl", img: "h-20 w-20" },
};

/** Cores geradas a partir do nome para consistência visual entre sessões. */
const AVATAR_COLORS = [
  "bg-orange-500 text-white",
  "bg-orange-700 text-white",
  "bg-primary text-white",
  "bg-orange-400 text-white",
  "bg-orange-800 text-white",
  "bg-dark text-cream",
];

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

/**
 * Avatar com inicial (ou foto). A cor de fundo é determinística a partir do nome
 * para que o mesmo usuário sempre tenha a mesma cor.
 */
export function Avatar({ nome, src, size = "md", className, ref, ...props }: AvatarProps) {
  const s = sizeMap[size];
  const inicial = (nome ?? "?").charAt(0).toUpperCase();
  const colorIdx = nome ? hashName(nome) % AVATAR_COLORS.length : 0;

  if (src) {
    return (
      <div
        ref={ref}
        className={cn(s.container, "relative shrink-0 overflow-hidden rounded-full", className)}
        {...props}
      >
        <img src={src} alt={nome ?? "Avatar"} className={cn(s.img, "rounded-full object-cover")} />
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={cn(
        s.container,
        "flex shrink-0 items-center justify-center rounded-full font-display font-black",
        AVATAR_COLORS[colorIdx],
        s.text,
        className,
      )}
      aria-hidden
      {...props}
    >
      {inicial}
    </div>
  );
}
