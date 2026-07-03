import type { BookingStatus } from "@obracerta/shared";

/** Etapas do caminho feliz do pedido. Estados terminais "fora do trilho" não usam o stepper. */
const STEPS: { status: BookingStatus; label: string }[] = [
  { status: "PENDENTE", label: "Solicitado" },
  { status: "APROVADO", label: "Aprovado" },
  { status: "INICIADO", label: "Em andamento" },
  { status: "CONCLUIDO", label: "Concluído" },
];

const ORDER: Partial<Record<BookingStatus, number>> = {
  PENDENTE: 0,
  APROVADO: 1,
  INICIADO: 2,
  CONCLUIDO: 3,
};

/**
 * Visualiza a posição do pedido na máquina de estados (Solicitado → … → Concluído).
 * Para estados terminais fora do trilho (recusado/cancelado/expirado) retorna `null`.
 */
export function BookingStepper({ status }: { status: BookingStatus }) {
  const current = ORDER[status];
  if (current === undefined) return null;

  return (
    <ol className="mt-5 flex items-center">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step.status} className="flex flex-1 flex-col items-center last:flex-none">
            <div className="flex w-full items-center">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                  done
                    ? "bg-primary text-primary-foreground"
                    : active
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/15"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              {i < STEPS.length - 1 && (
                <span className={`h-0.5 flex-1 ${i < current ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
            <span
              className={`mt-1.5 text-center text-[10px] font-semibold leading-tight sm:text-[11px] ${
                active ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
