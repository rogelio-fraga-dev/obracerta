import type { HTMLAttributes, Ref } from "react";
import { cn } from "./cn.js";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "primary";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: "sm" | "md";
  ref?: Ref<HTMLSpanElement>;
}

const tones: Record<BadgeTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/12 text-danger",
  info: "bg-info/12 text-info",
  primary: "bg-primary/10 text-primary",
};

const sizeClasses = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-2.5 py-0.5 text-xs",
};

/** Selo de status do Design System (pílula colorida por tom semântico). */
export function Badge({ tone = "neutral", size = "md", className, ref, ...props }: BadgeProps) {
  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-bold whitespace-nowrap",
        tones[tone],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
