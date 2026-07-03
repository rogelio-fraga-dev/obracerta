import { buildPixPayload, crc16ccitt } from "./pix-brcode.js";

describe("pix-brcode (BR Code EMV)", () => {
  it("calcula o CRC16-CCITT de um vetor conhecido", () => {
    // Vetor clássico: "123456789" → 0x29B1 (CCITT-FALSE).
    expect(crc16ccitt("123456789")).toBe("29B1");
  });

  it("monta um payload EMV bem-formado com valor e txid", () => {
    const payload = buildPixPayload({
      chave: "pagamentos@obracerta.com.br",
      merchantName: "ObraCerta",
      merchantCity: "Uberlandia",
      valorCentavos: 4900,
      txid: "INV-abc123",
    });

    expect(payload.startsWith("000201")).toBe(true); // Payload Format Indicator
    expect(payload).toContain("br.gov.bcb.pix"); // GUI do arranjo Pix
    expect(payload).toContain("540549.00"); // campo 54 (valor) com 2 casas
    expect(payload).toContain("5802BR"); // país
    expect(payload).toContain("OBRACERTA"); // nome sanitizado (upper)
    expect(payload).toContain("INVabc123"); // txid sem hífen (case preservado)
    expect(payload).toMatch(/6304[0-9A-F]{4}$/); // CRC no fim
  });

  it("CRC do payload confere (recomputável)", () => {
    const payload = buildPixPayload({
      chave: "chave@exemplo.com",
      merchantName: "Loja",
      merchantCity: "SP",
      valorCentavos: 100,
      txid: "T1",
    });
    const body = payload.slice(0, -4);
    const crc = payload.slice(-4);
    expect(crc16ccitt(body)).toBe(crc);
  });

  it("remove acentos e limita tamanho dos campos de texto", () => {
    const payload = buildPixPayload({
      chave: "x@y.com",
      merchantName: "Construções São João Ltda ME",
      merchantCity: "São Paulo",
      valorCentavos: 999,
      txid: "A".repeat(40),
    });
    expect(payload).toContain("CONSTRUCOES SAO JOAO LTDA"); // 25 chars, sem acento
    expect(payload).toContain("SAO PAULO");
    expect(payload).not.toContain("A".repeat(26)); // txid truncado em 25
  });
});
