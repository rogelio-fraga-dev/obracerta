import type { BadgeTone } from "@obracerta/ui";
import type { InvoiceStatus, PaymentMethod, RefundStatus } from "@obracerta/shared";

/** Rótulo + tom de cada estado de fatura. */
export const INVOICE_STATUS_UI: Record<InvoiceStatus, { label: string; tone: BadgeTone }> = {
  PENDENTE: { label: "Pendente", tone: "warning" },
  PAGA: { label: "Paga", tone: "success" },
  VENCIDA: { label: "Vencida", tone: "danger" },
  CANCELADA: { label: "Cancelada", tone: "neutral" },
  ESTORNADA: { label: "Estornada", tone: "info" },
};

/** Rótulo + tom de cada estado de reembolso. */
export const REFUND_STATUS_UI: Record<RefundStatus, { label: string; tone: BadgeTone }> = {
  SOLICITADO: { label: "Solicitado", tone: "warning" },
  APROVADO: { label: "Aprovado", tone: "info" },
  RECUSADO: { label: "Recusado", tone: "neutral" },
  CONCLUIDO: { label: "Concluído", tone: "success" },
};

/** Rótulo do método de pagamento. */
export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  PIX: "PIX",
  CARTAO: "Cartão",
  BOLETO: "Boleto",
};

/** Motivos de reembolso (CDC §21) — códigos aceitos pelo backend + rótulos. */
export const REFUND_REASONS: { value: string; label: string }[] = [
  { value: "ARREPENDIMENTO", label: "Arrependimento (até 7 dias) — integral" },
  { value: "COBRANCA_INDEVIDA", label: "Cobrança indevida" },
  { value: "FALHA_SERVICO", label: "Falha no serviço" },
  { value: "CANCELAMENTO_PROPORCIONAL", label: "Cancelamento (proporcional)" },
];

/**
 * Rótulos amigáveis das features de plano (gating §3/§17). Os códigos são do
 * domínio do backend (`Feature`); aqui ganham nome e descrição para a UI.
 */
export const FEATURE_UI: Record<string, { label: string; desc: string }> = {
  "profile.public": { label: "Perfil público", desc: "Apareça nas buscas e tenha página própria." },
  "profile.full": { label: "Perfil completo", desc: "Foto, nome, cidade e valores visíveis." },
  "profile.portfolio": { label: "Portfólio de obras", desc: "Galeria de fotos dos seus trabalhos." },
  "booking.receive": { label: "Receber pedidos", desc: "Clientes solicitam agendamento com você." },
  "booking.respond": {
    label: "Responder pedidos",
    desc: "Aceite pedidos e libere o contato do cliente.",
  },
  "profile.analytics": { label: "Analytics do perfil", desc: "KPIs de pedidos, aceite e avaliações em Desempenho." },
  "profile.analytics.advanced": {
    label: "Analytics avançados",
    desc: "Conversão de lances, ganho via plataforma e tendência mensal.",
  },
  "search.geo": { label: "Busca por proximidade", desc: "Encontre/seja encontrado por perto." },
  "search.unlimited": { label: "Busca ilimitada", desc: "Sem limite de resultados." },
  "search.top": { label: "Destaque no topo", desc: "Apareça no topo das buscas da sua cidade." },
  "workorder.early": {
    label: "Oportunidades em primeira mão",
    desc: "Seja avisado na hora quando uma obra da sua área abrir.",
  },
  "bid.submit": { label: "Lances em obras", desc: "Dê propostas sigilosas em obras abertas." },
  "tools.documents": {
    label: "Orçamentos e recibos",
    desc: "Monte orçamentos e emita recibos para seus clientes.",
  },
};

/**
 * Rótulos das features na ótica do **contratante/empresa**. A mesma feature de
 * gating (`bid.submit`) tem sentido diferente aqui (publicar obra p/ lances, não
 * dar lances), então mapeamos separadamente para não confundir a UI.
 */
export const CONTRACTOR_FEATURE_UI: Record<string, { label: string; desc: string }> = {
  "search.geo": { label: "Busca por proximidade", desc: "Encontre profissionais perto de você." },
  "search.unlimited": { label: "Busca ilimitada", desc: "Veja todos os resultados, sem limite." },
  "booking.request": {
    label: "Solicitar agendamento",
    desc: "Envie pedidos de agendamento e receba o contato após o aceite.",
  },
  "bid.submit": {
    label: "Publicar obra para lances",
    desc: "Publique uma obra e receba propostas sigilosas dos profissionais.",
  },
};

/**
 * Rótulos na ótica da **empresa** (PJ): tudo do contratante + os recursos
 * exclusivos de conta EMPRESA (identidade nas obras, destaque, relatórios).
 * Mapa separado para o contratante PF não ver features que não se aplicam.
 */
export const COMPANY_FEATURE_UI: Record<string, { label: string; desc: string }> = {
  ...CONTRACTOR_FEATURE_UI,
  "company.team": {
    label: "Equipe da empresa",
    desc: "Membros com acesso à conta e roster de profissionais em Equipe.",
  },
  "company.visibility": {
    label: "Identidade da empresa nas obras",
    desc: "Suas obras carregam o nome da empresa na descoberta.",
  },
  "workorder.featured": {
    label: "Destaque das obras",
    desc: "Suas obras sobem para o topo da descoberta (Empresa PRO).",
  },
  "company.reports": {
    label: "Relatórios da operação",
    desc: "Indicadores e histórico das contratações em Relatórios.",
  },
};
