// store/useStudyStore.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  topicId: string;
  description: string;
  estimatedMin: number;
  completed: boolean;
  completedAt: string | null;
  orderIndex: number;
}

export interface Topic {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  estimatedMin: number;
  completed: boolean;
  completedAt: string | null;
  orderIndex: number;
  tasks: Task[];
}

export interface Module {
  id: string;
  studyPlanId: string;
  title: string;
  description?: string;
  orderIndex: number;
  progressPct: number;
  totalTasks: number;
  completedTasks: number;
  topics: Topic[];
}

export interface StudyPlan {
  id: string;
  title: string;
  description?: string;
  totalHours: number;
  deadline?: string;
  isActive: boolean;
  progressPct: number;
  totalTasks: number;
  completedTasks: number;
  modules: Module[];
}

interface StudyState {
  // Data
  plans: StudyPlan[];
  activePlanId: string | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;

  // Computed
  activePlan: () => StudyPlan | null;
  pendingTasksCount: () => number;
  overallProgress: () => number;

  // Actions
  fetchPlans: () => Promise<void>;
  fetchPlan: (id: string) => Promise<void>;
  setActivePlan: (id: string) => void;
  createPlan: (data: { title: string; description?: string; totalHours?: number; deadline?: string }) => Promise<StudyPlan>;
  updatePlan: (id: string, data: Partial<StudyPlan>) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  toggleTask: (taskId: string, topicId: string) => Promise<{ xpEarned: number }>;
  optimisticToggleTask: (taskId: string) => void;
  invalidate: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useStudyStore = create<StudyState>()(
  devtools(
    persist(
      (set, get) => ({
        plans: [],
        activePlanId: null,
        isLoading: false,
        error: null,
        lastFetched: null,

        // ── Computed ───────────────────────────────────────────────────────

        activePlan: () => {
          const { plans, activePlanId } = get();
          return plans.find((p) => p.id === activePlanId) ?? plans[0] ?? null;
        },

        pendingTasksCount: () => {
          return get()
            .plans.flatMap((p) => p.modules.flatMap((m) => m.topics.flatMap((t) => t.tasks)))
            .filter((t) => !t.completed).length;
        },

        overallProgress: () => {
          const allTasks = get().plans.flatMap((p) =>
            p.modules.flatMap((m) => m.topics.flatMap((t) => t.tasks))
          );
          if (allTasks.length === 0) return 0;
          const done = allTasks.filter((t) => t.completed).length;
          return Math.round((done / allTasks.length) * 100);
        },

        // ── Fetch ──────────────────────────────────────────────────────────

        fetchPlans: async () => {
          const { lastFetched } = get();
          // Cache de 60 segundos
          if (lastFetched && Date.now() - lastFetched < 60_000) return;

          set({ isLoading: true, error: null });
          try {
            const res = await fetch("/api/study-plans?active=true");
            if (!res.ok) throw new Error("Falha ao buscar planos");
            const { data } = await res.json();
            set({
              plans: data.plans,
              isLoading: false,
              lastFetched: Date.now(),
              activePlanId: get().activePlanId ?? data.plans[0]?.id ?? null,
            });
          } catch (e) {
            set({ error: (e as Error).message, isLoading: false });
          }
        },

        fetchPlan: async (id: string) => {
          set({ isLoading: true, error: null });
          try {
            const res = await fetch(`/api/study-plans/${id}`);
            if (!res.ok) throw new Error("Plano não encontrado");
            const { data } = await res.json();
            set((state) => ({
              plans: state.plans.map((p) => (p.id === id ? data : p)),
              isLoading: false,
              lastFetched: Date.now(),
            }));
          } catch (e) {
            set({ error: (e as Error).message, isLoading: false });
          }
        },

        setActivePlan: (id: string) => set({ activePlanId: id }),

        // ── CRUD ───────────────────────────────────────────────────────────

        createPlan: async (data) => {
          const res = await fetch("/api/study-plans", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error("Falha ao criar plano");
          const { data: plan } = await res.json();
          set((state) => ({
            plans: [plan, ...state.plans],
            activePlanId: state.activePlanId ?? plan.id,
            lastFetched: null, // invalida cache
          }));
          return plan;
        },

        updatePlan: async (id, data) => {
          const res = await fetch(`/api/study-plans/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error("Falha ao atualizar plano");
          const { data: updated } = await res.json();
          set((state) => ({
            plans: state.plans.map((p) => (p.id === id ? { ...p, ...updated } : p)),
          }));
        },

        deletePlan: async (id) => {
          const res = await fetch(`/api/study-plans/${id}`, { method: "DELETE" });
          if (!res.ok) throw new Error("Falha ao deletar plano");
          set((state) => ({
            plans: state.plans.filter((p) => p.id !== id),
            activePlanId: state.activePlanId === id ? (state.plans[0]?.id ?? null) : state.activePlanId,
            lastFetched: null,
          }));
        },

        // ── Toggle task com optimistic update ─────────────────────────────

        optimisticToggleTask: (taskId: string) => {
          set((state) => ({
            plans: state.plans.map((plan) => ({
              ...plan,
              modules: plan.modules.map((mod) => ({
                ...mod,
                topics: mod.topics.map((topic) => ({
                  ...topic,
                  tasks: topic.tasks.map((task) =>
                    task.id === taskId
                      ? { ...task, completed: !task.completed, completedAt: !task.completed ? new Date().toISOString() : null }
                      : task
                  ),
                })),
              })),
            })),
          }));
        },

        toggleTask: async (taskId, _topicId) => {
          // Optimistic update imediato
          get().optimisticToggleTask(taskId);

          try {
            const task = get()
              .plans.flatMap((p) => p.modules.flatMap((m) => m.topics.flatMap((t) => t.tasks)))
              .find((t) => t.id === taskId);

            const res = await fetch(`/api/tasks/${taskId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ completed: task?.completed ?? false }),
            });

            if (!res.ok) {
              // Reverte optimistic update em caso de erro
              get().optimisticToggleTask(taskId);
              throw new Error("Falha ao atualizar tarefa");
            }

            const { data } = await res.json();
            // Invalida cache para recalcular progresso
            set({ lastFetched: null });
            return { xpEarned: data.xpEarned ?? 0 };
          } catch (e) {
            throw e;
          }
        },

        invalidate: () => set({ lastFetched: null }),
      }),
      {
        name: "studyflow-study",
        partialize: (state) => ({
          activePlanId: state.activePlanId,
          // Não persiste plans no localStorage — refetch sempre
        }),
      }
    ),
    { name: "StudyStore" }
  )
);
