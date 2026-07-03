/**
 * Gera os PNGs do PWA a partir dos SVGs em apps/web/public.
 * - icon-192.png / icon-512.png (purpose "any")
 * - icon-maskable-512.png (purpose "maskable", com zona segura)
 * - apple-touch-icon.png (180, iOS ignora SVG e maskable)
 *
 * Uso: node scripts/gen-pwa-icons.cjs
 */
const path = require("node:path");
const fs = require("node:fs");
const sharp = require(path.resolve(__dirname, "../node_modules/.pnpm/sharp@0.34.5/node_modules/sharp"));

const pub = path.resolve(__dirname, "../apps/web/public");
const iconSvg = fs.readFileSync(path.join(pub, "icon.svg"));
const maskableSvg = fs.readFileSync(path.join(pub, "icon-maskable.svg"));

const jobs = [
  { svg: iconSvg, size: 192, out: "icon-192.png" },
  { svg: iconSvg, size: 512, out: "icon-512.png" },
  { svg: maskableSvg, size: 512, out: "icon-maskable-512.png" },
  // Apple touch icon precisa de fundo opaco (iOS não respeita transparência/raio).
  { svg: iconSvg, size: 180, out: "apple-touch-icon.png" },
];

(async () => {
  for (const { svg, size, out } of jobs) {
    await sharp(svg, { density: 384 })
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(pub, out));
    console.log(`✓ ${out} (${size}×${size})`);
  }
  console.log("PWA icons gerados em apps/web/public/");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
