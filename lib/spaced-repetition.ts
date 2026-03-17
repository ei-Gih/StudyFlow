import { addDays } from "./utils";

type ReviewResult = "AGAIN" | "HARD" | "GOOD" | "EASY";

export interface NextReviewResult {
  nextReviewAt: Date;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  intervalDays: number;
}

// Intervalo base por resultado
const INTERVALS: Record<ReviewResult, number> = {
  AGAIN: 0,   // revisar no mesmo dia
  HARD: 1,    // revisar amanhã
  GOOD: 3,    // revisar em 3 dias
  EASY: 7,    // revisar em 7 dias
};

// Fator multiplicador baseado em quantas vezes o usuário acertou
// Quanto mais vezes acertou, maior o intervalo (comportamento SM-2)
export function calculateNextReview(
  result: ReviewResult,
  reviewCount: number
): NextReviewResult {
  const baseInterval = INTERVALS[result];

  // Aplica fator de crescimento para cartões bem conhecidos
  let intervalDays = baseInterval;
  if (result !== "AGAIN" && reviewCount > 2) {
    const growthFactor = 1 + (reviewCount - 2) * 0.2;
    intervalDays = Math.round(baseInterval * growthFactor);
  }

  // Cap máximo de 90 dias
  intervalDays = Math.min(intervalDays, 90);

  const nextReviewAt =
    intervalDays === 0 ? new Date() : addDays(new Date(), intervalDays);

  const difficulty: "EASY" | "MEDIUM" | "HARD" =
    result === "EASY" ? "EASY" : result === "AGAIN" || result === "HARD" ? "HARD" : "MEDIUM";

  return { nextReviewAt, difficulty, intervalDays };
}

// Retorna os flashcards devidos para revisão hoje
export function isDueToday(nextReviewAt: Date): boolean {
  const now = new Date();
  return nextReviewAt <= now;
}
