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
      { emoji: "🔍", titulo: "Busque e compare", texto: "Filtre por profissão, cidade e nota. Veja portfólio, agenda e reputação antes de decidir." },
      { emoji: "📅", titulo: "Envie o pedido", texto: "Escolha um horário livre na agenda e mande o pedido com mensagem e fotos do serviço." },
      { emoji: "⏳", titulo: "Aguarde o aceite", texto: "O profissional confirma em até 24h. No aceite, telefone, e-mail e WhatsApp são liberados." },
      { emoji: "🤝", titulo: "Combine direto", texto: "Com os contatos liberados, vocês alinham valor, data e escopo sem intermediário." },
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
      "Apareça nas buscas da sua cidade, receba pedidos diretos e construa uma reputação que vale mais que qualquer indicação. 7 dias do Pro grátis.",
    ctaLabel: "Criar perfil profissional",
    steps: [
      { emoji: "👷", titulo: "Monte seu perfil", texto: "Escolha suas profissões no catálogo, suba fotos do portfólio e configure sua agenda." },
      { emoji: "📣", titulo: "Apareça na busca", texto: "Clientes da sua cidade te acham por profissão e disponibilidade. Reputação melhor, posição mais alta." },
      { emoji: "📬", titulo: "Receba pedidos", texto: "A solicitação chega com a mensagem do cliente. Você tem 24h para aceitar ou recusar." },
      { emoji: "🛠️", titulo: "Aceite e execute", texto: "No aceite, seus contatos são liberados. Combine os detalhes e faça o serviço." },
      { emoji: "🏆", titulo: "Construa reputação", texto: "Cada obra vira avaliação e badge. No Pro, dê lances sigilosos em obras abertas." },
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
      { emoji: "🏢", titulo: "Cadastre a empresa", texto: "CNPJ, razão social e dados da equipe num só administrador. Cadastro rápido." },
      { emoji: "📢", titulo: "Busque ou publique", texto: "Ache profissionais por profissão e cidade, ou publique a obra para receber propostas." },
      { emoji: "📥", titulo: "Receba lances", texto: "Profissionais enviam propostas sigilosas. Compare valor e prazo lado a lado." },
      { emoji: "🤝", titulo: "Escolha e contrate", texto: "Selecione o melhor lance, libere os contatos e combine os detalhes diretamente." },
      { emoji: "📊", titulo: "Acompanhe tudo", texto: "Veja o histórico de obras e avalie cada serviço. Sua reputação como contratante também conta." },
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
