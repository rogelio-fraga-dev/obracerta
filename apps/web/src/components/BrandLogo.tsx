import { cn } from "@obracerta/ui";

/**
 * Logo da marca **ciente do tema**: mostra a variante padrão (texto grafite) no
 * modo claro e a variante creme (`*-dark.png`) no modo escuro. A troca é 100%
 * CSS (via `:root[data-theme="dark"]` no globals) — sem flash e sem depender de
 * JS/estado, então funciona em Server Components. As duas `<img>` coexistem no
 * DOM; só a do tema ativo é exibida.
 *
 * `variant`: `full` = logo com wordmark; `mark` = só o ícone.
 */
export function BrandLogo({
  variant = "full",
  alt,
  className,
}: {
  variant?: "full" | "mark";
  alt: string;
  className?: string;
}) {
  const base = variant === "mark" ? "obracerta-mark" : "obracerta-logo";
  const size =
    variant === "mark" ? { width: 310, height: 250 } : { width: 1120, height: 305 };
  return (
    <>
      <img
        src={`/brand/${base}.png`}
        alt={alt}
        {...size}
        className={cn("brand-logo-light", className)}
      />
      <img
        src={`/brand/${base}-dark.png`}
        alt=""
        aria-hidden
        {...size}
        className={cn("brand-logo-dark", className)}
      />
    </>
  );
}
