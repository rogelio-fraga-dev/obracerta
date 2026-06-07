import type { HTMLAttributes, Ref } from "react";
import { cn } from "./cn.js";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  ref?: Ref<HTMLSpanElement>;
}

const tones: Record<BadgeTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/12 text-danger",
  info: "bg-info/12 text-info",
};

/** Selo de status do Design System (pílula colorida por tom semântico). */
export function Badge({ tone = "neutral", className, ref, ...props }: BadgeProps) {
  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
