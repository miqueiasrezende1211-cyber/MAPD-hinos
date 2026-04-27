import crypto from "node:crypto";

export type AuthTokenPayload = {
  sub: string;
  email: string;
  role: "admin" | "editor";
  exp: number;
};

const secret = process.env.AUTH_SECRET ?? "dev-auth-secret-change-in-production";

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function sign(data: string): string {
  return b64url(crypto.createHmac("sha256", secret).update(data).digest());
}

export function createAuthToken(
  payload: Omit<AuthTokenPayload, "exp">,
  expiresInSeconds = 60 * 60 * 12,
): string {
  const fullPayload: AuthTokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };
  const encodedPayload = b64url(JSON.stringify(fullPayload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expected = sign(encodedPayload);
  const sigA = Buffer.from(signature);
  const sigB = Buffer.from(expected);
  if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
    return null;
  }

  try {
    const json = Buffer.from(
      encodedPayload.replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    ).toString("utf8");
    const payload = JSON.parse(json) as AuthTokenPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    if (!payload.sub || !payload.email || !payload.role) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
