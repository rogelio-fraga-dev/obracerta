import { hasAnyRole, isAdmin } from "./roles.js";

describe("hasAnyRole", () => {
  it("true quando o usuário tem ao menos um dos papéis exigidos", () => {
    expect(hasAnyRole(["MODERADOR"], ["ADMIN", "MODERADOR"])).toBe(true);
  });

  it("false quando não tem nenhum dos exigidos", () => {
    expect(hasAnyRole(["FINANCEIRO"], ["ADMIN", "MODERADOR"])).toBe(false);
    expect(hasAnyRole([], ["ADMIN"])).toBe(false);
  });

  it("sem papéis exigidos → liberado", () => {
    expect(hasAnyRole([], [])).toBe(true);
    expect(hasAnyRole(["FINANCEIRO"], [])).toBe(true);
  });

  it("ADMIN é superusuário → satisfaz qualquer exigência", () => {
    expect(hasAnyRole(["ADMIN"], ["MODERADOR"])).toBe(true);
    expect(hasAnyRole(["ADMIN"], ["FINANCEIRO"])).toBe(true);
    expect(hasAnyRole(["ADMIN"], ["MODERADOR", "FINANCEIRO"])).toBe(true);
  });
});

describe("isAdmin", () => {
  it("true só com o papel ADMIN", () => {
    expect(isAdmin(["ADMIN"])).toBe(true);
    expect(isAdmin(["MODERADOR", "FINANCEIRO"])).toBe(false);
    expect(isAdmin([])).toBe(false);
  });
});
