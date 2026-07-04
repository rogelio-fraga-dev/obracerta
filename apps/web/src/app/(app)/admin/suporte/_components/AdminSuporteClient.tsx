"use client";

import { useState, useTransition } from "react";
import type { AdminSupportTicket, SupportStatus } from "@obracerta/shared";
import { Badge, Button, Card, EmptyState, Textarea, type BadgeTone } from "@obracerta/ui";
import { useToast } from "@/components/Toast";
import { formatDateTimeBR } from "@/lib/format";
import { closeSupportTicketAction, respondSupportTicketAction } from "../actions";

const STATUS_UI: Record<SupportStatus, { label: string; tone: BadgeTone }> = {
  ABERTO: { label: "Aberto", tone: "warning" },
  RESPONDIDO: { label: "Respondido", tone: "success" },
  FECHADO: { label: "Fechado", tone: "neutral" },
};

/** Fila de chamados do suporte — responder e fechar. */
export function AdminSuporteClient({ tickets }: { tickets: AdminSupportTicket[] }) {
  const toast = useToast();
  const [respondendoId, setRespondendoId] = useState<string | null>(null);
  const [resposta, setResposta] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function responder(id: string) {
    if (!resposta.trim()) {
      setError("Escreva a resposta antes de enviar.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await respondSupportTicketAction(id, resposta.trim());
        setRespondendoId(null);
        setResposta("");
        toast.success("Resposta enviada — o usuário foi notificado.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao responder.");
      }
    });
  }

  function fechar(id: string) {
    startTransition(async () => {
      try {
        await closeSupportTicketAction(id);
        toast.success("Chamado fechado.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao fechar.");
      }
    });
  }

  if (tickets.length === 0) {
    return (
      <EmptyState
        icon="🛟"
        title="Fila limpa"
        description="Nenhum chamado de suporte no momento."
      />
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <ul className="space-y-3">
        {tickets.map((t) => {
          const ui = STATUS_UI[t.status];
          return (
            <li key={t.id}>
              <Card className="space-y-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-foreground">{t.assunto}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.autorNome ?? "—"}
                      {t.autorEmail ? ` · ${t.autorEmail}` : ""} · {t.categoria} ·{" "}
                      {formatDateTimeBR(t.criadoEm)}
                    </p>
                  </div>
                  <Badge tone={ui.tone} size="sm">{ui.label}</Badge>
                </div>
                <p className="whitespace-pre-line rounded-lg bg-muted/40 p-3 text-sm text-foreground">
                  {t.mensagem}
                </p>
                {t.resposta && (
                  <div className="rounded-lg border border-success/30 bg-success/5 p-3">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                      Resposta enviada
                    </p>
                    <p className="mt-1 whitespace-pre-line text-sm text-foreground">{t.resposta}</p>
                  </div>
                )}
                {respondendoId === t.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={resposta}
                      onChange={(e) => setResposta(e.target.value)}
                      maxLength={4000}
                      placeholder="Escreva a resposta ao usuário…"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => responder(t.id)} disabled={pending}>
                        {pending ? "Enviando…" : "Enviar resposta"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setRespondendoId(null)} disabled={pending}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {t.status !== "FECHADO" && (
                      <Button
                        size="sm"
                        variant={t.status === "ABERTO" ? "primary" : "secondary"}
                        onClick={() => {
                          setRespondendoId(t.id);
                          setResposta("");
                        }}
                        disabled={pending}
                      >
                        {t.resposta ? "Responder de novo" : "Responder"}
                      </Button>
                    )}
                    {t.status !== "FECHADO" && (
                      <Button size="sm" variant="ghost" onClick={() => fechar(t.id)} disabled={pending}>
                        Fechar chamado
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
