/**
 * Geração de **BR Code Pix** (EMVCo MPM) — payload do QR/copia-e-cola.
 * Padrão Bacen (Manual de Iniciação do Pix): TLV `id + len(2) + valor`, com
 * CRC16-CCITT (0xFFFF) no campo 63.
 *
 * Domínio puro (sem IO): em sandbox geramos um payload **fictício porém válido
 * em formato** (chave de exemplo); com gateway real (Asaas), o payload virá do
 * provedor e esta função deixa de ser usada no caminho de produção.
 */

/** Campo TLV: id (2 dígitos) + tamanho (2 dígitos) + valor. */
function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

/** CRC16-CCITT (polinômio 0x1021, inicial 0xFFFF) — exigido pelo BR Code. */
export function crc16ccitt(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export interface PixPayloadParams {
  /** Chave Pix do recebedor (e-mail, telefone, CNPJ ou EVP). */
  chave: string;
  /** Nome do recebedor (máx. 25 chars no padrão). */
  merchantName: string;
  /** Cidade do recebedor (máx. 15 chars). */
  merchantCity: string;
  valorCentavos: number;
  /** Identificador da transação (A-Za-z0-9, máx. 25). */
  txid: string;
}

/** Sanitiza texto para os campos EMV (ASCII simples, tamanho máximo). */
function emvText(value: string, max: number): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^ -~]/g, "")
    .slice(0, max)
    .toUpperCase();
}

/** Monta o payload completo do BR Code (estático, com valor). */
export function buildPixPayload(params: PixPayloadParams): string {
  const valor = (params.valorCentavos / 100).toFixed(2);
  const txid = params.txid.replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";

  const merchantAccount = tlv(
    "26",
    tlv("00", "br.gov.bcb.pix") + tlv("01", params.chave.slice(0, 77)),
  );
  const additional = tlv("62", tlv("05", txid));

  const semCrc =
    tlv("00", "01") + // Payload Format Indicator
    merchantAccount +
    tlv("52", "0000") + // Merchant Category Code
    tlv("53", "986") + // moeda BRL
    tlv("54", valor) +
    tlv("58", "BR") +
    tlv("59", emvText(params.merchantName, 25)) +
    tlv("60", emvText(params.merchantCity, 15)) +
    additional +
    "6304"; // CRC: id+len fazem parte do cálculo

  return semCrc + crc16ccitt(semCrc);
}
