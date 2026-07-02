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
  registerCompanySchema,
  registerSchema,
  type Subscription,
  type User,
  type UserType,
} from "@obracerta/shared";
import { Badge, Button, Field, Input } from "@obracerta/ui";
import { bff } from "@/lib/client";
import { useAsyncAction } from "@/lib/use-async-action";
import { ProfessionPicker } from "@/components/ProfessionPicker";
import { AuthPanel } from "../_auth/AuthPanel";
import { AuthDivider, GoogleButton } from "../_auth/SocialAuth";
import { MethodTabs } from "../_auth/MethodTabs";

type Method = "email" | "whatsapp";

/**
 * Cadastro (área pública) — 3 caminhos: e-mail+senha ("conta normal", funcional),
 * WhatsApp por OTP (assistente em passos, funcional) e Google (visual). O e-mail
 * coleta só o essencial; o resto do perfil é completado depois de entrar.
 */
export default function CadastroPage() {
  const [method, setMethod] = useState<Method>("email");

  return (
    <AuthPanel
      eyebrow="Criar conta"
      title="Crie sua"
      accent="conta"
      subtitle="Comece com o essencial. Você completa o resto do perfil depois de entrar."
      footer={
        <>
          Já tem conta?{" "}
          <a href="/entrar" className="font-semibold text-primary hover:underline">
            Entrar
          </a>
        </>
      }
    >
      <div className="space-y-5">
        <GoogleButton />
        <AuthDivider />
        <MethodTabs
          value={method}
          onChange={(m) => setMethod(m as Method)}
          options={[
            { value: "email", label: "E-mail e senha" },
            { value: "whatsapp", label: "WhatsApp" },
          ]}
        />
        {method === "email" ? <EmailSignup /> : <WhatsappSignup />}
      </div>
    </AuthPanel>
  );
}


function ErrorBox({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
      {message}
    </p>
  );
}

/** Conta normal: coleta o essencial (tipo, nome, e-mail, senha, WhatsApp) e entra. */
function EmailSignup() {
  const router = useRouter();
  const [tipo, setTipo] = useState<UserType>("PROFISSIONAL");
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const { error, loading, run } = useAsyncAction();

  const isEmpresa = tipo === "EMPRESA";

  const submit = () =>
    run(async () => {
      if (isEmpresa) {
        const parsed = registerCompanySchema.safeParse({
          nomeCompleto,
          email,
          password,
          whatsapp,
          cnpj,
          razaoSocial,
        });
        if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos.");
        await bff.post<{ user: User }>("/api/auth/register-company", parsed.data);
      } else {
        const parsed = registerSchema.safeParse({ nomeCompleto, email, password, whatsapp, tipo });
        if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos.");
        await bff.post<{ user: User }>("/api/auth/register", parsed.data);
      }
      router.replace("/inicio");
    });

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {error && <ErrorBox message={error} />}
      <fieldset>
        <legend className="text-sm font-semibold text-foreground">Você é…</legend>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <TipoOption value="PROFISSIONAL" current={tipo} onSelect={setTipo} label="Profissional" />
          <TipoOption value="CONTRATANTE" current={tipo} onSelect={setTipo} label="Contratante" />
          <TipoOption value="EMPRESA" current={tipo} onSelect={setTipo} label="Empresa" />
        </div>
      </fieldset>
      {isEmpresa && (
        <>
          <Field label="Razão social">
            <Input
              placeholder="Ex.: Construtora Alfa LTDA"
              value={razaoSocial}
              onChange={(e) => setRazaoSocial(e.target.value)}
            />
          </Field>
          <Field label="CNPJ">
            <Input
              inputMode="numeric"
              placeholder="00.000.000/0000-00"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
            />
          </Field>
        </>
      )}
      <Field label={isEmpresa ? "Nome do responsável" : "Nome completo"}>
        <Input
          autoComplete="name"
          placeholder="Ex.: Carlos Mendes"
          value={nomeCompleto}
          onChange={(e) => setNomeCompleto(e.target.value)}
        />
      </Field>
      <Field label="E-mail">
        <Input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="voce@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <Field label="Senha" hint="Mínimo de 8 caracteres">
        <Input
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <Field label="WhatsApp" hint="Fica escondido até você aceitar um pedido.">
        <Input
          inputMode="tel"
          autoComplete="tel"
          placeholder="+5511999999999"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
        />
      </Field>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Criando conta…" : "Criar conta"}
      </Button>
    </form>
  );
}

type WhatsappStep = "whatsapp" | "codigo" | "perfil" | "especialidades" | "plano" | "pagamento";

