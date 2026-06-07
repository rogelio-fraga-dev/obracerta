"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type AvailabilitySlot,
  type CalendarDay,
  setAvailabilitySchema,
} from "@obracerta/shared";
import { Badge, Button, Card, Input } from "@obracerta/ui";
import { bff } from "@/lib/client";
import { formatDayBR, WEEKDAY_LABELS, WEEKDAY_LABELS_LONG } from "@/lib/format";

interface Range {
  horaInicio: string;
  horaFim: string;
}

type GradeState = Record<number, Range[]>;

function gradeFromSlots(slots: AvailabilitySlot[]): GradeState {
  const grade: GradeState = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const slot of slots) {
    grade[slot.diaSemana]?.push({ horaInicio: slot.horaInicio, horaFim: slot.horaFim });
  }
  return grade;
}

/**
 * Editor da grade semanal (cliente) + visão do calendário projetado. Salvar
 * substitui a grade inteira no BFF (idempotente) e revalida a página para o
 * calendário refletir.
 */
export function AgendaEditor({
  initialGrade,
  calendario,
}: {
  initialGrade: AvailabilitySlot[];
  calendario: CalendarDay[];
}) {
  const router = useRouter();
  const [grade, setGrade] = useState<GradeState>(() => gradeFromSlots(initialGrade));
  const [draft, setDraft] = useState<Record<number, Range>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const totalFaixas = useMemo(
    () => Object.values(grade).reduce((acc, ranges) => acc + ranges.length, 0),
    [grade],
  );

  function addRange(dia: number) {
    const d = draft[dia];
    setError(null);
    if (!d?.horaInicio || !d.horaFim) {
      setError("Informe início e fim da faixa.");
      return;
    }
    if (d.horaInicio >= d.horaFim) {
      setError("O início deve ser anterior ao fim.");
      return;
    }
    setGrade((g) => ({ ...g, [dia]: [...g[dia]!, { ...d }] }));
    setDraft((dr) => ({ ...dr, [dia]: { horaInicio: "", horaFim: "" } }));
    setSaved(false);
  }

  function removeRange(dia: number, idx: number) {
    setGrade((g) => ({ ...g, [dia]: g[dia]!.filter((_, i) => i !== idx) }));
    setSaved(false);
  }

  async function salvar() {
    setError(null);
    setSaving(true);
    try {
      const slots = Object.entries(grade).flatMap(([dia, ranges]) =>
        ranges.map((r) => ({ diaSemana: Number(dia), horaInicio: r.horaInicio, horaFim: r.horaFim })),
      );
      const parsed = setAvailabilitySchema.safeParse({ slots });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Grade inválida.");
      }
      await bff.post("/api/availability/grade", { slots });
      setSaved(true);
      router.refresh(); // recarrega o calendário projetado
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <Card className="space-y-4">
        <h2 className="font-display text-lg font-black text-foreground">Grade semanal</h2>
        <ul className="space-y-3">
          {WEEKDAY_LABELS_LONG.map((nome, dia) => (
            <li key={dia} className="border-b border-border pb-3 last:border-0 last:pb-0">
              <div className="text-sm font-semibold text-foreground">{nome}</div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {grade[dia]!.length === 0 && (
                  <span className="text-xs text-muted-foreground">Indisponível</span>
                )}
                {grade[dia]!.map((r, idx) => (
                  <span
                    key={`${r.horaInicio}-${r.horaFim}-${idx}`}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-foreground"
                  >
                    {r.horaInicio}–{r.horaFim}
                    <button
                      type="button"
                      aria-label={`Remover faixa ${r.horaInicio} a ${r.horaFim}`}
                      onClick={() => removeRange(dia, idx)}
                      className="text-muted-foreground hover:text-danger"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  type="time"
                  aria-label={`Início ${nome}`}
                  className="h-9 w-28 px-2 py-1"
                  value={draft[dia]?.horaInicio ?? ""}
                  onChange={(e) =>
                    setDraft((dr) => ({
                      ...dr,
                      [dia]: { horaInicio: e.target.value, horaFim: dr[dia]?.horaFim ?? "" },
                    }))
                  }
                />
                <span className="text-muted-foreground">–</span>
                <Input
                  type="time"
                  aria-label={`Fim ${nome}`}
                  className="h-9 w-28 px-2 py-1"
                  value={draft[dia]?.horaFim ?? ""}
                  onChange={(e) =>
                    setDraft((dr) => ({
                      ...dr,
                      [dia]: { horaInicio: dr[dia]?.horaInicio ?? "", horaFim: e.target.value },
                    }))
                  }
                />
                <Button variant="ghost" size="sm" onClick={() => addRange(dia)}>
                  + Adicionar
                </Button>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between">
          {saved ? (
            <Badge tone="success">Salvo</Badge>
          ) : (
            <span className="text-xs text-muted-foreground">{totalFaixas} faixa(s)</span>
          )}
          <Button onClick={salvar} disabled={saving}>
            {saving ? "Salvando…" : "Salvar agenda"}
          </Button>
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-display text-lg font-black text-foreground">Próximos dias livres</h2>
        {calendario.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum dia livre projetado. Defina sua grade acima e salve.
          </p>
        ) : (
          <ul className="space-y-2">
            {calendario.slice(0, 14).map((dia) => (
              <li key={dia.data} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-semibold text-foreground">
                  {WEEKDAY_LABELS[dia.diaSemana]} {formatDayBR(dia.data)}
                </span>
                <span className="text-right text-muted-foreground">
                  {dia.janelas.map((j) => `${j.horaInicio}–${j.horaFim}`).join(", ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
