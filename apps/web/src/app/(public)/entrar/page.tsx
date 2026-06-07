"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  type OtpRequestResult,
  otpRequestSchema,
  otpVerifySchema,
} from "@obracerta/shared";
import { Button, Card, Field, Input } from "@obracerta/ui";
import { bff } from "@/lib/client";

/** Resultado do BFF /api/auth/verify (sem tokens — só sinaliza o estado). */
type VerifyResult = { registered: true; user: { nomeCompleto: string } } | { registered: false };

type Step = "whatsapp" | "codigo";

/**
 * Login por OTP (área logada). Consome o **BFF** (`/api/auth/*`) — os cookies de
 * sessão são setados pelo servidor. Usuário novo é mandado ao cadastro.
 */
export default function EntrarPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("whatsapp");
  const [whatsapp, setWhatsapp] = useState("");
  const [code, setCode] = useState("");
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
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "WhatsApp inválido.");
      }
      await bff.post<OtpRequestResult>("/api/auth/request-otp", { whatsapp });
      setStep("codigo");
    });

  const verifyOtp = () =>
    run(async () => {
      const parsed = otpVerifySchema.safeParse({ whatsapp, code });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Código inválido.");
      }
      const result = await bff.post<VerifyResult>("/api/auth/verify", { whatsapp, code });
      if (result.registered) {
        router.replace("/inicio");
      } else {
        router.push("/cadastro");
      }
    });

  return (
    <section aria-labelledby="entrar-heading" className="mx-auto max-w-md px-6 py-16">
      <h1 id="entrar-heading" className="font-display text-3xl font-black text-foreground">
        Entrar
      </h1>
      <p className="mt-2 text-muted-foreground">
        Acesse com seu WhatsApp. Enviamos um código de 6 dígitos.
      </p>

      <Card className="mt-8 space-y-4">
        {error && (
          <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
            {error}
          </p>
        )}

        {step === "whatsapp" && (
          <Field label="Seu WhatsApp" hint="Formato: +55 DDD 9XXXXXXXX">
            <Input
              placeholder="+5511999999999"
              inputMode="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
          </Field>
        )}

        {step === "codigo" && (
          <Field label="Código recebido" hint="6 dígitos (em dev, veja o log da API)">
            <Input
              placeholder="000000"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </Field>
        )}

        <Button
          className="w-full"
          onClick={step === "whatsapp" ? requestOtp : verifyOtp}
          disabled={loading}
        >
          {loading ? "Aguarde…" : step === "whatsapp" ? "Enviar código" : "Entrar"}
        </Button>

        {step === "codigo" && (
          <Button variant="ghost" size="sm" className="w-full" onClick={() => setStep("whatsapp")}>
            Voltar
          </Button>
        )}
      </Card>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Não tem conta?{" "}
        <a href="/cadastro" className="font-semibold text-primary hover:underline">
          Criar agora
        </a>
      </p>
    </section>
  );
}
