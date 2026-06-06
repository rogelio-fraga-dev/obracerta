import { canAuthenticate } from "./account-status.js";

describe("canAuthenticate", () => {
  it("só conta ATIVO pode autenticar", () => {
    expect(canAuthenticate("ATIVO")).toBe(true);
    expect(canAuthenticate("SUSPENSO")).toBe(false);
    expect(canAuthenticate("REMOVIDO")).toBe(false);
  });
});
