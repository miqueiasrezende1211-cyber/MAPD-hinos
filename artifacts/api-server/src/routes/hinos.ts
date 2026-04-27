import { Router, type IRouter } from "express";
import { eq, ilike, or, sql } from "drizzle-orm";
import { db, cifrasTable, hinosTable } from "@workspace/db";
import { z } from "zod/v4";
import { requireAuth, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

const hinoBodySchema = z.object({
  numero: z.number().int().positive(),
  titulo: z.string().trim().min(1).max(300),
  letra: z.string().trim().min(1),
  tom: z.string().trim().min(1).max(20).nullable().optional(),
  tipo: z.string().trim().min(1).max(80).nullable().optional(),
  possuiCifra: z.boolean().optional(),
});

const cifraBodySchema = z.object({
  conteudo: z.string().trim().min(1),
});

router.get("/hinos", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const num = Number(q);

  let where: ReturnType<typeof or> | undefined = undefined;

  if (q.length > 0) {
    const conditions = [ilike(hinosTable.titulo, `%${q}%`), ilike(hinosTable.letra, `%${q}%`)];
    if (Number.isFinite(num)) {
      conditions.unshift(eq(hinosTable.numero, num));
    }
    where = or(...conditions);
  }

  const rows = await db
    .select({
      numero: hinosTable.numero,
      titulo: hinosTable.titulo,
      letra: hinosTable.letra,
      tom: hinosTable.tom,
      tipo: hinosTable.tipo,
      possuiCifra: hinosTable.possuiCifra,
    })
    .from(hinosTable)
    .where(where)
    .orderBy(hinosTable.numero);

  return res.json({ items: rows });
});

router.get("/hinos/:numero", async (req, res) => {
  const numero = Number(req.params.numero);
  if (!Number.isInteger(numero) || numero <= 0) {
    return res.status(400).json({ error: "Invalid hino number" });
  }

  const [row] = await db
    .select({
      numero: hinosTable.numero,
      titulo: hinosTable.titulo,
      letra: hinosTable.letra,
      tom: hinosTable.tom,
      tipo: hinosTable.tipo,
      possuiCifra: hinosTable.possuiCifra,
      cifra: cifrasTable.conteudo,
    })
    .from(hinosTable)
    .leftJoin(cifrasTable, eq(cifrasTable.hinoNumero, hinosTable.numero))
    .where(eq(hinosTable.numero, numero))
    .limit(1);

  if (!row) {
    return res.status(404).json({ error: "Hino not found" });
  }
  return res.json({ item: row });
});

router.get("/hinos/:numero/cifra", async (req, res) => {
  const numero = Number(req.params.numero);
  if (!Number.isInteger(numero) || numero <= 0) {
    return res.status(400).json({ error: "Invalid hino number" });
  }

  const [row] = await db
    .select()
    .from(cifrasTable)
    .where(eq(cifrasTable.hinoNumero, numero))
    .limit(1);

  if (!row) {
    return res.status(404).json({ error: "Cifra not found" });
  }
  return res.json({ item: row });
});

router.post(
  "/hinos",
  requireAuth,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    const parsed = hinoBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const body = parsed.data;
    try {
      const [created] = await db
        .insert(hinosTable)
        .values({
          numero: body.numero,
          titulo: body.titulo,
          letra: body.letra,
          tom: body.tom ?? null,
          tipo: body.tipo ?? null,
          possuiCifra: body.possuiCifra ?? false,
        })
        .returning();

      return res.status(201).json({ item: created });
    } catch {
      return res
        .status(409)
        .json({ error: "Unable to create hino (number may already exist)" });
    }
  },
);

router.put(
  "/hinos/:numero",
  requireAuth,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    const numero = Number(req.params.numero);
    if (!Number.isInteger(numero) || numero <= 0) {
      return res.status(400).json({ error: "Invalid hino number" });
    }

    const parsed = hinoBodySchema.omit({ numero: true }).safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const body = parsed.data;
    const [saved] = await db
      .insert(hinosTable)
      .values({
        numero,
        titulo: body.titulo,
        letra: body.letra,
        tom: body.tom ?? null,
        tipo: body.tipo ?? null,
        possuiCifra: body.possuiCifra ?? false,
      })
      .onConflictDoUpdate({
        target: hinosTable.numero,
        set: {
          titulo: body.titulo,
          letra: body.letra,
          tom: body.tom ?? null,
          tipo: body.tipo ?? null,
          possuiCifra: body.possuiCifra ?? false,
        },
      })
      .returning();

    return res.json({ item: saved });
  },
);

router.delete(
  "/hinos/:numero",
  requireAuth,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    const numero = Number(req.params.numero);
    if (!Number.isInteger(numero) || numero <= 0) {
      return res.status(400).json({ error: "Invalid hino number" });
    }

    const deleted = await db
      .delete(hinosTable)
      .where(eq(hinosTable.numero, numero))
      .returning({ numero: hinosTable.numero });

    if (deleted.length === 0) {
      return res.status(404).json({ error: "Hino not found" });
    }
    return res.status(204).send();
  },
);

router.put(
  "/hinos/:numero/cifra",
  requireAuth,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    const numero = Number(req.params.numero);
    if (!Number.isInteger(numero) || numero <= 0) {
      return res.status(400).json({ error: "Invalid hino number" });
    }

    const parsed = cifraBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const [exists] = await db
      .select({ numero: hinosTable.numero })
      .from(hinosTable)
      .where(eq(hinosTable.numero, numero))
      .limit(1);
    if (!exists) {
      return res.status(404).json({ error: "Hino not found" });
    }

    const [saved] = await db
      .insert(cifrasTable)
      .values({ hinoNumero: numero, conteudo: parsed.data.conteudo })
      .onConflictDoUpdate({
        target: cifrasTable.hinoNumero,
        set: {
          conteudo: parsed.data.conteudo,
          atualizadoEm: sql`NOW()`,
        },
      })
      .returning();

    await db
      .update(hinosTable)
      .set({ possuiCifra: true })
      .where(eq(hinosTable.numero, numero));

    return res.json({ item: saved });
  },
);

router.delete(
  "/hinos/:numero/cifra",
  requireAuth,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    const numero = Number(req.params.numero);
    if (!Number.isInteger(numero) || numero <= 0) {
      return res.status(400).json({ error: "Invalid hino number" });
    }

    const deleted = await db
      .delete(cifrasTable)
      .where(eq(cifrasTable.hinoNumero, numero))
      .returning({ hinoNumero: cifrasTable.hinoNumero });

    if (deleted.length === 0) {
      return res.status(404).json({ error: "Cifra not found" });
    }

    const [remaining] = await db
      .select({ hasCifra: cifrasTable.hinoNumero })
      .from(cifrasTable)
      .where(eq(cifrasTable.hinoNumero, numero))
      .limit(1);

    if (!remaining) {
      await db
        .update(hinosTable)
        .set({ possuiCifra: false })
        .where(eq(hinosTable.numero, numero));
    }

    return res.status(204).send();
  },
);

export default router;
