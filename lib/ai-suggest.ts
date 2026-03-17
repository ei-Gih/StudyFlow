// lib/ai-suggest.ts
// Motor de sugestões inteligentes baseado em contexto do usuário.
// Usa regras heurísticas locais; pode ser substituído por chamada a LLM (ex: Claude API)
// para sugestões mais sofisticadas.

import { prisma } from "./prisma";

interface SuggestionContext {
  userId: string;
  availableMinutes?: number; // minutos livres estimados
}

export interface Suggestion {
  type: "topic" | "flashcard_review" | "streak" | "rest";
  title: string;
  description: string;
  topicId?: string;
  estimatedMin?: number;
  priority: number; // 0-100
}

export async function generateSuggestions(ctx: SuggestionContext): Promise<Suggestion[]> {
  const { userId, availableMinutes = 30 } = ctx;

  const [pendingTopics, dueFlashcards, stats, recentSessions] = await Promise.all([
    // Tópicos pendentes ordenados por plano ativo
    prisma.topic.findMany({
      where: {
        completed: false,
        module: { studyPlan: { userId, isActive: true } },
      },
      include: {
        tasks: { select: { completed: true } },
        module: { select: { title: true, studyPlanId: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 10,
    }),

    // Flashcards com revisão pendente
    prisma.flashcard.count({
      where: { userId, nextReviewAt: { lte: new Date() } },
    }),

    // Stats do usuário para contexto de streak/XP
    prisma.userStats.findUnique({ where: { userId } }),

    // Sessões das últimas 24h para evitar repetir o mesmo tópico
    prisma.studySession.findMany({
      where: {
        userId,
        startedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      select: { topicId: true },
    }),
  ]);

  const suggestions: Suggestion[] = [];
  const recentTopicIds = new Set(recentSessions.map((s) => s.topicId).filter(Boolean));

  // ── Sugestão 1: flashcards pendentes ──────────────────────────────────────
  if (dueFlashcards > 0) {
    const urgency = Math.min(100, 40 + dueFlashcards * 5);
    const estimatedMin = Math.min(availableMinutes, Math.ceil(dueFlashcards * 1.5));
    suggestions.push({
      type: "flashcard_review",
      title: `Revisar ${dueFlashcards} flashcard${dueFlashcards > 1 ? "s" : ""} pendente${dueFlashcards > 1 ? "s" : ""}`,
      description: `Você tem ${dueFlashcards} card${dueFlashcards > 1 ? "s" : ""} esperando revisão. Estimativa: ~${estimatedMin} min.`,
      estimatedMin,
      priority: urgency,
    });
  }

  // ── Sugestão 2: streak em risco ────────────────────────────────────────────
  if (stats?.lastStudyDate) {
    const hoursAgo = (Date.now() - stats.lastStudyDate.getTime()) / (1000 * 60 * 60);
    if (hoursAgo > 20 && stats.streak > 0) {
      suggestions.push({
        type: "streak",
        title: `Não quebre sua sequência de ${stats.streak} dias!`,
        description: `Você ainda não estudou hoje. Qualquer sessão rápida conta para manter o streak.`,
        estimatedMin: 15,
        priority: 90,
      });
    }
  }

  // ── Sugestão 3: tópico mais prioritário que caiba no tempo ────────────────
  const candidateTopics = pendingTopics
    .filter((t) => !recentTopicIds.has(t.id))
    .filter((t) => t.estimatedMin <= availableMinutes)
    .sort((a, b) => {
      // Prioriza tópicos com mais tarefas concluídas (quase prontos)
      const aRatio = a.tasks.filter((t) => t.completed).length / Math.max(a.tasks.length, 1);
      const bRatio = b.tasks.filter((t) => t.completed).length / Math.max(b.tasks.length, 1);
      return bRatio - aRatio;
    });

  if (candidateTopics.length > 0) {
    const top = candidateTopics[0];
    const doneTasks = top.tasks.filter((t) => t.completed).length;
    const pct = top.tasks.length === 0 ? 0 : Math.round((doneTasks / top.tasks.length) * 100);

    suggestions.push({
      type: "topic",
      title: `Estudar "${top.title}"`,
      description: `Módulo: ${top.module.title}. ${pct}% concluído — ${availableMinutes} min disponíveis, encaixa perfeitamente.`,
      topicId: top.id,
      estimatedMin: top.estimatedMin,
      priority: 70,
    });
  } else if (pendingTopics.length > 0) {
    // Tópico mais curto mesmo que ultrapasse um pouco o tempo
    const shortest = [...pendingTopics].sort((a, b) => a.estimatedMin - b.estimatedMin)[0];
    suggestions.push({
      type: "topic",
      title: `Iniciar "${shortest.title}"`,
      description: `Módulo: ${shortest.module.title}. Você pode começar agora e pausar quando precisar.`,
      topicId: shortest.id,
      estimatedMin: shortest.estimatedMin,
      priority: 50,
    });
  }

  // ── Sugestão 4: descanso (se estudou muito hoje) ───────────────────────────
  const todayMinutes = await prisma.studySession.aggregate({
    where: {
      userId,
      startedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    },
    _sum: { durationMin: true },
  });

  if ((todayMinutes._sum.durationMin ?? 0) > 180) {
    suggestions.push({
      type: "rest",
      title: "Você estudou mais de 3 horas hoje!",
      description: "Faça uma pausa mais longa. Descanso ativo consolida a memória.",
      estimatedMin: 20,
      priority: 30,
    });
  }

  // Ordena por prioridade decrescente
  return suggestions.sort((a, b) => b.priority - a.priority);
}
