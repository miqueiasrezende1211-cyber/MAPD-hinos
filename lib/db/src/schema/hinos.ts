import { boolean, integer, pgTable, text } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const hinosTable = pgTable("hinos", {
  numero: integer("numero").primaryKey(),
  titulo: text("titulo").notNull(),
  letra: text("letra").notNull(),
  tom: text("tom"),
  tipo: text("tipo"),
  possuiCifra: boolean("possui_cifra").notNull().default(false),
});

export const insertHinoSchema = createInsertSchema(hinosTable);
export const selectHinoSchema = createSelectSchema(hinosTable);

export type InsertHino = z.infer<typeof insertHinoSchema>;
export type Hino = typeof hinosTable.$inferSelect;