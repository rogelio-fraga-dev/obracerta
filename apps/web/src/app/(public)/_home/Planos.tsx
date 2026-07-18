"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@obracerta/ui";

type Lado = "profissional" | "contratante" | "empresa";

const LADOS: { id: Lado; label: string }[] = [
  { id: "profissional", label: "Sou profissional" },
  { id: "contratante", label: "Quero contratar" },
  { id: "empresa", label: "Sou empresa" },
];

/** Bloco de recursos com título próprio (planos de empresa agrupam por área). */
interface GrupoRecursos {
  titulo: string;
  sim?: string[];
  nao?: string[];
}

interface PlanoView {
  nome: string;
  preco: string;
  periodo: string;
  desc: string;
  destaque?: boolean;
  /** Recursos incluídos (✓). */
  sim?: string[];
  /** Recursos não incluídos (✗). */
  nao?: string[];
  /** Rótulo da lista de não incluídos (padrão "Não inclui"). */
  naoTitulo?: string;
  /** Recursos agrupados por área — usados pelos planos de empresa. */
  grupos?: GrupoRecursos[];
}

/** Planos do profissional — homologação 18/07 (R$ 19,90 / 49,90 / 99,90). */
const PLANOS_PROFISSIONAL: PlanoView[] = [
  {
    nome: "Iniciante",
    preco: "R$ 19,90",
    periodo: "/mês · 7 primeiros dias grátis",
    desc: "Essencial — Seja encontrado.",
    sim: [
      "Perfil aparece nas buscas",
      "Primeiro nome",
      "Cidade e raio de atuação",
      "Agenda disponível",
      "Receber pedidos de orçamento",
    ],
    nao: [
      "Foto de perfil",
      "Nome completo",
      "Avaliações de clientes",
      "Portfólio de obras",
      "Obras concluídas",
      "Valores cobrados",
      "Analytics do perfil",
      "Responder pedidos de orçamento",
      "Contato do cliente",
      "Dar lances em obras",
    ],
  },
  {
    nome: "Profissional",
    preco: "R$ 49,90",
    periodo: "/mês · cancele quando quiser",
    destaque: true,
    desc: "Para quem quer conquistar a confiança dos clientes e fechar mais serviços.",
    sim: [
      "Tudo do Plano Essencial",
      "Foto de perfil",
      "Nome completo",
      "Portfólio de obras",
      "Avaliações de clientes",
      "Obras concluídas",
      "Valores cobrados",
      "Analytics do perfil",
      "Responder pedidos de orçamento ilimitados",
      "Contato do cliente liberado",
    ],
  },
  {
    nome: "Especialista",
    preco: "R$ 99,90",
    periodo: "/mês · cancele quando quiser",
    desc: "Para quem quer receber mais oportunidades e acelerar o crescimento do seu negócio.",
    sim: [
      "Tudo do Plano Profissional",
      "Dar lances em obras",
      "Topo das buscas",
      "Receber novas oportunidades em primeira mão",
      "Analytics avançados do perfil",
      "Prioridade no suporte",
    ],
  },
];

