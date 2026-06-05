import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, or } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "../../../infrastructure/database/schema/index.js";
import { users } from "../../../infrastructure/database/schema/users.js";
import { bookingRequests } from "../../../infrastructure/database/schema/booking-requests.js";
import { termsAcceptances } from "../../../infrastructure/database/schema/terms-acceptances.js";
import { auditLog } from "../../../infrastructure/database/schema/audit-log.js";
import { DrizzleUsersRepository } from "../../users/infrastructure/drizzle-users.repository.js";
import { DrizzleBookingRepository } from "../../booking/infrastructure/drizzle-booking.repository.js";
import { computeExpiry } from "../../booking/domain/booking-state.js";
import { AuditService } from "../../audit/application/audit.service.js";
import { computeHash } from "../../audit/domain/audit-hash.js";
import { DrizzleAuditRepository } from "../../audit/infrastructure/drizzle-audit.repository.js";
import { DrizzleTermsRepository } from "./drizzle-terms.repository.js";

config({ path: "../../.env" });

/**
 * Integração real (Etapa 2.3): aceite append-only + hash-chain do audit_log.
 * Requer `pnpm docker:up`. Fora do CI.
 *
 * Limpeza: audit_log.ator_user_id é ON DELETE SET NULL — apagar o usuário depois
 * mutaria um campo já hasheado e quebraria a cadeia global. Por isso removemos
 * os registros de auditoria deste teste (que estão na cauda) ANTES dos usuários.
 */
describe("Terms + Audit (integração)", () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  const usersRepo = new DrizzleUsersRepository(db);
  const bookingRepo = new DrizzleBookingRepository(db);
  const termsRepo = new DrizzleTermsRepository(db);
  const auditRepo = new DrizzleAuditRepository(db);
  const auditService = new AuditService(auditRepo);
  const sufixo = Date.now().toString().slice(-9);
  let contractorId = "";
  let professionalId = "";
  let bookingId = "";

  beforeAll(async () => {
    const contractor = await usersRepo.create({
      nomeCompleto: "Contratante Termos",
      whatsapp: `+5531${sufixo}`,
      email: `c.termos.${sufixo}@example.com`,
      tipo: "CONTRATANTE",
    });
    const professional = await usersRepo.create({
      nomeCompleto: "Profissional Termos",
      whatsapp: `+5541${sufixo}`,
      email: `p.termos.${sufixo}@example.com`,
      tipo: "PROFISSIONAL",
    });
    contractorId = contractor.id;
    professionalId = professional.id;
    const booking = await bookingRepo.create({
      contractorId,
      professionalId,
      especialidade: "pintura",
      descricao: null,
      dataServico: "2026-10-01T14:00:00.000Z",
      expiraEm: computeExpiry(new Date()),
    });
    bookingId = booking.id;
  });

  afterAll(async () => {
    await db.delete(termsAcceptances).where(eq(termsAcceptances.bookingId, bookingId));
    await db.delete(auditLog).where(eq(auditLog.entidadeId, bookingId));
    await db.delete(bookingRequests).where(eq(bookingRequests.id, bookingId));
    await db.delete(users).where(or(eq(users.id, contractorId), eq(users.id, professionalId)));
    await pool.end();
  });

  it("registra aceite bilateral (append-only, 1 por usuário) e lista", async () => {
    const c = await termsRepo.accept({
      bookingId,
      userId: contractorId,
      papel: "CONTRATANTE",
      termoVersao: "1.0",
      ip: "203.0.113.1",
    });
    expect(c.papel).toBe("CONTRATANTE");
    expect(c).not.toHaveProperty("ip"); // ip é interno (LGPD)

    await termsRepo.accept({
      bookingId,
      userId: professionalId,
      papel: "PROFISSIONAL",
      termoVersao: "1.0",
      ip: null,
    });

    const lista = await termsRepo.listForBooking(bookingId);
    expect(lista).toHaveLength(2);
    expect(await termsRepo.findByBookingAndUser(bookingId, contractorId)).not.toBeNull();

    // UNIQUE(booking,user): segundo aceite do mesmo usuário é rejeitado pelo banco
    await expect(
      termsRepo.accept({
        bookingId,
        userId: contractorId,
        papel: "CONTRATANTE",
        termoVersao: "1.0",
        ip: null,
      }),
    ).rejects.toThrow();
  });

  it("encadeia o audit_log e mantém a integridade verificável", async () => {
    const baseline = await auditService.verify();

    const e1 = await auditRepo.append({
      atorUserId: contractorId,
      acao: "TERMO_ACEITO",
      entidade: "booking",
      entidadeId: bookingId,
      dados: { papel: "CONTRATANTE", termoVersao: "1.0" },
    });
    const e2 = await auditRepo.append({
      atorUserId: professionalId,
      acao: "TERMO_ACEITO",
      entidade: "booking",
      entidadeId: bookingId,
      dados: { papel: "PROFISSIONAL", termoVersao: "1.0" },
    });

    // encadeamento: hashPrev do 2º == hash do 1º; seq crescente
    expect(e2.hashPrev).toBe(e1.hash);
    expect(e2.seq).toBeGreaterThan(e1.seq);

    // o hash armazenado bate com o recomputado (stableStringify sobrevive ao jsonb)
    expect(
      computeHash(e1.hashPrev, {
        atorUserId: e1.atorUserId,
        acao: e1.acao,
        entidade: e1.entidade,
        entidadeId: e1.entidadeId,
        dados: e1.dados,
        criadoEm: e1.criadoEm,
      }),
    ).toBe(e1.hash);

    // a cadeia global continua íntegra e cresceu em 2
    const depois = await auditService.verify();
    expect(depois.ok).toBe(baseline.ok);
    expect(depois.total).toBe(baseline.total + 2);
  });
});
