// app/api/tasks/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTaskSchema } from "@/lib/validations";
import { ok, created, badRequest, unauthorized, forbidden, notFound, serverError, requireAuth } from "@/lib/utils";

// GET /api/tasks?topicId=xxx
export async function GET(req: NextRequest) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  const topicId = req.nextUrl.searchParams.get("topicId");
  if (!topicId) return badRequest("topicId é obrigatório");

  try {
    // Verifica ownership via join
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: { module: { include: { studyPlan: { select: { userId: true } } } } },
    });
    if (!topic) return notFound();
    if (topic.module.studyPlan.userId !== user.id) return forbidden();

    const tasks = await prisma.task.findMany({
      where: { topicId },
      orderBy: { orderIndex: "asc" },
    });

    return ok(tasks);
  } catch {
    return serverError();
  }
}

// POST /api/tasks
export async function POST(req: NextRequest) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  try {
    const body = await req.json();
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) return badRequest("Dados inválidos", parsed.error.flatten());

    const { topicId, description, estimatedMin, orderIndex } = parsed.data;

    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: { module: { include: { studyPlan: { select: { userId: true } } } } },
    });
    if (!topic) return notFound("Tópico não encontrado");
    if (topic.module.studyPlan.userId !== user.id) return forbidden();

    const lastTask = await prisma.task.findFirst({
      where: { topicId },
      orderBy: { orderIndex: "desc" },
    });
    const nextIndex = orderIndex ?? (lastTask ? lastTask.orderIndex + 1 : 0);

    const task = await prisma.task.create({
      data: { topicId, description, estimatedMin: estimatedMin ?? 15, orderIndex: nextIndex },
    });

    return created(task);
  } catch {
    return serverError();
  }
}
