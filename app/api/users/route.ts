// app/api/users/route.ts
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { ok, created, badRequest, serverError, requireAuth } from "@/lib/utils";

// GET /api/users  → perfil do usuário autenticado + stats
export async function GET() {
  const user = await requireAuth();
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });

  try {
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
        stats: true,
      },
    });

    return ok(profile);
  } catch {
    return serverError();
  }
}

// POST /api/users  → cadastro de novo usuário
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Dados inválidos", parsed.error.flatten());
    }

    const { name, email, password } = parsed.data;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return badRequest("Este e-mail já está cadastrado");

    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { name, email, passwordHash },
      });

      // Cria stats iniciais junto com o usuário
      await tx.userStats.create({
        data: { userId: created.id },
      });

      return created;
    });

    return created({ id: newUser.id, name: newUser.name, email: newUser.email });
  } catch {
    return serverError();
  }
}
