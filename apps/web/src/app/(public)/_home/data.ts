/**
 * Conteúdo da landing (refatorado sobre `docs/mockups/landing_page.html`).
 * Números são **placeholders realistas de começo de startup** (sem selo, decisão
 * do fundador) — trocar por dados reais quando houver tração.
 */

export type PersonaId = "contratante" | "profissional" | "empresa";

export interface PersonaStep {
  titulo: string;
  texto: string;
  /** Ilustração do passo (emoji — mesmo estilo da seção Dores). */
  emoji: string;
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
    label: "Procura um profissional",
    shortLabel: "Sou cliente",
    icon: "🏠",
    tagline: "Pessoa física",
    heroTitle: "O profissional",
    heroAccent: "certo",
    heroSub:
      "Encontre pedreiros, eletricistas, encanadores e mais — com histórico real, agenda transparente e reputação verificada. Sem boca a boca, sem surpresas.",
    ctaLabel: "Encontrar profissional",
    steps: [
      { emoji: "🔍", titulo: "Busque e compare", texto: "Filtre por profissão, cidade e nota. Veja portfólio, agenda e reputação antes de decidir." },
      { emoji: "📅", titulo: "Envie o pedido", texto: "Escolha um horário livre na agenda e mande o pedido com mensagem e fotos do serviço." },
      { emoji: "⏳", titulo: "Aguarde o aceite", texto: "O profissional confirma em até 24h. No aceite, telefone, e-mail e WhatsApp são liberados." },
      { emoji: "🤝", titulo: "Combine direto", texto: "Com os contatos liberados, vocês validam o valor, data e escopo sem intermediário." },
      { emoji: "⭐", titulo: "Avalie no fim", texto: "Concluído o serviço, avalie. A nota é dupla-cega — justa para os dois lados." },
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
      "Apareça nas buscas da sua cidade, receba pedidos diretos e construa uma reputação que vale mais que qualquer indicação. 7 dias grátis para começar.",
    ctaLabel: "Criar perfil profissional",
    steps: [
      { emoji: "👷", titulo: "Monte seu perfil", texto: "Escolha suas profissões no catálogo, suba fotos para o portfólio e configure sua agenda." },
      { emoji: "📬", titulo: "Receba pedidos", texto: "A solicitação chega com a mensagem do cliente. Você tem 24h para aceitar ou recusar." },
      { emoji: "🛠️", titulo: "Aceite e execute", texto: "No aceite, seus contatos são liberados. Combine os detalhes e faça o serviço." },
      { emoji: "🏆", titulo: "Construa reputação", texto: "Cada obra vira avaliação e badge. No Pro, dê lances sigilosos em obras abertas." },
      { emoji: "📣", titulo: "Apareça na busca", texto: "Clientes da sua cidade te acham por profissão e disponibilidade. Reputação melhor, posição mais alta." },
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
      { emoji: "🏢", titulo: "Cadastre sua empresa", texto: "Crie seu perfil empresarial com CNPJ, dados da empresa e equipe em um só lugar." },
      { emoji: "👥", titulo: "Apresente sua equipe ou encontre profissionais", texto: "Cadastre os profissionais da sua empresa ou encontre especialistas para complementar sua operação." },
      { emoji: "📣", titulo: "Publique obras ou receba oportunidades", texto: "Divulgue suas demandas para receber propostas ou aumente sua visibilidade como empresa prestadora." },
      { emoji: "🤝", titulo: "Escolha e contrate", texto: "Compare profissionais, propostas e escolha as melhores opções para cada necessidade." },
      { emoji: "📊", titulo: "Acompanhe sua operação", texto: "Tenha histórico das obras, avaliações e acompanhe sua reputação dentro da plataforma." },
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

/** Seção "Dores" — formato numerado 01–06 (homologação 18/07): categoria + fala do cliente. */
export const DORES = [
  { categoria: "Encontrar profissionais", frase: "Perco muito tempo procurando profissionais." },
  { categoria: "Confiar na contratação", frase: "Não sei em quem posso confiar." },
  { categoria: "Comparar opções", frase: "Não consigo comparar profissionais antes de contratar." },
  { categoria: "Encontrar disponibilidade", frase: "Nunca encontro alguém disponível quando preciso." },
  { categoria: "Entender o preço justo", frase: "Não sei quanto um serviço realmente custa." },
  { categoria: "Reduzir o risco", frase: "Tenho medo de contratar errado e ter dor de cabeça." },
];

export const DEPOIMENTOS = [
  { avatar: "👩", texto: "Encontrei um pedreiro excelente em menos de 10 minutos. Antes eu ficava uma semana pedindo indicação pra todo mundo.", nome: "Mariana Figueiredo", info: "Reforma de apartamento · Uberlândia" },
  { avatar: "👷", texto: "Como pedreiro, minha agenda nunca esteve tão cheia. Em dois meses no Pro já paguei o investimento muitas vezes.", nome: "Carlos Mendes", info: "Pedreiro · 87 obras na plataforma" },
  { avatar: "🧑", texto: "Publiquei minha obra e recebi 7 propostas em 48 horas. Contratei por menos do que esperava pagar.", nome: "Ricardo Alves", info: "Construção residencial · Uberlândia" },
];

export const FAQ = [
  { q: "Como funciona o teste gratuito de 7 dias?", a: "Os 7 dias grátis são exclusivos do plano Iniciante (Sou Profissional). Para ativar, você precisa cadastrar um cartão de crédito. Não há cobrança durante o período de teste — se cancelar antes do fim dos 7 dias, nenhum valor é cobrado. Após os 7 dias, a assinatura é renovada automaticamente por R$ 19,90/mês." },
  { q: "Como funciona o sistema de lances? Os profissionais veem as propostas dos concorrentes?", a: "Não. O sistema de lances é sigiloso — cada profissional vê apenas a própria proposta. A competição é pelo mérito real, não por guerra de preços." },
  { q: "Por que o contato só é liberado após a aprovação?", a: "Para garantir compromisso real dos dois lados. O profissional aprova a solicitação em até 24h e, após isso, telefone, e-mail e WhatsApp são liberados para combinarem os detalhes." },
  { q: "O ObraCerta garante a qualidade do serviço contratado?", a: "O ObraCerta é uma plataforma de conexão — não é parte do contrato entre cliente e profissional. Oferecemos transparência (histórico verificado, avaliações reais e agenda visível) para você decidir com segurança, mas a contratação e a execução são responsabilidade das partes." },
  { q: "Quanto custa para contratar um profissional?", a: "Quem contrata assina um plano mensal a partir de R$ 19,90 — cancele quando quiser. Não cobramos comissão sobre o serviço contratado: o valor da obra você combina diretamente com o profissional." },
  { q: "Posso cancelar minha assinatura quando quiser?", a: "Sim. Sem fidelidade, sem multa. Você cancela quando quiser pelo próprio app. Seu perfil e histórico ficam salvos caso queira voltar." },
];
