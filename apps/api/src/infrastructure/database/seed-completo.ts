import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { randomUUID } from "crypto";
import * as schema from "./schema/index.js";
import { hashPassword } from "../../modules/auth/domain/password.js";

config({ path: "../../.env" });

/**
 * Seed COMPLETO de DEV: popula o banco com **todos os tipos de conta, planos e
 * estados** que o sistema conhece — para validar UI e fluxos ponta a ponta sem
 * depender de provedores reais. Cobre: contratante PF, empresa PJ, profissionais
 * (Iniciante/Pro/Especialista), conta suspensa, denúncias (abertas/resolvidas),
 * obras em todos os status (incl. CANCELADA/EXPIRADA), o fluxo de lances completo,
 * pedidos em todos os status, avaliações dupla-cega, portfólio, orçamento+recibo,
 * assinaturas/compras/faturas/reembolsos e penalidades.
 *
 * NÃO use em produção — senhas conhecidas, dados fictícios.
 */
const SENHA_ADMIN = "admin@123";
const SENHA_USUARIO = "senha@123";

const dia = 24 * 60 * 60 * 1000;
const daysFromNow = (n: number): Date => new Date(Date.now() + n * dia);
const daysAgo = (n: number): Date => new Date(Date.now() - n * dia);

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL ausente.");

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool, { schema });

  console.log("Limpando banco de dados para seed completo...");
  // Ordem reversa de dependência (FKs). Em dev, apagamos tudo sem medo.
  await db.delete(schema.reviewResponses);
  await db.delete(schema.reviews);
  await db.delete(schema.termsAcceptances);
  await db.delete(schema.proposals);
  await db.delete(schema.workOrders);
  await db.delete(schema.bookingRequests);
  await db.delete(schema.scheduleBlocks);
  await db.delete(schema.accountSuspensions);
  await db.delete(schema.reports);
  await db.delete(schema.penalties);
  await db.delete(schema.auditLog);
  await db.delete(schema.reputationEvents);
  await db.delete(schema.badges);
  await db.delete(schema.refunds);
  await db.delete(schema.paymentEvents);
  await db.delete(schema.invoices);
  await db.delete(schema.purchases);
  await db.delete(schema.subscriptions);
  await db.delete(schema.professionalDocuments);
  await db.delete(schema.portfolioPhotos);
  await db.delete(schema.contractorProfiles);
  await db.delete(schema.professionalProfiles);
  await db.delete(schema.companyProfiles);
  await db.delete(schema.users);
  await db.delete(schema.cities);

  console.log("Inserindo Cidades...");
  const [sp, campinas] = await db
    .insert(schema.cities)
    .values([
      { id: randomUUID(), nome: "São Paulo", uf: "SP", ativa: true },
      { id: randomUUID(), nome: "Campinas", uf: "SP", ativa: true },
    ])
    .returning();
  const cidadeId = sp!.id;

  console.log("Inserindo Usuários (todos os tipos/estados)...");
  const carlosId = randomUUID(); // contratante PF
  const alineId = randomUUID(); // contratante PF com plano COMPLETO (avulso)
  const joanaId = randomUUID(); // profissional PRO
  const pedroId = randomUUID(); // profissional INICIANTE (grátis)
  const marcosId = randomUUID(); // profissional ESPECIALISTA
  const robertoId = randomUUID(); // profissional SUSPENSO (com denúncia)
  const empresaId = randomUUID(); // conta EMPRESA (PJ)
  const adminId = randomUUID(); // admin (controle total)

  const hashAdmin = await hashPassword(SENHA_ADMIN);
  const hashUsuario = await hashPassword(SENHA_USUARIO);

  await db.insert(schema.users).values([
    { id: carlosId, nomeCompleto: "Carlos Contratante", whatsapp: "+5511999990001", email: "carlos@example.com", senhaHash: hashUsuario, cidadeId, tipo: "CONTRATANTE", status: "ATIVO" },
    { id: alineId, nomeCompleto: "Aline Ribeiro", whatsapp: "+5511999990002", email: "aline@example.com", senhaHash: hashUsuario, cidadeId, tipo: "CONTRATANTE", status: "ATIVO" },
    { id: joanaId, nomeCompleto: "Joana Andrade Silva", whatsapp: "+5511999990003", email: "joana@example.com", senhaHash: hashUsuario, cidadeId, tipo: "PROFISSIONAL", status: "ATIVO" },
    { id: pedroId, nomeCompleto: "Pedro Pereira", whatsapp: "+5511999990004", email: "pedro@example.com", senhaHash: hashUsuario, cidadeId, tipo: "PROFISSIONAL", status: "ATIVO" },
    { id: marcosId, nomeCompleto: "Marcos Eletricista", whatsapp: "+5511999990005", email: "marcos@example.com", senhaHash: hashUsuario, cidadeId, tipo: "PROFISSIONAL", status: "ATIVO" },
    { id: robertoId, nomeCompleto: "Roberto Lima", whatsapp: "+5511999990006", email: "roberto@example.com", senhaHash: hashUsuario, cidadeId, tipo: "PROFISSIONAL", status: "SUSPENSO" },
    { id: empresaId, nomeCompleto: "Construtora Forte", whatsapp: "+5511999990007", email: "empresa@example.com", senhaHash: hashUsuario, cidadeId, tipo: "EMPRESA", status: "ATIVO" },
    { id: adminId, nomeCompleto: "Admin Geral", whatsapp: "+5511999990000", email: "admin@example.com", senhaHash: hashAdmin, cidadeId, tipo: "CONTRATANTE", status: "ATIVO", roles: ["ADMIN", "MODERADOR", "FINANCEIRO"] },
  ]);

  console.log("Inserindo Perfis (contratante/profissional/empresa)...");
  await db.insert(schema.contractorProfiles).values([
    { userId: carlosId, plano: "LANCE", planoExpiraEm: daysFromNow(20) },
    { userId: alineId, plano: "COMPLETO", planoExpiraEm: daysFromNow(12) },
    { userId: adminId, plano: "BASICO" },
  ]);

  await db.insert(schema.professionalProfiles).values([
    { userId: joanaId, especialidades: ["Gesseiro", "Azulejista"], anosExperiencia: 8, bairro: "Pinheiros", raioAtendimentoKm: 15, valores: "Diária a partir de R$ 280", formacaoDeclarada: "Curso técnico SENAI", completudePct: 100, plano: "PRO", slugPublico: "joana-gesseira-silva" },
    { userId: pedroId, especialidades: ["Pedreiro", "Alvenaria"], anosExperiencia: 2, bairro: "Itaquera", raioAtendimentoKm: 5, completudePct: 50, plano: "INICIANTE", slugPublico: "pedro-pereira" },
    { userId: marcosId, especialidades: ["Eletricista", "Encanador"], anosExperiencia: 12, bairro: "Moema", raioAtendimentoKm: 25, valores: "Visita técnica R$ 150 + orçamento", formacaoDeclarada: "Eletrotécnico (NR-10)", completudePct: 100, plano: "ESPECIALISTA", slugPublico: "marcos-eletricista" },
    { userId: robertoId, especialidades: ["Serralheiro"], anosExperiencia: 4, bairro: "Santo Amaro", raioAtendimentoKm: 10, completudePct: 70, plano: "PRO", slugPublico: "roberto-lima-serralheiro" },
  ]);

  await db.insert(schema.companyProfiles).values([
    { userId: empresaId, cnpj: "11444777000161", razaoSocial: "Construtora Forte Engenharia LTDA", nomeFantasia: "Construtora Forte" },
  ]);

  console.log("Inserindo Assinaturas (profissionais) — ATIVA, ATIVA, CANCELADA...");
  const subJoanaId = randomUUID();
  const subMarcosId = randomUUID();
  const subRobertoId = randomUUID();
  await db.insert(schema.subscriptions).values([
    { id: subJoanaId, userId: joanaId, plano: "PRO", status: "ATIVA", gateway: "ASAAS", valorCentavos: 4900, proximaCobranca: daysFromNow(20) },
    { id: subMarcosId, userId: marcosId, plano: "ESPECIALISTA", status: "ATIVA", gateway: "ASAAS", valorCentavos: 9900, proximaCobranca: daysFromNow(10) },
    { id: subRobertoId, userId: robertoId, plano: "PRO", status: "CANCELADA", gateway: "ASAAS", valorCentavos: 4900, canceladoEm: daysAgo(3) },
  ]);

  console.log("Inserindo Compras avulsas (contratantes)...");
  const compraCarlosId = randomUUID();
  const compraAlineId = randomUUID();
  await db.insert(schema.purchases).values([
    { id: compraCarlosId, userId: carlosId, plano: "LANCE", status: "ATIVO", gateway: "ASAAS", valorCentavos: 6900, expiraEm: daysFromNow(20) },
    { id: compraAlineId, userId: alineId, plano: "COMPLETO", status: "ATIVO", gateway: "ASAAS", valorCentavos: 3900, expiraEm: daysFromNow(12) },
  ]);

  console.log("Inserindo Faturas (PAGA, PAGA, VENCIDA) e Reembolsos...");
  const invJoanaId = randomUUID();
  const invMarcosId = randomUUID();
  const invMarcosVencidaId = randomUUID();
  const invCarlosId = randomUUID();
  await db.insert(schema.invoices).values([
    { id: invJoanaId, userId: joanaId, subscriptionId: subJoanaId, gateway: "ASAAS", valorCentavos: 4900, status: "PAGA", metodo: "PIX", vencimentoEm: daysAgo(2), pagoEm: daysAgo(2) },
    { id: invMarcosId, userId: marcosId, subscriptionId: subMarcosId, gateway: "ASAAS", valorCentavos: 9900, status: "PAGA", metodo: "CARTAO", vencimentoEm: daysAgo(5), pagoEm: daysAgo(5) },
    { id: invMarcosVencidaId, userId: marcosId, subscriptionId: subMarcosId, gateway: "ASAAS", valorCentavos: 9900, status: "VENCIDA", vencimentoEm: daysAgo(1) },
    { id: invCarlosId, userId: carlosId, purchaseId: compraCarlosId, gateway: "ASAAS", valorCentavos: 6900, status: "PAGA", metodo: "BOLETO", vencimentoEm: daysAgo(10), pagoEm: daysAgo(10) },
  ]);

  await db.insert(schema.refunds).values([
    { id: randomUUID(), invoiceId: invJoanaId, userId: joanaId, valorCentavos: 4900, motivo: "ARREPENDIMENTO" },
    { id: randomUUID(), invoiceId: invCarlosId, userId: carlosId, valorCentavos: 3450, motivo: "CANCELAMENTO_PROPORCIONAL", status: "CONCLUIDO", gatewayId: "rfd_seed_1", processadoEm: daysAgo(1) },
  ]);

  console.log("Inserindo Obras (todos os status) + Lances (fluxo completo)...");
  const obraAbertaId = randomUUID();
  const obraAdjudicadaId = randomUUID();
  const obraConcluidaId = randomUUID();
  const obraCanceladaId = randomUUID();
  const obraExpiradaId = randomUUID();
  const obraEmpresaId = randomUUID();

  await db.insert(schema.workOrders).values([
    { id: obraAbertaId, contractorId: carlosId, cidadeId, especialidade: "Gesseiro", titulo: "Forro de gesso em apartamento 60m²", descricao: "Instalar forro de gesso em toda a área social.", bairro: "Pinheiros", urgencia: "FLEXIVEL", status: "ABERTA", pisoCentavos: 120000, expiraEm: daysFromNow(7) },
    { id: obraAdjudicadaId, contractorId: carlosId, cidadeId, especialidade: "Pedreiro", titulo: "Construção de muro de 12m", descricao: "Muro de divisa, blocos de concreto.", bairro: "Itaquera", urgencia: "NORMAL", status: "ADJUDICADA", expiraEm: daysFromNow(3) },
    { id: obraConcluidaId, contractorId: carlosId, cidadeId, especialidade: "Eletricista", titulo: "Troca de quadro elétrico", descricao: "Modernização do quadro de distribuição.", bairro: "Moema", urgencia: "URGENTE", status: "CONCLUIDA", expiraEm: daysAgo(10) },
    { id: obraCanceladaId, contractorId: alineId, cidadeId, especialidade: "Encanador", titulo: "Reparo de vazamento na cozinha", descricao: "Cancelada — resolvido por conta própria.", bairro: "Centro", urgencia: "URGENTE", status: "CANCELADA", expiraEm: daysAgo(5) },
    { id: obraExpiradaId, contractorId: alineId, cidadeId, especialidade: "Serralheiro", titulo: "Portão de garagem basculante", descricao: "Sem lances dentro do prazo.", bairro: "Centro", urgencia: "NORMAL", status: "EXPIRADA", expiraEm: daysAgo(2) },
    { id: obraEmpresaId, contractorId: empresaId, cidadeId, especialidade: "Pedreiro", titulo: "Reforma de fachada comercial", descricao: "Obra publicada por empresa (PJ).", bairro: "Brooklin", urgencia: "NORMAL", status: "ABERTA", pisoCentavos: 800000, expiraEm: daysFromNow(10) },
  ]);

  await db.insert(schema.proposals).values([
    // Obra ABERTA — 2 lances sigilosos concorrendo (Pro + Especialista)
    { workOrderId: obraAbertaId, professionalId: joanaId, valorCentavos: 150000, prazoDias: 5, mensagem: "Posso começar semana que vem.", status: "ENVIADA" },
    { workOrderId: obraAbertaId, professionalId: marcosId, valorCentavos: 135000, prazoDias: 7, mensagem: "Faço com material incluso.", status: "ENVIADA" },
    // Obra ADJUDICADA — 1 aceita, 1 recusada
    { workOrderId: obraAdjudicadaId, professionalId: marcosId, valorCentavos: 250000, prazoDias: 10, status: "ACEITA" },
    { workOrderId: obraAdjudicadaId, professionalId: joanaId, valorCentavos: 280000, prazoDias: 8, status: "RECUSADA" },
    // Obra CONCLUIDA — lance aceito
    { workOrderId: obraConcluidaId, professionalId: marcosId, valorCentavos: 90000, prazoDias: 2, status: "ACEITA" },
    // Obra da EMPRESA — lances abertos
    { workOrderId: obraEmpresaId, professionalId: marcosId, valorCentavos: 850000, prazoDias: 20, mensagem: "Equipe completa disponível.", status: "ENVIADA" },
  ]);

  console.log("Inserindo Pedidos (todos os status)...");
  const bkPendenteId = randomUUID();
  const bkAprovadoId = randomUUID();
  const bkConcluidoId = randomUUID();
  const bkRecusadoId = randomUUID();
  const bkCanceladoId = randomUUID();
  const bkIniciadoId = randomUUID();

  await db.insert(schema.bookingRequests).values([
    { id: bkPendenteId, contractorId: carlosId, professionalId: joanaId, especialidade: "Gesseiro", descricao: "Orçamento para acabamento em gesso.", dataServico: daysFromNow(2), status: "PENDENTE", expiraEm: daysFromNow(1) },
    { id: bkAprovadoId, contractorId: carlosId, professionalId: marcosId, especialidade: "Eletricista", descricao: "Instalação de chuveiro 220V.", dataServico: daysFromNow(3), status: "APROVADO", expiraEm: daysFromNow(2) },
    { id: bkConcluidoId, contractorId: carlosId, professionalId: joanaId, especialidade: "Azulejista", descricao: "Assentamento de piso na varanda.", dataServico: daysAgo(6), status: "CONCLUIDO", expiraEm: daysAgo(7) },
    { id: bkRecusadoId, contractorId: carlosId, professionalId: pedroId, especialidade: "Pedreiro", descricao: "Pequeno reparo.", dataServico: daysFromNow(4), status: "RECUSADO", motivoRecusa: "Agenda indisponível na data.", expiraEm: daysFromNow(3) },
    { id: bkCanceladoId, contractorId: alineId, professionalId: marcosId, especialidade: "Encanador", descricao: "Cancelado pelo cliente.", dataServico: daysFromNow(5), status: "CANCELADO", expiraEm: daysFromNow(4) },
    { id: bkIniciadoId, contractorId: empresaId, professionalId: marcosId, especialidade: "Eletricista", descricao: "Manutenção elétrica predial (em andamento).", dataServico: daysAgo(1), status: "INICIADO", expiraEm: daysAgo(2) },
  ]);

  console.log("Inserindo Termos + Avaliações (dupla-cega) + Resposta...");
  await db.insert(schema.termsAcceptances).values([
    { id: randomUUID(), bookingId: bkConcluidoId, userId: carlosId, papel: "CONTRATANTE", termoVersao: "v1.0", ip: "127.0.0.1" },
    { id: randomUUID(), bookingId: bkConcluidoId, userId: joanaId, papel: "PROFISSIONAL", termoVersao: "v1.0", ip: "127.0.0.1" },
  ]);

  const reviewCarlosId = randomUUID();
  await db.insert(schema.reviews).values([
    // Pedido concluído — avaliação bilateral revelada
    { id: reviewCarlosId, bookingId: bkConcluidoId, autorId: carlosId, alvoId: joanaId, papelAutor: "CONTRATANTE", nota: 5, comentario: "Excelente serviço, caprichada e pontual!", status: "REVELADA", prazoEm: daysAgo(5), reveladaEm: daysAgo(5) },
    { id: randomUUID(), bookingId: bkConcluidoId, autorId: joanaId, alvoId: carlosId, papelAutor: "PROFISSIONAL", nota: 5, comentario: "Cliente ótimo, pagou em dia.", status: "REVELADA", prazoEm: daysAgo(5), reveladaEm: daysAgo(5) },
  ]);

  await db.insert(schema.reviewResponses).values([
    { id: randomUUID(), reviewId: reviewCarlosId, autorId: joanaId, texto: "Obrigada, Carlos! Foi um prazer trabalhar com você." },
  ]);

  console.log("Inserindo Denúncias (abertas/resolvidas) + Suspensão (com apelação)...");
  const reportProcedenteId = randomUUID();
  await db.insert(schema.reports).values([
    { id: randomUUID(), denuncianteId: carlosId, entidade: "REVIEW", entidadeId: reviewCarlosId, motivo: "Conteúdo possivelmente ofensivo", detalhe: "Solicito revisão do comentário.", status: "ABERTA" },
    { id: reportProcedenteId, denuncianteId: carlosId, entidade: "PROFILE", entidadeId: robertoId, motivo: "Comportamento abusivo com cliente", detalhe: "Tratou mal e abandonou o serviço.", status: "PROCEDENTE", resolvidoEm: daysAgo(4) },
    { id: randomUUID(), denuncianteId: alineId, entidade: "USER", entidadeId: pedroId, motivo: "Suspeita de perfil falso", detalhe: "Sem fundamento após análise.", status: "IMPROCEDENTE", resolvidoEm: daysAgo(8) },
  ]);

  await db.insert(schema.accountSuspensions).values([
    { id: randomUUID(), userId: robertoId, reportId: reportProcedenteId, motivo: "Conduta abusiva confirmada após denúncia", inicioEm: daysAgo(4), status: "ATIVA" },
  ]);

  console.log("Inserindo Penalidades (comportamento)...");
  await db.insert(schema.penalties).values([
    { id: randomUUID(), professionalId: pedroId, bookingId: bkRecusadoId, motivo: "RECUSA_INJUSTIFICADA", pontos: 1, detalhe: "Recusa sem justificativa válida." },
    { id: randomUUID(), professionalId: robertoId, bookingId: bkCanceladoId, motivo: "DESISTENCIA", pontos: 3, detalhe: "Abandonou o serviço após aceitar." },
  ]);

  console.log("Inserindo Portfólio (Pro/Especialista) + Documentos (orçamento/recibo)...");
  await db.insert(schema.portfolioPhotos).values([
    { id: randomUUID(), professionalId: joanaId, url: "https://picsum.photos/seed/gesso1/640/420", legenda: "Forro de gesso rebaixado com sanca" },
    { id: randomUUID(), professionalId: joanaId, url: "https://picsum.photos/seed/gesso2/640/420", legenda: "Acabamento de drywall" },
    { id: randomUUID(), professionalId: marcosId, url: "https://picsum.photos/seed/eletrica1/640/420", legenda: "Quadro elétrico organizado" },
  ]);

  await db.insert(schema.professionalDocuments).values([
    {
      id: randomUUID(),
      professionalId: marcosId,
      tipo: "ORCAMENTO",
      clienteNome: "Carlos Contratante",
      titulo: "Orçamento — troca de quadro elétrico",
      observacoes: "Validade de 15 dias. Material incluso.",
      itens: [
        { descricao: "Quadro de distribuição 12 disjuntores", quantidade: 1, valorUnitarioCentavos: 45000 },
        { descricao: "Disjuntores DR", quantidade: 3, valorUnitarioCentavos: 8000 },
        { descricao: "Mão de obra", quantidade: 1, valorUnitarioCentavos: 21000 },
      ],
      totalCentavos: 90000,
    },
    {
      id: randomUUID(),
      professionalId: marcosId,
      tipo: "RECIBO",
      clienteNome: "Carlos Contratante",
      titulo: "Recibo — serviço elétrico concluído",
      observacoes: "Pagamento recebido via PIX.",
      itens: [{ descricao: "Serviço elétrico completo", quantidade: 1, valorUnitarioCentavos: 90000 }],
      totalCentavos: 90000,
    },
  ]);

  console.log("\nSeed completo finalizado com sucesso!");
  console.log("=== Credenciais (login por e-mail + senha) ===");
  console.table([
    { papel: "ADMIN (controle total)", email: "admin@example.com", senha: SENHA_ADMIN },
    { papel: "Contratante PF", email: "carlos@example.com", senha: SENHA_USUARIO },
    { papel: "Contratante PF (plano Completo)", email: "aline@example.com", senha: SENHA_USUARIO },
    { papel: "Empresa PJ", email: "empresa@example.com", senha: SENHA_USUARIO },
    { papel: "Profissional PRO", email: "joana@example.com", senha: SENHA_USUARIO },
    { papel: "Profissional Iniciante", email: "pedro@example.com", senha: SENHA_USUARIO },
    { papel: "Profissional Especialista", email: "marcos@example.com", senha: SENHA_USUARIO },
    { papel: "Profissional SUSPENSO", email: "roberto@example.com", senha: SENHA_USUARIO },
  ]);
  void campinas;
  await pool.end();
}

main().catch((error: unknown) => {
  console.error("Seed completo falhou:", error);
  process.exit(1);
});