/** Planos do contratante — assinatura mensal (homologação 18/07). */
const PLANOS_CONTRATANTE: PlanoView[] = [
  {
    nome: "Essencial",
    preco: "R$ 19,90",
    periodo: "/mês · cancele quando quiser",
    desc: "Ideal para quem quer conhecer a plataforma e encontrar profissionais disponíveis.",
    sim: ["Buscar profissionais", "Filtrar por profissão", "Visualizar disponibilidade", "Solicitar contato"],
    naoTitulo: "Informações bloqueadas",
    nao: [
      "Foto de perfil",
      "Nome completo",
      "Avaliações de clientes",
      "Portfólio de obras",
      "Obras concluídas",
      "Valores cobrados",
      "Ranking dos profissionais",
      "Agendamento",
    ],
  },
  {
    nome: "Completo",
    preco: "R$ 39,90",
    periodo: "/mês · cancele quando quiser",
    destaque: true,
    desc: "Ideal para quem quer contratar com confiança e tomar a melhor decisão.",
    sim: [
      "Tudo do Plano Essencial",
      "Foto de perfil",
      "Nome completo",
      "Avaliações de clientes",
      "Portfólio de obras",
      "Obras concluídas",
      "Valores cobrados",
      "Ranking dos profissionais",
      "Agenda detalhada",
      "Solicitar agendamento",
      "Contato liberado após aprovação",
    ],
  },
  {
    nome: "Lance",
    preco: "R$ 69,90",
    periodo: "/mês · cancele quando quiser",
    desc: "Publique sua obra e receba propostas dos melhores profissionais da sua região.",
    sim: [
      "Tudo do Plano Completo",
      "Publicar obras",
      "Receber propostas de diversos profissionais",
      "Comparar propostas lado a lado",
      "Receber lances de profissionais qualificados",
    ],
  },
];

/** Planos de empresa — recursos agrupados por área (homologação 18/07). */
const PLANOS_EMPRESA: PlanoView[] = [
  {
    nome: "Essencial",
    preco: "R$ 49,90",
    periodo: "/mês · cancele quando quiser",
    desc: "Para empresas que querem cadastrar sua operação, apresentar sua equipe e encontrar profissionais para suas demandas.",
    grupos: [
      {
        titulo: "🏢 Sua empresa na plataforma",
        sim: [
          "Cadastre sua empresa com CNPJ e dados principais",
          "Adicione pessoas da sua equipe para acessar e gerenciar a conta",
          "Cadastre os profissionais que fazem parte da sua equipe",
        ],
      },
      {
        titulo: "🔎 Encontre profissionais para suas demandas",
        sim: [
          "Busque profissionais por profissão e região",
          "Veja profissionais disponíveis na plataforma",
          "Solicite contato",
        ],
      },
      {
        titulo: "Informações e recursos bloqueados",
        nao: [
          "Ver foto de perfil dos profissionais",
          "Ver nome completo",
          "Ver avaliações de clientes",
          "Ver portfólio de obras realizadas",
          "Ver obras concluídas",
          "Ver valores cobrados",
          "Ver ranking dos profissionais",
          "Ver agenda detalhada",
          "Publicar obras",
          "Receber propostas de profissionais",
          "Comparar propostas",
          "Receber lances",
        ],
      },
    ],
  },
  {
    nome: "Completo",
    preco: "R$ 99,90",
    periodo: "/mês · cancele quando quiser",
    destaque: true,
    desc: "Para empresas que querem contratar profissionais com mais segurança e escolher as melhores oportunidades.",
    grupos: [
      {
        titulo: "🏢 Sua empresa na plataforma",
        sim: [
          "Tudo do Plano Essencial",
          "Perfil completo da empresa",
          "Maior visibilidade da empresa na plataforma",
          "Gerenciamento dos profissionais vinculados à empresa",
        ],
      },
      {
        titulo: "🔎 Encontre profissionais com mais confiança",
        sim: [
          "Ver foto de perfil dos profissionais",
          "Ver nome completo",
          "Ver avaliações de clientes",
          "Ver portfólio de obras realizadas",
          "Ver obras concluídas",
          "Ver valores cobrados",
          "Ver ranking dos profissionais",
          "Ver agenda detalhada",
          "Solicitar agendamento",
          "Liberar contato após aprovação",
        ],
      },
      {
        titulo: "🏗️ Contratação de serviços",
        sim: [
          "Publicar demandas de contratação",
          "Receber propostas de profissionais",
          "Comparar profissionais antes da contratação",
        ],
        nao: [
          "Receber lances competitivos de vários profissionais",
          "Destaque prioritário das obras",
          "Relatórios avançados da operação",
        ],
      },
    ],
  },
  {
    nome: "Empresa PRO",
    preco: "R$ 149,90",
    periodo: "/mês · cancele quando quiser",
    desc: "Para empresas que querem contratar melhor, reduzir custos e receber propostas dos melhores profissionais da região.",
    sim: ["Tudo do Plano Completo"],
    grupos: [
      {
        titulo: "🏗️ Disputa de oportunidades",
        sim: [
          "Publicar obras para receber propostas",
          "Receber lances de diversos profissionais",
          "Comparar valores e prazos lado a lado",
          "Escolher a melhor proposta para cada obra",
        ],
      },
      {
        titulo: "📊 Gestão e crescimento",
        sim: [
          "Destaque das obras publicadas",
          "Maior alcance para encontrar profissionais",
          "Relatórios da operação",
          "Histórico completo de contratações",
          "Indicadores de desempenho das contratações",
        ],
      },
    ],
  },
];

