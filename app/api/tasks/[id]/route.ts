// app/api/tasks/[id]/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateTaskSchema } from "@/lib/validations";
import { ok, noContent, badRequest, unauthorized, forbidden, notFound, serverError, requireAuth } from "@/lib/utils";
import { awardXP } from "@/lib/gamification";

// PATCH /api/tasks/:id  → atualizar / marcar como concluída
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  try {
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        topic: {
          include: {
            module: {
              include: { studyPlan: { select: { userId: true } } },
            },
          },
        },
      },
    });

    if (!task) return notFound();
    if (task.topic.module.studyPlan.userId !== user.id) return forbidden();

    const body = await req.json();
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) return badRequest("Dados inválidos", parsed.error.flatten());

    const wasCompleted = task.completed;
    const willComplete = parsed.data.completed === true;

    const updated = await prisma.$transaction(async (tx) => {
      const updatedTask = await tx.task.update({
        where: { id: params.id },
        data: {
          ...parsed.data,
          ...(willComplete && !wasCompleted && { completedAt: new Date() }),
          ...(parsed.data.completed === false && { completedAt: null }),
        },
      });

      // Concede XP ao completar pela primeira vez
      if (willComplete && !wasCompleted) {
        await awardXP(tx, user.id, 10, "task_complete");
      }

      return updatedTask;
    });

    return ok(updated);
  } catch {
    return serverError();
  }
}

// DELETE /api/tasks/:id
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  try {
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        topic: {
          include: { module: { include: { studyPlan: { select: { userId: true } } } } },
        },
      },
    });

    if (!task) return notFound();
    if (task.topic.module.studyPlan.userId !== user.id) return forbidden();

    await prisma.task.delete({ where: { id: params.id } });
    return noContent();
  } catch {
    return serverError();
  }
}
