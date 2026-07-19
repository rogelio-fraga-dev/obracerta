/**
 * Gera a variante da logo para o **modo escuro**. A logo tem o "Obra" e a
 * tagline em grafite/cinza (somem no fundo escuro) e o "Certa"/ícone em laranja
 * (lê bem no escuro). Este script recolore só os pixels **neutros** (grafite→
 * creme, cinza→cinza-claro, por inversão de luminância) e **preserva o laranja**
 * e a transparência. Mantém o original; gera `*-dark.png`.
 *
 * Uso: node scripts/logo-dark-variant.cjs
 */
const path = require("node:path");
const sharp = require(
  path.resolve(__dirname, "../node_modules/.pnpm/sharp@0.34.5/node_modules/sharp"),
);

/** Um pixel é "laranja" (preservar) se for claramente quente (R≫B e R>G). */
function isOrange(r, g, b) {
  return r - b > 50 && r - g > 20;
}

async function darkVariant(input, output) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Creme dos tokens (--color-cream ≈ #f7f3ec) como alvo dos neutros.
  const CREAM = [247, 243, 236];

  for (let i = 0; i < data.length; i += channels) {
    const a = data[i + 3];
    if (a === 0) continue; // transparente: nada a fazer
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    if (isOrange(r, g, b)) continue; // laranja da marca: mantém

    // Neutro (grafite/cinza): inverte a luminância e tinge de creme. Grafite
    // escuro → creme brilhante; cinza médio (tagline) → cinza-claro legível.
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const inv = (255 - lum) / 255;
    const factor = 0.4 + 0.6 * inv; // realça sem estourar
    data[i] = Math.round(CREAM[0] * factor);
    data[i + 1] = Math.round(CREAM[1] * factor);
    data[i + 2] = Math.round(CREAM[2] * factor);
  }

  await sharp(data, { raw: { width, height, channels } }).png().toFile(output);
  const meta = await sharp(output).metadata();
  console.log(`✓ ${path.basename(output)} — ${meta.width}x${meta.height} (variante dark)`);
}

(async () => {
  const dir = path.resolve(__dirname, "../apps/web/public/brand");
  await darkVariant(
    path.join(dir, "obracerta-logo.png"),
    path.join(dir, "obracerta-logo-dark.png"),
  );
  await darkVariant(
    path.join(dir, "obracerta-mark.png"),
    path.join(dir, "obracerta-mark-dark.png"),
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
