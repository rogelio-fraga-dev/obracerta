import { rowToUser } from "./drizzle-users.repository.js";

type UserRow = Parameters<typeof rowToUser>[0];

function makeRow(overrides: Partial<UserRow> = {}): UserRow {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    nomeCompleto: "Maria da Silva",
    whatsapp: "+5511999999999",
    email: "maria@example.com",
    senhaHash: null,
    fotoUrl: null,
    cidadeId: "22222222-2222-2222-2222-222222222222",
    tipo: "PROFISSIONAL",
    cpf: "12345678901",
    status: "ATIVO",
    roles: [],
    criadoEm: new Date("2026-06-04T12:00:00.000Z"),
    ...overrides,
  };
}

describe("rowToUser", () => {
  it("mapeia a linha do banco para o contrato público User", () => {
    const user = rowToUser(makeRow());

    expect(user).toEqual({
      id: "11111111-1111-1111-1111-111111111111",
      nomeCompleto: "Maria da Silva",
      whatsapp: "+5511999999999",
      email: "maria@example.com",
      fotoUrl: null,
      tipo: "PROFISSIONAL",
      status: "ATIVO",
      criadoEm: "2026-06-04T12:00:00.000Z",
    });
  });

  it("nunca expõe cpf nem cidadeId (LGPD, roadmap §9)", () => {
    const user = rowToUser(makeRow());

    expect(user).not.toHaveProperty("cpf");
    expect(user).not.toHaveProperty("cidadeId");
  });

  it("converte email null em undefined", () => {
    const user = rowToUser(makeRow({ email: null }));

    expect(user.email).toBeUndefined();
  });

  it("serializa criadoEm como ISO string", () => {
    const user = rowToUser(makeRow({ criadoEm: new Date("2025-01-15T08:30:00.000Z") }));

    expect(user.criadoEm).toBe("2025-01-15T08:30:00.000Z");
  });
});
