import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

type VerifiedUser = {
  sub: string;
  email?: string;
  payload: JWTPayload;
};

function getAuth0Issuer() {
  const domain =
    process.env.AUTH0_ISSUER_BASE_URL ||
    process.env.AUTH0_DOMAIN ||
    process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
  if (!domain) return null;
  if (domain.startsWith("http://") || domain.startsWith("https://")) {
    return domain.replace(/\/+$/, "");
  }
  return `https://${domain.replace(/\/+$/, "")}`;
}

function getAudience() {
  return process.env.AUTH0_AUDIENCE || process.env.NEXT_PUBLIC_AUTH0_AUDIENCE || undefined;
}

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getJwks(issuer: string) {
  const existing = jwksCache.get(issuer);
  if (existing) return existing;
  const set = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
  jwksCache.set(issuer, set);
  return set;
}

export async function verifyAuth0Jwt(token: string): Promise<VerifiedUser | null> {
  const issuer = getAuth0Issuer();
  if (!issuer || !token) return null;

  try {
    const result = await jwtVerify(token, getJwks(issuer), {
      issuer,
      audience: getAudience(),
    });

    const payload = result.payload;
    const sub = typeof payload.sub === "string" ? payload.sub : "";
    if (!sub) return null;

    return {
      sub,
      email: typeof payload.email === "string" ? payload.email : undefined,
      payload,
    };
  } catch (error) {
    console.warn("Auth0 JWT verification failed:", error);
    return null;
  }
}

