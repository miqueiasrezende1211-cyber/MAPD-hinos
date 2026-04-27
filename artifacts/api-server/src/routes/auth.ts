import { Router, type IRouter } from "express";
import { db, usuariosTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod/v4";
import { createAuthToken } from "../lib/token";
import { hashPassword, verifyPassword } from "../lib/password";
import { requireAuth, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

const loginBodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  senha: z.string().min(1),
});

const createUserBodySchema = z.object({
  nome: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  senha: z.string().min(8).max(200),
  papel: z.enum(["admin", "editor"]).default("editor"),
});

router.post("/auth/login", async (req, res) => {
  const parsed = loginBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const { email, senha } = parsed.data;
  const [usuario] = await db
    .select()
    .from(usuariosTable)
    .where(and(eq(usuariosTable.email, email), eq(usuariosTable.ativo, true)))
    .limit(1);

  if (!usuario || !verifyPassword(senha, usuario.senhaHash)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = createAuthToken({
    sub: usuario.id,
    email: usuario.email,
    role: usuario.papel,
  });

  return res.json({
    token,
    user: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      papel: usuario.papel,
    },
  });
});

router.get("/auth/me", requireAuth, (req, res) => {
  const user = req.authUser;
  return res.json({ user });
});

router.post(
  "/auth/users",
  requireAuth,
  requireRole(["admin"]),
  async (req, res) => {
    const parsed = createUserBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const { nome, email, senha, papel } = parsed.data;
    const senhaHash = hashPassword(senha);

    try {
      const [created] = await db
        .insert(usuariosTable)
        .values({
          nome,
          email,
          senhaHash,
          papel,
          ativo: true,
        })
        .returning({
          id: usuariosTable.id,
          nome: usuariosTable.nome,
          email: usuariosTable.email,
          papel: usuariosTable.papel,
        });

      return res.status(201).json({ user: created });
    } catch {
      return res
        .status(409)
        .json({ error: "Unable to create user (email may already exist)" });
    }
  },
);

export default router;
