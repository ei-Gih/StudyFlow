// app/api/flashcards/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createFlashcardSchema } from "@/lib/validations";
import { ok, created, badRequest, unauthorized, serverError, requireAuth, parsePagination } from "@/lib/utils";

// GET /api/flashcards  → todos os flashcards do usuário
export async function GET(req: NextRequest) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  const { skip, take } = parsePagination(req.nextUrl.searchParams);
  const topicId = req.nextUrl.searchParams.get("topicId");

  try {
    const where = {
      userId: user.id,
      ...(topicId && { topicId }),
    };

    const [flashcards, total] = await Promise.all([
      prisma.flashcard.findMany({
        where,
        include: { topic: { select: { id: true, title: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.flashcard.count({ where }),
    ]);

    return ok({ flashcards, total });
  } catch {
    return serverError();
  }
}

// POST /api/flashcards
export async function POST(req: NextRequest) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  try {
    const body = await req.json();
    const parsed = createFlashcardSchema.safeParse(body);
    if (!parsed.success) return badRequest("Dados inválidos", parsed.error.flatten());

    const { topicId, front, back, difficulty } = parsed.data;

    const flashcard = await prisma.flashcard.create({
      data: {
        userId: user.id,
        topicId: topicId ?? null,
        front,
        back,
        difficulty: difficulty ?? "MEDIUM",
        nextReviewAt: new Date(),
      },
    });

    return created(flashcard);
  } catch {
    return serverError();
  }
}
