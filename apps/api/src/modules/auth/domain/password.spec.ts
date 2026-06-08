import { hashPassword, verifyPassword } from "./password.js";

describe("password (scrypt)", () => {
  it("verifica a senha correta contra o próprio hash", async () => {
    const hash = await hashPassword("segredo-super-forte");

    await expect(verifyPassword("segredo-super-forte", hash)).resolves.toBe(true);
  });

  it("rejeita senha incorreta", async () => {
    const hash = await hashPassword("segredo-super-forte");

    await expect(verifyPassword("senha-errada", hash)).resolves.toBe(false);
  });

  it("gera hashes diferentes para a mesma senha (salt aleatório)", async () => {
    const a = await hashPassword("mesma-senha");
    const b = await hashPassword("mesma-senha");

    expect(a).not.toBe(b);
  });

  it("retorna false para um hash com formato inválido", async () => {
    await expect(verifyPassword("qualquer", "formato-invalido")).resolves.toBe(false);
  });
});
