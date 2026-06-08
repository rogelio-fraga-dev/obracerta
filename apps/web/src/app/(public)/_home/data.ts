/**
 * Conteúdo da landing (refatorado sobre `docs/mockups/landing_page.html`).
 * Números são **placeholders realistas de começo de startup** (sem selo, decisão
 * do fundador) — trocar por dados reais quando houver tração.
 */

export type PersonaId = "contratante" | "profissional" | "empresa";

export interface PersonaStep {
  titulo: string;
  texto: string;
}

export interface Persona {
  id: PersonaId;
  label: string;
  /** Rótulo curto para o toggle (estilo quemfaz: "Sou cliente / Sou profissional"). */
  shortLabel: string;
  icon: string;
  /** Sub-rótulo do botão de seleção. */
  tagline: string;
  /** Manchete do hero quando esta persona está ativa (o `accent` fica em itálico/laranja). */
  heroTitle: string;
  heroAccent: string;
  heroSub: string;
  ctaLabel: string;
  /** Passo-a-passo "Como funciona" desta persona. */
  steps: PersonaStep[];
}

export const PERSONAS: Persona[] = [
  {
    id: "contratante",
    label: "Procuro um profissional",
    shortLabel: "Sou cliente",
    icon: "🏠",
    tagline: "Pessoa física",
    heroTitle: "O profissional",
    heroAccent: "certo",
    heroSub:
      "Encontre pedreiros, eletricistas, encanadores e mais — com histórico real, agenda transparente e reputação verificada. Sem boca a boca, sem surpresas.",
    ctaLabel: "Encontrar profissional",
    steps: [
      { titulo: "Busque e escolha", texto: "Filtre por profissão, cidade e avaliação. Veja agenda e valores direto no perfil." },
      { titulo: "Envie a proposta", texto: "Escolha um dia livre na agenda do profissional e mande sua proposta com mensagem e fotos." },
      { titulo: "Profissional aprova", texto: "Em até 24h ele confirma. Aí liberam-se telefone, e-mail e WhatsApp para vocês combinarem." },
      { titulo: "Combinem os detalhes", texto: "Com os contatos liberados, alinhem valor, data e escopo diretamente entre vocês." },
      { titulo: "Confirme e avalie", texto: "Registre o início do serviço e, ao final, avalie. Avaliação dupla-cega, justa para os dois." },
    ],
  },
  {
    id: "profissional",
    label: "Sou profissional",
    shortLabel: "Sou profissional",
    icon: "🔨",
    tagline: "Autônomo",
    heroTitle: "Sua próxima obra",
    heroAccent: "começa aqui",
    heroSub:
      "Apareça nas buscas da sua cidade, receba pedidos diretos e construa uma reputação que vale mais que qualquer indicação. 7 dias do Pro grátis.",
    ctaLabel: "Criar perfil profissional",
    steps: [
      { titulo: "Crie seu perfil", texto: "Escolha suas profissões no catálogo, adicione fotos do portfólio e configure sua agenda." },
      { titulo: "Apareça nas buscas", texto: "Clientes da sua cidade te encontram por profissão e disponibilidade. Melhor reputação, mais alto você aparece." },
      { titulo: "Receba e responda", texto: "Chega a solicitação com a mensagem do cliente. Você responde e tem 24h para aprovar." },
      { titulo: "Aprove e execute", texto: "Ao aprovar, seus contatos são liberados. Combine os detalhes e faça o serviço." },
      { titulo: "Construa reputação", texto: "Cada obra concluída vira avaliação e badge. Dê lances sigilosos em obras abertas." },
    ],
  },
  {
    id: "empresa",
    label: "Sou uma empresa",
    shortLabel: "Sou empresa",
    icon: "🏢",
    tagline: "Construtora / empreiteira",
    heroTitle: "Sua equipe,",
    heroAccent: "mais obras",
    heroSub:
      "Cadastre sua empresa, encontre profissionais verificados e publique obras para receber propostas. Gestão centralizada num único acesso.",
    ctaLabel: "Cadastrar empresa",
    steps: [
      { titulo: "Cadastre a empresa", texto: "CNPJ, razão social e dados da equipe num único administrador. Cadastro rápido." },
      { titulo: "Busque ou publique", texto: "Encontre profissionais por profissão e cidade, ou publique a obra para receber propostas." },
      { titulo: "Receba propostas", texto: "Profissionais enviam lances sigilosos. Compare lado a lado e escolha com segurança." },
      { titulo: "Escolha e contrate", texto: "Selecione o profissional, libere os contatos e combine os detalhes diretamente." },
      { titulo: "Acompanhe e avalie", texto: "Veja o histórico de obras e avalie cada serviço. Sua reputação como contratante também conta." },
    ],
  },
];

