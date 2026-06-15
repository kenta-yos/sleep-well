import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (password !== process.env.AUTH_PASSWORD) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const sessionId = crypto.randomBytes(32).toString("hex");
  const hmac = crypto
    .createHmac("sha256", process.env.AUTH_PASSWORD!)
    .update(sessionId)
    .digest("hex");
  const token = `${sessionId}.${hmac}`;

  const cookieStore = await cookies();
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 14, // 14 days
    path: "/",
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  return NextResponse.json({ ok: true });
}
