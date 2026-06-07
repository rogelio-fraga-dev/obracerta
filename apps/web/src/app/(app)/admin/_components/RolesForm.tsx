"use client";

import { useState } from "react";
import { UserRole, type UserRole as UserRoleType } from "@obracerta/shared";
import { Badge, Button, Card, Field, Input } from "@obracerta/ui";
import { bff } from "@/lib/client";

const ROLES: { value: UserRoleType; label: string }[] = [
  { value: UserRole.ADMIN, label: "Admin" },
  { value: UserRole.MODERADOR, label: "Moderador" },
  { value: UserRole.FINANCEIRO, label: "Financeiro" },
];

/** Concede/revoga papéis de um usuário por id (substitui o conjunto inteiro). */
export function RolesForm() {
  const [userId, setUserId] = useState("");
  const [selected, setSelected] = useState<Set<UserRoleType>>(new Set());
  const [salvo, setSalvo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggle(role: UserRoleType) {
    setSalvo(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  }

  async function salvar() {
    setError(null);
    setLoading(true);
    try {
      await bff.post("/api/admin/roles", { userId, roles: [...selected] });
      setSalvo(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar os papéis.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="space-y-3">
      <h2 className="font-display text-lg font-black text-foreground">Papéis de usuário</h2>
      {error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <Field label="ID do usuário">
        <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="uuid do usuário" />
      </Field>
      <div className="flex flex-wrap gap-2">
        {ROLES.map((r) => (
          <button
            key={r.value}
            type="button"
            aria-pressed={selected.has(r.value)}
            onClick={() => toggle(r.value)}
            className={`rounded-full border-2 px-3 py-1 text-sm font-semibold transition-colors ${
              selected.has(r.value)
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:border-primary"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between">
        {salvo && <Badge tone="success">Papéis atualizados</Badge>}
        <Button className="ml-auto" onClick={salvar} disabled={loading || !userId.trim()}>
          {loading ? "Salvando…" : "Salvar papéis"}
        </Button>
      </div>
    </Card>
  );
}
