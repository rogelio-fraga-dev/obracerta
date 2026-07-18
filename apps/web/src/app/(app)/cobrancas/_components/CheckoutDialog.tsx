"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  formatCentavos,
  type ProfessionalPlanInfo,
} from "@obracerta/shared";
import { Badge, Button } from "@obracerta/ui";
import { bff } from "@/lib/client";

/* ──────────────────────── Types ──────────────────────── */

interface CheckoutDialogProps {
  /** Plano sendo comprado. */
  plano: ProfessionalPlanInfo;
  /** Plano atual do profissional (para calcular desconto). */
  planoAtual: ProfessionalPlanInfo | null;
  onClose: () => void;
}

interface CartaoSalvo {
  /** Últimos 4 dígitos. */
  ultimos4: string;
  bandeira: string;
  titular: string;
  validade: string;
}

type Step = 1 | 2 | 3;

/* ──────────────────── Helpers ──────────────────── */

const STORAGE_KEY = "obracerta:cartao-salvo";

function lerCartaoSalvo(): CartaoSalvo | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CartaoSalvo;
  } catch {
    return null;
  }
}

function salvarCartao(c: CartaoSalvo) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
}

/** Detecta bandeira pelo primeiro dígito (simplificado). */
function detectarBandeira(numero: string): string {
  const d = numero.replace(/\D/g, "");
  if (d.startsWith("4")) return "Visa";
  if (d.startsWith("5")) return "Mastercard";
  if (d.startsWith("3")) return "Amex";
  if (d.startsWith("6")) return "Elo";
  return "Cartão";
}

