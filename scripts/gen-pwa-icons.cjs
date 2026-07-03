/**
 * Gera o logomark e os ícones do PWA A PARTIR DA LOGO REAL
 * (apps/web/public/brand/obracerta-logo.png).
 *
 * Passos:
 *  1) recorta o símbolo (casa + check + cunha) da logo → brand/obracerta-mark.png
 *     (asset reutilizável no sistema, fundo transparente).
 *  2) compõe o símbolo sobre fundo branco arredondado → ícones do PWA:
 *     icon-192, icon-512, icon-maskable-512 (zona segura), apple-touch-icon (180).
 *
 * Uso: node scripts/gen-pwa-icons.cjs
 */
const path = require("node:path");
const sharp = require(path.resolve(__dirname, "../node_modules/.pnpm/sharp@0.34.5/node_modules/sharp"));

const pub = path.resolve(__dirname, "../apps/web/public");
const brand = path.join(pub, "brand");
const LOGO = path.join(brand, "obracerta-logo.png");
const MARK = path.join(brand, "obracerta-mark.png");

const BG = "#ffffff"; // fundo do ícone (o interior do símbolo é branco → casa sem emenda)

/** Fundo arredondado (raio ~22% do lado, estilo iOS/Android). */
function roundedBg(size, radiusRatio = 0.22) {
  const r = Math.round(size * radiusRatio);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
       <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="${BG}"/>
     </svg>`,
  );
}

/** Compõe o mark centralizado sobre o fundo, ocupando `coverage` da largura. */
async function makeIcon({ size, coverage, rounded, out }) {
  const markW = Math.round(size * coverage);
  const mark = await sharp(MARK).resize({ width: markW }).toBuffer();
  const bg = rounded
    ? sharp(roundedBg(size))
    : sharp({ create: { width: size, height: size, channels: 4, background: BG } });
  await bg.composite([{ input: mark, gravity: "center" }]).png().toFile(path.join(pub, out));
  console.log(`✓ ${out} (${size}×${size}, cobertura ${Math.round(coverage * 100)}%)`);
}

(async () => {
  // 1) Extrai o logomark da logo (faixa esquerda) e apara a transparência.
  await sharp(LOGO).extract({ left: 0, top: 0, width: 310, height: 250 }).trim().toFile(MARK);
  console.log(`✓ brand/obracerta-mark.png (logomark isolado)`);

  // 2) Ícones do PWA.
  await makeIcon({ size: 192, coverage: 0.78, rounded: true, out: "icon-192.png" });
  await makeIcon({ size: 512, coverage: 0.78, rounded: true, out: "icon-512.png" });
  // Maskable: símbolo menor (zona segura ~80% do círculo) + fundo full-bleed.
  await makeIcon({ size: 512, coverage: 0.6, rounded: false, out: "icon-maskable-512.png" });
  // Apple touch: iOS arredonda sozinho; fundo opaco quadrado.
  await makeIcon({ size: 180, coverage: 0.78, rounded: false, out: "apple-touch-icon.png" });

  console.log("Ícones gerados a partir da logo real.");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
