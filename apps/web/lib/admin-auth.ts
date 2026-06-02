import { createHmac, timingSafeEqual, pbkdf2Sync, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./db";

const SECRET       = process.env["HMAC_SECRET"] ?? "dev-secret";
const ADMIN_EMAIL  = process.env["ADMIN_EMAIL"]  ?? "admin@example.com";
const ADMIN_PASS   = process.env["ADMIN_PASSWORD"] ?? "admin";
const COOKIE_NAME  = "admin_session";
const TTL_MS       = 24 * 60 * 60 * 1000; // 24 h

// ── Token helpers (Node crypto — used in server components / actions) ─────────

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

function makeToken(email: string): string {
  const data    = JSON.stringify({ email, exp: Date.now() + TTL_MS });
  const payload = Buffer.from(data).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function parseToken(token: string): { email: string; exp: number } | null {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  const payload = token.slice(0, dot);
  const sig     = token.slice(dot + 1);
  const expected = sign(payload);
  try {
    if (!timingSafeEqual(Buffer.from(sig, "base64url"), Buffer.from(expected, "base64url")))
      return null;
    const { email, exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (Date.now() > exp) return null;
    return { email, exp };
  } catch {
    return null;
  }
}

// ── Cryptographic Hashing Helpers ─────────────────────────────────────────────

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;
  const [salt, hash] = parts;
  if (!salt || !hash) return false;
  const verifyHash = pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(verifyHash, "hex"));
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function createSession(email: string, password: string): Promise<boolean> {
  const emailRow = await prisma.settings.findUnique({ where: { key: "admin.email" } });
  const passHashRow = await prisma.settings.findUnique({ where: { key: "admin.passwordHash" } });

  const targetEmail = emailRow?.value || ADMIN_EMAIL;
  let isValid = false;

  if (passHashRow?.value) {
    // Dynamic database-backed hashed credentials
    isValid = email === targetEmail && verifyPassword(password, passHashRow.value);
  } else {
    // Fallback/First-login env credentials
    isValid = email === targetEmail && password === ADMIN_PASS;

    // Secure database storage instantly on successful first login!
    if (isValid) {
      const hash = hashPassword(password);
      await prisma.settings.upsert({
        where: { key: "admin.passwordHash" },
        create: { key: "admin.passwordHash", value: hash },
        update: { value: hash },
      });
      await prisma.settings.upsert({
        where: { key: "admin.email" },
        create: { key: "admin.email", value: email },
        update: { value: email },
      });
    }
  }

  if (!isValid) return false;

  const jar = await cookies();
  jar.set(COOKIE_NAME, makeToken(email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: TTL_MS / 1000,
    path: "/",
  });
  return true;
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function requireAdmin(): Promise<{ email: string }> {
  const jar   = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  const sess  = token ? parseToken(token) : null;
  if (!sess) redirect("/admin/login");

  // Verify the email in the token is still the active admin email
  const emailRow = await prisma.settings.findUnique({ where: { key: "admin.email" } });
  const currentEmail = emailRow?.value || ADMIN_EMAIL;
  if (sess.email !== currentEmail) {
    jar.delete(COOKIE_NAME);
    redirect("/admin/login");
  }

  return { email: sess.email };
}

// Used by middleware (receives raw cookie string, returns boolean synchronously)
export function verifyTokenSync(token: string | undefined): boolean {
  if (!token) return false;
  return parseToken(token) !== null;
}
