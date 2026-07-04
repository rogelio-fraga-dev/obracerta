import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "../../../infrastructure/database/schema/index.js";
import { users } from "../../../infrastructure/database/schema/users.js";
import { accountSuspensions } from "../../../infrastructure/database/schema/account-suspensions.js";
import { DrizzleUsersRepository } from "../../users/infrastructure/drizzle-users.repository.js";
import { UsersService } from "../../users/application/users.service.js";
import type { ReputationService } from "../../reputation/application/reputation.service.js";
import type { AuditService } from "../../audit/application/audit.service.js";
import { ModerationService } from "../application/moderation.service.js";
import type { ModerationScheduler } from "../application/moderation.scheduler.js";
import { DrizzleReportRepository } from "./drizzle-report.repository.js";
import { DrizzleSuspensionRepository } from "./drizzle-suspension.repository.js";
import type { InboxService } from "../../notifications/application/inbox.service.js";

config({ path: "../../.env" });

/**
 * Integração real (Etapa 6.4): auto-lift de suspensão — no fim do prazo, expira a
 * suspensão e reativa a conta. Requer docker:up. Fora do CI.
 */
describe("ModerationService — auto-lift de suspensão (integração)", () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  const usersRepo = new DrizzleUsersRepository(db);
  const mockStorage = { putObject: async () => "url" };
  const usersService = new UsersService(usersRepo, mockStorage as any);
  const reportRepo = new DrizzleReportRepository(db);
  const suspRepo = new DrizzleSuspensionRepository(db);
  const reputationStub = {} as ReputationService;
  const schedulerStub = {
    scheduleRestore: () => Promise.resolve(),
    scheduleSuspensionLift: () => Promise.resolve(),
  } as unknown as ModerationScheduler;
  const auditStub = { record: () => Promise.resolve(undefined) } as unknown as AuditService;
  const inboxStub = { record: () => Promise.resolve() } as unknown as InboxService;
  const service = new ModerationService(
    reportRepo,
    suspRepo,
    reputationStub,
    usersService,
    schedulerStub,
    auditStub,
    inboxStub,
  );

  const sufixo = Date.now().toString().slice(-9);
  let userId = "";
  let suspId = "";

  beforeAll(async () => {
    const user = await usersRepo.create({
      nomeCompleto: "Suspenso Lift",
      whatsapp: `+5559${sufixo}`,
      email: `s.lift.${sufixo}@example.com`,
      tipo: "PROFISSIONAL",
    });
    userId = user.id;
    await usersRepo.setStatus(userId, "SUSPENSO");
    const susp = await suspRepo.create({
      userId,
      reportId: null,
      motivo: "Suspensão de teste",
      fimEm: new Date(Date.now() - 60_000).toISOString(), // já vencida (1 min atrás)
    });
    suspId = susp.id;
  });

  afterAll(async () => {
    await db.delete(accountSuspensions).where(eq(accountSuspensions.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
    await pool.end();
  });

  it("expira a suspensão vencida e reativa a conta", async () => {
    expect((await usersRepo.findById(userId))?.status).toBe("SUSPENSO");

    expect(await service.liftSuspensionIfDue(suspId)).toBe(true);

    expect((await suspRepo.findById(suspId))?.status).toBe("EXPIRADA");
    expect((await usersRepo.findById(userId))?.status).toBe("ATIVO");
  });

  it("é idempotente: rodar de novo não faz nada", async () => {
    expect(await service.liftSuspensionIfDue(suspId)).toBe(false);
  });
});
