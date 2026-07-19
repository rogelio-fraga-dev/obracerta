"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addCompanyMemberSchema, type CompanyTeam } from "@obracerta/shared";
import { Avatar, Badge, Button, Card, Field, Input } from "@obracerta/ui";
import { bff } from "@/lib/client";
import {
  ProfessionalSearchField,
  type SelectedProfessional,
} from "../../pedidos/novo/_components/ProfessionalSearchField";

/**
 * Gestão da equipe (client): membros com acesso (convite por e-mail) e roster
 * de profissionais (via busca real). Mutations pelo BFF; `router.refresh()`
 * revalida a visão server-side após cada ação.
 */
export function EquipeClient({ team }: { team: CompanyTeam }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Formulário de membro
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");

  // Vínculo de profissional
  const [profissional, setProfissional] = useState<SelectedProfessional | null>(null);

  async function run(action: () => Promise<unknown>) {
    setError(null);
    setLoading(true);
    try {
      await action();
      router.refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível concluir a ação.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  const addMember = async () => {
    const parsed = addCompanyMemberSchema.safeParse({ nome, email, papel: "GESTOR" });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }
    if (await run(() => bff.post("/api/company/members", parsed.data))) {
      setNome("");
      setEmail("");
    }
  };

  const addProfissional = async () => {
    if (!profissional) {
      setError("Busque e selecione um profissional pelo nome.");
      return;
    }
    if (await run(() => bff.post("/api/company/professionals", { professionalId: profissional.id }))) {
      setProfissional(null);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      {/* ── Membros com acesso ── */}
      <Card className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-black text-foreground">Pessoas com acesso</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Convide por e-mail. Se a pessoa já tem conta na plataforma, o acesso é imediato: ela
            publica e acompanha as obras da empresa pela própria conta (aba Obras). Sem conta, o
            vínculo acontece quando ela se cadastrar com este e-mail.
          </p>
        </div>

        {team.membros.length > 0 && (
          <ul className="space-y-2">
            {team.membros.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-3 rounded-xl border border-border p-3"
              >
                <Avatar nome={m.nome} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">{m.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                </div>
                <Badge tone={m.userId ? "success" : "warning"} size="sm">
                  {m.userId ? "Acesso ativo" : "Aguardando cadastro"}
                </Badge>
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-danger"
                  disabled={loading}
                  onClick={() => run(() => bff.post("/api/company/members/remove", { id: m.id }))}
                >
                  Remover
                </Button>
              </li>
            ))}
          </ul>
        )}

        <form
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            addMember();
          }}
        >
          <Field label="Nome">
            <Input
              placeholder="Ex.: Maria Gestora"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </Field>
          <Field label="E-mail">
            <Input
              type="email"
              inputMode="email"
              placeholder="maria@suaempresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Button type="submit" disabled={loading} className="sm:mb-0.5">
            {loading ? "Aguarde…" : "Adicionar"}
          </Button>
        </form>
      </Card>

      {/* ── Profissionais da equipe ── */}
      <Card className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-black text-foreground">
            Profissionais da equipe
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Vincule os profissionais da plataforma que fazem parte da sua operação. Cada um recebe
            um convite e, ao <strong>confirmar</strong>, passa a aparecer no perfil público da sua
            empresa — as pessoas encontram você pela sua equipe.
          </p>
        </div>

        {team.profissionais.length > 0 && (
          <ul className="space-y-2">
            {team.profissionais.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-xl border border-border p-3"
              >
                <Avatar nome={p.nome} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">{p.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.especialidades.join(", ") || "Sem especialidades"}
                  </p>
                </div>
                <Badge tone={p.confirmado ? "success" : "warning"} size="sm">
                  {p.confirmado ? "Confirmado" : "Aguardando confirmação"}
                </Badge>
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-danger"
                  disabled={loading}
                  onClick={() =>
                    run(() => bff.post("/api/company/professionals/remove", { id: p.id }))
                  }
                >
                  Remover
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <ProfessionalSearchField selected={profissional} onSelect={setProfissional} />
          <Button onClick={addProfissional} disabled={loading || !profissional} className="sm:mb-0.5">
            {loading ? "Aguarde…" : "Vincular"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
