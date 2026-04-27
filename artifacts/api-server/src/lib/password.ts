import crypto from "node:crypto";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, expectedHash] = stored.split(":");

  // Legacy fallback: accept plain-text rows created before hashing was enforced.
  if (!salt || !expectedHash) {
    const a = Buffer.from(String(stored), "utf8");
    const b = Buffer.from(String(password), "utf8");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  try {
    const actualHash = crypto.scryptSync(password, salt, 64).toString("hex");
    const expected = Buffer.from(expectedHash, "hex");
    const actual = Buffer.from(actualHash, "hex");
    if (expected.length !== actual.length) return false;
    return crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
