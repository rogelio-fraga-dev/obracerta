import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { getProfileHint } from "@/lib/session";
import {
  AgendaIcon,
  ObrasIcon,
  PedidosIcon,
  PlanoIcon,
  PlusIcon,
  SearchIcon,
} from "../_shell/icons";

interface Acao {
  href: string;
  titulo: string;
  desc: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const ACOES_PROFISSIONAL: Acao[] = [
  { href: "/agenda", titulo: "Minha agenda", desc: "Defina seus horários disponíveis", Icon: AgendaIcon },
  { href: "/pedidos", titulo: "Pedidos", desc: "Aprove, inicie e conclua serviços", Icon: PedidosIcon },
  { href: "/obras", titulo: "Obras abertas", desc: "Dê lances em obras de contratantes", Icon: ObrasIcon },
  { href: "/cobrancas", titulo: "Meu plano", desc: "Plano, faturas e benefícios", Icon: PlanoIcon },
];

const ACOES_CONTRATANTE: Acao[] = [
  { href: "/buscar", titulo: "Encontrar profissional", desc: "Por especialidade ou perto de você", Icon: SearchIcon },
  { href: "/obras/nova", titulo: "Publicar obra", desc: "Receba lances de vários profissionais", Icon: PlusIcon },
  { href: "/pedidos", titulo: "Meus pedidos", desc: "Acompanhe seus agendamentos", Icon: PedidosIcon },
  { href: "/cobrancas", titulo: "Cobranças", desc: "Faturas e reembolsos", Icon: PlanoIcon },
];

/** Início — painel inicial ciente de papel, com ações rápidas. */
export default async function InicioPage() {
  const hint = await getProfileHint();
  const primeiroNome = hint?.nome.split(" ")[0] ?? "";
  const isProfissional = hint?.tipo === "PROFISSIONAL";
  const acoes = isProfissional ? ACOES_PROFISSIONAL : ACOES_CONTRATANTE;

  return (
    <section aria-labelledby="inicio-heading" className="space-y-6">
      <div className="rounded-2xl bg-foreground px-6 py-7 text-background">
        <p className="text-xs font-bold uppercase tracking-[2px] text-background/60">
          {isProfissional ? "Profissional" : "Contratante"}
        </p>
        <h1 id="inicio-heading" className="mt-1 font-display text-3xl font-black text-background">
          {primeiroNome ? `Olá, ${primeiroNome}` : "Bem-vindo"}
        </h1>
        <p className="mt-1 text-sm text-background/70">
          {isProfissional
            ? "Gerencie sua agenda, pedidos e obras por aqui."
            : "Encontre profissionais e acompanhe seus pedidos."}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {acoes.map(({ href, titulo, desc, Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-4 rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-foreground">{titulo}</span>
              <span className="block truncate text-sm text-muted-foreground">{desc}</span>
            </span>
            <span aria-hidden className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary">
              →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
