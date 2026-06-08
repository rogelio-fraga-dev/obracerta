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
  Legend
} from "recharts";

import type { HealthSnapshot } from "@obracerta/shared";

interface AdminChartsProps {
  snapshot: HealthSnapshot;
}

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
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: "transparent" }}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))"
                }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="quantidade" name="Usuários Ativos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
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
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: "transparent" }}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))"
                }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="total" name="Cadastrados" fill="#f97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="concluidos" name="Sucesso/Adjudicados" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
