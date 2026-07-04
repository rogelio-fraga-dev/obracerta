import type { AvailabilitySlot, CalendarDay } from "@obracerta/shared";
import { Card } from "@obracerta/ui";
import { serverApi } from "@/lib/server-api";
import { getProfileHint } from "@/lib/session";
import { BackLink } from "../_shell/BackLink";
import { AgendaEditor } from "./_components/AgendaEditor";

/**
 * Agenda do profissional (Fase 2): edita a **grade semanal** de disponibilidade
 * e mostra o **calendário projetado** (6 meses, menos os bloqueios). Só faz
 * sentido para profissionais — contratante vê um aviso.
 */
export default async function AgendaPage() {
  const hint = await getProfileHint();
  if (hint && hint.tipo !== "PROFISSIONAL") {
    return (
      <section aria-labelledby="agenda-heading" className="space-y-4">
        <h1 id="agenda-heading" className="font-display text-2xl font-black text-foreground">
          Agenda
        </h1>
        <Card>
          <p className="text-muted-foreground">
            A agenda é exclusiva dos profissionais. Como contratante, você consulta a agenda de um
            profissional ao abrir o perfil dele.
          </p>
        </Card>
      </section>
    );
  }

  const [grade, calendario] = await Promise.all([
    serverApi<AvailabilitySlot[]>("GET", "/availability/me"),
    serverApi<CalendarDay[]>("GET", "/availability/me/calendario?meses=2"),
  ]);

  return (
    <section aria-labelledby="agenda-heading" className="space-y-5">
      <BackLink href="/inicio" label="Início" />
      <div>
        <h1 id="agenda-heading" className="font-display text-2xl font-black text-foreground">
          Agenda
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Defina seus horários fixos por dia da semana. Mostramos como fica o seu calendário.
        </p>
      </div>
      <AgendaEditor initialGrade={grade} calendario={calendario} />
    </section>
  );
}
