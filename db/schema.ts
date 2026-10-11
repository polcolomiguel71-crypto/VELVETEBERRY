import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const codigos = pgTable("codigos", {
  id: serial().primaryKey(),
  codigo: text().notNull().unique(),
  producto: text().notNull().default("zarzamoras"),
  lote: text().notNull().default(""),
  creadoEn: timestamp("creado_en").defaultNow().notNull(),
  canjeadoEn: timestamp("canjeado_en"),
  nombre: text(),
  telefono: text(),
  cupon: text().unique(),
});
