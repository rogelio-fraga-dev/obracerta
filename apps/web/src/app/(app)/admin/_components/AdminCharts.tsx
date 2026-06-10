"use client";

import { Card } from "@obracerta/ui";
import { colors } from "@obracerta/design-tokens";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

import type { HealthSnapshot } from "@obracerta/shared";

interface AdminChartsProps {
  snapshot: HealthSnapshot;
}

// Cores dos gráficos vêm dos tokens do DS (antes hardcoded + `hsl(var(--token))`
// que não resolvia, pois os tokens são hex). Fonte única de verdade.
const axis = colors.mutedForeground;
const grid = colors.border;
const tooltipStyle = {
  backgroundColor: colors.cream.DEFAULT,
  borderColor: colors.border,
  borderRadius: "8px",
  color: colors.dark.DEFAULT,
} as const;

export function AdminCharts({ snapshot }: AdminChartsProps) {
  const usersData = [
    { name: "Contratantes", quantidade: snapshot.usuarios.contratantes },
    { name: "Profissionais", quantidade: snapshot.usuarios.profissionais },
  ];

  const activityData = [
    { name: "Agendamentos", total: snapshot.agendamentos.total, concluidos: snapshot.agendamentos.concluidos },
    { name: "Obras", total: snapshot.obras.abertas + snapshot.obras.adjudicadas, concluidos: snapshot.obras.adjudicadas },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2 mt-6">
      <Card className="space-y-4">
        <h2 className="font-display text-xl font-bold text-foreground border-b border-border pb-2">
          Distribuição de Usuários
        </h2>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={usersData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={grid} />
              <XAxis dataKey="name" stroke={axis} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke={axis} fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "transparent" }} contentStyle={tooltipStyle} itemStyle={{ color: colors.dark.DEFAULT }} />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="quantidade" name="Usuários Ativos" fill={colors.info} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-display text-xl font-bold text-foreground border-b border-border pb-2">
          Atividade do Sistema
        </h2>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={grid} />
              <XAxis dataKey="name" stroke={axis} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke={axis} fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "transparent" }} contentStyle={tooltipStyle} itemStyle={{ color: colors.dark.DEFAULT }} />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="total" name="Cadastrados" fill={colors.orange[500]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="concluidos" name="Sucesso/Adjudicados" fill={colors.success} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
