import type { Config } from "@netlify/functions";
import { randomInt } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../db/index.js";
import { codigos } from "../../db/schema.js";

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function cupon() {
  let s = "";
  for (let i = 0; i < 6; i++) s += ALFABETO[randomInt(ALFABETO.length)];
  return `VB10-${s}`;
}

export default async (req: Request) => {
  const body = await req.json().catch(() => ({}));
  const codigo = String(body.codigo ?? "").trim().toUpperCase().replace(/\s+/g, "");
  const nombre = String(body.nombre ?? "").trim().slice(0, 80);
  const telefono = String(body.telefono ?? "").trim().slice(0, 30);

  if (!codigo) {
    return Response.json({ error: "Escribe el código de tu empaque." }, { status: 400 });
  }

  const [canjeado] = await db
    .update(codigos)
    .set({ canjeadoEn: new Date(), nombre: nombre || null, telefono: telefono || null, cupon: cupon() })
    .where(and(eq(codigos.codigo, codigo), isNull(codigos.canjeadoEn)))
    .returning({ cupon: codigos.cupon });

  if (canjeado) {
    return Response.json({ cupon: canjeado.cupon });
  }

  const [existente] = await db.select({ id: codigos.id }).from(codigos).where(eq(codigos.codigo, codigo));
  return Response.json(
    { error: existente ? "Este código ya fue utilizado." : "El código no es válido. Revisa que esté bien escrito." },
    { status: existente ? 409 : 404 },
  );
};

export const config: Config = {
  path: "/api/canjear",
  method: "POST",
};
