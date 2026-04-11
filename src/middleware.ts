import { NextRequest, NextResponse } from "next/server";
import { verifyAuth0Jwt } from "@/lib/auth0-jwt";

const PUBLIC_API_PREFIXES = ["/api/auth/login", "/api/auth/signup"];

function isPublicApi(pathname: string) {
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function decodeJwtPayload(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    if (!payload || typeof payload !== "object") return null;
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (isPublicApi(pathname)) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!bearer) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let userId = "";
  let userEmail = "";

  const verified = await verifyAuth0Jwt(bearer);
  if (verified) {
    userId = verified.sub;
    userEmail = verified.email || "";
  } else {
    // Compatibility fallback for Supabase-issued JWTs when Auth0 verification doesn't apply.
    const payload = decodeJwtPayload(bearer);
    const sub = typeof payload?.sub === "string" ? payload.sub : "";
    if (sub) {
      userId = sub;
      userEmail = typeof payload?.email === "string" ? payload.email : "";
    }
  }

  if (!userId) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", userId);
  if (userEmail) requestHeaders.set("x-user-email", userEmail);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/api/:path*"],
};
