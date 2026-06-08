import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

/**
 * Hash de senha com `scrypt` (node:crypto) — sem dependência externa. Formato do
 * hash armazenado: `scrypt$N$<saltHex>$<derivedHex>`, onde `N` é o custo de CPU.
 *
 * Domínio puro (sem framework/ORM): recebe/devolve strings. A verificação usa
 * comparação em tempo constante (`timingSafeEqual`) para evitar timing attacks.
 */

const KEY_LENGTH = 64;
const COST = 16_384; // 2^14 — equilíbrio custo/segurança para login interativo
const SALT_BYTES = 16;
const ALGO = "scrypt";

/** Wrapper tipado do `scrypt` baseado em callback → Promise<Buffer>. */
function deriveKey(plain: string, salt: Buffer, keyLength: number, cost: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(plain, salt, keyLength, { N: cost }, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

/** Deriva o hash de uma senha em texto puro. */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derived = await deriveKey(plain, salt, KEY_LENGTH, COST);
  return `${ALGO}$${COST}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

/** Verifica uma senha contra um hash previamente derivado (custo lido do próprio hash). */
export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== ALGO) return false;

  const cost = Number(parts[1]);
  const salt = Buffer.from(parts[2]!, "hex");
  const expected = Buffer.from(parts[3]!, "hex");
  if (!Number.isInteger(cost) || cost < 2 || salt.length === 0 || expected.length === 0) return false;

  const derived = await deriveKey(plain, salt, expected.length, cost);
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}
