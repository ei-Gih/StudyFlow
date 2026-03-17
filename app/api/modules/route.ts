// ═══════════════════════════════════════════════════════════════
// app/api/modules/route.ts
// ═══════════════════════════════════════════════════════════════
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createModuleSchema, updateModuleSchema } from "@/lib/validations";
import { ok, created, badRequest, unauthorized, forbidden, notFound, noContent, serverError, requireAuth } from "@/lib/utils";

// GET /api/modules?studyPlanId=xxx
export async function GET(req: NextRequest) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  const studyPlanId = req.nextUrl.searchParams.get("studyPlanId");
  if (!studyPlanId) return badRequest("studyPlanId é obrigatório");

  try {
    // Verifica ownership do plano
    const plan = await prisma.studyPlan.findUnique({ where: { id: studyPlanId } });
    if (!plan) return notFound("Plano não encontrado");
    if (plan.userId !== user.id) return forbidden();

    const modules = await prisma.module.findMany({
      where: { studyPlanId },
      include: {
        topics: {
          include: { tasks: { select: { id: true, completed: true } } },
          orderBy: { orderIndex: "asc" },
        },
      },
      orderBy: { orderIndex: "asc" },
    });

    return ok(modules);
  } catch {
    return serverError();
  }
}

// POST /api/modules
export async function POST(req: NextRequest) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  try {
    const body = await req.json();
    const parsed = createModuleSchema.safeParse(body);
    if (!parsed.success) return badRequest("Dados inválidos", parsed.error.flatten());

    const { studyPlanId, title, description, orderIndex } = parsed.data;

    const plan = await prisma.studyPlan.findUnique({ where: { id: studyPlanId } });
    if (!plan) return notFound("Plano não encontrado");
    if (plan.userId !== user.id) return forbidden();

    // Auto-incrementa orderIndex se não fornecido
    const lastModule = await prisma.module.findFirst({
      where: { studyPlanId },
      orderBy: { orderIndex: "desc" },
    });
    const nextIndex = orderIndex ?? (lastModule ? lastModule.orderIndex + 1 : 0);

    const module = await prisma.module.create({
      data: { studyPlanId, title, description, orderIndex: nextIndex },
    });

    return created(module);
  } catch {
    return serverError();
  }
}
