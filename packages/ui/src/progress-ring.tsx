import { cn } from "./cn.js";

export interface ProgressRingProps {
  /** Porcentagem 0–100. */
  value: number;
  /** Tamanho em pixels (largura = altura). */
  size?: number;
  /** Espessura do traço. */
  strokeWidth?: number;
  /** Cor do traço preenchido. */
  tone?: "primary" | "success" | "warning" | "danger";
  /** Label central (ex.: "85%"). Se omitido, mostra o valor + %. */
  label?: string;
  className?: string;
}

const toneColors = {
  primary: "stroke-primary",
  success: "stroke-success",
  warning: "stroke-warning",
  danger: "stroke-danger",
};

/**
 * Anel de progresso SVG animado. Usa CSS animation + `stroke-dasharray` +
 * custom properties para animar de 0 ao valor.
 */
export function ProgressRing({
  value,
  size = 80,
  strokeWidth = 6,
  tone = "primary",
  label,
  className,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-border"
        />
        {/* Filled arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          className={cn(toneColors[tone], "animate-progress-ring")}
          style={{
            "--ring-circumference": circumference,
            "--ring-offset": offset,
            strokeDashoffset: offset,
          } as React.CSSProperties}
        />
      </svg>
      <span className="absolute font-display text-lg font-black text-foreground">
        {label ?? `${Math.round(clamped)}%`}
      </span>
    </div>
  );
}
