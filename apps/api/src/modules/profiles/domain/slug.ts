/**
 * Geração de slug público a partir do nome (roadmap §4.1/§18). Pura e testável.
 * Remove acentos, baixa caixa, troca não-alfanuméricos por hífen e normaliza.
 * Garante o mínimo de 3 chars exigido pelo `slugSchema`.
 */
export function slugify(input: string): string {
  const base = input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove diacríticos (acentos)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-+$/g, "");

  return base.length >= 3 ? base : `pro-${base}`.replace(/-+$/g, "").slice(0, 70);
}

/** Sufixo determinístico para resolver colisão de slug (slug-2, slug-3, ...). */
export function slugWithSuffix(slug: string, n: number): string {
  if (n <= 1) return slug;
  const suffix = `-${n}`;
  return `${slug.slice(0, 80 - suffix.length)}${suffix}`;
}
