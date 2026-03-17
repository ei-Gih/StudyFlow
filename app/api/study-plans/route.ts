// app/api/study-plans/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createStudyPlanSchema } from "@/lib/validations";
import { ok, created, badRequest, serverError, requireAuth, parsePagination } from "@/lib/utils";

// GET /api/study-plans  → lista todos os planos do usuário autenticado
export async function GET(req: NextRequest) {
  const user = await requireAuth();
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });

  const { skip, take } = parsePagination(req.nextUrl.searchParams);
  const onlyActive = req.nextUrl.searchParams.get("active") === "true";

  try {
    const [plans, total] = await Promise.all([
      prisma.studyPlan.findMany({
        where: {
          userId: user.id,
          ...(onlyActive && { isActive: true }),
        },
        include: {
          modules: {
            include: {
              topics: {
                include: { tasks: { select: { completed: true } } },
              },
            },
            orderBy: { orderIndex: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.studyPlan.count({ where: { userId: user.id } }),
    ]);

    // Calcula progresso dinamicamente para cada plano
    const plansWithProgress = plans.map((plan) => {
      let totalTasks = 0;
      let completedTasks = 0;

      plan.modules.forEach((mod) => {
        mod.topics.forEach((topic) => {
          topic.tasks.forEach((task) => {
            totalTasks++;
            if (task.completed) completedTasks++;
          });
        });
      });

      const progressPct = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

      return { ...plan, progressPct, totalTasks, completedTasks };
    });

    return ok({ plans: plansWithProgress, total });
  } catch {
    return serverError();
  }
}

// POST /api/study-plans  → criar novo plano
export async function POST(req: NextRequest) {
  const user = await requireAuth();
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = createStudyPlanSchema.safeParse(body);

    if (!parsed.success) return badRequest("Dados inválidos", parsed.error.flatten());

    const { title, description, totalHours, deadline } = parsed.data;

    const plan = await prisma.studyPlan.create({
      data: {
        userId: user.id,
        title,
        description,
        totalHours: totalHours ?? 0,
        deadline: deadline ? new Date(deadline) : undefined,
      },
    });

    return created(plan);
  } catch {
    return serverError();
  }
}
