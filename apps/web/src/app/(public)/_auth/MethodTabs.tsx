"use client";

import { SegmentedControl, type SegmentedOption } from "@obracerta/ui";

interface MethodTabsProps {
  value: string;
  onChange: (value: string) => void;
  options: SegmentedOption[];
}

/**
 * Escolha do método de acesso (e-mail × WhatsApp) — wrapper fino do
 * {@link SegmentedControl} do DS com o rótulo acessível do contexto de auth.
 */
export function MethodTabs({ value, onChange, options }: MethodTabsProps) {
  return (
    <SegmentedControl
      aria-label="Método de acesso"
      value={value}
      onChange={onChange}
      options={options}
    />
  );
}
