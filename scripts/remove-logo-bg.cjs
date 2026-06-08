/**
 * Remove o fundo branco das logos (PNG) deixando-o transparente, com borda
 * suavizada (feather) e recorte automático das margens. Usa o `sharp` já
 * presente no repo. Mantém os originais; gera novos arquivos `*-sembg.png`.
 *
 * Uso: node scripts/remove-logo-bg.cjs
 */
const path = require("node:path");
const sharp = require(path.resolve(__dirname, "../node_modules/.pnpm/sharp@0.34.5/node_modules/sharp"));

// Limiares de "branco": acima de HI vira transparente; abaixo de LO fica opaco;
// no meio, alfa interpolado (suaviza o serrilhado das bordas).
const HI = 248;
const LO = 236;

async function removeBg(input, output) {
  // Recorta a moldura branca primeiro (top-left define a cor da borda).
  const base = sharp(input).trim({ threshold: 12 }).ensureAlpha();
  const { data, info } = await base.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  for (let i = 0; i < data.length; i += channels) {
    const m = Math.min(data[i], data[i + 1], data[i + 2]); // 255 = branco puro
    let a;
    if (m >= HI) a = 0;
    else if (m <= LO) a = 255;
    else a = Math.round(((HI - m) / (HI - LO)) * 255);
    // Combina com o alfa existente (caso a imagem já tivesse transparência).
    data[i + 3] = Math.min(data[i + 3], a);
  }

  await sharp(data, { raw: { width, height, channels } }).png().toFile(output);
  const out = await sharp(output).metadata();
  console.log(`✓ ${path.basename(output)} — ${out.width}x${out.height} (fundo removido)`);
}

(async () => {
  const dir = path.resolve(__dirname, "../docs/mockups");
  await removeBg(path.join(dir, "obracerta-logo.png"), path.join(dir, "obracerta-logo-sembg.png"));
  await removeBg(path.join(dir, "quemfaz-logo.png"), path.join(dir, "quemfaz-logo-sembg.png"));
})().catch((e) => {
  console.error("Falha ao remover fundo:", e);
  process.exit(1);
});
