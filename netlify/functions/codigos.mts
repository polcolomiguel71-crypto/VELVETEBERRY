import type { Config } from "@netlify/functions";
import { randomInt, timingSafeEqual } from "node:crypto";
import { desc } from "drizzle-orm";
import { db } from "../../db/index.js";
import { codigos } from "../../db/schema.js";

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function bloque(n: number) {
  let s = "";
  for (let i = 0; i < n; i++) s += ALFABETO[randomInt(ALFABETO.length)];
  return s;
}

function autorizado(req: Request) {
  const esperado = Netlify.env.get("ADMIN_PASSWORD");
  const recibido = req.headers.get("x-admin-password") ?? "";
  if (!esperado) return false;
  const a = Buffer.from(esperado);
  const b = Buffer.from(recibido);
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async (req: Request) => {
  if (!Netlify.env.get("ADMIN_PASSWORD")) {
    return Response.json(
      { error: "Falta configurar la variable ADMIN_PASSWORD en Netlify." },
      { status: 503 },
    );
  }
  if (!autorizado(req)) {
    return Response.json({ error: "Contraseña incorrecta." }, { status: 401 });
  }

  if (req.method === "GET") {
    const lista = await db.select().from(codigos).orderBy(desc(codigos.creadoEn)).limit(500);
    return Response.json(lista);
  }

  if (req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    const cantidad = Math.min(Math.max(parseInt(body.cantidad, 10) || 1, 1), 200);
    const lote = String(body.lote ?? "").trim().slice(0, 40);
    const nuevos = Array.from({ length: cantidad }, () => ({
      codigo: `ZAR-${bloque(4)}-${bloque(4)}`,
      producto: "zarzamoras",
      lote,
    }));
    const creados = await db.insert(codigos).values(nuevos).onConflictDoNothing().returning();
    return Response.json(creados, { status: 201 });
  }

  return new Response("Método no permitido", { status: 405 });
};

export const config: Config = {
  path: "/api/codigos",
  method: ["GET", "POST"],
};
