"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCentavos, type Proposal, type WorkOrderStatus } from "@obracerta/shared";
import { Badge, Button, Card, Field, Input } from "@obracerta/ui";
import { bff } from "@/lib/client";
import { PROPOSAL_STATUS_UI } from "@/lib/work-order-ui";

/**
 * Lance do profissional (sigiloso). Se já enviou, mostra o próprio lance; senão,
 * o formulário (enquanto a obra está ABERTA). O piso é uma dica — o backend recusa
 * lances abaixo dele.
 */
export function ObraBid({
  workOrderId,
  status,
  pisoCentavos,
  minhaProposta,
  canBid,
  planoIndisponivel = false,
}: {
  workOrderId: string;
  status: WorkOrderStatus;
  pisoCentavos: number | null;
  minhaProposta: Proposal | null;
  /** O plano vigente libera dar lances (feature `bid.submit`)? */
  canBid: boolean;
  /**
   * Não deu para CONFIRMAR o plano (erro/timeout da API) — diferente de "sem
   * plano": um Pro pagante não pode ver o cadeado de upgrade por falha transitória.
   */
  planoIndisponivel?: boolean;
}) {
  const router = useRouter();
  const [valor, setValor] = useState("");
  const [prazo, setPrazo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (minhaProposta) {
    const ui = PROPOSAL_STATUS_UI[minhaProposta.status];
    return (
      <Card className="space-y-2">
        <h2 className="font-display text-lg font-black text-foreground">Seu lance</h2>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-black text-foreground">
            {formatCentavos(minhaProposta.valorCentavos)}
          </span>
          <Badge tone={ui.tone}>{ui.label}</Badge>
        </div>
        {minhaProposta.prazoDias !== null && (
          <p className="text-sm text-muted-foreground">Prazo: {minhaProposta.prazoDias} dias</p>
        )}
        <p className="text-xs text-muted-foreground">
          Seu lance é sigiloso — só você e o contratante o veem.
        </p>
      </Card>
    );
  }

  if (status !== "ABERTA") {
    return (
      <Card>
        <p className="text-muted-foreground">Esta obra não está mais aberta para lances.</p>
      </Card>
    );
  }

  // Erro ao checar o plano ≠ plano sem a feature: avisa e pede pra tentar de
  // novo, em vez de mostrar o cadeado de upgrade a um possível pagante.
  if (planoIndisponivel) {
    return (
      <Card className="space-y-2 border-warning/30 bg-warning/5">
        <h2 className="font-display text-base font-black text-foreground">
          Não foi possível confirmar seu plano
        </h2>
        <p className="text-sm text-muted-foreground">
          Falha temporária ao verificar seus benefícios. Recarregue a página para tentar de novo —
          se você é Pro ou Especialista, seu lance continua disponível.
        </p>
      </Card>
    );
  }

  // Gating: sem a feature bid.submit (planos pagos, Pro+), mostra o cadeado + upgrade.
  if (!canBid) {
    return (
      <Card className="space-y-3 border-primary/30 bg-primary/[0.04] text-center">
        <span aria-hidden className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/8 text-primary">
          <Lock className="h-6 w-6" />
        </span>
        <h2 className="font-display text-lg font-black text-foreground">
          Dar lances é dos planos pagos
        </h2>
        <p className="text-sm text-muted-foreground">
          Faça upgrade para o plano Pro ou Especialista e envie propostas sigilosas em obras abertas.
        </p>
        <Button asChild className="w-full">
          <Link href="/cobrancas">Fazer upgrade</Link>
        </Button>
      </Card>
    );
  }

  async function enviar() {
    setError(null);
    setLoading(true);
    try {
      const reais = Number(valor.replace(",", "."));
      if (!Number.isFinite(reais) || reais <= 0) throw new Error("Informe um valor válido.");
      const valorCentavos = Math.round(reais * 100);
      if (pisoCentavos !== null && valorCentavos < pisoCentavos) {
        throw new Error(`O lance não pode ser menor que o piso (${formatCentavos(pisoCentavos)}).`);
      }
      const prazoDias = prazo.trim() ? Number(prazo) : undefined;
      await bff.post("/api/proposals", {
        workOrderId,
        valorCentavos,
        prazoDias: prazoDias && !Number.isNaN(prazoDias) ? prazoDias : undefined,
        mensagem: mensagem.trim() || undefined,
      });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao enviar o lance.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="space-y-4">
      <h2 className="font-display text-lg font-black text-foreground">Enviar lance</h2>
      {error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      {pisoCentavos !== null && (
        <p className="text-xs text-muted-foreground">Piso de dignidade: {formatCentavos(pisoCentavos)}</p>
      )}
      <Field label="Seu valor (R$)">
        <Input inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Ex.: 1500" />
      </Field>
      <Field label="Prazo (dias)" hint="Opcional">
        <Input inputMode="numeric" value={prazo} onChange={(e) => setPrazo(e.target.value)} placeholder="Ex.: 7" />
      </Field>
      <Field label="Mensagem" hint="Opcional">
        <Input value={mensagem} onChange={(e) => setMensagem(e.target.value)} />
      </Field>
      <Button className="w-full" onClick={enviar} disabled={loading}>
        {loading ? "Enviando…" : "Enviar lance"}
      </Button>
    </Card>
  );
}
