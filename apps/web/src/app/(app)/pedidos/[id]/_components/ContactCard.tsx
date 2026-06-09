import type { BookingContact } from "@obracerta/shared";

/** Só dígitos para montar o link wa.me (remove +, espaços, parênteses). */
function waLink(whatsapp: string): string {
  return `https://wa.me/${whatsapp.replace(/\D/g, "")}`;
}

/**
 * Contato liberado pós-aceite (double-blind §24). Mostra WhatsApp/e-mail da
 * outra parte com ações diretas. Só renderiza quando a API libera o contato.
 */
export function ContactCard({ contato, papel }: { contato: BookingContact; papel: string }) {
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/[0.04] p-4">
      <div className="flex items-center gap-2">
        <span aria-hidden className="text-lg">
          🔓
        </span>
        <p className="text-xs font-bold uppercase tracking-[2px] text-primary">
          Contato liberado · {papel}
        </p>
      </div>
      <p className="mt-2 font-display text-lg font-black text-foreground">{contato.nome}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={waLink(contato.whatsapp)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md bg-primary px-4 py-2 text-sm font-extrabold text-primary-foreground"
        >
          WhatsApp {contato.whatsapp}
        </a>
        {contato.email && (
          <a
            href={`mailto:${contato.email}`}
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground"
          >
            {contato.email}
          </a>
        )}
      </div>
    </div>
  );
}