const PLANOS_POR_LADO: Record<Lado, PlanoView[]> = {
  profissional: PLANOS_PROFISSIONAL,
  contratante: PLANOS_CONTRATANTE,
  empresa: PLANOS_EMPRESA,
};

function ItemRecurso({ texto, incluido, destaque }: { texto: string; incluido: boolean; destaque?: boolean }) {
  if (incluido) {
    return (
      <li className={cn("flex items-start gap-2 text-sm", destaque ? "text-background/80" : "text-foreground")}>
        <span aria-hidden className="mt-0.5 text-success">✓</span>
        {texto}
      </li>
    );
  }
  return (
    <li
      className={cn(
        "flex items-start gap-2 text-sm line-through",
        destaque ? "text-background/35" : "text-muted-foreground/50",
      )}
    >
      <span aria-hidden className="mt-0.5 not-italic no-underline">✕</span>
      <span className="no-underline">{texto}</span>
    </li>
  );
}

function TituloLista({ children, destaque }: { children: string; destaque?: boolean }) {
  return (
    <div
      className={cn(
        "mb-2 mt-4 text-[11px] font-extrabold uppercase tracking-wider first:mt-0",
        destaque ? "text-background/50" : "text-muted-foreground",
      )}
    >
      {children}
    </div>
  );
}

export function Planos() {
  const [lado, setLado] = useState<Lado>("profissional");
  const planos = PLANOS_POR_LADO[lado];

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
          className="mt-8 inline-flex flex-wrap gap-1 rounded-xl bg-muted p-1"
        >
          {LADOS.map((l) => (
            <button
              key={l.id}
              type="button"
              role="tab"
              aria-selected={lado === l.id}
              onClick={() => setLado(l.id)}
              className={cn(
                "rounded-lg px-5 py-2 text-sm font-bold transition-colors",
                lado === l.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {l.label}
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
              <div className={cn("mt-2 font-display text-4xl font-black", p.destaque ? "text-background" : "text-foreground")}>
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
              <div className="mt-5 flex-1">
                {p.sim && (
                  <>
                    <TituloLista destaque={p.destaque}>Inclui</TituloLista>
                    <ul className="space-y-2.5">
                      {p.sim.map((b) => (
                        <ItemRecurso key={b} texto={b} incluido destaque={p.destaque} />
                      ))}
                    </ul>
                  </>
                )}
                {p.nao && (
                  <>
                    <TituloLista destaque={p.destaque}>{p.naoTitulo ?? "Não inclui"}</TituloLista>
                    <ul className="space-y-2.5">
                      {p.nao.map((b) => (
                        <ItemRecurso key={b} texto={b} incluido={false} destaque={p.destaque} />
                      ))}
                    </ul>
                  </>
                )}
                {p.grupos?.map((g) => (
                  <div key={g.titulo}>
                    <TituloLista destaque={p.destaque}>{g.titulo}</TituloLista>
                    <ul className="space-y-2.5">
                      {g.sim?.map((b) => (
                        <ItemRecurso key={b} texto={b} incluido destaque={p.destaque} />
                      ))}
                      {g.nao?.map((b) => (
                        <ItemRecurso key={b} texto={b} incluido={false} destaque={p.destaque} />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
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
