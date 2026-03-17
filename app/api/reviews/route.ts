// app/api/reviews/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createReviewSchema } from "@/lib/validations";
import {
  created, badRequest, unauthorized, forbidden,
  notFound, serverError, requireAuth,
} from "@/lib/utils";
import { calculateNextReview } from "@/lib/spaced-repetition";
import { awardXP, checkAndGrantAchievements, XP_REWARDS } from "@/lib/gamification";

// POST /api/reviews  → registrar resultado de revisão de um flashcard
export async function POST(req: NextRequest) {
  const user = await requireAuth();
  if (!user) return unauthorized();

  try {
    const body = await req.json();
    const parsed = createReviewSchema.safeParse(body);
    if (!parsed.success) return badRequest("Dados inválidos", parsed.error.flatten());

    const { flashcardId, result } = parsed.data;

    // Verifica ownership
    const flashcard = await prisma.flashcard.findUnique({ where: { id: flashcardId } });
    if (!flashcard) return notFound("Flashcard não encontrado");
    if (flashcard.userId !== user.id) return forbidden();

    // Calcula próxima data de revisão (algoritmo SM-2 simplificado)
    const { nextReviewAt, difficulty, intervalDays } = calculateNextReview(
      result,
      flashcard.reviewCount
    );

    const resultData = await prisma.$transaction(async (tx) => {
      // Salva a revisão
      const review = await tx.review.create({
        data: { flashcardId, userId: user.id, result },
      });

      // Atualiza o flashcard com nova data e dificuldade
      await tx.flashcard.update({
        where: { id: flashcardId },
        data: {
          nextReviewAt,
          difficulty,
          reviewCount: { increment: 1 },
        },
      });

      // XP por revisão
      const xpEarned = XP_REWARDS.flashcard_review;
      await awardXP(tx, user.id, xpEarned, "flashcard_review");

      // Incrementa contador de flashcards revisados
      await tx.userStats.upsert({
        where: { userId: user.id },
        create: { userId: user.id },
        update: {},
      });

      // Verifica conquistas
      const newAchievements = await checkAndGrantAchievements(tx, user.id);

      return { review, nextReviewAt, intervalDays, xpEarned, newAchievements };
    });

    return created(resultData);
  } catch {
    return serverError();
  }
}
