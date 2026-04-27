import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { hinosTable } from "./hinos";

export const cifrasTable = pgTable("cifras", {
  hinoNumero: integer("hino_numero")
    .primaryKey()
    .references(() => hinosTable.numero, { onDelete: "cascade" }),
  conteudo: text("conteudo").notNull(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertCifraSchema = createInsertSchema(cifrasTable).omit({
  atualizadoEm: true,
});
export const selectCifraSchema = createSelectSchema(cifrasTable);

export type InsertCifra = z.infer<typeof insertCifraSchema>;
export type Cifra = typeof cifrasTable.$inferSelect;