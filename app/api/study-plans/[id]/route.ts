// app/api/study-plans/[id]/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateStudyPlanSchema } from "@/lib/validations";
import {
  ok, noContent, badRequest, unauthorized, forbidden,
  notFound, serverError, requireAuth,
} from "@/lib/utils";

async function getOwnedPlan(id: string, userId: string) {
  const plan = await prisma.studyPlan.findUnique({ where: { id } });
  if (!plan) return { plan: null, error: notFound() };
  if (plan.userId !== userId) return { plan: null, error: forbidden() };
  return { plan, error: null };
}

// GET /api/study-plans/:id  → plano completo com módulos, tópicos e tarefas
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  try {
    const plan = await prisma.studyPlan.findUnique({
      where: { id: params.id },
      include: {
        modules: {
          include: {
            topics: {
              include: {
                tasks: { orderBy: { orderIndex: "asc" } },
              },
              orderBy: { orderIndex: "asc" },
            },
          },
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!plan) return notFound();
    if (plan.userId !== user.id) return forbidden();

    // Calcula progresso por módulo e global
    const modulesWithProgress = plan.modules.map((mod) => {
      const allTasks = mod.topics.flatMap((t) => t.tasks);
      const completedTasks = allTasks.filter((t) => t.completed).length;
      const totalTasks = allTasks.length;
      return {
        ...mod,
        progressPct: totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
        totalTasks,
        completedTasks,
      };
    });

    const allTasks = modulesWithProgress.flatMap((m) => m.topics.flatMap((t) => t.tasks));
    const globalProgress =
      allTasks.length === 0
        ? 0
        : Math.round((allTasks.filter((t) => t.completed).length / allTasks.length) * 100);

    return ok({ ...plan, modules: modulesWithProgress, globalProgress });
  } catch {
    return serverError();
  }
}

// PATCH /api/study-plans/:id  → atualizar plano
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  try {
    const { plan, error } = await getOwnedPlan(params.id, user.id);
    if (error) return error;

    const body = await req.json();
    const parsed = updateStudyPlanSchema.safeParse(body);
    if (!parsed.success) return badRequest("Dados inválidos", parsed.error.flatten());

    const { title, description, totalHours, deadline, isActive } = parsed.data;

    const updated = await prisma.studyPlan.update({
      where: { id: plan!.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(totalHours !== undefined && { totalHours }),
        ...(deadline !== undefined && { deadline: new Date(deadline) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return ok(updated);
  } catch {
    return serverError();
  }
}

// DELETE /api/study-plans/:id  → deletar plano (cascade via Prisma)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  try {
    const { error } = await getOwnedPlan(params.id, user.id);
    if (error) return error;

    await prisma.studyPlan.delete({ where: { id: params.id } });
    return noContent();
  } catch {
    return serverError();
  }
}
