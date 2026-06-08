import type { ButtonHTMLAttributes, Ref } from "react";
import { cn } from "./cn.js";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  ref?: Ref<HTMLButtonElement>;
}

const base =
  "inline-flex items-center justify-center gap-2 font-sans font-extrabold rounded-lg " +
  "transition-all duration-200 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 " +
  "disabled:opacity-50 disabled:pointer-events-none " +
  "active:scale-[0.98]";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-orange-400 hover:shadow-[var(--shadow-md)] hover:scale-[1.02]",
  secondary:
    "border-2 border-border text-foreground hover:bg-dark hover:text-cream hover:shadow-[var(--shadow-sm)]",
  ghost: "text-foreground hover:bg-muted",
  danger:
    "bg-danger text-white hover:bg-red-700 hover:shadow-[var(--shadow-md)] hover:scale-[1.02]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm rounded-md",
  md: "h-11 px-6 text-base",
  lg: "h-14 px-8 text-lg",
};

/**
 * Base button of the Design System.
 * Styling is driven entirely by Tailwind classes mapped to design tokens.
 */
export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ref,
  ...props
}: ButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
