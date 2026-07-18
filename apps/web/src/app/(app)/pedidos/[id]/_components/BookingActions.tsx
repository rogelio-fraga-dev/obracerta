"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  type BookingStatus,
  type DeclineReason,
  declineReasonSchema,
  type UserType,
} from "@obracerta/shared";
import { Button, ConfirmDialog, Field, Input, Select } from "@obracerta/ui";
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
  hideApprove = false,
}: {
  bookingId: string;
  status: BookingStatus;
  tipo: UserType;
  /** Esconde o "Aprovar" quando o plano não permite responder (o cadeado de upgrade fica na página). */
  hideApprove?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [motivo, setMotivo] = useState<DeclineReason>("AGENDA_INDISPONIVEL");
  const [detalhe, setDetalhe] = useState("");

  const actions = bookingActionsFor(status, tipo).filter(
    (a) => !(hideApprove && a.action === "approve"),
  );
  if (actions.length === 0) return null;

  /** Devolve `true` só em sucesso — o modal de confirmação fecha apenas nesse caso. */
  async function send(action: BookingAction, extra?: Record<string, unknown>): Promise<boolean> {
    setError(null);
    setLoading(true);
    try {
      await bff.post("/api/bookings/action", { id: bookingId, action, ...extra });
      router.refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível concluir a ação.");
      return false;
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
            <Select value={motivo} onChange={(e) => setMotivo(e.target.value as DeclineReason)}>
              {DECLINE_REASONS.map((r) => (
                <option key={r} value={r}>
                  {DECLINE_REASON_UI[r]}
                </option>
              ))}
            </Select>
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
              onClick={() => {
                if (a.action === "decline") setDeclining(true);
                else if (a.action === "cancel") setConfirmingCancel(true);
                else void send(a.action);
              }}
              disabled={loading}
            >
              {a.label}
            </Button>
          ))}
        </div>
      )}

      {/* Cancelamento é irreversível — pede confirmação. */}
      <ConfirmDialog
        open={confirmingCancel}
        title="Cancelar este pedido?"
        description="O pedido será encerrado para os dois lados e não poderá ser reaberto."
        confirmLabel="Sim, cancelar"
        cancelLabel="Manter pedido"
        loading={loading}
        onConfirm={async () => {
          // Falha mantém o modal aberto com o erro visível — fechar daria a
          // impressão de cancelado quando não foi.
          if (await send("cancel")) setConfirmingCancel(false);
        }}
        onClose={() => setConfirmingCancel(false)}
      />
    </div>
  );
}
