"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, type ButtonVariant } from "@obracerta/ui";
import { bff } from "@/lib/client";

interface ResolverOption {
  label: string;
  body: Record<string, unknown>;
  variant?: ButtonVariant;
}

/**
 * Dois botões de decisão para um item de fila (denúncia/apelação/reembolso).
 * Cada opção posta `{ ...payloadBase, ...body }` no endpoint do BFF e revalida.
 */
export function Resolver({
  action,
  payloadBase,
  options,
}: {
  action: string;
  payloadBase: Record<string, unknown>;
  options: ResolverOption[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function decide(body: Record<string, unknown>) {
    setError(null);
    setLoading(true);
    try {
      await bff.post(action, { ...payloadBase, ...body });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível concluir.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
      <div className="flex gap-2">
        {options.map((o) => (
          <Button
            key={o.label}
            size="sm"
            variant={o.variant ?? "primary"}
            onClick={() => decide(o.body)}
            disabled={loading}
          >
            {o.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
