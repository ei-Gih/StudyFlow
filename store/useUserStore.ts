// store/useUserStore.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserStats {
  totalXp: number;
  level: number;
  streak: number;
  longestStreak: number;
  lastStudyDate: string | null;
  totalMinutes: number;
  tasksCompleted: number;
  pomodoroCount: number;
  modulesCompleted: number;
}

export interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  unlockedAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
  stats: UserStats | null;
}

// Notificação de XP ganho — para toasts e animações
export interface XPNotification {
  id: string;
  amount: number;
  reason: string;
  timestamp: number;
}

interface UserState {
  profile: UserProfile | null;
  achievements: Achievement[];
  xpNotifications: XPNotification[];
  isLoading: boolean;
  lastFetched: number | null;

  // Computed helpers
  xpForNextLevel: () => number;
  xpProgress: () => number; // 0–1 dentro do nível atual

  // Actions
  fetchProfile: () => Promise<void>;
  addXPNotification: (amount: number, reason: string) => void;
  dismissXPNotification: (id: string) => void;
  optimisticAddXP: (amount: number) => void;
  invalidate: () => void;
}

// ─── XP helpers ───────────────────────────────────────────────────────────────

export function xpForLevel(level: number): number {
  return level * 300;
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  return level;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set, get) => ({
        profile: null,
        achievements: [],
        xpNotifications: [],
        isLoading: false,
        lastFetched: null,

        // ── Computed ───────────────────────────────────────────────────────

        xpForNextLevel: () => {
          const level = get().profile?.stats?.level ?? 1;
          return xpForLevel(level + 1);
        },

        xpProgress: () => {
          const stats = get().profile?.stats;
          if (!stats) return 0;
          const currentLevelXp = xpForLevel(stats.level);
          const nextLevelXp = xpForLevel(stats.level + 1);
          const range = nextLevelXp - currentLevelXp;
          const progress = stats.totalXp - currentLevelXp;
          return Math.min(1, Math.max(0, progress / range));
        },

        // ── Fetch ──────────────────────────────────────────────────────────

        fetchProfile: async () => {
          const { lastFetched } = get();
          if (lastFetched && Date.now() - lastFetched < 30_000) return;

          set({ isLoading: true });
          try {
            const res = await fetch("/api/users");
            if (!res.ok) throw new Error();
            const { data } = await res.json();
            set({
              profile: data,
              isLoading: false,
              lastFetched: Date.now(),
            });
          } catch {
            set({ isLoading: false });
          }
        },

        // ── XP notifications ───────────────────────────────────────────────

        addXPNotification: (amount, reason) => {
          const id = `xp-${Date.now()}`;
          set((state) => ({
            xpNotifications: [
              { id, amount, reason, timestamp: Date.now() },
              ...state.xpNotifications.slice(0, 4),
            ],
          }));
          // Auto-dismiss após 3s
          setTimeout(() => get().dismissXPNotification(id), 3000);
        },

        dismissXPNotification: (id) => {
          set((state) => ({
            xpNotifications: state.xpNotifications.filter((n) => n.id !== id),
          }));
        },

        // ── Optimistic XP update (sem esperar re-fetch) ────────────────────

        optimisticAddXP: (amount) => {
          set((state) => {
            if (!state.profile?.stats) return state;
            const newXp = state.profile.stats.totalXp + amount;
            const newLevel = levelFromXp(newXp);
            return {
              profile: {
                ...state.profile,
                stats: {
                  ...state.profile.stats,
                  totalXp: newXp,
                  level: newLevel,
                },
              },
              lastFetched: null, // re-fetch na próxima chamada
            };
          });
        },

        invalidate: () => set({ lastFetched: null }),
      }),
      {
        name: "studyflow-user",
        partialize: (state) => ({
          profile: state.profile,
          // Não persiste notificações
        }),
      }
    ),
    { name: "UserStore" }
  )
);
