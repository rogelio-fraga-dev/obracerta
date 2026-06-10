"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@obracerta/ui";

type Lado = "profissional" | "contratante";

interface PlanoView {
  nome: string;
  preco: string;
  periodo: string;
  desc: string;
  destaque?: boolean;
  /** Recursos incluídos (✓). */
  sim: string[];
  /** Recursos não incluídos (✗). */
  nao?: string[];
}

/** Planos do profissional — preços alinhados ao catálogo (R$0 / R$49 / R$99). */
const PLANOS_PROFISSIONAL: PlanoView[] = [
  {
    nome: "Iniciante",
    preco: "R$0",
    periodo: "para sempre · inclui 7 dias do Pro",
    desc: "Comece de graça: apareça nas buscas e já receba pedidos de clientes.",
    sim: ["Perfil na busca", "Nota geral visível", "Nº de obras concluídas", "Receber pedidos"],
    nao: [
      "Foto de perfil",
      "Nome completo",
      "Cidade e localização",
      "Agenda detalhada",
      "Valores cobrados",
      "Dar lances em obras",
    ],
  },
  {
    nome: "Profissional",
    preco: "R$49",
    periodo: "/mês · cancele quando quiser",
    destaque: true,
    desc: "Perfil completo, tudo desbloqueado — e agora você também dá lances em obras.",
    sim: [
      "Foto de perfil visível",
      "Nome completo visível",
      "Cidade e raio de atuação",
      "Agenda detalhada",
      "Valores cobrados",
      "Portfólio de obras",
      "Receber pedidos",
      "Dar lances em obras",
      "Contatos liberados após aprovação",
      "Analytics do perfil",
    ],
    nao: ["Orçamentos e recibos"],
  },
  {
    nome: "Especialista",
    preco: "R$99",
    periodo: "/mês · cancele quando quiser",
    desc: "Para quem vive de obra: ferramentas de gestão e o máximo alcance nas buscas.",
    sim: [
      "Tudo do plano Profissional",
      "Orçamentos e recibos",
      "Topo absoluto nas buscas",
      "Notificação de buscas na cidade",
      "Badge “Verificado”",
      "Prioridade no suporte",
    ],
  },
];

/** Planos do contratante (acesso por 30 dias). */
const PLANOS_CONTRATANTE: PlanoView[] = [
  {
    nome: "Básico",
    preco: "R$19",
    periodo: "acesso por 30 dias",
    desc: "Explore os profissionais disponíveis na sua cidade.",
    sim: ["Ver todos os profissionais", "Filtro por profissão", "Disponibilidade geral"],
    nao: [
      "Ranking e recomendados",
      "Filtro por avaliação",
      "Agenda detalhada",
      "Valores cobrados",
      "Solicitar agendamento",
      "Publicar obra para lances",
    ],
  },
  {
    nome: "Completo",
    preco: "R$39",
    periodo: "acesso por 30 dias",
    destaque: true,
    desc: "Contrate com segurança, vendo todos os dados antes de decidir.",
    sim: [
      "Tudo do Básico",
      "Ranking e recomendados",
      "Filtro por avaliação",
      "Top da cidade visível",
      "Agenda detalhada",
      "Valores cobrados",
      "Solicitar agendamento",
      "Contatos liberados após aprovação",
    ],
    nao: ["Publicar obra para lances"],
  },
  {
    nome: "Lance",
    preco: "R$69",
    periodo: "acesso por 30 dias",
    desc: "Faça os melhores profissionais competirem pela sua obra.",
    sim: [
      "Tudo do Completo",
      "Publicar obra para lances",
      "Receber propostas sigilosas",
      "Comparar propostas lado a lado",
      "Lances de profissionais verificados",
    ],
  },
];

export function Planos() {
  const [lado, setLado] = useState<Lado>("profissional");
  const planos = lado === "profissional" ? PLANOS_PROFISSIONAL : PLANOS_CONTRATANTE;

  return (
    <section id="planos" className="bg-muted/40 px-6 py-20 sm:px-10 sm:py-28 lg:px-14">
      <div className="mx-auto max-w-[1600px]">
        <span className="text-xs font-extrabold uppercase tracking-[3px] text-primary">Planos e preços</span>
        <h2 className="mt-3 font-display text-3xl font-black tracking-tight text-foreground sm:text-5xl">
          Transparente para <em className="italic text-primary">todo mundo</em>
        </h2>
        <p className="mt-3 text-muted-foreground">Escolha seu perfil e veja os planos disponíveis.</p>

        <div
          role="tablist"
          aria-label="Escolha seu perfil para ver os planos"
          className="mt-8 inline-flex rounded-xl bg-muted p-1"
        >
          {(["profissional", "contratante"] as const).map((l) => (
            <button
              key={l}
              type="button"
              role="tab"
              aria-selected={lado === l}
              onClick={() => setLado(l)}
              className={cn(
                "rounded-lg px-5 py-2 text-sm font-bold transition-colors",
                lado === l ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {l === "profissional" ? "Sou profissional" : "Quero contratar"}
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {planos.map((p) => (
            <div
              key={p.nome}
              className={cn(
                "relative flex flex-col rounded-2xl border-2 p-7 transition-all",
                p.destaque
                  ? "border-foreground bg-foreground text-background shadow-[var(--shadow-lg)]"
                  : "border-border bg-background hover:border-primary hover:shadow-[var(--shadow-md)]",
              )}
            >
              {p.destaque && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-md bg-primary px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-white">
                  Mais popular
                </span>
              )}
              <div
                className={cn(
                  "text-xs font-extrabold uppercase tracking-wider",
                  p.destaque ? "text-background/50" : "text-muted-foreground",
                )}
              >
                {p.nome}
              </div>
              <div className={cn("mt-2 font-display text-5xl font-black", p.destaque ? "text-background" : "text-foreground")}>
                {p.preco}
              </div>
              <div className={cn("mt-1 text-xs", p.destaque ? "text-background/60" : "text-muted-foreground")}>
                {p.periodo}
              </div>
              <p
                className={cn(
                  "mt-4 border-b pb-4 text-sm",
                  p.destaque ? "border-white/10 text-background/70" : "border-border text-muted-foreground",
                )}
              >
                {p.desc}
              </p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {p.sim.map((b) => (
                  <li
                    key={b}
                    className={cn("flex items-start gap-2 text-sm", p.destaque ? "text-background/80" : "text-foreground")}
                  >
                    <span aria-hidden className="mt-0.5 text-success">✓</span>
                    {b}
                  </li>
                ))}
                {p.nao?.map((b) => (
                  <li
                    key={b}
                    className={cn(
                      "flex items-start gap-2 text-sm line-through",
                      p.destaque ? "text-background/35" : "text-muted-foreground/50",
                    )}
                  >
                    <span aria-hidden className="mt-0.5 not-italic no-underline">✕</span>
                    <span className="no-underline">{b}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/cadastro"
                className={cn(
                  "mt-6 w-full rounded-lg border-2 py-3 text-center text-sm font-extrabold transition-colors",
                  p.destaque
                    ? "border-primary bg-primary text-white hover:bg-orange-400"
                    : "border-foreground text-foreground hover:bg-foreground hover:text-background",
                )}
              >
                Começar agora
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
