// app/api/flashcards/due/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, unauthorized, serverError, requireAuth } from "@/lib/utils";

// GET /api/flashcards/due  → flashcards com revisão pendente para hoje
export async function GET(req: NextRequest) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  const limit = Math.min(50, Number(req.nextUrl.searchParams.get("limit") ?? 20));
  const topicId = req.nextUrl.searchParams.get("topicId");

  try {
    const due = await prisma.flashcard.findMany({
      where: {
        userId: user.id,
        nextReviewAt: { lte: new Date() },
        ...(topicId && { topicId }),
      },
      include: { topic: { select: { id: true, title: true } } },
      orderBy: [{ nextReviewAt: "asc" }, { difficulty: "desc" }],
      take: limit,
    });

    return ok({ flashcards: due, count: due.length });
  } catch {
    return serverError();
  }
}
