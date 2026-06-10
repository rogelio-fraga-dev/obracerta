"use client";

import { useState } from "react";
import { FAQ } from "./data";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-muted/40 px-6 py-20 sm:px-10 sm:py-28 lg:px-14">
      <div className="mx-auto grid max-w-[1600px] gap-10 lg:grid-cols-[0.8fr_2fr]">
        {/* Coluna do título — alinha com as demais seções e preenche a largura */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <span className="text-xs font-extrabold uppercase tracking-[3px] text-primary">
            Perguntas frequentes
          </span>
          <h2 className="mt-3 font-display text-3xl font-black tracking-tight text-foreground sm:text-5xl">
            Ficou com <em className="italic text-primary">dúvida?</em>
          </h2>
          <p className="mt-3 text-muted-foreground">
            Não achou sua resposta? Fale com a gente pelo suporte.
          </p>
        </div>

        {/* Coluna do acordeão */}
        <div className="space-y-2">
          {FAQ.map((item, i) => {
            const aberto = open === i;
            return (
              <div key={item.q} className="overflow-hidden rounded-xl bg-background">
                <button
                  type="button"
                  id={`faq-btn-${i}`}
                  onClick={() => setOpen(aberto ? null : i)}
                  aria-expanded={aberto}
                  aria-controls={`faq-panel-${i}`}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-bold text-foreground"
                >
                  {item.q}
                  <span
                    aria-hidden
                    className={`text-xl text-primary transition-transform ${aberto ? "rotate-45" : ""}`}
                  >
                    +
                  </span>
                </button>
                <div
                  id={`faq-panel-${i}`}
                  role="region"
                  aria-labelledby={`faq-btn-${i}`}
                  className={`grid transition-all duration-300 ${aberto ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
