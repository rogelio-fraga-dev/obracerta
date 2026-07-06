import type { MulterOptions } from "@nestjs/platform-express/multer/interfaces/multer-options.interface.js";

/**
 * Regras únicas de upload de imagem (fotos de perfil, pedido, obra, portfólio).
 *
 * - `IMAGE_UPLOAD_OPTIONS`: teto de tamanho no Multer — sem ele, um arquivo de
 *   GBs é bufferizado em memória e derruba o processo (DoS trivial autenticado).
 * - `sniffImageExt`: valida o CONTEÚDO pelos magic bytes — o `mimetype` do
 *   multipart é uma string enviada pelo cliente, trivialmente falsificável.
 */

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB — foto de obra em celular cabe folgado

export const IMAGE_UPLOAD_OPTIONS: MulterOptions = {
  limits: { fileSize: MAX_IMAGE_BYTES },
};

export type ImageExt = "jpg" | "png" | "webp";

/** Content-Type canônico por extensão (persistido no storage — nunca o do cliente). */
export const IMAGE_MIME: Record<ImageExt, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/**
 * Detecta JPEG/PNG/WebP pelos magic bytes. `null` = formato não aceito (ou
 * arquivo mentindo o Content-Type).
 */
export function sniffImageExt(buffer: Buffer): ImageExt | null {
  if (buffer.length < 12) return null;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }
  // WebP: "RIFF" .... "WEBP"
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }
  return null;
}
