import { resolveRadiusKm, geoFilter, offsetFor, buildMeta } from "./search-rules.js";

describe("resolveRadiusKm", () => {
  it("usa o default quando ausente e satura no máximo", () => {
    expect(resolveRadiusKm(undefined)).toBe(25);
    expect(resolveRadiusKm(10)).toBe(10);
    expect(resolveRadiusKm(500)).toBe(200); // satura no máximo
  });
});

describe("geoFilter", () => {
  it("liga a busca geo só com lat+lng juntos", () => {
    expect(geoFilter(-18.9, -48.3, 10)).toEqual({ lat: -18.9, lng: -48.3, raioKm: 10 });
    expect(geoFilter(undefined, undefined, 10)).toBeNull();
    expect(geoFilter(-18.9, undefined, 10)).toBeNull();
  });

  it("aplica o raio default quando não informado", () => {
    expect(geoFilter(-18.9, -48.3, undefined)).toEqual({ lat: -18.9, lng: -48.3, raioKm: 25 });
  });
});

describe("offsetFor", () => {
  it("calcula o offset da paginação", () => {
    expect(offsetFor(1, 20)).toBe(0);
    expect(offsetFor(3, 20)).toBe(40);
  });
});

describe("buildMeta", () => {
  it("monta a metadata de paginação (totalPages arredonda pra cima)", () => {
    expect(buildMeta(45, 2, 20)).toEqual({ total: 45, page: 2, limit: 20, totalPages: 3 });
    expect(buildMeta(0, 1, 20)).toEqual({ total: 0, page: 1, limit: 20, totalPages: 0 });
  });
});
