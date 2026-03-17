import { Prisma } from "@prisma/client";
import { isSameDay, addDays } from "./utils";

// ── Constantes de XP ──────────────────────────────────────────────────────────

export const XP_REWARDS = {
  task_complete: 10,
  pomodoro_cycle: 20,
  module_complete: 100,
  flashcard_review: 5,
  streak_bonus: 15,        // bônus por manter streak
} as const;

type XPReason = keyof typeof XP_REWARDS;

// ── Cálculo de nível ──────────────────────────────────────────────────────────
// Fórmula: XP necessário para nível N = N * 300
// Nível 1 = 0 XP, Nível 2 = 300, Nível 3 = 600 ...

export function xpForLevel(level: number): number {
  return level * 300;
}

export function levelFromXp(totalXp: number): number {
  let level = 1;
  while (totalXp >= xpForLevel(level + 1)) level++;
  return level;
}

// ── Award XP (deve ser chamado dentro de uma transaction Prisma) ──────────────

export async function awardXP(
  tx: Prisma.TransactionClient,
  userId: string,
  amount: number,
  reason: XPReason
) {
  const stats = await tx.userStats.upsert({
    where: { userId },
    create: { userId, totalXp: amount, level: 1 },
    update: { totalXp: { increment: amount } },
  });

  const newLevel = levelFromXp(stats.totalXp);

  if (newLevel !== stats.level) {
    await tx.userStats.update({
      where: { userId },
      data: { level: newLevel },
    });
  }

  return { xpAwarded: amount, reason, newLevel };
}

// ── Atualiza streak ───────────────────────────────────────────────────────────

export async function updateStreak(
  tx: Prisma.TransactionClient,
  userId: string
): Promise<{ streak: number; streakBroken: boolean }> {
  const stats = await tx.userStats.findUnique({ where: { userId } });
  if (!stats) return { streak: 0, streakBroken: false };

  const today = new Date();
  const yesterday = addDays(today, -1);

  let newStreak = stats.streak;
  let streakBroken = false;

  if (!stats.lastStudyDate) {
    // Primeiro dia de estudo
    newStreak = 1;
  } else if (isSameDay(stats.lastStudyDate, today)) {
    // Já estudou hoje — não faz nada
    return { streak: stats.streak, streakBroken: false };
  } else if (isSameDay(stats.lastStudyDate, yesterday)) {
    // Estudou ontem — incrementa streak
    newStreak = stats.streak + 1;
  } else {
    // Perdeu o streak
    newStreak = 1;
    streakBroken = true;
  }

  const longestStreak = Math.max(newStreak, stats.longestStreak);

  await tx.userStats.update({
    where: { userId },
    data: {
      streak: newStreak,
      longestStreak,
      lastStudyDate: today,
    },
  });

  // Bônus de XP por manter streak (a cada 7 dias)
  if (newStreak > 0 && newStreak % 7 === 0) {
    await awardXP(tx, userId, XP_REWARDS.streak_bonus * Math.floor(newStreak / 7), "streak_bonus");
  }

  return { streak: newStreak, streakBroken };
}

// ── Checa e concede conquistas ────────────────────────────────────────────────

const ACHIEVEMENT_TRIGGERS: Record<string, (stats: { streak: number; pomodoroCount: number; tasksCompleted: number; modulesCompleted: number }) => boolean> = {
  FIRST_TASK: (s) => s.tasksCompleted >= 1,
  TASKS_10: (s) => s.tasksCompleted >= 10,
  TASKS_100: (s) => s.tasksCompleted >= 100,
  FIRST_POMODORO: (s) => s.pomodoroCount >= 1,
  POMODORO_10: (s) => s.pomodoroCount >= 10,
  STREAK_3: (s) => s.streak >= 3,
  STREAK_7: (s) => s.streak >= 7,
  STREAK_30: (s) => s.streak >= 30,
  FIRST_MODULE: (s) => s.modulesCompleted >= 1,
};

export async function checkAndGrantAchievements(
  tx: Prisma.TransactionClient,
  userId: string
) {
  const [stats, userAchievements, allAchievements] = await Promise.all([
    tx.userStats.findUnique({ where: { userId } }),
    tx.userAchievement.findMany({ where: { userId }, select: { achievementId: true } }),
    tx.achievement.findMany(),
  ]);

  if (!stats) return [];

  const unlockedKeys = new Set(
    userAchievements.map((ua) => {
      const ach = allAchievements.find((a) => a.id === ua.achievementId);
      return ach?.key;
    })
  );

  const newlyUnlocked: string[] = [];

  for (const [key, condition] of Object.entries(ACHIEVEMENT_TRIGGERS)) {
    if (unlockedKeys.has(key)) continue;
    if (!condition(stats)) continue;

    const achievement = allAchievements.find((a) => a.key === key);
    if (!achievement) continue;

    await tx.userAchievement.create({
      data: { userId, achievementId: achievement.id },
    });

    await awardXP(tx, userId, achievement.xpReward, "task_complete");

    newlyUnlocked.push(key);
  }

  return newlyUnlocked;
}
