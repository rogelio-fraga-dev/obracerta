"use client";

import { useState } from "react";
import { Button, Field, Input } from "@obracerta/ui";

/**
 * Formulário do consentimento simulado: coleta e-mail/nome e devolve ao callback
 * um `code` = base64url de `{email, nome}` (o formato que o adapter fake da API
 * espera). Visual de "chooser" para o fluxo ser demonstrável de ponta a ponta.
 */
export function GoogleMockForm({ redirectUri, state }: { redirectUri: string; state: string }) {
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [error, setError] = useState<string | null>(null);

  const invalidParams = !redirectUri || !state;

  function continuar() {
    setError(null);
    if (!email.includes("@")) {
      setError("Informe um e-mail válido.");
      return;
    }
    const code = btoa(JSON.stringify({ email: email.trim().toLowerCase(), nome: nome.trim() }))
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replace(/=+$/, "");
    const url = new URL(redirectUri);
    url.searchParams.set("code", code);
    url.searchParams.set("state", state);
    window.location.assign(url.toString());
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-[var(--shadow-lg)]">
      <p className="text-center font-sans text-xl font-semibold tracking-tight text-foreground">
        <span className="text-[#4285F4]">G</span>
        <span className="text-[#EA4335]">o</span>
        <span className="text-[#FBBC05]">o</span>
        <span className="text-[#4285F4]">g</span>
        <span className="text-[#34A853]">l</span>
        <span className="text-[#EA4335]">e</span>
        <span className="ml-2 text-muted-foreground">· simulado</span>
      </p>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Ambiente de testes — faça de conta que esta é a tela de escolha de conta do Google.
      </p>

      {invalidParams ? (
        <p role="alert" className="mt-4 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          Link inválido — inicie o login pelo botão &ldquo;Continuar com Google&rdquo;.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {error && (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
          <Field label="E-mail da conta Google">
            <Input
              type="email"
              placeholder="voce@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && continuar()}
            />
          </Field>
          <Field label="Nome" hint="Opcional">
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />
          </Field>
          <Button className="w-full" onClick={continuar}>
            Continuar
          </Button>
        </div>
      )}
    </div>
  );
}
