"use client";

import type { ChangeEvent } from "react";
import { Input, type InputProps } from "@obracerta/ui";

/**
 * Input de WhatsApp com o +55 embutido: a pessoa digita só DDD + número e o
 * valor sai normalizado (`+55DDD9XXXXXXXX`) — formato que os schemas esperam.
 */
export function WhatsappInput({
  value,
  onValueChange,
  ...props
}: Omit<InputProps, "value" | "onChange"> & {
  value: string;
  onValueChange: (normalizado: string) => void;
}) {
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    let digits = e.target.value.replace(/\D/g, "");
    // Aceita colar com o 55 na frente; digitando, o prefixo já está fixo fora.
    if (digits.startsWith("55")) digits = digits.slice(2);
    digits = digits.slice(0, 11); // DDD (2) + 9XXXXXXXX (9)
    onValueChange(digits ? `+55${digits}` : "");
  }

  // Exibe só o trecho depois do +55 (o prefixo é um adorno fixo à esquerda).
  const visible = value.startsWith("+55") ? value.slice(3) : value.replace(/\D/g, "");

  return (
    <div className="relative">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm font-semibold text-muted-foreground"
      >
        +55
      </span>
      <Input
        {...props}
        inputMode="tel"
        autoComplete="tel-national"
        value={visible}
        onChange={handleChange}
        placeholder="11 99999 9999"
        className="pl-12"
      />
    </div>
  );
}
