import {
  stableStringify,
  canonicalize,
  computeHash,
  verifyChain,
  type AuditEntryData,
  type ChainLink,
} from "./audit-hash.js";

const entry = (over: Partial<AuditEntryData> = {}): AuditEntryData => ({
  atorUserId: "u1",
  acao: "TERMO_ACEITO",
  entidade: "booking",
  entidadeId: "b1",
  dados: { papel: "PROFISSIONAL", termoVersao: "1.0" },
  criadoEm: "2026-06-04T12:00:00.000Z",
  ...over,
});

/** Constrói uma cadeia válida a partir de uma lista de payloads. */
function buildChain(entries: AuditEntryData[]): ChainLink[] {
  const links: ChainLink[] = [];
  let prevHash: string | null = null;
  entries.forEach((e, i) => {
    const hash = computeHash(prevHash, e);
    links.push({ ...e, seq: i + 1, hashPrev: prevHash, hash });
    prevHash = hash;
  });
  return links;
}

describe("stableStringify", () => {
  it("é independente da ordem das chaves (jsonb reordena)", () => {
    expect(stableStringify({ a: 1, b: 2 })).toBe(stableStringify({ b: 2, a: 1 }));
  });

  it("ordena chaves aninhadas e mantém arrays", () => {
    expect(stableStringify({ z: [3, { y: 1, x: 2 }], a: null })).toBe(
      '{"a":null,"z":[3,{"x":2,"y":1}]}',
    );
  });
});

describe("computeHash", () => {
  it("é determinístico e hex de 64 chars (sha256)", () => {
    const h = computeHash(null, entry());
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(computeHash(null, entry())).toBe(h);
  });

  it("muda se o payload muda", () => {
    expect(computeHash(null, entry())).not.toBe(computeHash(null, entry({ acao: "OUTRA" })));
  });

  it("muda se o hashPrev muda (encadeamento)", () => {
    expect(computeHash(null, entry())).not.toBe(computeHash("abc", entry()));
  });
});

describe("verifyChain", () => {
  it("aprova uma cadeia íntegra", () => {
    const chain = buildChain([entry(), entry({ acao: "A2" }), entry({ acao: "A3" })]);
    expect(verifyChain(chain)).toEqual({ ok: true, brokenAtSeq: null });
  });

  it("cadeia vazia é íntegra", () => {
    expect(verifyChain([])).toEqual({ ok: true, brokenAtSeq: null });
  });

  it("detecta adulteração de um registro (payload mexido)", () => {
    const chain = buildChain([entry(), entry({ acao: "A2" }), entry({ acao: "A3" })]);
    const adulterado: ChainLink[] = chain.map((l) =>
      l.seq === 2 ? { ...l, acao: "HACKEADO" } : l,
    );
    expect(verifyChain(adulterado)).toEqual({ ok: false, brokenAtSeq: 2 });
  });

  it("detecta hashPrev quebrado", () => {
    const chain = buildChain([entry(), entry({ acao: "A2" })]);
    const quebrado: ChainLink[] = chain.map((l) =>
      l.seq === 2 ? { ...l, hashPrev: "deadbeef" } : l,
    );
    expect(verifyChain(quebrado)).toEqual({ ok: false, brokenAtSeq: 2 });
  });

  it("canonicalize ignora a ordem das chaves de dados", () => {
    const a = canonicalize(entry({ dados: { x: 1, y: 2 } }));
    const b = canonicalize(entry({ dados: { y: 2, x: 1 } }));
    expect(a).toBe(b);
  });
});
