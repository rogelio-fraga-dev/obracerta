import { cn } from "./cn.js";

export interface SkeletonProps {
  className?: string;
  /** Formato pré-definido. */
  variant?: "text" | "circle" | "card" | "rect";
}

/**
 * Skeleton loading placeholder com animação shimmer.
 */
export function Skeleton({ className, variant = "rect" }: SkeletonProps) {
  const variantClasses = {
    text: "h-4 w-3/4 rounded-md",
    circle: "h-11 w-11 rounded-full",
    card: "h-28 w-full rounded-xl",
    rect: "h-8 w-full rounded-lg",
  };

  return (
    <div
      aria-hidden
      className={cn(
        "animate-shimmer bg-muted",
        variantClasses[variant],
        className,
      )}
    />
  );
}

/** Esqueleto de card inteiro para loading de listas. */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3 rounded-xl border border-border bg-background p-6", className)}>
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" />
          <Skeleton variant="text" className="w-1/2" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}
