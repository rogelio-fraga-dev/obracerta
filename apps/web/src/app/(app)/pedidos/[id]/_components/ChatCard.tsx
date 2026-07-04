"use client";

import { useEffect, useRef, useState } from "react";
import type { BookingMessage } from "@obracerta/shared";
import { Button, Card } from "@obracerta/ui";
import { bff } from "@/lib/client";

/** Intervalo do polling de novas mensagens (sem websocket no MVP). */
const POLL_MS = 8000;

/**
 * Chat do pedido — conversa centralizada entre as partes, aberta após o aceite.
 * Polling leve a cada 8s; envio otimista simples (recarrega a lista ao enviar).
 */
export function ChatCard({
  bookingId,
  meuId,
  initialMensagens,
  outraParte,
}: {
  bookingId: string;
  meuId: string;
  initialMensagens: BookingMessage[];
  outraParte: string;
}) {
  const [mensagens, setMensagens] = useState<BookingMessage[]>(initialMensagens);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Rola para a última mensagem quando a lista muda (dentro do container do chat).
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [mensagens.length]);

  // Polling: busca novas mensagens periodicamente enquanto a tela está aberta.
  useEffect(() => {
    const id = setInterval(() => {
      bff
        .get<BookingMessage[]>(`/api/bookings/${bookingId}/mensagens`)
        .then(setMensagens)
        .catch(() => {
          /* falha transitória de rede: mantém as mensagens atuais */
        });
    }, POLL_MS);
    return () => clearInterval(id);
  }, [bookingId]);

  async function enviar() {
    const t = texto.trim();
    if (!t || sending) return;
    setError(null);
    setSending(true);
    try {
      const nova = await bff.post<BookingMessage>(`/api/bookings/${bookingId}/mensagens`, {
        texto: t,
      });
      setMensagens((prev) => [...prev, nova]);
      setTexto("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao enviar a mensagem.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="space-y-3 p-4 sm:p-5">
      <div>
        <h2 className="font-display text-lg font-black text-foreground">Conversa</h2>
        <p className="text-xs text-muted-foreground">
          Combine os detalhes com {outraParte.toLowerCase()} — tudo fica registrado neste pedido.
        </p>
      </div>

      <div
        ref={listRef}
        className="max-h-80 space-y-2 overflow-y-auto rounded-lg bg-muted/40 p-3"
        aria-live="polite"
      >
        {mensagens.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma mensagem ainda. Diga um oi e combine os detalhes 👋
          </p>
        ) : (
          mensagens.map((m) => {
            const minha = m.senderId === meuId;
            return (
              <div key={m.id} className={`flex ${minha ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                    minha
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm border border-border bg-background text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-line break-words">{m.texto}</p>
                  <p
                    className={`mt-0.5 text-right text-[10px] ${
                      minha ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    {new Date(m.criadoEm).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void enviar();
        }}
      >
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          maxLength={2000}
          placeholder="Escreva sua mensagem…"
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-orange-200"
        />
        <Button type="submit" size="sm" className="h-auto shrink-0" disabled={sending || !texto.trim()}>
          {sending ? "…" : "Enviar"}
        </Button>
      </form>
    </Card>
  );
}
