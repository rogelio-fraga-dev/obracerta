import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { randomUUID } from "crypto";
import * as schema from "./schema/index.js";
import { hashPassword } from "../../modules/auth/domain/password.js";

config({ path: "../../.env" });

/**
 * Senhas padrão do ambiente de DEV (login "conta normal" por e-mail+senha).
 * NÃO use em produção — são credenciais conhecidas para validação local.
 */
const SENHA_ADMIN = "admin@123";
const SENHA_USUARIO = "senha@123";

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL ausente.");

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool, { schema });

  console.log("Limpando banco de dados para seed completo...");
  // Limpa as tabelas em ordem reversa de dependência. Como estamos em dev, podemos apagar tudo sem medo.
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
  await db.delete(schema.contractorProfiles);
  await db.delete(schema.professionalProfiles);
  await db.delete(schema.users);
  await db.delete(schema.cities);

  console.log("Inserindo Cidades...");
  const [sp] = await db
    .insert(schema.cities)
    .values([
      { id: randomUUID(), nome: "São Paulo", uf: "SP", ativa: true },
      { id: randomUUID(), nome: "Campinas", uf: "SP", ativa: true },
    ])
    .returning();

  console.log("Inserindo Usuários (Contratante, Profissionais, Admin)...");
  const contratanteId = randomUUID();
  const profProId = randomUUID();
  const profInicianteId = randomUUID();
  const adminId = randomUUID();

  // Hashes scrypt das senhas padrão (login por e-mail+senha).
  const hashAdmin = await hashPassword(SENHA_ADMIN);
  const hashUsuario = await hashPassword(SENHA_USUARIO);

  await db.insert(schema.users).values([
    {
      id: contratanteId,
      nomeCompleto: "Carlos Contratante",
      whatsapp: "+5511999999991",
      email: "carlos@example.com",
      senhaHash: hashUsuario,
      cidadeId: sp!.id,
      tipo: "CONTRATANTE",
      status: "ATIVO",
    },
    {
      id: profProId,
      nomeCompleto: "Joana Pintora Silva",
      whatsapp: "+5511999999992",
      email: "joana@example.com",
      senhaHash: hashUsuario,
      cidadeId: sp!.id,
      tipo: "PROFISSIONAL",
      status: "ATIVO",
    },
    {
      id: profInicianteId,
      nomeCompleto: "Pedro Pedreiro",
      whatsapp: "+5511999999993",
      email: "pedro@example.com",
      senhaHash: hashUsuario,
      cidadeId: sp!.id,
      tipo: "PROFISSIONAL",
      status: "ATIVO",
    },
    {
      id: adminId,
      nomeCompleto: "Admin Geral",
      whatsapp: "+5511999999994",
      email: "admin@example.com",
      senhaHash: hashAdmin,
      cidadeId: sp!.id,
      tipo: "CONTRATANTE", // Admins usam perfil contratante no front
      status: "ATIVO",
      // Controle total: ADMIN já é superusuário, mas concedemos os 3 papéis
      // explicitamente para deixar claro no banco de dev.
      roles: ["ADMIN", "MODERADOR", "FINANCEIRO"],
    },
  ]);

  console.log("Inserindo Perfis...");
  await db.insert(schema.contractorProfiles).values([
    { userId: contratanteId, plano: "BASICO" },
    { userId: adminId, plano: "BASICO" },
  ]);

  await db.insert(schema.professionalProfiles).values([
    {
      userId: profProId,
      especialidades: ["Pintura", "Gesso"],
      anosExperiencia: 5,
      bairro: "Pinheiros",
      raioAtendimentoKm: 15,
      completudePct: 100,
      plano: "PRO",
      slugPublico: "joana-pintora-silva",
    },
    {
      userId: profInicianteId,
      especialidades: ["Pedreiro", "Alvenaria"],
      anosExperiencia: 2,
      bairro: "Itaquera",
      raioAtendimentoKm: 5,
      completudePct: 50,
      plano: "INICIANTE",
      slugPublico: "pedro-pedreiro",
    },
  ]);

  console.log("Inserindo Assinaturas e Faturas (Monetização)...");
  const subscriptionId = randomUUID();
  await db.insert(schema.subscriptions).values([
    {
      id: subscriptionId,
      userId: profProId,
      plano: "PRO",
      status: "ATIVA",
      gateway: "ASAAS",
      valorCentavos: 4900,
    },
  ]);

  const invoiceId = randomUUID();
  await db.insert(schema.invoices).values([
    {
      id: invoiceId,
      userId: profProId,
      subscriptionId: subscriptionId,
      gateway: "ASAAS",
      valorCentavos: 4900,
      status: "PAGA",
      vencimentoEm: new Date(),
    },
  ]);

  console.log("Inserindo Obras, Pedidos e Lances...");
  const obraAbertaId = randomUUID();
  const obraAdjudicadaId = randomUUID();

  const dataFutura = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(schema.workOrders).values([
    {
      id: obraAbertaId,
      contractorId: contratanteId,
      cidadeId: sp!.id,
      especialidade: "Pintura",
      titulo: "Pintura de Apartamento 60m2",
      descricao: "Preciso pintar paredes e teto.",
      urgencia: "FLEXIVEL",
      status: "ABERTA",
      expiraEm: dataFutura,
    },
    {
      id: obraAdjudicadaId,
      contractorId: contratanteId,
      cidadeId: sp!.id,
      especialidade: "Pedreiro",
      titulo: "Construção de Muro",
      urgencia: "NORMAL",
      status: "ADJUDICADA",
      expiraEm: dataFutura,
    },
  ]);

  await db.insert(schema.proposals).values([
    {
      workOrderId: obraAbertaId,
      professionalId: profProId,
      valorCentavos: 150000,
      prazoDias: 5,
      mensagem: "Posso começar semana que vem.",
      status: "ENVIADA",
    },
    {
      workOrderId: obraAbertaId,
      professionalId: profInicianteId,
      valorCentavos: 120000,
      prazoDias: 7,
      mensagem: "Faço um preço bom.",
      status: "ENVIADA",
    },
    {
      workOrderId: obraAdjudicadaId,
      professionalId: profInicianteId,
      valorCentavos: 250000,
      prazoDias: 10,
      status: "ACEITA",
    },
  ]);

  console.log("Inserindo Agendamentos e Avaliações...");
  const bookingPendenteId = randomUUID();
  const bookingConcluidoId = randomUUID();

  await db.insert(schema.bookingRequests).values([
    {
      id: bookingPendenteId,
      contractorId: contratanteId,
      professionalId: profProId,
      especialidade: "Pintura",
      descricao: "Orçamento para pintura externa.",
      dataServico: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: "PENDENTE",
      expiraEm: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    },
    {
      id: bookingConcluidoId,
      contractorId: contratanteId,
      professionalId: profProId,
      especialidade: "Gesso",
      dataServico: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: "CONCLUIDO",
      expiraEm: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  ]);

  await db.insert(schema.termsAcceptances).values([
    {
      id: randomUUID(),
      bookingId: bookingConcluidoId,
      userId: contratanteId,
      papel: "CONTRATANTE",
      termoVersao: "v1.0",
      ip: "127.0.0.1",
    },
    {
      id: randomUUID(),
      bookingId: bookingConcluidoId,
      userId: profProId,
      papel: "PROFISSIONAL",
      termoVersao: "v1.0",
      ip: "127.0.0.1",
    },
  ]);

  await db.insert(schema.reviews).values([
    {
      id: randomUUID(),
      bookingId: bookingConcluidoId,
      autorId: contratanteId,
      alvoId: profProId,
      papelAutor: "CONTRATANTE",
      nota: 5,
      comentario: "Excelente serviço!",
      status: "REVELADA",
      prazoEm: new Date(),
      reveladaEm: new Date(),
    },
    {
      id: randomUUID(),
      bookingId: bookingConcluidoId,
      autorId: profProId,
      alvoId: contratanteId,
      papelAutor: "PROFISSIONAL",
      nota: 5,
      comentario: "Cliente muito bom, pagou em dia.",
      status: "REVELADA",
      prazoEm: new Date(),
      reveladaEm: new Date(),
    },
  ]);

  console.log("Inserindo Penalidades (Painel de Comportamento)...");
  await db.insert(schema.penalties).values([
    {
      id: randomUUID(),
      professionalId: profInicianteId,
      bookingId: bookingPendenteId, // fake relation for seed
      motivo: "RECUSA_INJUSTIFICADA",
      pontos: 1,
    },
  ]);

  console.log("Seed completo finalizado com sucesso!");
  console.log("\n=== Credenciais (login por e-mail + senha) ===");
  console.table([
    { papel: "ADMIN (controle total)", email: "admin@example.com", senha: SENHA_ADMIN },
    { papel: "Contratante", email: "carlos@example.com", senha: SENHA_USUARIO },
    { papel: "Profissional (PRO)", email: "joana@example.com", senha: SENHA_USUARIO },
    { papel: "Profissional (Iniciante)", email: "pedro@example.com", senha: SENHA_USUARIO },
  ]);
  await pool.end();
}

main().catch((error: unknown) => {
  console.error("Seed completo falhou:", error);
  process.exit(1);
});
