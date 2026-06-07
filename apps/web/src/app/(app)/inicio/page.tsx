import Link from "next/link";
import { Card } from "@obracerta/ui";
import { getProfileHint } from "@/lib/session";

/** Aba Início — visão geral ciente de papel (placeholder; cresce nas etapas 7.2–7.5). */
export default async function InicioPage() {
  const hint = await getProfileHint();
  const primeiroNome = hint?.nome.split(" ")[0] ?? "";
  const isProfissional = hint?.tipo === "PROFISSIONAL";

  return (
    <section aria-labelledby="inicio-heading" className="space-y-4">
      <h1 id="inicio-heading" className="font-display text-2xl font-black text-foreground">
        {primeiroNome ? `Olá, ${primeiroNome}` : "Início"}
      </h1>

      {isProfissional ? (
        <Link href="/agenda" className="block">
          <Card className="transition-colors hover:border-primary">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-foreground">Sua agenda</div>
                <p className="text-sm text-muted-foreground">Defina seus horários disponíveis.</p>
              </div>
              <span aria-hidden className="text-xl text-primary">
                →
              </span>
            </div>
          </Card>
        </Link>
      ) : (
        <Link href="/buscar" className="block">
          <Card className="transition-colors hover:border-primary">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-foreground">Encontrar profissional</div>
                <p className="text-sm text-muted-foreground">Busque por especialidade ou perto de você.</p>
              </div>
              <span aria-hidden className="text-xl text-primary">
                →
              </span>
            </div>
          </Card>
        </Link>
      )}
    </section>
  );
}
