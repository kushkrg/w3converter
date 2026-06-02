import { createHmac } from "crypto";

const SECRET = process.env["HMAC_SECRET"] ?? "dev-secret";

export function signDownloadUrl(jobId: string, expiresAt: number): string {
  const payload = `${jobId}:${expiresAt}`;
  return createHmac("sha256", SECRET).update(payload).digest("hex");
}

export function verifyDownloadToken(jobId: string, expiresAt: number, token: string): boolean {
  const expected = signDownloadUrl(jobId, expiresAt);
  return expected === token && Date.now() < expiresAt;
}
