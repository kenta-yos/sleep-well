import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function verifyToken(token: string, password: string): boolean {
  const dot = token.indexOf(".");
  if (dot === -1) return false;
  const sessionId = token.slice(0, dot);
  const hmac = token.slice(dot + 1);
  const expected = crypto
    .createHmac("sha256", password)
    .update(sessionId)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(hmac, "hex"),
    Buffer.from(expected, "hex")
  );
}

const securityHeaders: [string, string][] = [
  ["X-Content-Type-Options", "nosniff"],
  ["X-Frame-Options", "DENY"],
  ["X-XSS-Protection", "1; mode=block"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ["Permissions-Policy", "camera=(), microphone=(), geolocation=()"],
  [
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  ],
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow login page and auth API
  if (pathname === "/login" || pathname.startsWith("/api/auth")) {
    const res = NextResponse.next();
    for (const [k, v] of securityHeaders) res.headers.set(k, v);
    return res;
  }

  // Allow static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname === "/manifest.json" ||
    pathname === "/favicon.ico" ||
    pathname === "/sw.js"
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    if (!verifyToken(token, process.env.AUTH_PASSWORD!)) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const res = NextResponse.next();
  for (const [k, v] of securityHeaders) res.headers.set(k, v);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
