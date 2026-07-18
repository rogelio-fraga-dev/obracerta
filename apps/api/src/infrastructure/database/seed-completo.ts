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
// Senhas do seed — padrão de DEV. Em um ambiente exposto (demo na nuvem), defina
// SEED_ADMIN_PASSWORD/SEED_USER_PASSWORD com valores fortes ANTES de rodar o seed,
// senão o admin fica com credencial pública conhecida (documentada em docs/).
const SENHA_ADMIN = process.env.SEED_ADMIN_PASSWORD ?? "admin@123";
const SENHA_USUARIO = process.env.SEED_USER_PASSWORD ?? "senha@123";

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
  await db.delete(schema.supportTickets);
  await db.delete(schema.notifications);
  await db.delete(schema.pushSubscriptions);
  await db.delete(schema.workOrderMessages);
  await db.delete(schema.workOrderPhotos);
  await db.delete(schema.bookingMessages);
  await db.delete(schema.addresses);
  await db.delete(schema.availability);
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

  console.log("Inserindo Cidades (capitais de todas as UFs + piloto)...");
  const CIDADES = [
    { nome: "São Paulo", uf: "SP" },
    { nome: "Campinas", uf: "SP" },
    { nome: "Rio Branco", uf: "AC" },
    { nome: "Maceió", uf: "AL" },
    { nome: "Macapá", uf: "AP" },
    { nome: "Manaus", uf: "AM" },
    { nome: "Salvador", uf: "BA" },
    { nome: "Fortaleza", uf: "CE" },
    { nome: "Brasília", uf: "DF" },
    { nome: "Vitória", uf: "ES" },
    { nome: "Goiânia", uf: "GO" },
    { nome: "São Luís", uf: "MA" },
    { nome: "Cuiabá", uf: "MT" },
    { nome: "Campo Grande", uf: "MS" },
    { nome: "Belo Horizonte", uf: "MG" },
    { nome: "Belém", uf: "PA" },
    { nome: "João Pessoa", uf: "PB" },
    { nome: "Curitiba", uf: "PR" },
    { nome: "Recife", uf: "PE" },
    { nome: "Teresina", uf: "PI" },
    { nome: "Rio de Janeiro", uf: "RJ" },
    { nome: "Natal", uf: "RN" },
    { nome: "Porto Alegre", uf: "RS" },
    { nome: "Porto Velho", uf: "RO" },
    { nome: "Boa Vista", uf: "RR" },
    { nome: "Florianópolis", uf: "SC" },
    { nome: "Aracaju", uf: "SE" },
    { nome: "Palmas", uf: "TO" },
  ].map((c) => ({ id: randomUUID(), ...c, ativa: true }));
  const inseridas = await db.insert(schema.cities).values(CIDADES).returning();
  const cidadeId = inseridas.find((c) => c.nome === "São Paulo")!.id;

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

  // Fotos de perfil (retratos de placeholder) — busca/início/chat ficam humanos.
  const foto = (n: number) => `https://i.pravatar.cc/300?img=${n}`;

  await db.insert(schema.users).values([
    { id: carlosId, nomeCompleto: "Carlos Contratante", whatsapp: "+5511999990001", email: "carlos@example.com", senhaHash: hashUsuario, cidadeId, tipo: "CONTRATANTE", status: "ATIVO", fotoUrl: foto(12) },
    { id: alineId, nomeCompleto: "Aline Ribeiro", whatsapp: "+5511999990002", email: "aline@example.com", senhaHash: hashUsuario, cidadeId, tipo: "CONTRATANTE", status: "ATIVO", fotoUrl: foto(47) },
    { id: joanaId, nomeCompleto: "Joana Andrade Silva", whatsapp: "+5511999990003", email: "joana@example.com", senhaHash: hashUsuario, cidadeId, tipo: "PROFISSIONAL", status: "ATIVO", fotoUrl: foto(31) },
    { id: pedroId, nomeCompleto: "Pedro Pereira", whatsapp: "+5511999990004", email: "pedro@example.com", senhaHash: hashUsuario, cidadeId, tipo: "PROFISSIONAL", status: "ATIVO", fotoUrl: foto(59) },
    { id: marcosId, nomeCompleto: "Marcos Eletricista", whatsapp: "+5511999990005", email: "marcos@example.com", senhaHash: hashUsuario, cidadeId, tipo: "PROFISSIONAL", status: "ATIVO", fotoUrl: foto(53) },
    { id: robertoId, nomeCompleto: "Roberto Lima", whatsapp: "+5511999990006", email: "roberto@example.com", senhaHash: hashUsuario, cidadeId, tipo: "PROFISSIONAL", status: "SUSPENSO" },
    { id: empresaId, nomeCompleto: "Construtora Forte", whatsapp: "+5511999990007", email: "empresa@example.com", senhaHash: hashUsuario, cidadeId, tipo: "EMPRESA", status: "ATIVO", fotoUrl: foto(68) },
    { id: adminId, nomeCompleto: "Admin Geral", whatsapp: "+5511999990000", email: "admin@example.com", senhaHash: hashAdmin, cidadeId, tipo: "CONTRATANTE", status: "ATIVO", roles: ["ADMIN", "MODERADOR", "FINANCEIRO"] },
  ]);

  console.log("Inserindo Perfis (contratante/profissional/empresa)...");
  await db.insert(schema.contractorProfiles).values([
    { userId: carlosId, plano: "LANCE", planoExpiraEm: daysFromNow(20) },
    { userId: alineId, plano: "COMPLETO", planoExpiraEm: daysFromNow(12) },
    { userId: adminId, plano: "BASICO" },
  ]);

  await db.insert(schema.professionalProfiles).values([
    { userId: joanaId, especialidades: ["Gesseiro", "Azulejista"], anosExperiencia: 8, bairro: "Pinheiros", raioAtendimentoKm: 15, valores: "Diária a partir de R$ 280", formacaoDeclarada: "Curso técnico SENAI", completudePct: 100, plano: "PRO", slugPublico: "joana-gesseira-silva", fotoUrl: foto(31) },
    { userId: pedroId, especialidades: ["Pedreiro", "Alvenaria"], anosExperiencia: 2, bairro: "Itaquera", raioAtendimentoKm: 5, completudePct: 50, plano: "INICIANTE", slugPublico: "pedro-pereira", fotoUrl: foto(59) },
    { userId: marcosId, especialidades: ["Eletricista", "Encanador"], anosExperiencia: 12, bairro: "Moema", raioAtendimentoKm: 25, valores: "Visita técnica R$ 150 + orçamento", formacaoDeclarada: "Eletrotécnico (NR-10)", completudePct: 100, plano: "ESPECIALISTA", slugPublico: "marcos-eletricista", fotoUrl: foto(53) },
    { userId: robertoId, especialidades: ["Serralheiro"], anosExperiencia: 4, bairro: "Santo Amaro", raioAtendimentoKm: 10, completudePct: 70, plano: "PRO", slugPublico: "roberto-lima-serralheiro" },
  ]);

  console.log("Inserindo Agenda semanal (grade de disponibilidade)...");
  await db.insert(schema.availability).values([
    // Joana: seg–sex comercial
    ...[1, 2, 3, 4, 5].map((dia) => ({ professionalId: joanaId, diaSemana: dia, horaInicio: "08:00", horaFim: "17:00" })),
    // Marcos: seg–sáb, dois turnos
    ...[1, 2, 3, 4, 5, 6].map((dia) => ({ professionalId: marcosId, diaSemana: dia, horaInicio: "07:00", horaFim: "12:00" })),
    ...[1, 2, 3, 4, 5].map((dia) => ({ professionalId: marcosId, diaSemana: dia, horaInicio: "13:00", horaFim: "18:00" })),
    // Pedro (Iniciante): só fins de semana — cenário de agenda enxuta
    { professionalId: pedroId, diaSemana: 6, horaInicio: "08:00", horaFim: "14:00" },
    { professionalId: pedroId, diaSemana: 0, horaInicio: "08:00", horaFim: "12:00" },
  ]);

  console.log("Inserindo Endereços salvos (aba Endereços)...");
  await db.insert(schema.addresses).values([
    { userId: carlosId, apelido: "Casa", cep: "05422030", logradouro: "Rua dos Pinheiros", numero: "742", bairro: "Pinheiros", cidade: "São Paulo", uf: "SP", principal: true },
    { userId: carlosId, apelido: "Apartamento da reforma", cep: "04077000", logradouro: "Av. Ibirapuera", numero: "2120", complemento: "Apto 84", bairro: "Moema", cidade: "São Paulo", uf: "SP", principal: false },
    { userId: alineId, apelido: "Casa", cep: "01310100", logradouro: "Av. Paulista", numero: "1578", complemento: "Cobertura", bairro: "Bela Vista", cidade: "São Paulo", uf: "SP", principal: true },
    { userId: empresaId, apelido: "Sede", cep: "04571010", logradouro: "Rua Fidêncio Ramos", numero: "302", complemento: "Conj. 61", bairro: "Vila Olímpia", cidade: "São Paulo", uf: "SP", principal: true },
    { userId: empresaId, apelido: "Obra Brooklin", cep: "04561000", logradouro: "Av. Santo Amaro", numero: "4580", bairro: "Brooklin", cidade: "São Paulo", uf: "SP", principal: false },
  ]);

  await db.insert(schema.companyProfiles).values([
    { userId: empresaId, cnpj: "11444777000161", razaoSocial: "Construtora Forte Engenharia LTDA", nomeFantasia: "Construtora Forte" },
  ]);

  console.log("Inserindo Assinaturas (profissionais) — ATIVA, ATIVA, CANCELADA...");
  const subJoanaId = randomUUID();
  const subMarcosId = randomUUID();
  const subRobertoId = randomUUID();
  await db.insert(schema.subscriptions).values([
    { id: subJoanaId, userId: joanaId, plano: "PRO", status: "ATIVA", gateway: "ASAAS", valorCentavos: 4990, proximaCobranca: daysFromNow(20) },
    { id: subMarcosId, userId: marcosId, plano: "ESPECIALISTA", status: "ATIVA", gateway: "ASAAS", valorCentavos: 9990, proximaCobranca: daysFromNow(10) },
    { id: subRobertoId, userId: robertoId, plano: "PRO", status: "CANCELADA", gateway: "ASAAS", valorCentavos: 4990, canceladoEm: daysAgo(3) },
  ]);

  console.log("Inserindo Compras avulsas (contratantes)...");
  const compraCarlosId = randomUUID();
  const compraAlineId = randomUUID();
  await db.insert(schema.purchases).values([
    { id: compraCarlosId, userId: carlosId, plano: "LANCE", status: "ATIVO", gateway: "ASAAS", valorCentavos: 6990, expiraEm: daysFromNow(20) },
    { id: compraAlineId, userId: alineId, plano: "COMPLETO", status: "ATIVO", gateway: "ASAAS", valorCentavos: 3990, expiraEm: daysFromNow(12) },
  ]);

  console.log("Inserindo Faturas (PAGA, PAGA, VENCIDA) e Reembolsos...");
  const invJoanaId = randomUUID();
  const invMarcosId = randomUUID();
  const invMarcosVencidaId = randomUUID();
  const invCarlosId = randomUUID();
  await db.insert(schema.invoices).values([
    { id: invJoanaId, userId: joanaId, subscriptionId: subJoanaId, gateway: "ASAAS", valorCentavos: 4990, status: "PAGA", metodo: "PIX", vencimentoEm: daysAgo(2), pagoEm: daysAgo(2) },
    { id: invMarcosId, userId: marcosId, subscriptionId: subMarcosId, gateway: "ASAAS", valorCentavos: 9990, status: "PAGA", metodo: "CARTAO", vencimentoEm: daysAgo(5), pagoEm: daysAgo(5) },
    { id: invMarcosVencidaId, userId: marcosId, subscriptionId: subMarcosId, gateway: "ASAAS", valorCentavos: 9990, status: "VENCIDA", vencimentoEm: daysAgo(1) },
    { id: invCarlosId, userId: carlosId, purchaseId: compraCarlosId, gateway: "ASAAS", valorCentavos: 6990, status: "PAGA", metodo: "BOLETO", vencimentoEm: daysAgo(10), pagoEm: daysAgo(10) },
  ]);

  await db.insert(schema.refunds).values([
    { id: randomUUID(), invoiceId: invJoanaId, userId: joanaId, valorCentavos: 4990, motivo: "ARREPENDIMENTO" },
    { id: randomUUID(), invoiceId: invCarlosId, userId: carlosId, valorCentavos: 3450, motivo: "CANCELAMENTO_PROPORCIONAL", status: "CONCLUIDO", gatewayId: "rfd_seed_1", processadoEm: daysAgo(1) },
  ]);

  console.log("Inserindo Obras (todos os status) + Galeria de fotos...");
  const obraAbertaId = randomUUID();
  const obraAdjudicadaId = randomUUID();
  const obraConcluidaId = randomUUID();
  const obraCanceladaId = randomUUID();
  const obraExpiradaId = randomUUID();
  const obraEmpresaId = randomUUID();
  const obraAberta2Id = randomUUID();
  const obraAberta3Id = randomUUID();

  const obraFoto = (seedName: string) => `https://picsum.photos/seed/${seedName}/800/520`;

  await db.insert(schema.workOrders).values([
    { id: obraAbertaId, contractorId: carlosId, cidadeId, especialidade: "Gesseiro", titulo: "Forro de gesso em apartamento 60m²", descricao: "Instalar forro de gesso em toda a área social (sala + 2 quartos).\nPé-direito 2,70m, sanca aberta na sala.\nMaterial por conta do profissional — detalhar no lance.", bairro: "Pinheiros", urgencia: "FLEXIVEL", status: "ABERTA", pisoCentavos: 120000, expiraEm: daysFromNow(7), fotoUrl: obraFoto("obra-gesso-1") },
    { id: obraAberta2Id, contractorId: alineId, cidadeId, especialidade: "Eletricista", titulo: "Troca de fiação em casa dos anos 70", descricao: "Casa de 120m² com fiação original. Trocar tudo, incluir DR e aterramento. Laudo ao final.", bairro: "Perdizes", urgencia: "NORMAL", status: "ABERTA", expiraEm: daysFromNow(6), fotoUrl: obraFoto("obra-fiacao-1") },
    { id: obraAberta3Id, contractorId: empresaId, cidadeId, especialidade: "Encanador", titulo: "Instalação hidráulica de 4 banheiros", descricao: "Prédio comercial em reforma — 4 banheiros novos, tubulação completa (água fria/quente + esgoto).", bairro: "Vila Olímpia", urgencia: "URGENTE", status: "ABERTA", expiraEm: daysFromNow(2) },
    { id: obraAdjudicadaId, contractorId: carlosId, cidadeId, especialidade: "Pedreiro", titulo: "Construção de muro de 12m", descricao: "Muro de divisa, blocos de concreto, com fundação.", bairro: "Itaquera", urgencia: "NORMAL", status: "ADJUDICADA", expiraEm: daysFromNow(3), fotoUrl: obraFoto("obra-muro-1") },
    { id: obraConcluidaId, contractorId: carlosId, cidadeId, especialidade: "Eletricista", titulo: "Troca de quadro elétrico", descricao: "Modernização do quadro de distribuição.", bairro: "Moema", urgencia: "URGENTE", status: "CONCLUIDA", expiraEm: daysAgo(10) },
    { id: obraCanceladaId, contractorId: alineId, cidadeId, especialidade: "Encanador", titulo: "Reparo de vazamento na cozinha", descricao: "Cancelada — resolvido por conta própria.", bairro: "Centro", urgencia: "URGENTE", status: "CANCELADA", expiraEm: daysAgo(5) },
    { id: obraExpiradaId, contractorId: alineId, cidadeId, especialidade: "Serralheiro", titulo: "Portão de garagem basculante", descricao: "Sem lances dentro do prazo.", bairro: "Centro", urgencia: "NORMAL", status: "EXPIRADA", expiraEm: daysAgo(2) },
    { id: obraEmpresaId, contractorId: empresaId, cidadeId, especialidade: "Pedreiro", titulo: "Reforma de fachada comercial", descricao: "Obra publicada por empresa (PJ). Fachada de 3 andares, com recomposição de reboco e pintura de base.", bairro: "Brooklin", urgencia: "NORMAL", status: "ABERTA", pisoCentavos: 800000, expiraEm: daysFromNow(10), fotoUrl: obraFoto("obra-fachada-1") },
  ]);

  // Galeria (várias fotos por obra; a 1ª espelha na capa acima)
  await db.insert(schema.workOrderPhotos).values([
    { workOrderId: obraAbertaId, url: obraFoto("obra-gesso-1") },
    { workOrderId: obraAbertaId, url: obraFoto("obra-gesso-2") },
    { workOrderId: obraAbertaId, url: obraFoto("obra-gesso-3") },
    { workOrderId: obraAberta2Id, url: obraFoto("obra-fiacao-1") },
    { workOrderId: obraAberta2Id, url: obraFoto("obra-fiacao-2") },
    { workOrderId: obraAdjudicadaId, url: obraFoto("obra-muro-1") },
    { workOrderId: obraEmpresaId, url: obraFoto("obra-fachada-1") },
    { workOrderId: obraEmpresaId, url: obraFoto("obra-fachada-2") },
  ]);

  await db.insert(schema.proposals).values([
    // Obra ABERTA — 2 lances sigilosos concorrendo (Pro + Especialista)
    { workOrderId: obraAbertaId, professionalId: joanaId, valorCentavos: 150000, prazoDias: 5, mensagem: "Posso começar semana que vem.", status: "ENVIADA" },
    { workOrderId: obraAbertaId, professionalId: marcosId, valorCentavos: 135000, prazoDias: 7, mensagem: "Faço com material incluso.", status: "ENVIADA" },
    // Obra ABERTA 2 — 1 lance (Especialista)
    { workOrderId: obraAberta2Id, professionalId: marcosId, valorCentavos: 780000, prazoDias: 12, mensagem: "Laudo NR-10 incluso. Referências disponíveis.", status: "ENVIADA" },
    // Obra ADJUDICADA — 1 aceita, 1 recusada (chat da obra aberto)
    { workOrderId: obraAdjudicadaId, professionalId: marcosId, valorCentavos: 250000, prazoDias: 10, status: "ACEITA" },
    { workOrderId: obraAdjudicadaId, professionalId: joanaId, valorCentavos: 280000, prazoDias: 8, status: "RECUSADA" },
    // Obra CONCLUIDA — lance aceito
    { workOrderId: obraConcluidaId, professionalId: marcosId, valorCentavos: 90000, prazoDias: 2, status: "ACEITA" },
    // Obra da EMPRESA — lances abertos
    { workOrderId: obraEmpresaId, professionalId: marcosId, valorCentavos: 850000, prazoDias: 20, mensagem: "Equipe completa disponível.", status: "ENVIADA" },
  ]);

  console.log("Inserindo Chat da obra adjudicada (dono ↔ vencedor)...");
  const msgObra = (senderId: string, texto: string, dias: number) => ({
    workOrderId: obraAdjudicadaId,
    senderId,
    texto,
    criadoEm: daysAgo(dias),
  });
  await db.insert(schema.workOrderMessages).values([
    msgObra(carlosId, "Parabéns pelo lance, Marcos! Quando você consegue começar o muro?", 2),
    msgObra(marcosId, "Obrigado, Carlos! Consigo iniciar na segunda-feira às 7h. Vou levar a betoneira.", 2),
    msgObra(carlosId, "Perfeito. O portão lateral fica aberto — pode entrar com o material por ali.", 1),
    msgObra(marcosId, "Combinado. Qualquer coisa te chamo por aqui. 👍", 1),
  ]);

  console.log("Inserindo Pedidos (todos os status, incl. EXPIRADO) + Foto...");
  const bkPendenteId = randomUUID();
  const bkAprovadoId = randomUUID();
  const bkConcluidoId = randomUUID();
  const bkRecusadoId = randomUUID();
  const bkCanceladoId = randomUUID();
  const bkIniciadoId = randomUUID();
  const bkExpiradoId = randomUUID();
  // Concluídos do marcos — geram avaliações reveladas (estrela visível na busca)
  const bkMarcos1Id = randomUUID();
  const bkMarcos2Id = randomUUID();

  await db.insert(schema.bookingRequests).values([
    { id: bkPendenteId, contractorId: carlosId, professionalId: joanaId, especialidade: "Gesseiro", descricao: "Orçamento para acabamento em gesso.", fotoUrl: obraFoto("pedido-gesso"), dataServico: daysFromNow(2), status: "PENDENTE", expiraEm: daysFromNow(1) },
    { id: bkAprovadoId, contractorId: carlosId, professionalId: marcosId, especialidade: "Eletricista", descricao: "Instalação de chuveiro 220V.", dataServico: daysFromNow(3), status: "APROVADO", expiraEm: daysFromNow(2) },
    { id: bkConcluidoId, contractorId: carlosId, professionalId: joanaId, especialidade: "Azulejista", descricao: "Assentamento de piso na varanda.", dataServico: daysAgo(6), status: "CONCLUIDO", expiraEm: daysAgo(7) },
    { id: bkRecusadoId, contractorId: carlosId, professionalId: pedroId, especialidade: "Pedreiro", descricao: "Pequeno reparo.", dataServico: daysFromNow(4), status: "RECUSADO", motivoRecusa: "Agenda indisponível na data.", expiraEm: daysFromNow(3) },
    { id: bkCanceladoId, contractorId: alineId, professionalId: marcosId, especialidade: "Encanador", descricao: "Cancelado pelo cliente.", dataServico: daysFromNow(5), status: "CANCELADO", expiraEm: daysFromNow(4) },
    { id: bkIniciadoId, contractorId: empresaId, professionalId: marcosId, especialidade: "Eletricista", descricao: "Manutenção elétrica predial (em andamento).", dataServico: daysAgo(1), status: "INICIADO", expiraEm: daysAgo(2) },
    { id: bkExpiradoId, contractorId: alineId, professionalId: pedroId, especialidade: "Alvenaria", descricao: "Fechar vão de porta — profissional não respondeu em 24h.", dataServico: daysAgo(3), status: "EXPIRADO", expiraEm: daysAgo(4) },
    { id: bkMarcos1Id, contractorId: carlosId, professionalId: marcosId, especialidade: "Eletricista", descricao: "Troca de quadro de distribuição.", dataServico: daysAgo(10), status: "CONCLUIDO", expiraEm: daysAgo(11) },
    { id: bkMarcos2Id, contractorId: alineId, professionalId: marcosId, especialidade: "Encanador", descricao: "Reparo de vazamento na cozinha.", dataServico: daysAgo(8), status: "CONCLUIDO", expiraEm: daysAgo(9) },
  ]);

  console.log("Inserindo Chat dos pedidos (pós-aceite)...");
  const msgPedido = (bookingId: string, senderId: string, texto: string, dias: number) => ({
    bookingId,
    senderId,
    texto,
    criadoEm: daysAgo(dias),
  });
  await db.insert(schema.bookingMessages).values([
    // Pedido APROVADO (carlos ↔ marcos): combinando os detalhes
    msgPedido(bkAprovadoId, carlosId, "Oi Marcos! O chuveiro é um Lorenzetti 7500W. Precisa de disjuntor novo?", 1),
    msgPedido(bkAprovadoId, marcosId, "Oi Carlos! Provavelmente sim — levo um de 40A e o cabo 6mm. Confirmo no local.", 1),
    msgPedido(bkAprovadoId, carlosId, "Fechado. Interfone 84, pode subir direto.", 0),
    // Pedido INICIADO (empresa ↔ marcos): acompanhamento
    msgPedido(bkIniciadoId, empresaId, "Marcos, o zelador liberou o acesso ao barrilete. Precisa de mais alguma coisa?", 1),
    msgPedido(bkIniciadoId, marcosId, "Perfeito. Hoje termino o 2º andar e amanhã fecho o laudo. 👍", 0),
    // Pedido CONCLUÍDO (carlos ↔ joana): histórico da conversa
    msgPedido(bkConcluidoId, joanaId, "Piso assentado e rejuntado! Deixei as sobras na despensa.", 6),
    msgPedido(bkConcluidoId, carlosId, "Ficou ótimo, Joana. Obrigado! Vou te avaliar aqui pela plataforma.", 6),
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
    // Marcos (Especialista) — avaliações reveladas sem denúncia → estrela na busca (média 4.5)
    { id: randomUUID(), bookingId: bkMarcos1Id, autorId: carlosId, alvoId: marcosId, papelAutor: "CONTRATANTE", nota: 5, comentario: "Resolveu o quadro elétrico com segurança e rapidez.", status: "REVELADA", prazoEm: daysAgo(9), reveladaEm: daysAgo(9) },
    { id: randomUUID(), bookingId: bkMarcos2Id, autorId: alineId, alvoId: marcosId, papelAutor: "CONTRATANTE", nota: 4, comentario: "Bom serviço, atrasou um pouco mas resolveu.", status: "REVELADA", prazoEm: daysAgo(7), reveladaEm: daysAgo(7) },
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

  console.log("Inserindo Notificações (sino: lidas + não lidas)...");
  const notif = (
    userId: string,
    tipo: string,
    titulo: string,
    corpo: string,
    link: string | null,
    lida: boolean,
    dias: number,
  ) => ({ userId, tipo, titulo, corpo, link, lida, criadoEm: daysAgo(dias) });
  await db.insert(schema.notifications).values([
    // Carlos (contratante)
    notif(carlosId, "PEDIDO", "Pedido aprovado 🎉", "Eletricista confirmado — o contato foi liberado e o chat está aberto.", `/pedidos/${bkAprovadoId}`, true, 1),
    notif(carlosId, "OBRA", "Novo lance na sua obra", '"Forro de gesso em apartamento 60m²" recebeu um lance. Compare as propostas com calma.', `/obras/${obraAbertaId}`, false, 0),
    notif(carlosId, "PEDIDO", "Nova mensagem no pedido", "Provavelmente sim — levo um de 40A e o cabo 6mm. Confirmo no local.", `/pedidos/${bkAprovadoId}`, false, 1),
    notif(carlosId, "AVALIACAO", "Serviço concluído — avalie", "Azulejista foi concluído. Sua avaliação ajuda toda a comunidade.", `/pedidos/${bkConcluidoId}`, true, 6),
    // Joana (profissional PRO)
    notif(joanaId, "PEDIDO", "Você recebeu um novo pedido", "Gesseiro — responda em até 24h para não perder o cliente.", `/pedidos/${bkPendenteId}`, false, 0),
    notif(joanaId, "AVALIACAO", "Você recebeu uma avaliação ⭐", "Carlos avaliou o serviço de Azulejista com 5 estrelas.", "/avaliacoes", true, 5),
    // Marcos (profissional Especialista)
    notif(marcosId, "OBRA", "Seu lance foi aceito 🎉", 'Você venceu a obra "Construção de muro de 12m". Combine os próximos passos com o contratante.', `/obras/${obraAdjudicadaId}`, true, 2),
    notif(marcosId, "PEDIDO", "Nova mensagem no pedido", "Oi Marcos! O chuveiro é um Lorenzetti 7500W. Precisa de disjuntor novo?", `/pedidos/${bkAprovadoId}`, false, 1),
    notif(marcosId, "COBRANCA", "Fatura em aberto", "Sua fatura do plano Especialista venceu ontem — regularize para manter os benefícios.", "/cobrancas", false, 1),
    // Pedro (Iniciante) — lembrete de engajamento
    notif(pedroId, "SISTEMA", "Complete seu perfil e apareça mais 📈", "Perfis completos (foto, especialidades, bairro) aparecem melhor na busca e recebem mais pedidos.", "/perfil", false, 1),
    // Empresa
    notif(empresaId, "PEDIDO", "Nova mensagem no pedido", "Hoje termino o 2º andar e amanhã fecho o laudo. 👍", `/pedidos/${bkIniciadoId}`, false, 0),
  ]);

  console.log("Inserindo Chamados de suporte (aberto/respondido/fechado)...");
  await db.insert(schema.supportTickets).values([
    {
      userId: pedroId,
      categoria: "CONTA",
      assunto: "Como faço para aparecer mais na busca?",
      mensagem: "Criei minha conta faz duas semanas e ainda não recebi nenhum pedido. O que posso melhorar no meu perfil?",
      status: "ABERTO",
      criadoEm: daysAgo(1),
    },
    {
      userId: carlosId,
      categoria: "PEDIDO",
      assunto: "Profissional não apareceu no horário",
      mensagem: "Marquei um serviço e o profissional atrasou mais de uma hora sem avisar. Como devo proceder?",
      status: "RESPONDIDO",
      resposta:
        "Olá, Carlos! Sentimos pelo transtorno. Você pode registrar o ocorrido avaliando o profissional ao final do serviço — atrasos recorrentes afetam a reputação dele na busca. Se o serviço não foi realizado, cancele o pedido para liberar sua agenda. Qualquer conduta abusiva pode ser denunciada pelo perfil do profissional.",
      respondidoEm: daysAgo(2),
      criadoEm: daysAgo(3),
    },
    {
      userId: alineId,
      categoria: "PAGAMENTO",
      assunto: "Dúvida sobre reembolso proporcional",
      mensagem: "Cancelei meu plano e queria entender como funciona o reembolso proporcional.",
      status: "FECHADO",
      resposta:
        "Olá, Aline! O reembolso proporcional considera os dias não utilizados do período já pago. O seu foi processado e aparece em Cobranças → Reembolsos. Qualquer dúvida, estamos por aqui!",
      respondidoEm: daysAgo(5),
      criadoEm: daysAgo(6),
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
  await pool.end();
}

main().catch((error: unknown) => {
  console.error("Seed completo falhou:", error);
  process.exit(1);
});
