"use client";

import { useState, type ReactNode } from "react";
import type {
  AuthResult,
  CadastroResult,
  OtpRequestResult,
  ProfessionalProfile,
  UserType,
} from "@obracerta/shared";
import { api } from "@/lib/api";

type Step = "whatsapp" | "codigo" | "perfil" | "detalhes" | "pronto";

const STEPS: { id: Step; label: string }[] = [
  { id: "whatsapp", label: "WhatsApp" },
  { id: "codigo", label: "Código" },
  { id: "perfil", label: "Perfil" },
  { id: "detalhes", label: "Detalhes" },
];

/**
 * Cadastro em 4 passos (roadmap §4/§14). Consome a API via contratos do
 * @obracerta/shared. Persistência de sessão (cookie httpOnly) é hardening da
 * Fase 6 — aqui o token fica em memória só para o passo de detalhes.
 */
export default function CadastroPage() {
  const [step, setStep] = useState<Step>("whatsapp");
  const [whatsapp, setWhatsapp] = useState("");
  const [code, setCode] = useState("");
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [tipo, setTipo] = useState<UserType>("PROFISSIONAL");
  const [especialidades, setEspecialidades] = useState("");
  const [bairro, setBairro] = useState("");
  const [token, setToken] = useState<string | null>(null);
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
      await api.post<OtpRequestResult>("/auth/otp/request", { whatsapp });
      setStep("codigo");
    });

  const verifyOtp = () =>
    run(async () => {
      const result = await api.post<AuthResult>("/auth/otp/verify", { whatsapp, code });
      if (result.registered) {
        setToken(result.tokens.accessToken);
        setStep("pronto");
      } else {
        setStep("perfil");
      }
    });

  const cadastrar = () =>
    run(async () => {
      const result = await api.post<CadastroResult>("/cadastro", { whatsapp, nomeCompleto, tipo });
      setToken(result.tokens.accessToken);
      setStep(tipo === "PROFISSIONAL" ? "detalhes" : "pronto");
    });

  const salvarDetalhes = () =>
    run(async () => {
      const lista = especialidades
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await api.patch<ProfessionalProfile>(
        "/profiles/professional/me",
        { especialidades: lista, bairro: bairro || undefined },
        token ?? undefined,
      );
      setStep("pronto");
    });

  const activeIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <section aria-labelledby="cadastro-heading" className="mx-auto max-w-md py-12">
      <h1 id="cadastro-heading" className="font-display text-3xl font-black text-foreground">
        Criar conta
      </h1>

      {step !== "pronto" && (
        <ol className="mt-6 flex gap-2" aria-label="Progresso do cadastro">
          {STEPS.map((s, i) => (
            <li
              key={s.id}
              className={`h-1.5 flex-1 rounded-full ${
                i <= activeIndex ? "bg-primary" : "bg-border"
              }`}
              aria-current={s.id === step ? "step" : undefined}
            />
          ))}
        </ol>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-6 space-y-4">
        {step === "whatsapp" && (
          <Field label="Seu WhatsApp" hint="Formato: +55 DDD 9XXXXXXXX">
            <input
              className={inputClass}
              placeholder="+5511999999999"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              inputMode="tel"
            />
            <PrimaryButton onClick={requestOtp} disabled={loading}>
              {loading ? "Enviando…" : "Enviar código"}
            </PrimaryButton>
          </Field>
        )}

        {step === "codigo" && (
          <Field label="Código recebido" hint="6 dígitos (em dev, veja o log da API)">
            <input
              className={inputClass}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              maxLength={6}
            />
            <PrimaryButton onClick={verifyOtp} disabled={loading}>
              {loading ? "Verificando…" : "Verificar"}
            </PrimaryButton>
          </Field>
        )}

        {step === "perfil" && (
          <div className="space-y-4">
            <fieldset>
              <legend className="text-sm font-medium text-foreground">Você é…</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <TipoOption value="PROFISSIONAL" current={tipo} onSelect={setTipo} label="Profissional" />
                <TipoOption value="CONTRATANTE" current={tipo} onSelect={setTipo} label="Contratante" />
              </div>
            </fieldset>
            <Field label="Nome completo">
              <input
                className={inputClass}
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
              />
              <PrimaryButton onClick={cadastrar} disabled={loading}>
                {loading ? "Criando…" : "Criar conta"}
              </PrimaryButton>
            </Field>
          </div>
        )}

        {step === "detalhes" && (
          <div className="space-y-4">
            <Field label="Especialidades" hint="Separe por vírgula (ex.: Alvenaria, Pintura)">
              <input
                className={inputClass}
                value={especialidades}
                onChange={(e) => setEspecialidades(e.target.value)}
              />
            </Field>
            <Field label="Bairro">
              <input className={inputClass} value={bairro} onChange={(e) => setBairro(e.target.value)} />
              <PrimaryButton onClick={salvarDetalhes} disabled={loading}>
                {loading ? "Salvando…" : "Concluir"}
              </PrimaryButton>
            </Field>
          </div>
        )}

        {step === "pronto" && (
          <div className="rounded-lg border border-border bg-background p-6">
            <h2 className="text-xl font-bold text-foreground">Tudo certo! 🎉</h2>
            <p className="mt-2 text-muted-foreground">
              Sua conta está ativa. Acesse seu painel para continuar.
            </p>
            <a
              href="/dashboard"
              className="mt-4 inline-block rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground"
            >
              Ir para o painel
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      {children}
    </label>
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
      className={`rounded-md border px-4 py-3 text-sm font-medium transition-colors ${
        selected
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border text-muted-foreground hover:border-primary"
      }`}
    >
      {label}
    </button>
  );
}

function PrimaryButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-2 w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50"
    >
      {children}
    </button>
  );
}
