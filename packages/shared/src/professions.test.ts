import { describe, expect, it } from "vitest";
import {
  isCatalogProfession,
  professionCatalog,
  professionIcon,
  professionLabels,
} from "./professions.js";

describe("catálogo de profissões", () => {
  it("tem ids e labels únicos", () => {
    const ids = professionCatalog.map((p) => p.id);
    const labels = professionCatalog.map((p) => p.label);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("professionLabels reflete os rótulos do catálogo", () => {
    expect(professionLabels).toContain("Pedreiro");
    expect(professionLabels).toContain("Eletricista");
    expect(professionLabels.length).toBe(professionCatalog.length);
  });

  it("professionIcon resolve do catálogo e cai no fallback", () => {
    expect(professionIcon("Pedreiro")).toBe("🧱");
    expect(professionIcon("Profissão Inexistente")).toBe("🔨");
  });

  it("isCatalogProfession distingue catálogo de 'Outra'", () => {
    expect(isCatalogProfession("Encanador")).toBe(true);
    expect(isCatalogProfession("Domador de leões")).toBe(false);
  });
});
