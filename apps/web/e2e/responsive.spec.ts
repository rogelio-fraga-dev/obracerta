import { expect, test } from "@playwright/test";

/** A landing não pode ter rolagem horizontal em nenhum breakpoint comum. */
const BREAKPOINTS = [
  { name: "mobile-320", width: 320, height: 720 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1440", width: 1440, height: 900 },
];

for (const bp of BREAKPOINTS) {
  test(`landing sem overflow horizontal em ${bp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: bp.width, height: bp.height });
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1); // tolera 1px de arredondamento
  });
}
