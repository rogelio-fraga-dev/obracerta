"use client";

import { Card } from "@obracerta/ui";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend,
} from "recharts";

import type { AnalyticsSnapshot } from "@obracerta/shared";

interface AnalyticsChartsProps {
  snapshot: AnalyticsSnapshot;
}

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  borderColor: "hsl(var(--border))",
  borderRadius: "8px",
  color: "hsl(var(--foreground))",
} as const;

/**
 * Gráficos do analytics estratégico: o funil de conversão do profissional
 * (barras decrescentes etapa a etapa) e a coorte de cadastros por mês (linha).
 */
export function AnalyticsCharts({ snapshot }: AnalyticsChartsProps) {
  const funilData = [
    { etapa: "Cadastro", quantidade: snapshot.funil.cadastros },
    { etapa: "Com perfil", quantidade: snapshot.funil.profissionaisComPerfil },
    { etapa: "Ativados", quantidade: snapshot.funil.profissionaisAtivados },
    { etapa: "Com lance", quantidade: snapshot.funil.profissionaisComLance },
    { etapa: "Obra fechada", quantidade: snapshot.funil.obrasAdjudicadas },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="space-y-4">
        <h2 className="font-display text-xl font-bold text-foreground border-b border-border pb-2">
          Funil de conversão
        </h2>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funilData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="etapa"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                interval={0}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip cursor={{ fill: "transparent" }} contentStyle={tooltipStyle} />
              <Bar dataKey="quantidade" name="Profissionais" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-display text-xl font-bold text-foreground border-b border-border pb-2">
          Coorte de cadastros
        </h2>
        <div className="h-[260px] w-full">
          {snapshot.coorte.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Ainda sem dados de cadastro por mês.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={snapshot.coorte} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="mes"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip cursor={{ fill: "transparent" }} contentStyle={tooltipStyle} />
                <Legend verticalAlign="top" height={36} />
                <Line
                  type="monotone"
                  dataKey="profissionais"
                  name="Profissionais"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="contratantes"
                  name="Contratantes"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
    </div>
  );
}