export const STATS = [
  { num: "180+", lbl: "Profissionais cadastrados" },
  { num: "850+", lbl: "Obras realizadas" },
  { num: "4.8★", lbl: "Avaliação média" },
];

export const HERO_CARDS = [
  { icon: "👷", nome: "Carlos Mendes", role: "Pedreiro · Uberlândia, MG", rating: "⭐ 4.9 · 87 obras" },
  { icon: "👩‍🔧", nome: "Ana Paula Costa", role: "Mestre de obras · Uberlândia, MG", rating: "⭐ 4.8 · 54 obras" },
  { icon: "👨‍🔧", nome: "Roberto Silva", role: "Eletricista · Uberlândia, MG", rating: "⭐ 4.7 · 63 obras" },
];

export const DORES = [
  { emoji: "😰", titulo: "“Indiquei um conhecido e ele sumiu no meio da obra”", texto: "Sem histórico verificado, você só descobre que errou quando o estrago já está feito." },
  { emoji: "📅", titulo: "“Precisava de alguém pra semana que vem e não achei ninguém”", texto: "Descobrir disponibilidade ainda exige ligar um por um, sem nenhuma agenda visível." },
  { emoji: "💸", titulo: "“Paguei caro demais porque não sabia quanto devia custar”", texto: "Sem referência de preço, quem contrata sempre leva desvantagem na negociação." },
  { emoji: "👻", titulo: "“Não sabia se podia confiar — nunca vi o trabalho dele”", texto: "Contratar sem ver portfólio ou avaliações reais é sempre um ato de fé." },
  { emoji: "⏳", titulo: "“Perdi duas semanas só procurando um pedreiro de confiança”", texto: "O tempo gasto na busca já atrasa a obra antes mesmo de ela começar." },
  { emoji: "🤷", titulo: "“A indicação era boa, mas ele não atendia na minha data”", texto: "Mesmo com boa indicação, achar alguém livre no momento certo continua difícil." },
];

export const DEPOIMENTOS = [
  { avatar: "👩", texto: "Encontrei um pedreiro excelente em menos de 10 minutos. Antes eu ficava uma semana pedindo indicação pra todo mundo.", nome: "Mariana Figueiredo", info: "Reforma de apartamento · Uberlândia" },
  { avatar: "👷", texto: "Como pedreiro, minha agenda nunca esteve tão cheia. Em dois meses no Pro já paguei o investimento muitas vezes.", nome: "Carlos Mendes", info: "Pedreiro · 87 obras na plataforma" },
  { avatar: "🧑", texto: "Publiquei minha obra e recebi 7 propostas em 48 horas. Contratei por menos do que esperava pagar.", nome: "Ricardo Alves", info: "Construção residencial · Uberlândia" },
];

export const FAQ = [
  { q: "O trial de 7 dias é gratuito mesmo?", a: "Sim, 100% gratuito. Não pedimos cartão para ativar o trial. Você experimenta o plano Pro por 7 dias completos e só decide se quer continuar depois disso." },
  { q: "Como funciona o sistema de lances? Os profissionais veem as propostas dos concorrentes?", a: "Não. O sistema de lances é sigiloso — cada profissional vê apenas a própria proposta. A competição é pelo mérito real, não por guerra de preços." },
  { q: "Por que o contato só é liberado após a aprovação?", a: "Para garantir compromisso real dos dois lados. O profissional aprova a solicitação em até 24h e, após isso, telefone, e-mail e WhatsApp são liberados para combinarem os detalhes." },
  { q: "O ObraCerta garante a qualidade do serviço contratado?", a: "O ObraCerta é uma plataforma de conexão — não é parte do contrato entre cliente e profissional. Oferecemos transparência (histórico verificado, avaliações reais e agenda visível) para você decidir com segurança, mas a contratação e a execução são responsabilidade das partes." },
  { q: "Quanto custa para contratar um profissional?", a: "Buscar e contatar é o foco da plataforma. A receita vem da assinatura mensal dos profissionais — não cobramos comissão sobre o serviço contratado. Você combina o valor da obra diretamente com o profissional." },
  { q: "Posso cancelar minha assinatura quando quiser?", a: "Sim. Sem fidelidade, sem multa. Você cancela quando quiser pelo próprio app. Seu perfil e histórico ficam salvos caso queira voltar." },
];
