"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@obracerta/ui";
import { PERSONAS, type PersonaId } from "./data";

/**
 * Seção "Como funciona" com o **toggle de persona** (estilo quemfaz: Sou cliente /
 * Sou profissional / Sou empresa). Alternar troca o passo-a-passo e o CTA. O hero
 * fica estático — o seletor vive só aqui, numa seção própria.
 */
export function ComoFunciona() {
  const [personaId, setPersonaId] = useState<PersonaId>("contratante");
  const persona = PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0]!;

  return (
    <section
      id="como-funciona"
      className="relative overflow-hidden bg-foreground px-6 py-20 text-background sm:px-10 sm:py-28 lg:px-14"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/15 blur-3xl"
      />
      <div className="mx-auto max-w-[1600px]">
        <span className="text-xs font-extrabold uppercase tracking-[3px] text-primary">Como funciona</span>
        <h2 className="mt-3 font-display text-3xl font-black tracking-tight text-background sm:text-5xl">
          Simples para os <em className="italic text-primary">dois lados</em>
        </h2>

        {/* Toggle de persona */}
        <div
          role="tablist"
          aria-label="Selecione seu perfil"
          className="mt-8 inline-flex flex-wrap gap-1 rounded-xl bg-background/10 p-1"
        >
          {PERSONAS.map((p) => {
            const active = p.id === personaId;
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                id={`persona-tab-${p.id}`}
                aria-selected={active}
                aria-controls="persona-panel"
                onClick={() => setPersonaId(p.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition-colors",
                  active ? "bg-primary text-white" : "text-background/60 hover:text-background",
                )}
              >
                <span aria-hidden>{p.icon}</span>
                {p.shortLabel}
              </button>
            );
          })}
        </div>

        <p className="mt-6 font-display text-xl font-black text-background sm:text-2xl">
          Para quem <em className="italic text-primary">{persona.label.toLowerCase()}</em>
        </p>

        <ol
          id="persona-panel"
          role="tabpanel"
          aria-labelledby={`persona-tab-${personaId}`}
          className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        >
          {persona.steps.map((s, i) => (
            <li key={s.titulo} className="rounded-2xl bg-background/[0.06] p-6">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/15 text-sm font-black text-primary">
                  {i + 1}
                </span>
                <span aria-hidden className="text-3xl">{s.emoji}</span>
              </div>
              <h3 className="mt-4 font-bold text-background">{s.titulo}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-background/60">{s.texto}</p>
            </li>
          ))}
        </ol>

        <Link
          href="/cadastro"
          className="mt-10 inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 font-extrabold text-white transition-colors hover:bg-orange-400"
        >
          {persona.ctaLabel} →
        </Link>
      </div>
    </section>
  );
}
