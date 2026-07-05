"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input } from "@obracerta/ui";
import { bff } from "@/lib/client";
import { formatDateTimeBR } from "@/lib/format";

type RescheduleAction = "reschedule" | "reschedule-accept" | "reschedule-reject";

/** Agora em formato `datetime-local` (horário local) — bloqueia datas passadas no picker. */
function minDateTimeLocal(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

/**
 * Reagendamento bilateral de um pedido APROVADO: qualquer participante propõe uma
 * nova data; a **outra parte** confirma ou recusa. Quando há proposta pendente,
 * quem propôs vê "aguardando"; a outra parte vê Aceitar/Recusar.
 */
export function RescheduleCard({
  bookingId,
  meuId,
  dataServico,
  reagendamentoData,
  reagendamentoPor,
}: {
  bookingId: string;
  meuId: string;
  dataServico: string;
  reagendamentoData: string | null;
  reagendamentoPor: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [novaData, setNovaData] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(action: RescheduleAction, extra?: Record<string, unknown>) {
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

  function propor() {
    if (!novaData) return;
    const iso = new Date(novaData).toISOString();
    if (Date.parse(iso) <= Date.now()) {
      setError("Escolha uma data e hora no futuro.");
      return;
    }
    void send("reschedule", { novaData: iso }).then(() => {
      setOpen(false);
      setNovaData("");
    });
  }

  const pendente = reagendamentoData !== null;
  const souProponente = pendente && reagendamentoPor === meuId;

  return (
    <Card className="space-y-3">
      <div>
        <h3 className="font-display text-base font-black text-foreground">Reagendamento</h3>
        <p className="text-sm text-muted-foreground">Data atual: {formatDateTimeBR(dataServico)}</p>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      {pendente && !open ? (
        <div className="rounded-lg border border-primary/30 bg-primary/[0.04] p-3">
          <p className="text-sm font-bold text-foreground">
            Nova data proposta: {formatDateTimeBR(reagendamentoData)}
          </p>
          {souProponente ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Aguardando a confirmação da outra parte.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => void send("reschedule-accept")} disabled={loading}>
                Aceitar nova data
              </Button>
              {/* Contrapropor substitui a proposta (os papéis se invertem) — a
                  recusa deixa de ser um beco sem saída. */}
              <Button size="sm" variant="secondary" onClick={() => setOpen(true)} disabled={loading}>
                Propor outra data
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void send("reschedule-reject")}
                disabled={loading}
              >
                Recusar
              </Button>
            </div>
          )}
        </div>
      ) : open ? (
        <div className="space-y-3">
          <Field label="Nova data e hora">
            <Input
              type="datetime-local"
              min={minDateTimeLocal()}
              value={novaData}
              onChange={(e) => setNovaData(e.target.value)}
            />
          </Field>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setOpen(false)} disabled={loading}>
              Voltar
            </Button>
            <Button size="sm" onClick={propor} disabled={loading || !novaData}>
              {loading ? "Enviando…" : "Propor nova data"}
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
          Reagendar
        </Button>
      )}
    </Card>
  );
}
