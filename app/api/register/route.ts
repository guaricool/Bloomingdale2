/**
 * POST /api/register
 * Body: { name: string, email: string, password: string }
 *
 * Creates a new User. The very first user registered becomes role=admin;
 * everyone after that defaults to role=member. A matching Member record
 * is also created with firstName/lastName derived from `name`.
 */
import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getDb } from "@/lib/db";

const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(120),
  email: z.string().email("Correo electrónico no válido").max(200),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(200),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();
  const db = getDb();

  // Reject duplicate email
  const existing = await db
    .prepare(`SELECT id FROM "User" WHERE email = ?`)
    .get(normalizedEmail);
  if (existing) {
    return NextResponse.json(
      { error: "Ya existe una cuenta con ese correo electrónico" },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // First user wins admin; everyone else is member.
  const userCountRow = (await db
    .prepare(`SELECT COUNT(*) AS c FROM "User"`)
    .get()) as { c: number };
  const isFirstUser = userCountRow.c === 0;
  const role: "admin" | "member" = isFirstUser ? "admin" : "member";

  // Split name into first/last (best-effort). Empty lastName is allowed (e.g. single given name).
  const parts = name.trim().split(/\s+/);
  const firstName = parts[0] ?? name.trim();
  const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "—";

  const tx = db.transaction(async () => {
    const memberRows = await db
      .prepare(`INSERT INTO "Member" (firstName, lastName) VALUES (?, ?) RETURNING id`)
      .all(firstName, lastName);
    const memberId = (memberRows[0] as { id: number }).id;

    await db.prepare(
      `INSERT INTO "User" (email, passwordHash, role, memberId) VALUES (?, ?, ?, ?)`,
    ).run(normalizedEmail, passwordHash, role, memberId);

    return memberId;
  });

  const memberId = await tx();

  return NextResponse.json(
    {
      ok: true,
      user: {
        email: normalizedEmail,
        role,
        memberId,
        isFirstUser,
      },
    },
    { status: 201 },
  );
}
