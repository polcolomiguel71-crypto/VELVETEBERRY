import type { Config } from "@netlify/functions";
import { randomInt } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../db/index.js";
import { codigos } from "../../db/schema.js";

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// Premios posibles; "peso" indica qué tan seguido sale cada uno.
const PREMIOS = [
  { prefijo: "VB10", peso: 30, titulo: "¡Ganaste 10% de descuento en tu siguiente compra!" },
  { prefijo: "VB15", peso: 15, titulo: "¡Ganaste 15% de descuento en tu siguiente compra!" },
  { prefijo: "VB20", peso: 8, titulo: "¡Ganaste 20% de descuento en tu siguiente compra!" },
  { prefijo: "VB2X", peso: 10, titulo: "¡Ganaste un 2x1 en zarzamoras VelveteBerry!" },
  { prefijo: "VBFR", peso: 13, titulo: "¡Te ganaste unas fresas VelveteBerry!" },
  { prefijo: "VBME", peso: 12, titulo: "¡Te ganaste una mermelada de zarzamora!" },
  { prefijo: "VBCA", peso: 12, titulo: "¡Te ganaste una cajita extra de zarzamoras!" },
];

function premioAlAzar() {
  const total = PREMIOS.reduce((suma, p) => suma + p.peso, 0);
  let n = randomInt(total);
  for (const p of PREMIOS) {
    if (n < p.peso) return p;
    n -= p.peso;
  }
  return PREMIOS[0];
}

function cupon(prefijo: string) {
  let s = "";
  for (let i = 0; i < 6; i++) s += ALFABETO[randomInt(ALFABETO.length)];
  return `${prefijo}-${s}`;
}

export default async (req: Request) => {
  const body = await req.json().catch(() => ({}));
  const codigo = String(body.codigo ?? "").trim().toUpperCase().replace(/\s+/g, "");
  const nombre = String(body.nombre ?? "").trim().slice(0, 80);
  const telefono = String(body.telefono ?? "").trim().slice(0, 30);

  if (!codigo) {
    return Response.json({ error: "Escribe el código de tu empaque." }, { status: 400 });
  }

  const premio = premioAlAzar();
  const [canjeado] = await db
    .update(codigos)
    .set({
      canjeadoEn: new Date(),
      nombre: nombre || null,
      telefono: telefono || null,
      cupon: cupon(premio.prefijo),
      premio: premio.titulo,
    })
    .where(and(eq(codigos.codigo, codigo), isNull(codigos.canjeadoEn)))
    .returning({ cupon: codigos.cupon, premio: codigos.premio });

  if (canjeado) {
    return Response.json({ cupon: canjeado.cupon, premio: canjeado.premio });
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
