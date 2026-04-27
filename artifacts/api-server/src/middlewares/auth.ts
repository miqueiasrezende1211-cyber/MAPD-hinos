import type { NextFunction, Request, Response } from "express";
import { verifyAuthToken, type AuthTokenPayload } from "../lib/token";

declare module "express-serve-static-core" {
  interface Request {
    authUser?: AuthTokenPayload;
  }
}

function parseBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = parseBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const payload = verifyAuthToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.authUser = payload;
  next();
}

export function requireRole(roles: Array<AuthTokenPayload["role"]>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.authUser?.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}
