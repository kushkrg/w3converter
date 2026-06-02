import { NextRequest, NextResponse } from "next/server";

const SECURITY_HEADERS = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

// Lightweight Edge-compatible session check (HMAC-SHA256 via Web Crypto).
// The authoritative check happens in requireAdmin() on the Node server.
async function isValidAdminCookie(token: string): Promise<boolean> {
  try {
    const dot     = token.lastIndexOf(".");
    if (dot === -1) return false;
    const payload = token.slice(0, dot);
    const sigB64  = token.slice(dot + 1);

    const secret = process.env["HMAC_SECRET"] ?? "dev-secret";
    const key = await globalThis.crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );

    // base64url → Uint8Array
    const pad     = sigB64.replace(/-/g, "+").replace(/_/g, "/");
    const sigBuf  = Uint8Array.from(atob(pad), (c) => c.charCodeAt(0));
    const valid   = await globalThis.crypto.subtle.verify(
      "HMAC", key, sigBuf, new TextEncoder().encode(payload),
    );
    if (!valid) return false;

    // Check expiry
    const dataPad = payload.replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(dataPad)) as { exp: number };
    return Date.now() < exp;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin route guard ──────────────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      // Already logged in? Send to dashboard
      const token = request.cookies.get("admin_session")?.value;
      if (token && (await isValidAdminCookie(token))) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    } else {
      const token = request.cookies.get("admin_session")?.value;
      if (!token || !(await isValidAdminCookie(token))) {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
    }
  }

  // ── Security headers on all other responses ────────────────────────────────
  const response = NextResponse.next();
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(k, v);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next|_vercel|\\..).*)"],
};
