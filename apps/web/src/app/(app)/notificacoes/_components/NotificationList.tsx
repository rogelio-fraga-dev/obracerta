"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Notification, NotificationType } from "@obracerta/shared";
import { Button, Card, EmptyState } from "@obracerta/ui";
import { ArrowRight, Bell, Hammer, HardHat, Star, CreditCard, Megaphone, type LucideIcon } from "lucide-react";
import { formatRelativeBR } from "@/lib/format";
import { markAllNotificationsReadAction, markNotificationReadAction } from "../actions";

/** Ícone por categoria — leitura rápida do que aconteceu. */
const TIPO_ICON: Record<NotificationType, LucideIcon> = {
  PEDIDO: Hammer,
  OBRA: HardHat,
  AVALIACAO: Star,
  COBRANCA: CreditCard,
  SISTEMA: Megaphone,
};

/**
 * Lista de notificações: clique marca como lida e navega para o destino.
 * Não lidas ganham destaque (borda + fundo).
 */
export function NotificationList({ notificacoes }: { notificacoes: Notification[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  function abrir(n: Notification) {
    startTransition(async () => {
      if (!n.lida) {
        await markNotificationReadAction(n.id).catch(() => {
          /* marcar como lida é best-effort — a navegação continua */
        });
      }
      if (n.link) router.push(n.link);
    });
  }

  function lerTodas() {
    startTransition(async () => {
      await markAllNotificationsReadAction().catch(() => undefined);
    });
  }

  if (notificacoes.length === 0) {
    return (
      <EmptyState
        icon={<Bell className="h-8 w-8" />}
        title="Nada por aqui ainda"
        description="Avisos sobre pedidos, obras, mensagens e avaliações aparecem nesta lista."
      />
    );
  }

  return (
    <div className="space-y-3">
      {naoLidas > 0 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {naoLidas} não lida{naoLidas > 1 ? "s" : ""}
          </p>
          <Button size="sm" variant="secondary" onClick={lerTodas} disabled={pending}>
            Marcar todas como lidas
          </Button>
        </div>
      )}
      <ul className="space-y-2">
        {notificacoes.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => abrir(n)}
              disabled={pending}
              className="block w-full text-left"
            >
              <Card
                interactive
                className={`flex items-start gap-3 p-4 ${
                  n.lida ? "" : "border-primary/40 bg-primary/[0.04]"
                }`}
              >
                {(() => {
                  const Icon = TIPO_ICON[n.tipo];
                  return <Icon aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-primary" />;
                })()}
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className={`text-sm ${n.lida ? "font-semibold text-foreground/80" : "font-bold text-foreground"}`}>
                      {n.titulo}
                    </span>
                    {!n.lida && (
                      <span aria-label="não lida" className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </span>
                  {n.corpo && (
                    <span className="mt-0.5 block text-sm text-muted-foreground">{n.corpo}</span>
                  )}
                  <span className="mt-1 block text-xs text-muted-foreground/80">
                    {formatRelativeBR(n.criadoEm)}
                  </span>
                </span>
                {n.link && <ArrowRight aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />}
              </Card>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
