import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, inArray } from "drizzle-orm";
import { Pool } from "pg";
import type { User } from "@obracerta/shared";
import * as schema from "../../../infrastructure/database/schema/index.js";
import { users } from "../../../infrastructure/database/schema/users.js";
import { cities } from "../../../infrastructure/database/schema/cities.js";
import { workOrders } from "../../../infrastructure/database/schema/work-orders.js";
import { proposals } from "../../../infrastructure/database/schema/proposals.js";
import { DrizzleUsersRepository } from "../../users/infrastructure/drizzle-users.repository.js";
import type { UsersService } from "../../users/application/users.service.js";
import type { AuditService } from "../../audit/application/audit.service.js";
import type { BillingService } from "../../billing/application/billing.service.js";
import { WorkOrderService } from "../application/work-order.service.js";
import type { WorkOrderScheduler } from "../application/work-order.scheduler.js";
import { DrizzleWorkOrderRepository } from "./drizzle-work-order.repository.js";
import { DrizzleProposalRepository } from "./drizzle-proposal.repository.js";

config({ path: "../../.env" });

/**
 * Integração real (Etapa 5.3): abrir obra → lances (com piso de dignidade) → sigilo
 * → adjudicação. Requer docker:up. Fora do CI.
 */
describe("WorkOrderService (integração)", () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  const usersRepo = new DrizzleUsersRepository(db);
  const orderRepo = new DrizzleWorkOrderRepository(db);
  const proposalRepo = new DrizzleProposalRepository(db);

  const usersById = new Map<string, User>();
  const usersStub = { findById: (id: string) => Promise.resolve(usersById.get(id) ?? null) } as unknown as UsersService;
  const auditStub = { record: () => Promise.resolve(undefined) } as unknown as AuditService;
  const schedulerStub = { scheduleExpiry: () => Promise.resolve() } as unknown as WorkOrderScheduler;
  // Gating: neste fluxo os profissionais podem dar lances (Especialista).
  const billingStub = { can: () => Promise.resolve(true) } as unknown as BillingService;
  // Este fluxo não exercita upload de foto — storage stub inerte.
  const storageStub = {
    putObject: () => Promise.reject(new Error("sem storage no teste")),
  } as unknown as import("../../storage/domain/storage.port.js").StoragePort;
  const inboxStub = {
    record: () => Promise.resolve(undefined),
  } as unknown as import("../../notifications/application/inbox.service.js").InboxService;
  const service = new WorkOrderService(
    orderRepo,
    proposalRepo,
    usersStub,
    schedulerStub,
    auditStub,
    billingStub,
    storageStub,
    inboxStub,
  );

  const sufixo = Date.now().toString().slice(-9);
  let cidadeId = "";
  let contractorId = "";
  const proIds: string[] = [];
  let workOrderId = "";

  beforeAll(async () => {
    const [city] = await db
      .insert(cities)
      .values({ nome: `Cidade WO ${sufixo}`, uf: "MG" })
      .returning();
    cidadeId = city!.id;

    const contractor = await usersRepo.create({
      nomeCompleto: "Contratante WO",
      whatsapp: `+5557${sufixo}`,
      email: `c.wo.${sufixo}@example.com`,
      tipo: "CONTRATANTE",
    });
    contractorId = contractor.id;
    usersById.set(contractorId, contractor);

    for (let i = 0; i < 4; i++) {
      const pro = await usersRepo.create({
        nomeCompleto: `Profissional WO ${i}`,
        whatsapp: `+556${i}${sufixo}`,
        email: `p${i}.wo.${sufixo}@example.com`,
        tipo: "PROFISSIONAL",
      });
      proIds.push(pro.id);
      usersById.set(pro.id, pro);
    }
  });

  afterAll(async () => {
    if (workOrderId) await db.delete(proposals).where(eq(proposals.workOrderId, workOrderId));
    if (workOrderId) await db.delete(workOrders).where(eq(workOrders.id, workOrderId));
    await db.delete(users).where(inArray(users.id, [contractorId, ...proIds]));
    await db.delete(cities).where(eq(cities.id, cidadeId));
    await pool.end();
  });

  it("abre a obra com expiração pela urgência", async () => {
    const order = await service.openWorkOrder(contractorId, {
      cidadeId,
      especialidade: `esp-wo-${sufixo}`,
      titulo: "Reforma do banheiro",
      urgencia: "URGENTE",
      descricao: "Trocar revestimento",
    });
    workOrderId = order.id;
    expect(order.status).toBe("ABERTA");
    // URGENTE = 48h à frente
    expect(Date.parse(order.expiraEm) - Date.parse(order.criadoEm)).toBeCloseTo(48 * 3600 * 1000, -5);
  });

  it("aceita lances e aplica o piso de dignidade a partir do 4º", async () => {
    await service.submitProposal(proIds[0]!, workOrderId, { valorCentavos: 10000 });
    await service.submitProposal(proIds[1]!, workOrderId, { valorCentavos: 20000 });
    await service.submitProposal(proIds[2]!, workOrderId, { valorCentavos: 30000 });
    // 3 lances (10k/20k/30k) → piso = média(20000) * 0,7 = 14000
    expect((await orderRepo.findById(workOrderId))?.pisoCentavos).toBe(14000);

    // 4º lance abaixo do piso é recusado; no/acima é aceito
    await expect(
      service.submitProposal(proIds[3]!, workOrderId, { valorCentavos: 13000 }),
    ).rejects.toThrow();
    const aceito = await service.submitProposal(proIds[3]!, workOrderId, { valorCentavos: 15000 });
    expect(aceito.status).toBe("ENVIADA");
  });

  it("respeita o sigilo: dono vê todos, profissional vê só o seu", async () => {
    expect(await service.listProposals(contractorId, workOrderId)).toHaveLength(4);
    const doPro0 = await service.listProposals(proIds[0]!, workOrderId);
    expect(doPro0).toHaveLength(1);
    expect(doPro0[0]?.professionalId).toBe(proIds[0]);
  });

  it("adjudica: obra ADJUDICADA, lance ACEITA e os demais RECUSADA", async () => {
    const all = await service.listProposals(contractorId, workOrderId);
    const escolhido = all.find((p) => p.professionalId === proIds[0]);
    const aceita = await service.acceptProposal(contractorId, escolhido!.id);
    expect(aceita.status).toBe("ACEITA");
    expect((await orderRepo.findById(workOrderId))?.status).toBe("ADJUDICADA");

    const depois = await service.listProposals(contractorId, workOrderId);
    const recusadas = depois.filter((p) => p.status === "RECUSADA");
    expect(recusadas).toHaveLength(3);

    // obra já adjudicada não aceita novo lance
    await expect(
      service.submitProposal(proIds[1]!, workOrderId, { valorCentavos: 99000 }),
    ).rejects.toThrow();
  });
});
