// store/usePomodoroStore.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Phase = "focus" | "short_break" | "long_break";

export interface PomodoroConfig {
  focusMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  cyclesBeforeLong: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  soundEnabled: boolean;
}

export interface PomodoroLog {
  id: string;
  label: string;
  topicTitle?: string;
  cycles: number;
  xpEarned: number;
  timestamp: string;
}

interface PomodoroState {
  // Config
  config: PomodoroConfig;

  // Timer state
  phase: Phase;
  secondsLeft: number;
  isRunning: boolean;
  cyclesThisRound: number;   // ciclos desde a última pausa longa
  totalCyclesSession: number; // ciclos na sessão atual
  totalXpSession: number;

  // Contexto
  selectedTopicId: string | null;
  selectedTopicTitle: string | null;

  // Histórico da sessão
  sessionLog: PomodoroLog[];

  // Computed
  progress: () => number;
  totalSecondsForPhase: () => number;

  // Actions
  setConfig: (config: Partial<PomodoroConfig>) => void;
  setPhase: (phase: Phase) => void;
  setRunning: (running: boolean) => void;
  tick: () => void;
  reset: () => void;
  skipPhase: () => void;
  completeCycle: () => Promise<void>;
  selectTopic: (id: string | null, title: string | null) => void;
  clearSession: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: PomodoroConfig = {
  focusMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  cyclesBeforeLong: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  soundEnabled: true,
};

function phaseSeconds(phase: Phase, cfg: PomodoroConfig): number {
  if (phase === "focus") return cfg.focusMin * 60;
  if (phase === "short_break") return cfg.shortBreakMin * 60;
  return cfg.longBreakMin * 60;
}

export const usePomodoroStore = create<PomodoroState>()(
  devtools(
    persist(
      (set, get) => ({
        config: DEFAULT_CONFIG,
        phase: "focus",
        secondsLeft: DEFAULT_CONFIG.focusMin * 60,
        isRunning: false,
        cyclesThisRound: 0,
        totalCyclesSession: 0,
        totalXpSession: 0,
        selectedTopicId: null,
        selectedTopicTitle: null,
        sessionLog: [],

        // ── Computed ───────────────────────────────────────────────────────

        progress: () => {
          const { secondsLeft, phase, config } = get();
          const total = phaseSeconds(phase, config);
          return 1 - secondsLeft / total;
        },

        totalSecondsForPhase: () => {
          const { phase, config } = get();
          return phaseSeconds(phase, config);
        },

        // ── Config ─────────────────────────────────────────────────────────

        setConfig: (partial) => {
          set((state) => {
            const newConfig = { ...state.config, ...partial };
            // Recalcula secondsLeft se mudou a duração da fase atual
            const newSeconds = phaseSeconds(state.phase, newConfig);
            return {
              config: newConfig,
              secondsLeft: state.isRunning ? state.secondsLeft : newSeconds,
            };
          });
        },

        // ── Phase ──────────────────────────────────────────────────────────

        setPhase: (phase) => {
          set((state) => ({
            phase,
            secondsLeft: phaseSeconds(phase, state.config),
            isRunning: false,
          }));
        },

        setRunning: (running) => set({ isRunning: running }),

        // ── Tick (chamado pelo intervalo no componente) ─────────────────────

        tick: () => {
          const { secondsLeft } = get();
          if (secondsLeft <= 1) {
            set({ secondsLeft: 0, isRunning: false });
            get().completeCycle();
          } else {
            set({ secondsLeft: secondsLeft - 1 });
          }
        },

        // ── Reset ──────────────────────────────────────────────────────────

        reset: () => {
          set((state) => ({
            secondsLeft: phaseSeconds(state.phase, state.config),
            isRunning: false,
          }));
        },

        // ── Skip ───────────────────────────────────────────────────────────

        skipPhase: () => {
          set({ secondsLeft: 0, isRunning: false });
          get().completeCycle();
        },

        // ── Complete cycle ─────────────────────────────────────────────────

        completeCycle: async () => {
          const { phase, cyclesThisRound, config, selectedTopicId, selectedTopicTitle } = get();

          if (phase === "focus") {
            const newCycles = cyclesThisRound + 1;
            const nextPhase: Phase =
              newCycles % config.cyclesBeforeLong === 0 ? "long_break" : "short_break";

            // Persiste sessão na API
            try {
              const res = await fetch("/api/pomodoro", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  topicId: selectedTopicId,
                  focusMin: config.focusMin,
                  breakMin: config.shortBreakMin,
                  cycles: 1,
                  completed: true,
                  date: new Date().toISOString(),
                }),
              });

              const { data } = await res.json();
              const xpEarned = data?.xpEarned ?? 20;

              set((state) => ({
                cyclesThisRound: newCycles,
                totalCyclesSession: state.totalCyclesSession + 1,
                totalXpSession: state.totalXpSession + xpEarned,
                sessionLog: [
                  {
                    id: Date.now().toString(),
                    label: `Foco — ${selectedTopicTitle ?? "Sem tópico"}`,
                    topicTitle: selectedTopicTitle ?? undefined,
                    cycles: 1,
                    xpEarned,
                    timestamp: new Date().toISOString(),
                  },
                  ...state.sessionLog.slice(0, 19),
                ],
                phase: nextPhase,
                secondsLeft: phaseSeconds(nextPhase, state.config),
                isRunning: state.config.autoStartBreaks,
              }));
            } catch {
              // Mesmo sem API, avança a fase
              set((state) => ({
                cyclesThisRound: newCycles,
                totalCyclesSession: state.totalCyclesSession + 1,
                phase: nextPhase,
                secondsLeft: phaseSeconds(nextPhase, state.config),
                isRunning: state.config.autoStartBreaks,
              }));
            }
          } else {
            // Fim de pausa → volta ao foco
            set((state) => ({
              phase: "focus",
              secondsLeft: phaseSeconds("focus", state.config),
              isRunning: state.config.autoStartFocus,
            }));
          }
        },

        // ── Topic ──────────────────────────────────────────────────────────

        selectTopic: (id, title) =>
          set({ selectedTopicId: id, selectedTopicTitle: title }),

        // ── Clear session ──────────────────────────────────────────────────

        clearSession: () =>
          set({
            totalCyclesSession: 0,
            totalXpSession: 0,
            cyclesThisRound: 0,
            sessionLog: [],
            phase: "focus",
            secondsLeft: get().config.focusMin * 60,
            isRunning: false,
          }),
      }),
      {
        name: "studyflow-pomodoro",
        partialize: (state) => ({
          config: state.config,
          selectedTopicId: state.selectedTopicId,
          selectedTopicTitle: state.selectedTopicTitle,
          // Não persiste timer em si (perde contexto ao recarregar)
        }),
      }
    ),
    { name: "PomodoroStore" }
  )
);
