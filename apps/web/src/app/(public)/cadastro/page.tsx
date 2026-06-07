"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  cadastroSchema,
  formatCentavos,
  otpRequestSchema,
  otpVerifySchema,
  type ProfessionalPlan,
  professionalPlansOrdered,
  type Subscription,
  type User,
  type UserType,
} from "@obracerta/shared";
import { Badge, Button, Card, Field, Input } from "@obracerta/ui";
import { bff } from "@/lib/client";

type VerifyResult = { registered: true } | { registered: false };

type Step = "whatsapp" | "codigo" | "perfil" | "especialidades" | "plano" | "pagamento";

const PROFISSIONAL_STEPS: { id: Step; label: string }[] = [
  { id: "whatsapp", label: "WhatsApp" },
  { id: "codigo", label: "Código" },
  { id: "perfil", label: "Perfil" },
  { id: "especialidades", label: "Atuação" },
  { id: "plano", label: "Plano" },
];

/**
 * Onboarding do profissional (roadmap §4/§14, linguagem do `prototipo2`). Tudo
 * sobre o **BFF** — os cookies de sessão são setados no cadastro e reutilizados
 * nos passos autenticados (perfil, assinatura). O contratante encerra no passo 3.
 */
export default function CadastroPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("whatsapp");
  const [whatsapp, setWhatsapp] = useState("");
  const [code, setCode] = useState("");
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [tipo, setTipo] = useState<UserType>("PROFISSIONAL");
  const [especialidades, setEspecialidades] = useState("");
  const [bairro, setBairro] = useState("");
  const [anos, setAnos] = useState("");
  const [plano, setPlano] = useState<ProfessionalPlan | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(fn: () => Promise<void>): Promise<void> {
    setError(null);
    setLoading(true);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  const requestOtp = () =>
    run(async () => {
      const parsed = otpRequestSchema.safeParse({ whatsapp });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "WhatsApp inválido.");
      await bff.post("/api/auth/request-otp", { whatsapp });
      setStep("codigo");
    });

  const verifyOtp = () =>
    run(async () => {
      const parsed = otpVerifySchema.safeParse({ whatsapp, code });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Código inválido.");
      const result = await bff.post<VerifyResult>("/api/auth/verify", { whatsapp, code });
      if (result.registered) {
        router.replace("/inicio"); // já tem conta → entra direto
      } else {
        setStep("perfil");
      }
    });

  const cadastrar = () =>
    run(async () => {
      const parsed = cadastroSchema.safeParse({ whatsapp, nomeCompleto, tipo });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      await bff.post<{ user: User }>("/api/auth/cadastro", { whatsapp, nomeCompleto, tipo });
      if (tipo === "PROFISSIONAL") {
        setStep("especialidades");
      } else {
        router.replace("/inicio");
      }
    });

  const salvarAtuacao = () =>
    run(async () => {
      const lista = especialidades
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const anosNum = anos.trim() ? Number(anos) : undefined;
      await bff.post("/api/profile/professional", {
        ...(lista.length ? { especialidades: lista } : {}),
        ...(bairro.trim() ? { bairro: bairro.trim() } : {}),
        ...(anosNum !== undefined && !Number.isNaN(anosNum) ? { anosExperiencia: anosNum } : {}),
      });
      setStep("plano");
    });

  const escolherPlano = () =>
    run(async () => {
      if (!plano) throw new Error("Escolha um plano para continuar.");
      if (plano === "INICIANTE") {
        router.replace("/inicio"); // grátis: sem cobrança
        return;
      }
      const sub = await bff.post<Subscription>("/api/billing/subscribe", { plano });
      setSubscription(sub);
      setStep("pagamento");
    });

  const activeIndex = PROFISSIONAL_STEPS.findIndex((s) => s.id === step);

  return (
    <section aria-labelledby="cadastro-heading" className="mx-auto max-w-md px-6 py-12">
      <h1 id="cadastro-heading" className="font-display text-3xl font-black text-foreground">
        Criar conta
      </h1>

      {step !== "pagamento" && (
        <ol className="mt-6 flex gap-1.5" aria-label="Progresso do cadastro">
          {PROFISSIONAL_STEPS.map((s, i) => (
            <li
              key={s.id}
              className={`h-1.5 flex-1 rounded-full ${i <= activeIndex ? "bg-primary" : "bg-border"}`}
              aria-current={s.id === step ? "step" : undefined}
            />
          ))}
        </ol>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <Card className="mt-6 space-y-4">
        {step === "whatsapp" && (
          <>
            <Field label="Seu WhatsApp" hint="Formato: +55 DDD 9XXXXXXXX">
              <Input
                placeholder="+5511999999999"
                inputMode="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
            </Field>
            <PrimaryAction onClick={requestOtp} loading={loading}>
              Enviar código
            </PrimaryAction>
          </>
        )}

        {step === "codigo" && (
          <>
            <Field label="Código recebido" hint="6 dígitos (em dev, veja o log da API)">
              <Input
                placeholder="000000"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </Field>
            <PrimaryAction onClick={verifyOtp} loading={loading}>
              Verificar
            </PrimaryAction>
          </>
        )}

        {step === "perfil" && (
          <>
            <fieldset>
              <legend className="text-sm font-semibold text-foreground">Você é…</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <TipoOption value="PROFISSIONAL" current={tipo} onSelect={setTipo} label="Profissional" />
                <TipoOption value="CONTRATANTE" current={tipo} onSelect={setTipo} label="Contratante" />
              </div>
            </fieldset>
            <Field label="Nome completo">
              <Input value={nomeCompleto} onChange={(e) => setNomeCompleto(e.target.value)} />
            </Field>
            <PrimaryAction onClick={cadastrar} loading={loading}>
              Criar conta
            </PrimaryAction>
          </>
        )}

        {step === "especialidades" && (
          <>
            <Field label="Especialidades" hint="Separe por vírgula (ex.: Alvenaria, Pintura)">
              <Input value={especialidades} onChange={(e) => setEspecialidades(e.target.value)} />
            </Field>
            <Field label="Bairro de atuação">
              <Input value={bairro} onChange={(e) => setBairro(e.target.value)} />
            </Field>
            <Field label="Anos de experiência" hint="Opcional">
              <Input
                inputMode="numeric"
                value={anos}
                onChange={(e) => setAnos(e.target.value)}
                placeholder="Ex.: 8"
              />
            </Field>
            <PrimaryAction onClick={salvarAtuacao} loading={loading}>
              Continuar
            </PrimaryAction>
          </>
        )}

        {step === "plano" && (
          <>
            <p className="text-sm text-muted-foreground">
              Escolha como quer aparecer para os contratantes. Dá para mudar depois.
            </p>
            <div className="space-y-3">
              {professionalPlansOrdered.map((p) => (
                <PlanCard
                  key={p.plano}
                  nome={p.nome}
                  preco={p.precoCentavos === 0 ? "Grátis" : `${formatCentavos(p.precoCentavos)}/mês`}
                  resumo={p.resumo}
                  beneficios={p.beneficios}
                  recomendado={p.recomendado}
                  selected={plano === p.plano}
                  onSelect={() => setPlano(p.plano)}
                />
              ))}
            </div>
            <PrimaryAction onClick={escolherPlano} loading={loading}>
              {plano === "INICIANTE" ? "Começar grátis" : "Assinar"}
            </PrimaryAction>
          </>
        )}

        {step === "pagamento" && subscription && (
          <div className="space-y-3 text-center">
            <Badge tone="warning">Aguardando pagamento</Badge>
            <h2 className="text-xl font-bold text-foreground">Assinatura criada 🎉</h2>
            <p className="text-muted-foreground">
              Geramos sua fatura de{" "}
              <strong className="text-foreground">{formatCentavos(subscription.valorCentavos)}/mês</strong>.
              Pague via PIX para ativar — você tem alguns dias de cortesia até lá.
            </p>
            <Button className="w-full" onClick={() => router.replace("/inicio")}>
              Ir para o painel
            </Button>
          </div>
        )}
      </Card>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <a href="/entrar" className="font-semibold text-primary hover:underline">
          Entrar
        </a>
      </p>
    </section>
  );
}

function PrimaryAction({
  onClick,
  loading,
  children,
}: {
  onClick: () => void;
  loading: boolean;
  children: ReactNode;
}) {
  return (
    <Button className="w-full" onClick={onClick} disabled={loading}>
      {loading ? "Aguarde…" : children}
    </Button>
  );
}

function TipoOption({
  value,
  current,
  onSelect,
  label,
}: {
  value: UserType;
  current: UserType;
  onSelect: (v: UserType) => void;
  label: string;
}) {
  const selected = value === current;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      aria-pressed={selected}
      className={`rounded-md border-2 px-4 py-3 text-sm font-semibold transition-colors ${
        selected ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary"
      }`}
    >
      {label}
    </button>
  );
}

function PlanCard({
  nome,
  preco,
  resumo,
  beneficios,
  recomendado,
  selected,
  onSelect,
}: {
  nome: string;
  preco: string;
  resumo: string;
  beneficios: string[];
  recomendado: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
        selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/60"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-lg font-black text-foreground">{nome}</span>
        {recomendado && <Badge tone="success">Recomendado</Badge>}
      </div>
      <div className="mt-0.5 text-sm font-bold text-primary">{preco}</div>
      <p className="mt-1 text-xs text-muted-foreground">{resumo}</p>
      <ul className="mt-2 space-y-1">
        {beneficios.map((b) => (
          <li key={b} className="flex items-start gap-1.5 text-xs text-foreground">
            <span aria-hidden className="text-primary">
              ✓
            </span>
            {b}
          </li>
        ))}
      </ul>
    </button>
  );
}
