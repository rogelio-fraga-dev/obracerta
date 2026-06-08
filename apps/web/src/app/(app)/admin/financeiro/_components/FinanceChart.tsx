"use client";

import { Card } from "@obracerta/ui";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const dataReceita = [
  { name: "Jan", receita: 1500 },
  { name: "Fev", receita: 2300 },
  { name: "Mar", receita: 3400 },
  { name: "Abr", receita: 4200 },
  { name: "Mai", receita: 4900 },
];

const dataAssinaturas = [
  { name: "Jan", novas: 12, canceladas: 2 },
  { name: "Fev", novas: 19, canceladas: 4 },
  { name: "Mar", novas: 25, canceladas: 3 },
  { name: "Abr", novas: 32, canceladas: 5 },
  { name: "Mai", novas: 18, canceladas: 2 },
];

const dataPlanos = [
  { name: "Plano PRO", value: 4500 },
  { name: "Plano Iniciante", value: 400 },
];

const COLORS = ["#d97706", "#f59e0b", "#fbbf24"];

export function FinanceChart() {
  return (
    <div className="flex flex-col gap-6 mt-6">
      {/* Gráfico Principal */}
      <Card className="p-6 h-[400px] w-full flex flex-col">
        <h2 className="font-display text-xl font-bold text-foreground mb-6">
          Histórico de Receita
        </h2>
        <div className="flex-1 min-h-0 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={dataReceita}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `R$ ${value}`}
                dx={-10}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                formatter={(value) => [`R$ ${value},00`, "Receita"]}
                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold", marginBottom: "4px" }}
              />
              <Area
                type="monotone"
                dataKey="receita"
                stroke="#d97706"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorReceita)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Dois Gráficos Secundários Lado a Lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico 2: Novas Assinaturas vs Cancelamentos */}
        <Card className="p-6 h-[350px] flex flex-col">
          <h2 className="font-display text-lg font-bold text-foreground mb-6">
            Assinaturas vs Cancelamentos
          </h2>
          <div className="flex-1 min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dataAssinaturas}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold" }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "12px", paddingBottom: "10px" }} />
                <Bar dataKey="novas" name="Novas Assinaturas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="canceladas" name="Cancelamentos" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Gráfico 3: Distribuição da Receita */}
        <Card className="p-6 h-[350px] flex flex-col">
          <h2 className="font-display text-lg font-bold text-foreground mb-2">
            Distribuição da Receita
          </h2>
          <div className="flex-1 min-h-0 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  formatter={(value) => [`R$ ${value},00`, "Receita"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "13px" }} />
                <Pie
                  data={dataPlanos}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {dataPlanos.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
      </div>
    </div>
  );
}
