import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de uso e assinaturas",
  description:
    "Regras de assinatura, teste grátis, renovação automática e cancelamento da plataforma.",
};

/**
 * Termos de uso — foco nas regras comerciais das assinaturas (homologação 18/07):
 * teste grátis com cartão, renovação automática mensal e cancelamento (CDC).
 * O texto institucional completo (responsabilidades, LGPD) evolui com o jurídico;
 * esta página é a referência que o app e o cadastro linkam.
 */
export default function TermosPage() {
  return (
    <section className="px-6 py-16 sm:px-10 lg:px-14">
      <div className="mx-auto max-w-3xl">
        <span className="text-xs font-extrabold uppercase tracking-[3px] text-primary">
          Institucional
        </span>
        <h1 className="mt-3 font-display text-3xl font-black tracking-tight text-foreground sm:text-5xl">
          Termos de uso e <em className="italic text-primary">assinaturas</em>
        </h1>
        <p className="mt-4 text-muted-foreground">
          Estas são as regras comerciais dos planos da plataforma. Ao assinar qualquer plano, você
          declara ciência e concordância com o que está descrito abaixo.
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground">
          <TermoBloco titulo="1. Assinaturas e renovação automática">
            Todos os planos (profissional, contratante e empresa) são <strong>assinaturas mensais
            com renovação automática</strong>: ao fim de cada período de 30 dias, uma nova cobrança
            é gerada no mesmo valor vigente do plano. Não há fidelidade nem multa por cancelamento.
          </TermoBloco>

          <TermoBloco titulo="2. Teste grátis de 7 dias (plano Iniciante)">
            O teste grátis de 7 dias é <strong>exclusivo do plano Iniciante</strong> (conta
            profissional). Para ativá-lo é obrigatório cadastrar um cartão de crédito.{" "}
            <strong>Nenhum valor é cobrado durante o teste</strong> — se você cancelar antes do fim
            dos 7 dias, nada é cobrado. Ao fim do teste, a assinatura é renovada automaticamente
            pelo valor mensal do plano (R$ 19,90/mês), cobrado no cartão cadastrado.
          </TermoBloco>

          <TermoBloco titulo="3. Cancelamento">
            Você pode cancelar qualquer assinatura a qualquer momento pelo próprio aplicativo (área
            de Cobranças). O cancelamento interrompe a renovação automática;{" "}
            <strong>o acesso aos recursos do plano continua até o fim do período já pago</strong>.
            Não há reembolso automático do período em curso, ressalvado o direito de arrependimento.
          </TermoBloco>

          <TermoBloco titulo="4. Direito de arrependimento (CDC)">
            Nos termos do art. 49 do Código de Defesa do Consumidor, você pode desistir da
            contratação em até <strong>7 dias corridos</strong> após o primeiro pagamento, com
            devolução integral do valor pago. Outros cenários (cobrança indevida, falha de serviço
            e cancelamento proporcional) são tratados pela área de reembolsos do aplicativo.
          </TermoBloco>

          <TermoBloco titulo="5. Alteração de planos e preços">
            Upgrades têm efeito imediato. Mudanças de preço dos planos são comunicadas com
            antecedência e passam a valer apenas na renovação seguinte — nunca no período já pago.
          </TermoBloco>

          <TermoBloco titulo="6. Papel da plataforma">
            A plataforma conecta clientes e profissionais e <strong>não intermedia o pagamento dos
            serviços contratados</strong> entre as partes: valor, escopo e execução da obra são
            combinados diretamente entre cliente e profissional. Não cobramos comissão sobre o
            serviço. A reputação exibida (avaliações, histórico) reflete registros reais de uso.
          </TermoBloco>
        </div>

        <p className="mt-10 text-xs text-muted-foreground">
          Dúvidas sobre cobrança? Veja as{" "}
          <Link href="/#faq" className="font-semibold text-primary hover:underline">
            perguntas frequentes
          </Link>{" "}
          ou fale com o suporte.
        </p>
      </div>
    </section>
  );
}

function TermoBloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-6">
      <h2 className="font-display text-lg font-black text-foreground">{titulo}</h2>
      <p className="mt-2 text-muted-foreground">{children}</p>
    </div>
  );
}
