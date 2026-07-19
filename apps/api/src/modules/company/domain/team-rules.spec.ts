import { UserType } from "@obracerta/shared";
import { canBeMember, normalizeInviteEmail } from "./team-rules.js";

describe("canBeMember", () => {
  it("pessoas físicas podem ser membros da equipe", () => {
    expect(canBeMember(UserType.CONTRATANTE)).toBe(true);
    expect(canBeMember(UserType.PROFISSIONAL)).toBe(true);
  });

  it("outra EMPRESA não pode ser membro", () => {
    expect(canBeMember(UserType.EMPRESA)).toBe(false);
  });
});

describe("normalizeInviteEmail", () => {
  it("normaliza trim + minúsculas (o vínculo por e-mail depende disso)", () => {
    expect(normalizeInviteEmail("  Joao.Silva@Empresa.COM ")).toBe("joao.silva@empresa.com");
  });
});
