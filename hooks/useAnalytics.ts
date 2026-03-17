// hooks/useAnalytics.ts
import { useState, useEffect, useCallback } from "react";

export interface AnalyticsData {
  range: number;
  since: string;
  userStats: {
    totalXp: number;
    level: number;
    streak: number;
    longestStreak: number;
    totalMinutes: number;
    tasksCompleted: number;
    pomodoroCount: number;
  } | null;
  summary: {
    totalMinutes: number;
    totalTasks: number;
    totalPomodoros: number;
    totalReviews: number;
  };
  dailyMinutes: { date: string; minutes: number; pomodoroMinutes: number }[];
  dailyTasks: { date: string; completed: number }[];
  reviewBreakdown: { AGAIN: number; HARD: number; GOOD: number; EASY: number };
  plansProgress: {
    id: string;
    title: string;
    progressPct: number;
    completedTasks: number;
    totalTasks: number;
  }[];
}

export function useAnalytics(range: 7 | 30 | 90 = 7) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics?range=${range}`);
      if (!res.ok) throw new Error("Falha ao buscar analytics");
      const { data: d } = await res.json();
      setData(d);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { data, isLoading, error, refetch: fetch_ };
}

// ─── Flashcards due ───────────────────────────────────────────────────────────

export interface FlashcardDue {
  id: string;
  front: string;
  back: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  nextReviewAt: string;
  reviewCount: number;
  topic?: { id: string; title: string } | null;
}

export function useFlashcardsDue(limit = 20) {
  const [cards, setCards] = useState<FlashcardDue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/flashcards/due?limit=${limit}`);
      const { data } = await res.json();
      setCards(data.flashcards ?? []);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const submitReview = useCallback(
    async (flashcardId: string, result: "AGAIN" | "HARD" | "GOOD" | "EASY") => {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flashcardId, result }),
      });
      if (!res.ok) throw new Error("Falha ao enviar revisão");
      const { data } = await res.json();
      // Remove card da fila local (exceto AGAIN que reencaminha)
      if (result !== "AGAIN") {
        setCards((prev) => prev.filter((c) => c.id !== flashcardId));
      }
      return data;
    },
    []
  );

  return { cards, isLoading, refetch: fetch_, submitReview };
}

// ─── AI Suggestions ───────────────────────────────────────────────────────────

export interface AISuggestion {
  type: "topic" | "flashcard_review" | "streak" | "rest";
  title: string;
  description: string;
  topicId?: string;
  estimatedMin?: number;
  priority: number;
}

export function useAISuggestions(availableMinutes = 30) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetch_ = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/ai/suggest?minutes=${availableMinutes}`);
      const { data } = await res.json();
      setSuggestions(data.suggestions ?? []);
    } finally {
      setIsLoading(false);
    }
  }, [availableMinutes]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { suggestions, isLoading, refetch: fetch_ };
}

// ─── Study sessions ───────────────────────────────────────────────────────────

export function useStudySessions(dateFilter?: string) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const url = dateFilter
      ? `/api/sessions?date=${dateFilter}`
      : "/api/sessions?limit=50";

    fetch(url)
      .then((r) => r.json())
      .then(({ data }) => {
        setSessions(data.sessions ?? []);
        setTotalMinutes(data.totalMinutesFiltered ?? 0);
      })
      .finally(() => setIsLoading(false));
  }, [dateFilter]);

  const logSession = useCallback(
    async (durationMin: number, topicId?: string, notes?: string) => {
      const now = new Date();
      const startedAt = new Date(now.getTime() - durationMin * 60_000).toISOString();
      const endedAt = now.toISOString();

      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationMin, topicId, notes, startedAt, endedAt }),
      });
      if (!res.ok) throw new Error("Falha ao salvar sessão");
      const { data } = await res.json();
      setSessions((prev) => [data.session, ...prev]);
      setTotalMinutes((m) => m + durationMin);
      return data;
    },
    []
  );

  return { sessions, totalMinutes, isLoading, logSession };
}
