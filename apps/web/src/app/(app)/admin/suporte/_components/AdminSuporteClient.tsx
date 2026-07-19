"use client";

import { useState, useTransition } from "react";
import type { AdminSupportTicket, SupportStatus } from "@obracerta/shared";
import { Badge, Button, Card, EmptyState, Textarea, Field, Select, type BadgeTone } from "@obracerta/ui";
import { LifeBuoy } from "lucide-react";
import { useToast } from "@/components/Toast";
import { formatDateTimeBR } from "@/lib/format";
import { closeSupportTicketAction, respondSupportTicketAction } from "../actions";

const STATUS_UI: Record<SupportStatus, { label: string; tone: BadgeTone }> = {
  ABERTO: { label: "Aberto", tone: "warning" },
  RESPONDIDO: { label: "Respondido", tone: "success" },
  FECHADO: { label: "Fechado", tone: "neutral" },
};

const CANNED_RESPONSES = [
  {
    titulo: "Instruções de redefinição de senha",
    texto: "Olá! Para redefinir sua senha, clique em 'Entrar' na página inicial e selecione 'Esqueci minha senha'. Insira seu e-mail cadastrado e enviaremos um link de recuperação imediatamente. Se não receber, verifique a caixa de spam.",
  },
  {
    titulo: "Dúvida sobre reembolso / CDC",
    texto: "Olá! O reembolso integral de planos pagos pode ser solicitado em até 7 dias úteis após a aprovação do pagamento, de acordo com o Código de Defesa do Consumidor, contanto que os recursos não tenham sido consumidos em sua totalidade. O estorno será creditado em sua fatura ou enviado via Pix conforme o método de pagamento original.",
  },
  {
    titulo: "Conduta inadequada / Termos de uso",
    texto: "Olá! Identificamos uma infração aos nossos Termos de Uso em sua conta. Solicitamos que revise as políticas de privacidade e conduta bilateral. Violações adicionais podem resultar em suspensão temporária ou exclusão permanente do seu perfil.",
  },
  {
    titulo: "Problemas com agendamento / Agenda travada",
    texto: "Olá! Caso sua agenda esteja aparecendo como indisponível ou ocorram conflitos de agendamento, acesse o painel 'Minha Agenda' e redefina os horários de atendimento semanal. Lembre-se que pedidos pendentes bloqueiam a agenda preventivamente.",
  },
];

/** Fila de chamados do suporte — responder e fechar. */
export function AdminSuporteClient({ tickets }: { tickets: AdminSupportTicket[] }) {
  const toast = useToast();
  const [ticketSelecionado, setTicketSelecionado] = useState<AdminSupportTicket | null>(null);
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
        setTicketSelecionado(null);
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
        setTicketSelecionado(null);
        toast.success("Chamado fechado.");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao fechar.");
      }
    });
  }

  if (tickets.length === 0) {
    return (
      <EmptyState
        icon={<LifeBuoy className="h-8 w-8" />}
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
              <Card className="p-4 space-y-3">
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
                  {t.mensagem.substring(0, 150)}{t.mensagem.length > 150 ? "..." : ""}
                </p>
                {t.resposta && (
                  <Badge tone="success" size="sm">✓ Chamado Respondido</Badge>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setTicketSelecionado(t);
                      setResposta(t.resposta ?? "");
                      setError(null);
                    }}
                  >
                    Abrir Chamado
                  </Button>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      {/* Modal / Dialog de Detalhes do Chamado */}
      {ticketSelecionado && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={ticketSelecionado.assunto}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setTicketSelecionado(null)} />
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-background p-6 shadow-[var(--shadow-xl)] animate-scale-in max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Chamado de Suporte ({ticketSelecionado.categoria})
                </span>
                <h2 className="font-display text-xl font-black text-foreground">{ticketSelecionado.assunto}</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Enviado por: <strong>{ticketSelecionado.autorNome}</strong> ({ticketSelecionado.autorEmail})
                  <br />
                  Data: {formatDateTimeBR(ticketSelecionado.criadoEm)}
                </p>
              </div>
              <Badge tone={STATUS_UI[ticketSelecionado.status].tone}>
                {STATUS_UI[ticketSelecionado.status].label}
              </Badge>
            </div>

            <div className="border-t border-border pt-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mensagem original:</span>
              <p className="mt-1.5 whitespace-pre-line rounded-lg bg-muted/40 p-4 text-sm text-foreground leading-relaxed">
                {ticketSelecionado.mensagem}
              </p>
            </div>

            {ticketSelecionado.resposta && (
              <div className="rounded-lg border border-success/30 bg-success/5 p-3">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-success-foreground">
                  Última resposta enviada:
                </span>
                <p className="mt-1 whitespace-pre-line text-sm text-foreground">{ticketSelecionado.resposta}</p>
              </div>
            )}

            {ticketSelecionado.status !== "FECHADO" && (
              <div className="border-t border-border pt-3 space-y-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Resposta Rápida (Mensagens Prontas):
                  </span>
                  <Select
                    onChange={(e) => {
                      const selected = CANNED_RESPONSES.find((r) => r.titulo === e.target.value);
                      if (selected) {
                        setResposta(selected.texto);
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>-- Selecione uma mensagem pronta para responder --</option>
                    {CANNED_RESPONSES.map((res) => (
                      <option key={res.titulo} value={res.titulo}>
                        {res.titulo}
                      </option>
                    ))}
                  </Select>
                </div>

                <Field label="Escreva sua resposta para o usuário:">
                  <Textarea
                    value={resposta}
                    onChange={(e) => setResposta(e.target.value)}
                    maxLength={4000}
                    rows={4}
                    placeholder="Digite a resposta do suporte..."
                  />
                </Field>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
              <div>
                {ticketSelecionado.status !== "FECHADO" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-danger hover:bg-danger/10"
                    onClick={() => fechar(ticketSelecionado.id)}
                    disabled={pending}
                  >
                    Fechar Chamado
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setTicketSelecionado(null)}
                  disabled={pending}
                >
                  Voltar
                </Button>
                {ticketSelecionado.status !== "FECHADO" && (
                  <Button
                    size="sm"
                    onClick={() => responder(ticketSelecionado.id)}
                    disabled={pending}
                  >
                    {pending ? "Enviando..." : "Responder Chamado"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
