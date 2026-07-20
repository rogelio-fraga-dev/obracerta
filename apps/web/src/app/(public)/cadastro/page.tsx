"use client";

import { Suspense, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { WhatsappInput } from "@/components/WhatsappInput";
import { AuthPanel } from "../_auth/AuthPanel";
import { AuthDivider, GoogleButton } from "../_auth/SocialAuth";
import { MethodTabs } from "../_auth/MethodTabs";

type Method = "email" | "whatsapp";

/**
 * Cadastro (área pública) — 3 caminhos: e-mail+senha ("conta normal"), WhatsApp
 * por OTP (assistente em passos) e Google (OAuth; e-mail novo chega aqui com
 * `?google=1&email=&nome=` e o formulário vem pré-preenchido). O e-mail coleta
 * só o essencial; o resto do perfil é completado depois de entrar.
 */
export default function CadastroPage() {
  // useSearchParams exige Suspense no App Router.
  return (
    <Suspense fallback={null}>
      <CadastroInner />
    </Suspense>
  );
}

function CadastroInner() {
  const params = useSearchParams();
  const [method, setMethod] = useState<Method>("email");

  // Pré-preenchimento vindo do Google (e-mail ainda sem conta).
  const viaGoogle = params.get("google") === "1";
  const googleEmail = params.get("email") ?? "";
  const googleNome = params.get("nome") ?? "";

  // Persona declarada na landing (`?tipo=`) — a intenção do clique não se perde.
  const tipoParam = params.get("tipo");
  const initialTipo: UserType =
    tipoParam === "CONTRATANTE" || tipoParam === "EMPRESA" || tipoParam === "PROFISSIONAL"
      ? tipoParam
      : "PROFISSIONAL";

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
        {viaGoogle && (
          <p
            role="status"
            className="rounded-lg bg-info/10 px-4 py-3 text-sm font-semibold text-foreground"
          >
            Seu Google ainda não tem conta aqui — complete o cadastro abaixo (já preenchemos
            nome e e-mail) e defina uma senha.
          </p>
        )}
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
        {method === "email" ? (
          <EmailSignup initialEmail={googleEmail} initialNome={googleNome} initialTipo={initialTipo} />
        ) : (
          <WhatsappSignup initialTipo={initialTipo} />
        )}
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

/**
 * Conta normal: coleta o essencial (tipo, nome, e-mail, senha, WhatsApp) e entra.
 * **Profissional** (homologação 18/07) segue para escolha de plano + cartão —
 * mesma régua do fluxo por WhatsApp; contratante/empresa assinam em Cobranças.
 */
function EmailSignup({
  initialEmail = "",
  initialNome = "",
  initialTipo = "PROFISSIONAL",
  initialCodigoIndicacao = "",
}: {
  initialEmail?: string;
  initialNome?: string;
  initialTipo?: UserType;
  initialCodigoIndicacao?: string;
}) {
  const router = useRouter();
  const [fase, setFase] = useState<"dados" | "plano" | "cartao" | "pronto">("dados");
  const [tipo, setTipo] = useState<UserType>(initialTipo);
  const [nomeCompleto, setNomeCompleto] = useState(initialNome);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [plano, setPlano] = useState<ProfessionalPlan | null>(null);
  const [cupom, setCupom] = useState("");
  const [codigoIndicacao, setCodigoIndicacao] = useState(initialCodigoIndicacao);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
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
        const parsed = registerSchema.safeParse({
          nomeCompleto,
          email,
          password,
          whatsapp,
          tipo,
          codigoIndicacao: codigoIndicacao.trim() || undefined,
        });
        if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos.");
        await bff.post<{ user: User }>("/api/auth/register", parsed.data);
      }
      if (tipo === "PROFISSIONAL") setFase("plano");
      else router.replace("/inicio");
    });

  const assinarComCartao = (cartaoToken: string) =>
    run(async () => {
      if (!plano) throw new Error("Escolha um plano para continuar.");
      const sub = await bff.post<Subscription>("/api/billing/subscribe", {
        plano,
        cartaoToken,
        cupom: cupom.trim() || undefined,
      });
      setSubscription(sub);
      setFase("pronto");
    });

  if (fase === "plano") {
    return (
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!plano) return;
          setFase("cartao");
        }}
      >
        {error && <ErrorBox message={error} />}
        <p className="text-sm text-muted-foreground">
          Conta criada! Agora escolha seu plano — dá para mudar depois.
        </p>
        <div className="space-y-3">
          {professionalPlansOrdered.map((p) => (
            <PlanCard
              key={p.plano}
              nome={p.nome}
              preco={
                p.trialDias
                  ? `${p.trialDias} dias grátis · depois ${formatCentavos(p.precoCentavos)}/mês`
                  : `${formatCentavos(p.precoCentavos)}/mês`
              }
              resumo={p.resumo}
              beneficios={p.beneficios}
              recomendado={p.recomendado}
              selected={plano === p.plano}
              onSelect={() => setPlano(p.plano)}
            />
          ))}
        </div>
        <Field label="Cupom de desconto" hint="Opcional — aplicado na primeira fatura.">
          <Input
            placeholder="Ex.: BEMVINDO"
            value={cupom}
            onChange={(e) => setCupom(e.target.value.toUpperCase())}
            maxLength={24}
          />
        </Field>
        <PrimaryAction loading={loading}>Continuar para o cartão</PrimaryAction>
      </form>
    );
  }

  if (fase === "cartao" && plano) {
    return (
      <div className="space-y-4">
        {error && <ErrorBox message={error} />}
        <CartaoStep
          plano={plano}
          loading={loading}
          onConfirm={assinarComCartao}
          onBack={() => setFase("plano")}
        />
      </div>
    );
  }

  if (fase === "pronto" && subscription) {
    return (
      <div className="space-y-3 text-center">
        {plano === "INICIANTE" ? (
          <>
            <Badge tone="success">Teste grátis ativado</Badge>
            <h2 className="text-xl font-bold text-foreground">Bem-vindo! 🎉</h2>
            <p className="text-muted-foreground">
              Seus <strong className="text-foreground">7 dias grátis</strong> começaram. Não há
              cobrança durante o teste — cancele antes do fim e nenhum valor é cobrado. Depois, a
              assinatura renova automaticamente por{" "}
              <strong className="text-foreground">{formatCentavos(subscription.valorCentavos)}/mês</strong>.
            </p>
          </>
        ) : (
          <>
            <Badge tone="warning">Aguardando pagamento</Badge>
            <h2 className="text-xl font-bold text-foreground">Assinatura criada 🎉</h2>
            <p className="text-muted-foreground">
              Geramos sua fatura de{" "}
              <strong className="text-foreground">{formatCentavos(subscription.valorCentavos)}/mês</strong>.
              Pague em Cobranças para ativar todos os recursos.
            </p>
          </>
        )}
        <Button className="w-full" onClick={() => router.replace("/inicio")}>
          Ir para o painel
        </Button>
      </div>
    );
  }

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
      <Field label="WhatsApp" hint="Só DDD e número — fica escondido até você aceitar um pedido.">
        <WhatsappInput value={whatsapp} onValueChange={setWhatsapp} />
      </Field>
      <Field label="Código de indicação" hint="Opcional — se um amigo te indicou, informe o código dele.">
        <Input
          placeholder="Ex.: ABCD2345"
          value={codigoIndicacao}
          onChange={(e) => setCodigoIndicacao(e.target.value.toUpperCase())}
          maxLength={12}
        />
      </Field>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Criando conta…" : "Criar conta"}
      </Button>
    </form>
  );
}

