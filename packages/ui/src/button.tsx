import type { ButtonHTMLAttributes, Ref } from "react";
import { cn } from "./cn.js";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  // React 19: function components accept `ref` as a regular prop (no forwardRef).
  ref?: Ref<HTMLButtonElement>;
}

const base =
  "inline-flex items-center justify-center gap-2 font-sans font-extrabold rounded-md " +
  "transition-colors duration-200 focus-visible:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 " +
  "disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-orange-400",
  secondary: "border-2 border-border text-foreground hover:bg-dark hover:text-cream",
  ghost: "text-foreground hover:bg-muted",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-base",
  lg: "h-14 px-8 text-base",
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
