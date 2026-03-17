// app/api/sessions/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createStudySessionSchema } from "@/lib/validations";
import {
  ok, created, badRequest, unauthorized, serverError,
  requireAuth, parsePagination, startOfDay, endOfDay,
} from "@/lib/utils";
import { updateStreak } from "@/lib/gamification";

// GET /api/sessions  → histórico de sessões; suporta filtro por data
export async function GET(req: NextRequest) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  const { skip, take } = parsePagination(req.nextUrl.searchParams);
  const dateParam = req.nextUrl.searchParams.get("date"); // "YYYY-MM-DD"

  try {
    const dateFilter = dateParam
      ? {
          startedAt: {
            gte: startOfDay(new Date(dateParam)),
            lte: endOfDay(new Date(dateParam)),
          },
        }
      : {};

    const [sessions, total] = await Promise.all([
      prisma.studySession.findMany({
        where: { userId: user.id, ...dateFilter },
        include: { topic: { select: { id: true, title: true } } },
        orderBy: { startedAt: "desc" },
        skip,
        take,
      }),
      prisma.studySession.count({ where: { userId: user.id } }),
    ]);

    // Soma total de minutos
    const totalMinutesFiltered = sessions.reduce((acc, s) => acc + s.durationMin, 0);

    return ok({ sessions, total, totalMinutesFiltered });
  } catch {
    return serverError();
  }
}

// POST /api/sessions  → registrar nova sessão de estudo
export async function POST(req: NextRequest) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  try {
    const body = await req.json();
    const parsed = createStudySessionSchema.safeParse(body);
    if (!parsed.success) return badRequest("Dados inválidos", parsed.error.flatten());

    const { topicId, durationMin, notes, startedAt, endedAt } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const session = await tx.studySession.create({
        data: {
          userId: user.id,
          topicId: topicId ?? null,
          durationMin,
          notes,
          startedAt: new Date(startedAt),
          endedAt: new Date(endedAt),
        },
      });

      // Acumula minutos totais nas stats
      await tx.userStats.upsert({
        where: { userId: user.id },
        create: { userId: user.id, totalMinutes: durationMin },
        update: { totalMinutes: { increment: durationMin } },
      });

      // Atualiza streak
      const { streak } = await updateStreak(tx, user.id);

      return { session, streak };
    });

    return created(result);
  } catch {
    return serverError();
  }
}
