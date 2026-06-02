import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALG = "aes-256-gcm";

function getKey(): Buffer {
  const raw = process.env.SETTINGS_ENCRYPTION_KEY ?? "";
  const buf = Buffer.from(raw, "hex");
  if (buf.length !== 32) throw new Error("SETTINGS_ENCRYPTION_KEY must be 32 bytes (64 hex chars)");
  return buf;
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv  = randomBytes(12);
  const cipher = createCipheriv(ALG, key, iv);
  const enc  = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag  = cipher.getAuthTag();
  // format: iv(24) + "." + tag(32) + "." + ciphertext(hex)
  return `${iv.toString("hex")}.${tag.toString("hex")}.${enc.toString("hex")}`;
}

export function decrypt(encoded: string): string {
  const parts = encoded.split(".");
  if (parts.length !== 3) throw new Error("Invalid encrypted format");
  const [ivHex, tagHex, encHex] = parts as [string, string, string];
  const key    = getKey();
  const iv     = Buffer.from(ivHex,  "hex");
  const tag    = Buffer.from(tagHex, "hex");
  const encBuf = Buffer.from(encHex, "hex");
  const decipher = createDecipheriv(ALG, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encBuf).toString("utf8") + decipher.final("utf8");
}
