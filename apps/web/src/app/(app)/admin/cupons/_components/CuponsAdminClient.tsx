"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CouponType, type Coupon, type CouponType as CouponTypeT } from "@obracerta/shared";
import { Badge, Button, Card, Field, Input } from "@obracerta/ui";
import { bff } from "@/lib/client";

/** Rótulos e dica de unidade do valor por tipo de cupom. */
const TIPO_UI: Record<CouponTypeT, { label: string; unidade: string }> = {
  PERCENTUAL: { label: "Percentual (%)", unidade: "% de desconto (1 a 100)" },
  FIXO: { label: "Valor fixo (R$)", unidade: "centavos de desconto (ex.: 1500 = R$ 15,00)" },
  DIAS_GRATIS: { label: "Dias grátis", unidade: "dias adicionados ao vencimento" },
};

/** Painel admin de cupons: formulário de criação + tabela com ativar/desativar. */
export function CuponsAdminClient({ cuponsIniciais }: { cuponsIniciais: Coupon[] }) {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<CouponTypeT>(CouponType.PERCENTUAL);
  const [valor, setValor] = useState("");
  const [usosMax, setUsosMax] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function criar() {
    setError(null);
    const valorNum = Number(valor);
    if (codigo.trim().length < 3) {
      setError("O código deve ter ao menos 3 caracteres.");
      return;
    }
    if (!Number.isInteger(valorNum) || valorNum <= 0) {
      setError("Informe um valor inteiro positivo.");
      return;
    }
    setLoading(true);
    try {
      await bff.post("/api/admin/cupons", {
        codigo: codigo.trim(),
        descricao: descricao.trim() || undefined,
        tipo,
        valor: valorNum,
        usosMax: usosMax.trim() ? Number(usosMax) : undefined,
      });
      setCodigo("");
      setDescricao("");
      setValor("");
      setUsosMax("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível criar o cupom.");
    } finally {
      setLoading(false);
    }
  }

  async function toggle(id: string, ativo: boolean) {
    setTogglingId(id);
    try {
      await bff.post("/api/admin/cupons/toggle", { id, ativo });
      router.refresh();
    } catch {
      // erro silencioso; a tabela recarrega no próximo refresh
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
      <Card className="space-y-3">
        <h2 className="font-display text-lg font-black text-foreground">Novo cupom</h2>
        {error && (
          <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
            {error}
          </p>
        )}
        <Field label="Código">
          <Input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="Ex.: BEMVINDO"
            maxLength={24}
          />
        </Field>
        <Field label="Descrição" hint="Opcional">
          <Input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Campanha de julho"
            maxLength={160}
          />
        </Field>
        <Field label="Tipo">
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as CouponTypeT)}
            className="w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-foreground outline-none focus-visible:border-primary"
          >
            {Object.entries(TIPO_UI).map(([value, ui]) => (
              <option key={value} value={value}>
                {ui.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Valor" hint={TIPO_UI[tipo].unidade}>
          <Input
            inputMode="numeric"
            value={valor}
            onChange={(e) => setValor(e.target.value.replace(/\D/g, ""))}
            placeholder="20"
          />
        </Field>
        <Field label="Limite de usos" hint="Opcional — em branco = ilimitado">
          <Input
            inputMode="numeric"
            value={usosMax}
            onChange={(e) => setUsosMax(e.target.value.replace(/\D/g, ""))}
            placeholder="100"
          />
        </Field>
        <Button className="w-full" onClick={criar} disabled={loading}>
          {loading ? "Criando…" : "Criar cupom"}
        </Button>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-display text-lg font-black text-foreground">
          Cupons ({cuponsIniciais.length})
        </h2>
        {cuponsIniciais.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum cupom criado ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {cuponsIniciais.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-foreground">{c.codigo}</span>
                    <Badge tone={c.ativo ? "success" : "neutral"}>
                      {c.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                    <Badge tone="neutral" size="sm">
                      {resumoCupom(c)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {c.descricao ? `${c.descricao} · ` : ""}
                    {c.usosCount} uso{c.usosCount === 1 ? "" : "s"}
                    {c.usosMax ? ` de ${c.usosMax}` : ""}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => toggle(c.id, !c.ativo)}
                  disabled={togglingId === c.id}
                >
                  {c.ativo ? "Desativar" : "Ativar"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

/** Texto curto do efeito do cupom. */
function resumoCupom(c: Coupon): string {
  switch (c.tipo) {
    case CouponType.PERCENTUAL:
      return `${c.valor}% off`;
    case CouponType.FIXO:
      return `R$ ${(c.valor / 100).toFixed(2).replace(".", ",")} off`;
    case CouponType.DIAS_GRATIS:
      return `${c.valor} dias grátis`;
    default:
      return "";
  }
}
