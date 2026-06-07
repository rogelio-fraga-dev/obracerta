"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  type BookingStatus,
  type DeclineReason,
  declineReasonSchema,
  type UserType,
} from "@obracerta/shared";
import { Button, Field, Input } from "@obracerta/ui";
import { bff } from "@/lib/client";
import { type BookingAction, bookingActionsFor, DECLINE_REASON_UI } from "@/lib/booking-ui";

const DECLINE_REASONS = Object.keys(DECLINE_REASON_UI) as DeclineReason[];

/**
 * Ações da máquina de estados, por papel. A recusa abre um sub-form de motivo
 * (categorizado; OUTRO exige detalhe). Após agir, revalida a página.
 */
export function BookingActions({
  bookingId,
  status,
  tipo,
}: {
  bookingId: string;
  status: BookingStatus;
  tipo: UserType;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [motivo, setMotivo] = useState<DeclineReason>("AGENDA_INDISPONIVEL");
  const [detalhe, setDetalhe] = useState("");

  const actions = bookingActionsFor(status, tipo);
  if (actions.length === 0) return null;

  async function send(action: BookingAction, extra?: Record<string, unknown>) {
    setError(null);
    setLoading(true);
    try {
      await bff.post("/api/bookings/action", { id: bookingId, action, ...extra });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível concluir a ação.");
    } finally {
      setLoading(false);
    }
  }

  function confirmarRecusa() {
    const parsed = declineReasonSchema.safeParse(motivo);
    if (!parsed.success) return;
    if (motivo === "OUTRO" && detalhe.trim().length < 3) {
      setError("Descreva o motivo quando escolher Outro.");
      return;
    }
    void send("decline", { motivo, detalhe: detalhe.trim() || undefined });
  }

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      {declining ? (
        <div className="space-y-3 rounded-lg border border-border p-4">
          <Field label="Motivo da recusa">
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value as DeclineReason)}
              className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-foreground"
            >
              {DECLINE_REASONS.map((r) => (
                <option key={r} value={r}>
                  {DECLINE_REASON_UI[r]}
                </option>
              ))}
            </select>
          </Field>
          {motivo === "OUTRO" && (
            <Field label="Detalhe">
              <Input value={detalhe} onChange={(e) => setDetalhe(e.target.value)} />
            </Field>
          )}
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setDeclining(false)} disabled={loading}>
              Voltar
            </Button>
            <Button size="sm" onClick={confirmarRecusa} disabled={loading}>
              {loading ? "Enviando…" : "Confirmar recusa"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {actions.map((a) => (
            <Button
              key={a.action}
              variant={a.variant}
              onClick={() => (a.action === "decline" ? setDeclining(true) : void send(a.action))}
              disabled={loading}
            >
              {a.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
