"use client";

import { useState, useTransition } from "react";
import {
  createSupportTicketSchema,
  type SupportCategory,
  type SupportStatus,
  type SupportTicket,
} from "@obracerta/shared";
import { Badge, Button, Card, Field, Input, Select, Textarea, type BadgeTone } from "@obracerta/ui";
import { useToast } from "@/components/Toast";
import { formatRelativeBR } from "@/lib/format";
import { createSupportTicketAction } from "../actions";

const CATEGORIAS: { value: SupportCategory; label: string }[] = [
  { value: "CONTA", label: "Minha conta" },
  { value: "PEDIDO", label: "Um pedido" },
  { value: "OBRA", label: "Uma obra" },
  { value: "PAGAMENTO", label: "Pagamento / plano" },
  { value: "DENUNCIA", label: "Denúncia" },
  { value: "OUTRO", label: "Outro assunto" },
];

const STATUS_UI: Record<SupportStatus, { label: string; tone: BadgeTone }> = {
  ABERTO: { label: "Aguardando resposta", tone: "warning" },
  RESPONDIDO: { label: "Respondido", tone: "success" },
  FECHADO: { label: "Encerrado", tone: "neutral" },
};

/** Formulário de chamado + histórico dos meus chamados (com resposta do suporte). */
export function SupportClient({ tickets }: { tickets: SupportTicket[] }) {
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [categoria, setCategoria] = useState<SupportCategory>("CONTA");
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function enviar() {
    setError(null);
    const parsed = createSupportTicketSchema.safeParse({ categoria, assunto, mensagem });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }
    startTransition(async () => {
      try {
        await createSupportTicketAction(parsed.data);
        setAssunto("");
        setMensagem("");
        setShowForm(false);
        toast.success("Chamado aberto — respondemos por aqui e no sino.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao abrir o chamado.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-black text-foreground">Falar com o suporte</h2>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            + Abrir chamado
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="space-y-4">
          {error && (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
              {error}
            </p>
          )}
          <Field label="Sobre o que é?">
            <Select value={categoria} onChange={(e) => setCategoria(e.target.value as SupportCategory)}>
              {CATEGORIAS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Assunto">
            <Input
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              maxLength={140}
              placeholder="Ex.: Não consigo enviar foto no portfólio"
            />
          </Field>
          <Field label="Descreva o problema" hint="Quanto mais detalhes, mais rápida a resposta">
            <Textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              maxLength={4000}
              placeholder="Conte o que aconteceu, em qual tela e o que você esperava…"
            />
          </Field>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={enviar} disabled={pending}>
              {pending ? "Enviando…" : "Enviar chamado"}
            </Button>
            <Button variant="secondary" onClick={() => setShowForm(false)} disabled={pending}>
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {tickets.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-display text-lg font-black text-foreground">Meus chamados</h3>
          <ul className="space-y-3">
            {tickets.map((t) => {
              const ui = STATUS_UI[t.status];
              return (
                <li key={t.id}>
                  <Card className="space-y-2 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-foreground">{t.assunto}</span>
                      <Badge tone={ui.tone} size="sm">{ui.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{t.mensagem}</p>
                    {t.resposta && (
                      <div className="rounded-lg border border-success/30 bg-success/5 p-3">
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                          Resposta do suporte
                        </p>
                        <p className="mt-1 whitespace-pre-line text-sm text-foreground">{t.resposta}</p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground/80">
                      Aberto {formatRelativeBR(t.criadoEm)}
                      {t.respondidoEm ? ` · respondido ${formatRelativeBR(t.respondidoEm)}` : ""}
                    </p>
                  </Card>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
