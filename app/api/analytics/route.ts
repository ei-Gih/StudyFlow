// app/api/analytics/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, serverError, requireAuth, startOfDay, addDays } from "@/lib/utils";

// GET /api/analytics?range=7|30|90
// Retorna todas as métricas necessárias para o dashboard de analytics
export async function GET(req: NextRequest) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  const range = Math.min(90, Math.max(1, Number(req.nextUrl.searchParams.get("range") ?? 7)));
  const since = startOfDay(addDays(new Date(), -range + 1));

  try {
    const [
      studySessions,
      pomodoroSessions,
      tasks,
      flashcardReviews,
      userStats,
      studyPlans,
    ] = await Promise.all([
      // Sessões de estudo no período
      prisma.studySession.findMany({
        where: { userId: user.id, startedAt: { gte: since } },
        select: { durationMin: true, startedAt: true },
        orderBy: { startedAt: "asc" },
      }),

      // Sessões pomodoro no período
      prisma.pomodoroSession.findMany({
        where: { userId: user.id, date: { gte: since }, completed: true },
        select: { cycles: true, focusMin: true, date: true },
        orderBy: { date: "asc" },
      }),

      // Tarefas concluídas no período
      prisma.task.findMany({
        where: {
          topic: { module: { studyPlan: { userId: user.id } } },
          completed: true,
          completedAt: { gte: since },
        },
        select: { completedAt: true },
        orderBy: { completedAt: "asc" },
      }),

      // Revisões de flashcard no período
      prisma.review.findMany({
        where: { userId: user.id, reviewedAt: { gte: since } },
        select: { result: true, reviewedAt: true },
        orderBy: { reviewedAt: "asc" },
      }),

      // Stats gerais do usuário
      prisma.userStats.findUnique({ where: { userId: user.id } }),

      // Progresso dos planos de estudo
      prisma.studyPlan.findMany({
        where: { userId: user.id, isActive: true },
        include: {
          modules: {
            include: {
              topics: {
                include: { tasks: { select: { completed: true } } },
              },
            },
          },
        },
      }),
    ]);

    // ── Agrega por dia ──────────────────────────────────────────────────────
    const days = buildDayRange(since, range);

    const dailyMinutes = days.map((day) => ({
      date: day,
      minutes: studySessions
        .filter((s) => toDateStr(s.startedAt) === day)
        .reduce((acc, s) => acc + s.durationMin, 0),
      pomodoroMinutes: pomodoroSessions
        .filter((s) => toDateStr(s.date) === day)
        .reduce((acc, s) => acc + s.focusMin * s.cycles, 0),
    }));

    const dailyTasks = days.map((day) => ({
      date: day,
      completed: tasks.filter((t) => t.completedAt && toDateStr(t.completedAt) === day).length,
    }));

    // ── Totais do período ───────────────────────────────────────────────────
    const totalMinutes =
      studySessions.reduce((a, s) => a + s.durationMin, 0) +
      pomodoroSessions.reduce((a, s) => a + s.focusMin * s.cycles, 0);

    const totalTasks = tasks.length;
    const totalPomodoros = pomodoroSessions.reduce((a, s) => a + s.cycles, 0);
    const totalReviews = flashcardReviews.length;

    const reviewBreakdown = {
      AGAIN: flashcardReviews.filter((r) => r.result === "AGAIN").length,
      HARD: flashcardReviews.filter((r) => r.result === "HARD").length,
      GOOD: flashcardReviews.filter((r) => r.result === "GOOD").length,
      EASY: flashcardReviews.filter((r) => r.result === "EASY").length,
    };

    // ── Progresso por plano ─────────────────────────────────────────────────
    const plansProgress = studyPlans.map((plan) => {
      const allTasks = plan.modules.flatMap((m) => m.topics.flatMap((t) => t.tasks));
      const completed = allTasks.filter((t) => t.completed).length;
      const total = allTasks.length;
      return {
        id: plan.id,
        title: plan.title,
        progressPct: total === 0 ? 0 : Math.round((completed / total) * 100),
        completedTasks: completed,
        totalTasks: total,
      };
    });

    return ok({
      range,
      since,
      userStats,
      summary: { totalMinutes, totalTasks, totalPomodoros, totalReviews },
      dailyMinutes,
      dailyTasks,
      reviewBreakdown,
      plansProgress,
    });
  } catch (e) {
    console.error(e);
    return serverError();
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildDayRange(since: Date, range: number): string[] {
  return Array.from({ length: range }, (_, i) => {
    const d = addDays(since, i);
    return toDateStr(d);
  });
}