const WHATSAPP_STEPS: WhatsappStep[] = ["whatsapp", "codigo", "perfil", "especialidades", "plano"];

/** Cadastro via WhatsApp (OTP) — assistente em passos (linguagem do prototipo2). */
function WhatsappSignup() {
  const router = useRouter();
  const [step, setStep] = useState<WhatsappStep>("whatsapp");
  const [whatsapp, setWhatsapp] = useState("");
  const [code, setCode] = useState("");
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [tipo, setTipo] = useState<UserType>("PROFISSIONAL");
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [bairro, setBairro] = useState("");
  const [anos, setAnos] = useState("");
  const [plano, setPlano] = useState<ProfessionalPlan | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const { error, loading, run } = useAsyncAction();

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
      const result = await bff.post<{ registered: boolean }>("/api/auth/verify", { whatsapp, code });
      if (result.registered) router.replace("/inicio");
      else setStep("perfil");
    });

  const cadastrar = () =>
    run(async () => {
      const parsed = cadastroSchema.safeParse({ whatsapp, nomeCompleto, tipo });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      await bff.post<{ user: User }>("/api/auth/cadastro", { whatsapp, nomeCompleto, tipo });
      if (tipo === "PROFISSIONAL") setStep("especialidades");
      else router.replace("/inicio");
    });

  const salvarAtuacao = () =>
    run(async () => {
      const lista = especialidades;
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
        router.replace("/inicio");
        return;
      }
      const sub = await bff.post<Subscription>("/api/billing/subscribe", { plano });
      setSubscription(sub);
      setStep("pagamento");
    });

  const activeIndex = WHATSAPP_STEPS.indexOf(step);

  return (
    <div className="space-y-4">
      {step !== "pagamento" && (
        <ol className="flex gap-1.5" aria-label="Progresso do cadastro">
          {WHATSAPP_STEPS.map((s, i) => (
            <li
              key={s}
              className={`h-1.5 flex-1 rounded-full ${i <= activeIndex ? "bg-primary" : "bg-border"}`}
              aria-current={s === step ? "step" : undefined}
            />
          ))}
        </ol>
      )}

      {error && <ErrorBox message={error} />}

      {step === "whatsapp" && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            requestOtp();
          }}
        >
          <Field label="Seu WhatsApp" hint="Formato: +55 DDD 9XXXXXXXX">
            <Input
              placeholder="+5511999999999"
              inputMode="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
          </Field>
          <PrimaryAction loading={loading}>Enviar código</PrimaryAction>
        </form>
      )}

      {step === "codigo" && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            verifyOtp();
          }}
        >
          <Field label="Código recebido" hint="6 dígitos (em dev, veja o log da API)">
            <Input
              placeholder="000000"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </Field>
          <PrimaryAction loading={loading}>Verificar</PrimaryAction>
        </form>
      )}

      {step === "perfil" && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            cadastrar();
          }}
        >
          <fieldset>
            <legend className="text-sm font-semibold text-foreground">Você é…</legend>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <TipoOption value="PROFISSIONAL" current={tipo} onSelect={setTipo} label="Profissional" />
              <TipoOption value="CONTRATANTE" current={tipo} onSelect={setTipo} label="Contratante" />
            </div>
          </fieldset>
          <Field label="Nome completo">
            <Input value={nomeCompleto} onChange={(e) => setNomeCompleto(e.target.value)} />
          </Field>
          <PrimaryAction loading={loading}>Criar conta</PrimaryAction>
        </form>
      )}

      {step === "especialidades" && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            salvarAtuacao();
          }}
        >
          <div className="space-y-1.5">
            <span className="text-sm font-semibold text-foreground">Suas profissões</span>
            <span className="block text-xs text-muted-foreground">
              Selecione uma ou mais. Não achou? Use &quot;Outra&quot;.
            </span>
            <ProfessionPicker value={especialidades} onChange={setEspecialidades} />
          </div>
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
          <PrimaryAction loading={loading}>Continuar</PrimaryAction>
        </form>
      )}

      {step === "plano" && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            escolherPlano();
          }}
        >
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
          <PrimaryAction loading={loading}>
            {plano === "INICIANTE" ? "Começar grátis" : "Assinar"}
          </PrimaryAction>
        </form>
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
    </div>
  );
}

function PrimaryAction({ loading, children }: { loading: boolean; children: ReactNode }) {
  return (
    <Button type="submit" className="w-full" disabled={loading}>
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
        selected
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border text-muted-foreground hover:border-primary"
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
