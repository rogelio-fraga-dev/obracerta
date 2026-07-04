import type { SupportTicket } from "@obracerta/shared";
import { serverApi } from "@/lib/server-api";
import { getProfileHint } from "@/lib/session";
import { BackLink } from "../_shell/BackLink";
import { FAQ_CONTRATANTE, FAQ_GERAL, FAQ_PROFISSIONAL, type FaqItem } from "./_components/faq-data";
import { SupportClient } from "./_components/SupportClient";

/**
 * Central de ajuda: FAQ por persona (renderizado no servidor, sem JS) +
 * abertura/histórico de chamados de suporte.
 */
export default async function AjudaPage() {
  const [hint, tickets] = await Promise.all([
    getProfileHint(),
    serverApi<SupportTicket[]>("GET", "/support/tickets/me").catch(() => [] as SupportTicket[]),
  ]);
  const isProfissional = hint?.tipo === "PROFISSIONAL";
  const faqPersona = isProfissional ? FAQ_PROFISSIONAL : FAQ_CONTRATANTE;
  const tituloPersona = isProfissional ? "Para profissionais" : "Para quem contrata";

  return (
    <section aria-labelledby="ajuda-heading" className="space-y-6">
      <BackLink href="/inicio" label="Início" />
      <div>
        <h1 id="ajuda-heading" className="font-display text-2xl font-black text-foreground">
          Central de ajuda
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Respostas rápidas para as dúvidas mais comuns — e o suporte a um clique.
        </p>
      </div>

      <FaqSection titulo={tituloPersona} itens={faqPersona} aberto />
      <FaqSection titulo="Como a plataforma funciona" itens={FAQ_GERAL} />

      <SupportClient tickets={tickets} />
    </section>
  );
}

/** Bloco de FAQ com <details> nativo — acessível e sem JavaScript. */
function FaqSection({ titulo, itens, aberto = false }: { titulo: string; itens: FaqItem[]; aberto?: boolean }) {
  return (
    <div className="space-y-3">
      <h2 className="font-display text-xl font-black text-foreground">{titulo}</h2>
      <div className="space-y-2">
        {itens.map((item, i) => (
          <details
            key={item.pergunta}
            open={aberto && i === 0}
            className="group rounded-xl border border-border bg-background px-4 py-3 open:border-primary/30"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-foreground [&::-webkit-details-marker]:hidden">
              {item.pergunta}
              <span aria-hidden className="shrink-0 text-muted-foreground transition-transform group-open:rotate-90">
                ›
              </span>
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.resposta}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
