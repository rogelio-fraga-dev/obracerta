"use client";

import { useState } from "react";
import type { NotificationPreference, NotificationType } from "@obracerta/shared";
import { Card, Switch } from "@obracerta/ui";
import { bff } from "@/lib/client";

/** Rótulos amigáveis de cada categoria de notificação. */
const LABELS: Record<NotificationType, string> = {
  PEDIDO: "Pedidos",
  OBRA: "Obras e lances",
  AVALIACAO: "Avaliações",
  COBRANCA: "Cobranças e pagamentos",
  SISTEMA: "Avisos do sistema",
};

/**
 * Preferências de push por categoria. O sino in-app sempre registra tudo; aqui o
 * usuário escolhe o que também chega por Web Push. Atualização otimista com
 * rollback em erro.
 */
export function NotificationPreferences({ initial }: { initial: NotificationPreference[] }) {
  const [prefs, setPrefs] = useState(initial);
  const [saving, setSaving] = useState<NotificationType | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle(tipo: NotificationType, pushEnabled: boolean) {
    setError(null);
    setSaving(tipo);
    setPrefs((p) => p.map((x) => (x.tipo === tipo ? { ...x, pushEnabled } : x)));
    try {
      const updated = await bff.post<NotificationPreference[]>(
        "/api/notifications/preferences",
        { tipo, pushEnabled },
      );
      setPrefs(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar a preferência.");
      setPrefs((p) => p.map((x) => (x.tipo === tipo ? { ...x, pushEnabled: !pushEnabled } : x)));
    } finally {
      setSaving(null);
    }
  }

  return (
    <Card className="space-y-3">
      <div>
        <h2 className="font-display text-lg font-black text-foreground">
          Preferências de notificação
        </h2>
        <p className="text-sm text-muted-foreground">
          Escolha o que também chega por push. O sino aqui sempre registra tudo.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <ul className="divide-y divide-border">
        {prefs.map((p) => (
          <li key={p.tipo} className="flex items-center justify-between gap-3 py-2.5">
            <span className="text-sm font-semibold text-foreground">{LABELS[p.tipo]}</span>
            <Switch
              checked={p.pushEnabled}
              onCheckedChange={(next) => void toggle(p.tipo, next)}
              aria-label={`Push de ${LABELS[p.tipo]}`}
              disabled={saving === p.tipo}
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}
