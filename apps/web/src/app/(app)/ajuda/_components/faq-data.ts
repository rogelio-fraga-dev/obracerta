/** Uma pergunta da central de ajuda. */
export interface FaqItem {
  pergunta: string;
  resposta: string;
}

/** Perguntas comuns a todo mundo. */
export const FAQ_GERAL: FaqItem[] = [
  {
    pergunta: "A plataforma cobra pelo serviço contratado?",
    resposta:
      "Não. A plataforma conecta contratantes e profissionais — o valor do serviço é combinado e pago diretamente entre vocês. Não intermediamos o pagamento do serviço nem cobramos comissão sobre ele.",
  },
  {
    pergunta: "Quando o contato (WhatsApp) é liberado?",
    resposta:
      "Só depois que o profissional aceita o pedido. Até lá a plataforma protege o contato dos dois lados — isso evita spam e mantém o histórico da negociação dentro do pedido.",
  },
  {
    pergunta: "Como funciona o chat?",
    resposta:
      "Cada pedido aceito (e cada obra adjudicada) tem uma conversa própria dentro da plataforma. Tudo fica registrado junto do serviço — se precisar comprovar um combinado, está lá.",
  },
  {
    pergunta: "Como funcionam as avaliações?",
    resposta:
      "São duplas-cegas: cada parte avalia sem ver a nota da outra. As avaliações são reveladas quando ambos avaliam (ou quando a janela fecha). Isso evita retaliação e mantém as notas honestas.",
  },
  {
    pergunta: "Posso exportar um resumo do que foi combinado?",
    resposta:
      "Sim. Em um pedido aceito, use “Exportar resumo do serviço” — sai um documento imprimível com as partes, o combinado e os aceites dos termos. A plataforma não é parte do contrato: o acordo é direto entre vocês.",
  },
  {
    pergunta: "Como cadastro meus endereços?",
    resposta:
      "Na aba Endereços do menu. Digite o CEP e o resto preenche sozinho. O endereço salvo agiliza a abertura de obras e pedidos.",
  },
];

/** Perguntas do contratante/empresa. */
export const FAQ_CONTRATANTE: FaqItem[] = [
  {
    pergunta: "Qual a diferença entre pedido e obra?",
    resposta:
      "O pedido é direto: você escolhe um profissional específico e propõe data e hora. A obra é um leilão às avessas: você publica o serviço e vários profissionais dão lances — você compara e escolhe.",
  },
  {
    pergunta: "O profissional não respondeu meu pedido. E agora?",
    resposta:
      "Pedidos expiram em 24h sem resposta (e o profissional que deixa expirar é penalizado na reputação). Você pode abrir novo pedido com outro profissional a qualquer momento.",
  },
  {
    pergunta: "Os lances da minha obra são públicos?",
    resposta:
      "Não. Cada lance é sigiloso: só você vê todos; cada profissional vê apenas o próprio lance. Isso evita leilão predatório de preço para baixo.",
  },
  {
    pergunta: "Como sei quanto um serviço costuma custar?",
    resposta:
      "Na busca por especialidade mostramos a faixa de preço de referência — um agregado anônimo dos lances reais dados em obras daquela especialidade.",
  },
];

/** Perguntas do profissional. */
export const FAQ_PROFISSIONAL: FaqItem[] = [
  {
    pergunta: "Como recebo mais pedidos?",
    resposta:
      "Complete o perfil (foto, especialidades, bairro), defina a agenda semanal e publique fotos no portfólio. Perfis completos aparecem melhor na busca. Responder rápido também rende o selo “Responde rápido”.",
  },
  {
    pergunta: "Fui penalizado por recusar um pedido. Por quê?",
    resposta:
      "Recusas com motivo legítimo (agenda, área, escopo, valor) não penalizam. O que penaliza é desistir sem motivo ou deixar o pedido expirar sem responder — isso frustra o cliente e derruba a confiança na plataforma.",
  },
  {
    pergunta: "O que cada plano libera?",
    resposta:
      "Iniciante (R$ 19,90/mês, 7 dias grátis): aparecer nas buscas e receber pedidos. Profissional (R$ 49,90): perfil completo, portfólio e responder pedidos com contato liberado. Especialista (R$ 99,90): tudo do Profissional + lances em obras, topo das buscas e orçamentos/recibos. Veja os detalhes em Cobranças.",
  },
  {
    pergunta: "Como funciona o piso de dignidade nas obras?",
    resposta:
      "Lances muito abaixo da média da obra são recusados automaticamente. É uma proteção para a categoria: competição por qualidade e reputação, não por precarização.",
  },
];
