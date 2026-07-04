"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  loginSchema,
  type OtpRequestResult,
  otpRequestSchema,
  otpVerifySchema,
} from "@obracerta/shared";
import { Badge, Button, Field, Input } from "@obracerta/ui";
import { bff } from "@/lib/client";
import { useAsyncAction } from "@/lib/use-async-action";
import { WhatsappInput } from "@/components/WhatsappInput";
import { AuthPanel } from "../_auth/AuthPanel";
import { AuthDivider, GoogleButton } from "../_auth/SocialAuth";
import { MethodTabs } from "../_auth/MethodTabs";

type Method = "email" | "whatsapp";
type WhatsappStep = "numero" | "codigo";
type VerifyResult = { registered: true; user: { nomeCompleto: string } } | { registered: false };

export default function EntrarPage() {
  // useSearchParams exige Suspense no App Router.
  return (
    <Suspense fallback={null}>
      <EntrarInner />
    </Suspense>
  );
}

function EntrarInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [method, setMethod] = useState<Method>("email");
  const googleFalhou = params.get("erro") === "google";

  return (
    <AuthPanel
      eyebrow="Entrar"
      title="Bem-vindo de"
      accent="volta"
      subtitle="Acesse sua conta para gerenciar pedidos, obras e seu perfil."
    >
      <div className="animate-fade-in space-y-6">
        {googleFalhou && (
          <ErrorBox message="Não foi possível entrar com o Google. Tente de novo — ou use e-mail/WhatsApp." />
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
        <div className="animate-fade-in">
          {method === "email" ? (
            <EmailLogin onDone={() => router.replace("/inicio")} />
          ) : (
            <WhatsappLogin
              onRegistered={() => router.replace("/inicio")}
              onUnregistered={() => router.push("/cadastro")}
            />
          )}
        </div>
      </div>
    </AuthPanel>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div role="alert" className="animate-fade-in rounded-lg bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
      {message}
    </div>
  );
}

function EmailLogin({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { error, loading, run } = useAsyncAction();

  const submit = () =>
    run(async () => {
      const parsed = loginSchema.safeParse({ email, password });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      await bff.post("/api/auth/login", parsed.data);
      onDone();
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
      <Field label="Senha">
        <Input
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <Button type="submit" className="mt-2 w-full" disabled={loading} size="lg">
        {loading ? "Entrando…" : "Entrar na minha conta"}
      </Button>
    </form>
  );
}

function WhatsappLogin({
  onRegistered,
  onUnregistered,
}: {
  onRegistered: () => void;
  onUnregistered: () => void;
}) {
  const [step, setStep] = useState<WhatsappStep>("numero");
  const [whatsapp, setWhatsapp] = useState("");
  const [code, setCode] = useState("");
  const { error, loading, run } = useAsyncAction();

  const requestOtp = () =>
    run(async () => {
      const parsed = otpRequestSchema.safeParse({ whatsapp });
      if (!parsed.success) throw new Error("Número inválido. Use +55 e o DDD.");
      await bff.post<OtpRequestResult>("/api/auth/request-otp", { whatsapp });
      setStep("codigo");
    });

  const verifyOtp = () =>
    run(async () => {
      const parsed = otpVerifySchema.safeParse({ whatsapp, code });
      if (!parsed.success) throw new Error("Código deve ter 6 dígitos.");
      const result = await bff.post<VerifyResult>("/api/auth/verify", { whatsapp, code });
      if (result.registered) onRegistered();
      else onUnregistered();
    });

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (step === "numero") requestOtp();
        else verifyOtp();
      }}
    >
      {error && <ErrorBox message={error} />}
      {step === "numero" ? (
        <Field label="Seu celular" hint="Só DDD e número — o +55 já está aí">
          <WhatsappInput value={whatsapp} onValueChange={setWhatsapp} />
        </Field>
      ) : (
        <Field label="Código recebido por WhatsApp" hint="Digite os 6 números recebidos">
          <Input
            placeholder="000000"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="text-center font-display text-2xl tracking-widest"
          />
        </Field>
      )}

      {/* Helper em DEV: */}
      {process.env.NODE_ENV !== "production" && step === "codigo" && (
        <div className="flex justify-center">
          <Badge tone="warning">DEV: use 123456</Badge>
        </div>
      )}

      <Button type="submit" className="mt-2 w-full" disabled={loading} size="lg">
        {loading ? "Aguarde…" : step === "numero" ? "Receber código" : "Verificar e Entrar"}
      </Button>

      {step === "codigo" && (
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => setStep("numero")}
        >
          Mudar número
        </Button>
      )}
    </form>
  );
}