/** Formata número do cartão com espaços a cada 4 dígitos. */
function formatarNumero(v: string): string {
  const digits = v.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

/** Formata validade MM/AA. */
function formatarValidade(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

/* ──────────────────── Stepper ──────────────────── */

const STEPS: { label: string; icon: string }[] = [
  { label: "Resumo", icon: "📋" },
  { label: "Pagamento", icon: "💳" },
  { label: "Confirmação", icon: "✅" },
];

function Stepper({ current }: { current: Step }) {
  return (
    <div className="flex items-center justify-center gap-1">
      {STEPS.map((s, i) => {
        const step = (i + 1) as Step;
        const isActive = step === current;
        const isDone = step < current;
        return (
          <div key={s.label} className="flex items-center gap-1">
            {i > 0 && (
              <div
                className={`h-0.5 w-6 rounded-full transition-colors sm:w-10 ${
                  isDone ? "bg-primary" : "bg-border"
                }`}
              />
            )}
            <div className="flex flex-col items-center gap-0.5">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all sm:h-9 sm:w-9 ${
                  isActive
                    ? "bg-primary text-white shadow-[var(--shadow-md)]"
                    : isDone
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isDone ? "✓" : s.icon}
              </span>
              <span
                className={`text-[10px] font-semibold transition-colors sm:text-xs ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ──────────────────── StepResumo ──────────────────── */

function StepResumo({
  plano,
  planoAtual,
  onNext,
}: {
  plano: ProfessionalPlanInfo;
  planoAtual: ProfessionalPlanInfo | null;
  onNext: () => void;
}) {
  const precoAtual = planoAtual?.precoCentavos ?? 0;
  const desconto = precoAtual > 0 ? Math.round(precoAtual * 0.5) : 0;
  const total = Math.max(0, plano.precoCentavos - desconto);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border-2 border-primary/30 bg-primary/[0.04] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-lg font-black text-foreground sm:text-xl">{plano.nome}</p>
            <p className="text-xs text-muted-foreground sm:text-sm">{plano.resumo}</p>
          </div>
          {plano.recomendado && <Badge tone="success">Recomendado</Badge>}
        </div>
        <div className="mt-3 text-2xl font-black text-primary sm:text-3xl">
          {formatCentavos(plano.precoCentavos)}
          <span className="text-sm font-normal text-muted-foreground">/mês</span>
        </div>
      </div>

      {/* Features desbloqueadas */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          O que você desbloqueia
        </p>
        <ul className="space-y-1.5">
          {plano.beneficios.map((b) => (
            <li key={b} className="flex items-center gap-2 text-sm">
              <span className="text-success">✓</span>
              <span className="text-foreground">{b}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Desconto proporcional */}
      {desconto > 0 && (
        <div className="rounded-lg bg-success/10 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Crédito proporcional ({planoAtual?.nome})
            </span>
            <span className="font-bold text-success">−{formatCentavos(desconto)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between border-t border-success/20 pt-1">
            <span className="font-bold text-foreground">Total hoje</span>
            <span className="font-display text-lg font-black text-primary">{formatCentavos(total)}</span>
          </div>
        </div>
      )}

      <Button className="w-full" onClick={onNext}>
        Continuar para pagamento →
      </Button>
    </div>
  );
}

/* ──────────────────── StepPagamento ──────────────────── */

function StepPagamento({
  onNext,
  onBack,
  cartaoSalvo,
  onCartaoConfirmado,
}: {
  onNext: () => void;
  onBack: () => void;
  cartaoSalvo: CartaoSalvo | null;
  onCartaoConfirmado: (c: CartaoSalvo) => void;
}) {
  const [usarSalvo, setUsarSalvo] = useState(!!cartaoSalvo);
  const [numero, setNumero] = useState("");
  const [validade, setValidade] = useState("");
  const [cvv, setCvv] = useState("");
  const [titular, setTitular] = useState("");
  const [salvar, setSalvar] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validar(): boolean {
    const errs: Record<string, string> = {};
    const digits = numero.replace(/\D/g, "");
    if (digits.length < 13 || digits.length > 16) errs.numero = "Número inválido";
    if (validade.length < 5) errs.validade = "MM/AA";
    else {
      const [mm] = validade.split("/");
      if (Number(mm) < 1 || Number(mm) > 12) errs.validade = "Mês inválido";
    }
    if (cvv.length < 3) errs.cvv = "CVV inválido";
    if (titular.trim().length < 3) errs.titular = "Nome obrigatório";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function confirmar() {
    if (usarSalvo && cartaoSalvo) {
      onCartaoConfirmado(cartaoSalvo);
      onNext();
      return;
    }
    if (!validar()) return;
    const digits = numero.replace(/\D/g, "");
    const novo: CartaoSalvo = {
      ultimos4: digits.slice(-4),
      bandeira: detectarBandeira(digits),
      titular: titular.trim(),
      validade,
    };
    if (salvar) salvarCartao(novo);
    onCartaoConfirmado(novo);
    onNext();
  }

  return (
    <div className="space-y-4">
      {/* Cartão salvo */}
      {cartaoSalvo && (
        <div
          onClick={() => setUsarSalvo(true)}
          className={`cursor-pointer rounded-xl border-2 p-3 transition-all sm:p-4 ${
            usarSalvo
              ? "border-primary bg-primary/[0.04] shadow-[var(--shadow-sm)]"
              : "border-border hover:border-muted-foreground/30"
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 text-xs ${
                usarSalvo ? "border-primary bg-primary text-white" : "border-border"
              }`}
            >
              {usarSalvo && "✓"}
            </span>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">
                {cartaoSalvo.bandeira} •••• {cartaoSalvo.ultimos4}
              </p>
              <p className="text-xs text-muted-foreground">
                {cartaoSalvo.titular} · Validade {cartaoSalvo.validade}
              </p>
            </div>
            <span className="text-lg">💳</span>
          </div>
        </div>
      )}

      {/* Novo cartão */}
      <div
        onClick={() => setUsarSalvo(false)}
        className={`cursor-pointer rounded-xl border-2 p-3 transition-all sm:p-4 ${
          !usarSalvo
            ? "border-primary bg-primary/[0.04]"
            : "border-border hover:border-muted-foreground/30"
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full border-2 text-xs ${
              !usarSalvo ? "border-primary bg-primary text-white" : "border-border"
            }`}
          >
            {!usarSalvo && "✓"}
          </span>
          <p className="text-sm font-bold text-foreground">Novo cartão de crédito</p>
        </div>

        {!usarSalvo && (
          <div className="mt-3 space-y-3 pl-8">
            <FormField label="Número do cartão" error={errors.numero}>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0000 0000 0000 0000"
                value={numero}
                onChange={(e) => setNumero(formatarNumero(e.target.value))}
                maxLength={19}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Validade" error={errors.validade}>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="MM/AA"
                  value={validade}
                  onChange={(e) => setValidade(formatarValidade(e.target.value))}
                  maxLength={5}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </FormField>
              <FormField label="CVV" error={errors.cvv}>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="123"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  maxLength={4}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </FormField>
            </div>

            <FormField label="Nome no cartão" error={errors.titular}>
              <input
                type="text"
                placeholder="NOME COMO NO CARTÃO"
                value={titular}
                onChange={(e) => setTitular(e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </FormField>

            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={salvar}
                onChange={(e) => setSalvar(e.target.checked)}
                className="rounded"
              />
              Salvar cartão para pagamentos futuros
            </label>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onBack}>
          ← Voltar
        </Button>
        <Button className="flex-1" onClick={confirmar}>
          Revisar pedido →
        </Button>
      </div>
    </div>
  );
}

/* ──────────────────── StepConfirmacao ──────────────────── */

function StepConfirmacao({
  plano,
  planoAtual,
  cartao,
  onBack,
  onClose,
}: {
  plano: ProfessionalPlanInfo;
  planoAtual: ProfessionalPlanInfo | null;
  cartao: CartaoSalvo;
  onBack: () => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const precoAtual = planoAtual?.precoCentavos ?? 0;
  const desconto = precoAtual > 0 ? Math.round(precoAtual * 0.5) : 0;
  const total = Math.max(0, plano.precoCentavos - desconto);

  async function confirmar() {
    setError(null);
    setLoading(true);
    try {
      await bff.post("/api/billing/upgrade", { plano: plano.plano });
      setSucesso(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível processar o pagamento.");
    } finally {
      setLoading(false);
    }
  }

  if (sucesso) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-3xl">
          🎉
        </div>
        <h3 className="font-display text-xl font-black text-foreground">Upgrade realizado!</h3>
        <p className="text-sm text-muted-foreground">
          Seu plano foi atualizado para <strong>{plano.nome}</strong>. As novas funcionalidades já
          estão disponíveis.
        </p>
        <Button className="w-full" onClick={onClose}>
          Fechar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <div className="rounded-xl border border-border bg-muted/20 p-3 sm:p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Plano</p>
        <p className="mt-1 font-display text-lg font-black text-foreground">{plano.nome}</p>
        <p className="text-sm text-muted-foreground">{plano.resumo}</p>
      </div>

      <div className="rounded-xl border border-border bg-muted/20 p-3 sm:p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pagamento</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-lg">💳</span>
          <div>
            <p className="text-sm font-bold text-foreground">
              {cartao.bandeira} •••• {cartao.ultimos4}
            </p>
            <p className="text-xs text-muted-foreground">{cartao.titular}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border-2 border-primary/20 bg-primary/[0.03] p-3 sm:p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Assinatura mensal</span>
          <span className="text-foreground">{formatCentavos(plano.precoCentavos)}</span>
        </div>
        {desconto > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Crédito proporcional</span>
            <span className="font-bold text-success">−{formatCentavos(desconto)}</span>
          </div>
        )}
        <div className="mt-2 flex items-center justify-between border-t border-primary/15 pt-2">
          <span className="font-bold text-foreground">Total cobrado agora</span>
          <span className="font-display text-xl font-black text-primary">{formatCentavos(total)}</span>
        </div>
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        Assinatura com renovação automática mensal — cancele quando quiser. Em ambiente de testes o
        upgrade é imediato; em produção a cobrança passa pelo gateway Asaas.
      </p>

      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onBack} disabled={loading}>
          ← Voltar
        </Button>
        <Button className="flex-1" onClick={confirmar} disabled={loading}>
          {loading ? "Processando…" : `Confirmar ${formatCentavos(total)}`}
        </Button>
      </div>
    </div>
  );
}

/* ──────────────────── FormField ──────────────────── */

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      {children}
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}

/* ──────────────────── CheckoutDialog ──────────────────── */

/**
 * Checkout multi-step para upgrade de plano profissional.
 * Simula fluxo completo: resumo → pagamento (cartão fictício) → confirmação.
 * Dados do cartão são salvos no localStorage (simulação — produção seria tokenizado).
 */
export function CheckoutDialog({ plano, planoAtual, onClose }: CheckoutDialogProps) {
  const [step, setStep] = useState<Step>(1);
  const [cartao, setCartao] = useState<CartaoSalvo | null>(null);
  const [cartaoSalvo, setCartaoSalvo] = useState<CartaoSalvo | null>(null);

  // Carrega cartão salvo do localStorage (client-only).
  useEffect(() => {
    setCartaoSalvo(lerCartaoSalvo());
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Checkout — ${plano.nome}`}
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-border bg-background p-4 shadow-[var(--shadow-xl)] animate-scale-in sm:max-w-lg sm:rounded-2xl sm:p-6">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3 sm:mb-5">
          <h2 className="font-display text-lg font-black text-foreground sm:text-xl">
            Upgrade de plano
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-md px-2 text-lg text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        </div>

        {/* Stepper */}
        <div className="mb-5 sm:mb-6">
          <Stepper current={step} />
        </div>

        {/* Steps */}
        {step === 1 && (
          <StepResumo plano={plano} planoAtual={planoAtual} onNext={() => setStep(2)} />
        )}
        {step === 2 && (
          <StepPagamento
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
            cartaoSalvo={cartaoSalvo}
            onCartaoConfirmado={setCartao}
          />
        )}
        {step === 3 && cartao && (
          <StepConfirmacao
            plano={plano}
            planoAtual={planoAtual}
            cartao={cartao}
            onBack={() => setStep(2)}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
