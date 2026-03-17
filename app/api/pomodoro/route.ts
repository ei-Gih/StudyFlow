// app/api/pomodoro/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPomodoroSchema } from "@/lib/validations";
import { ok, created, badRequest, unauthorized, serverError, requireAuth, parsePagination } from "@/lib/utils";
import { awardXP, updateStreak, checkAndGrantAchievements, XP_REWARDS } from "@/lib/gamification";

// GET /api/pomodoro  → histórico de sessões pomodoro do usuário
export async function GET(req: NextRequest) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  const { skip, take } = parsePagination(req.nextUrl.searchParams);

  try {
    const [sessions, total] = await Promise.all([
      prisma.pomodoroSession.findMany({
        where: { userId: user.id },
        include: { topic: { select: { id: true, title: true } } },
        orderBy: { date: "desc" },
        skip,
        take,
      }),
      prisma.pomodoroSession.count({ where: { userId: user.id } }),
    ]);

    return ok({ sessions, total });
  } catch {
    return serverError();
  }
}

// POST /api/pomodoro  → registrar nova sessão pomodoro concluída
export async function POST(req: NextRequest) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  try {
    const body = await req.json();
    const parsed = createPomodoroSchema.safeParse(body);
    if (!parsed.success) return badRequest("Dados inválidos", parsed.error.flatten());

    const { topicId, focusMin, breakMin, cycles, completed, date } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      // Salva a sessão
      const session = await tx.pomodoroSession.create({
        data: {
          userId: user.id,
          topicId: topicId ?? null,
          focusMin,
          breakMin,
          cycles,
          completed,
          date: date ? new Date(date) : new Date(),
        },
      });

      if (completed) {
        // Atualiza totalMinutes e pomodoroCount nas stats
        await tx.userStats.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            totalMinutes: focusMin * cycles,
            pomodoroCount: cycles,
          },
          update: {
            totalMinutes: { increment: focusMin * cycles },
            pomodoroCount: { increment: cycles },
          },
        });

        // XP por cada ciclo completado
        const xpEarned = XP_REWARDS.pomodoro_cycle * cycles;
        await awardXP(tx, user.id, xpEarned, "pomodoro_cycle");

        // Atualiza streak
        const { streak } = await updateStreak(tx, user.id);

        // Checa conquistas
        const newAchievements = await checkAndGrantAchievements(tx, user.id);

        return { session, xpEarned, streak, newAchievements };
      }

      return { session, xpEarned: 0, streak: 0, newAchievements: [] };
    });

    return created(result);
  } catch {
    return serverError();
  }
}