type WhatsappStep =
  | "whatsapp"
  | "codigo"
  | "perfil"
  | "especialidades"
  | "plano"
  | "cartao"
  | "pagamento";

const WHATSAPP_STEPS: WhatsappStep[] = ["whatsapp", "codigo", "perfil", "especialidades", "plano", "cartao"];

/** Cadastro via WhatsApp (OTP) — assistente em passos (linguagem do prototipo2). */
function WhatsappSignup({ initialTipo = "PROFISSIONAL" }: { initialTipo?: UserType }) {
  const router = useRouter();
  const [step, setStep] = useState<WhatsappStep>("whatsapp");
  const [whatsapp, setWhatsapp] = useState("");
  const [code, setCode] = useState("");
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [tipo, setTipo] = useState<UserType>(initialTipo);
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
      // Todos os planos são pagos (homologação 18/07); o cartão vem no próximo passo.
      // No Iniciante ele é obrigatório: ativa os 7 dias grátis (cobrança só depois).
      setStep("cartao");
      return Promise.resolve();
    });

  const assinarComCartao = (cartaoToken: string) =>
    run(async () => {
      if (!plano) throw new Error("Escolha um plano para continuar.");
      const sub = await bff.post<Subscription>("/api/billing/subscribe", { plano, cartaoToken });
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
          <Field label="Seu WhatsApp" hint="Só DDD e número — o +55 já está aí">
            <WhatsappInput value={whatsapp} onValueChange={setWhatsapp} />
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
                preco={
                  p.trialDias
                    ? `${p.trialDias} dias grátis · depois ${formatCentavos(p.precoCentavos)}/mês`
                    : `${formatCentavos(p.precoCentavos)}/mês`
                }
                resumo={p.resumo}
                beneficios={p.beneficios}
                recomendado={p.recomendado}
                selected={plano === p.plano}
                onSelect={() => setPlano(p.plano)}
              />
            ))}
          </div>
          <PrimaryAction loading={loading}>Continuar para o cartão</PrimaryAction>
        </form>
      )}

      {step === "cartao" && plano && (
        <CartaoStep
          plano={plano}
          loading={loading}
          onConfirm={assinarComCartao}
          onBack={() => setStep("plano")}
        />
      )}

      {step === "pagamento" && subscription && (
        <div className="space-y-3 text-center">
          {plano === "INICIANTE" ? (
            <>
              <Badge tone="success">Teste grátis ativado</Badge>
              <h2 className="text-xl font-bold text-foreground">Bem-vindo! 🎉</h2>
              <p className="text-muted-foreground">
                Seus <strong className="text-foreground">7 dias grátis</strong> começaram. Não há
                cobrança durante o teste — cancele antes do fim e nenhum valor é cobrado. Depois, a
                assinatura renova automaticamente por{" "}
                <strong className="text-foreground">{formatCentavos(subscription.valorCentavos)}/mês</strong>.
              </p>
            </>
          ) : (
            <>
              <Badge tone="warning">Aguardando pagamento</Badge>
              <h2 className="text-xl font-bold text-foreground">Assinatura criada 🎉</h2>
              <p className="text-muted-foreground">
                Geramos sua fatura de{" "}
                <strong className="text-foreground">{formatCentavos(subscription.valorCentavos)}/mês</strong>.
                Pague em Cobranças para ativar todos os recursos. A assinatura renova
                automaticamente — cancele quando quiser.
              </p>
            </>
          )}
          <Button className="w-full" onClick={() => router.replace("/inicio")}>
            Ir para o painel
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Passo do cartão de crédito (homologação 18/07): obrigatório para todos os
 * planos — no Iniciante ele ativa os 7 dias grátis (cobrança só após o teste).
 * Em sandbox o "token" é gerado localmente (produção: tokenização no gateway;
 * o número nunca chega ao nosso backend).
 */
function CartaoStep({
  plano,
  loading,
  onConfirm,
  onBack,
}: {
  plano: ProfessionalPlan;
  loading: boolean;
  onConfirm: (cartaoToken: string) => void;
  onBack: () => void;
}) {
  const [numero, setNumero] = useState("");
  const [validade, setValidade] = useState("");
  const [cvv, setCvv] = useState("");
  const [titular, setTitular] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const isTrial = plano === "INICIANTE";

  const submit = () => {
    const digits = numero.replace(/\D/g, "");
    if (digits.length < 13 || digits.length > 16) return setFormError("Número do cartão inválido.");
    const [mm] = validade.split("/");
    if (validade.length < 5 || Number(mm) < 1 || Number(mm) > 12) {
      return setFormError("Validade inválida (MM/AA).");
    }
    if (cvv.replace(/\D/g, "").length < 3) return setFormError("CVV inválido.");
    if (titular.trim().length < 3) return setFormError("Informe o nome como está no cartão.");
    setFormError(null);
    onConfirm(`tok_${digits.slice(-4)}_${Date.now().toString(36)}`);
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <p className="text-sm text-muted-foreground">
        {isTrial ? (
          <>
            Para ativar os <strong className="text-foreground">7 dias grátis</strong> é preciso
            cadastrar um cartão. <strong className="text-foreground">Nada é cobrado durante o teste</strong>{" "}
            — cancele antes do fim e nenhum valor é cobrado.
          </>
        ) : (
          <>Cadastre o cartão da assinatura. A renovação é mensal e você cancela quando quiser.</>
        )}
      </p>
      {formError && <ErrorBox message={formError} />}
      <Field label="Número do cartão">
        <Input
          inputMode="numeric"
          placeholder="0000 0000 0000 0000"
          maxLength={19}
          value={numero}
          onChange={(e) => {
            const d = e.target.value.replace(/\D/g, "").slice(0, 16);
            setNumero(d.replace(/(.{4})/g, "$1 ").trim());
          }}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Validade">
          <Input
            inputMode="numeric"
            placeholder="MM/AA"
            maxLength={5}
            value={validade}
            onChange={(e) => {
              const d = e.target.value.replace(/\D/g, "").slice(0, 4);
              setValidade(d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`);
            }}
          />
        </Field>
        <Field label="CVV">
          <Input
            inputMode="numeric"
            placeholder="123"
            maxLength={4}
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
          />
        </Field>
      </div>
      <Field label="Nome no cartão">
        <Input
          placeholder="NOME COMO NO CARTÃO"
          value={titular}
          onChange={(e) => setTitular(e.target.value.toUpperCase())}
        />
      </Field>
      <p className="text-xs text-muted-foreground">
        Assinatura com renovação automática mensal. Sem fidelidade nem multa — cancele quando quiser
        pelo próprio app. Ao continuar você concorda com os{" "}
        <a href="/termos" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">
          termos de assinatura
        </a>
        .
      </p>
      <div className="flex gap-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onBack} disabled={loading}>
          ← Voltar
        </Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? "Aguarde…" : isTrial ? "Ativar 7 dias grátis" : "Assinar"}
        </Button>
      </div>
    </form>
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
