"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = "focus" | "short_break" | "long_break";

interface Topic {
  id: string;
  title: string;
  moduleTitle: string;
}

interface PomodoroConfig {
  focusMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  cyclesBeforeLong: number;
}

const DEFAULT_CONFIG: PomodoroConfig = {
  focusMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  cyclesBeforeLong: 4,
};

const MOCK_TOPICS: Topic[] = [
  { id: "1", title: "Big O Notation", moduleTitle: "Algoritmos" },
  { id: "2", title: "React Hooks avançados", moduleTitle: "React" },
  { id: "3", title: "Generics em TypeScript", moduleTitle: "TypeScript" },
  { id: "4", title: "Índices e performance", moduleTitle: "PostgreSQL" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function phaseLabel(phase: Phase): string {
  return phase === "focus"
    ? "Foco"
    : phase === "short_break"
    ? "Pausa curta"
    : "Pausa longa";
}

function phaseColor(phase: Phase): string {
  return phase === "focus" ? "#a3e635" : phase === "short_break" ? "#34d399" : "#60a5fa";
}

function phaseDuration(phase: Phase, cfg: PomodoroConfig): number {
  return phase === "focus"
    ? cfg.focusMin * 60
    : phase === "short_break"
    ? cfg.shortBreakMin * 60
    : cfg.longBreakMin * 60;
}

function fmtTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── SVG Ring ────────────────────────────────────────────────────────────────

function RingTimer({
  progress,
  phase,
  timeStr,
  isRunning,
}: {
  progress: number; // 0–1
  phase: Phase;
  timeStr: string;
  isRunning: boolean;
}) {
  const R = 110;
  const cx = 140;
  const cy = 140;
  const circ = 2 * Math.PI * R;
  const dash = circ * progress;
  const color = phaseColor(phase);

  return (
    <svg
      width="280"
      height="280"
      viewBox="0 0 280 280"
      style={{ overflow: "visible", display: "block", margin: "0 auto" }}
    >
      {/* Track */}
      <circle
        cx={cx}
        cy={cy}
        r={R}
        fill="none"
        stroke="#1e2026"
        strokeWidth="10"
      />
      {/* Progress arc */}
      <circle
        cx={cx}
        cy={cy}
        r={R}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ * 0.25}
        style={{
          transition: "stroke-dasharray 1s linear",
          filter: `drop-shadow(0 0 8px ${color}88)`,
        }}
      />
      {/* Dot at progress end */}
      {progress > 0.01 && (
        <circle
          cx={cx + R * Math.cos((progress * 2 * Math.PI) - Math.PI / 2)}
          cy={cy + R * Math.sin((progress * 2 * Math.PI) - Math.PI / 2)}
          r="6"
          fill={color}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      )}
      {/* Time display */}
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "44px",
          fontWeight: "500",
          fill: "#e8eaf0",
          letterSpacing: "-2px",
        }}
      >
        {timeStr}
      </text>
      {/* Pulsing dot when running */}
      {isRunning && (
        <circle cx={cx} cy={cy + 34} r="4" fill={color}>
          <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PomodoroTimer() {
  const [cfg] = useState<PomodoroConfig>(DEFAULT_CONFIG);
  const [phase, setPhase] = useState<Phase>("focus");
  const [cyclesThisRound, setCyclesThisRound] = useState(0); // completed focus cycles
  const [totalCycles, setTotalCycles] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_CONFIG.focusMin * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [showTopicPicker, setShowTopicPicker] = useState(false);
  const [log, setLog] = useState<{ label: string; time: string; xp: number }[]>([]);
  const [showCfg, setShowCfg] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const totalSecs = phaseDuration(phase, cfg);

  // ── Tick ──────────────────────────────────────────────────────────────────

  const handlePhaseEnd = useCallback(() => {
    playChime();
    if (phase === "focus") {
      const newCycles = cyclesThisRound + 1;
      setCyclesThisRound(newCycles);
      setTotalCycles((t) => t + 1);
      const xpEarned = 20;
      setLog((prev) => [
        {
          label: `Foco — ${selectedTopic?.title ?? "Sem tópico"}`,
          time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          xp: xpEarned,
        },
        ...prev.slice(0, 9),
      ]);
      if (newCycles % cfg.cyclesBeforeLong === 0) {
        setPhase("long_break");
        setSecondsLeft(cfg.longBreakMin * 60);
      } else {
        setPhase("short_break");
        setSecondsLeft(cfg.shortBreakMin * 60);
      }
    } else {
      setPhase("focus");
      setSecondsLeft(cfg.focusMin * 60);
    }
    setIsRunning(false);
  }, [phase, cyclesThisRound, cfg, selectedTopic]);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          handlePhaseEnd();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [isRunning, handlePhaseEnd]);

  // ── Actions ───────────────────────────────────────────────────────────────

  function toggle() {
    setIsRunning((r) => !r);
  }

  function reset() {
    setIsRunning(false);
    setSecondsLeft(phaseDuration(phase, cfg));
  }

  function skipPhase() {
    setIsRunning(false);
    handlePhaseEnd();
  }

  function playChime() {
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {}
  }

  const progress = 1 - secondsLeft / totalSecs;
  const accent = phaseColor(phase);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700&family=DM+Mono:wght@400;500&display=swap');

        .pomo-root {
          --bg: #0e0f11;
          --surface: #16181c;
          --surface2: #1e2026;
          --border: #2a2d35;
          --text: #e8eaf0;
          --muted: #6b7280;
          font-family: 'Sora', sans-serif;
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 48px 24px;
        }

        .pomo-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 36px 40px;
          width: 100%;
          max-width: 500px;
          display: flex;
          flex-direction: column;
          gap: 0;
          animation: fadeUp 0.4s ease both;
        }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }

        /* Phase tabs */
        .phase-tabs {
          display: flex; gap: 6px;
          background: var(--surface2);
          border-radius: 10px; padding: 4px;
          margin-bottom: 32px;
        }
        .phase-tab {
          flex: 1; padding: 7px;
          border-radius: 7px; font-size: 12px;
          font-weight: 500; cursor: pointer;
          text-align: center; transition: all 0.2s;
          color: var(--muted); border: none; background: transparent;
        }
        .phase-tab.active { background: var(--bg); color: var(--text); }

        /* Ring area */
        .pomo-ring-area { position: relative; margin-bottom: 24px; }

        .phase-label {
          text-align: center; font-size: 12px;
          text-transform: uppercase; letter-spacing: 1.5px;
          color: var(--muted); margin-bottom: 12px;
        }

        /* Cycle dots */
        .cycle-dots {
          display: flex; gap: 6px;
          justify-content: center; margin-bottom: 28px;
        }
        .cycle-dot {
          width: 8px; height: 8px; border-radius: 50%;
          transition: background 0.3s;
        }

        /* Controls */
        .pomo-controls {
          display: flex; align-items: center;
          justify-content: center; gap: 12px;
          margin-bottom: 28px;
        }
        .pomo-btn {
          border: none; cursor: pointer; border-radius: 99px;
          font-family: 'Sora', sans-serif; font-weight: 600;
          transition: all 0.15s; display: flex;
          align-items: center; justify-content: center;
        }
        .pomo-btn-main {
          width: 64px; height: 64px; font-size: 22px;
          background: #a3e635; color: #0e0f11;
          box-shadow: 0 0 20px rgba(163,230,53,0.3);
        }
        .pomo-btn-main:hover { transform: scale(1.06); box-shadow: 0 0 28px rgba(163,230,53,0.5); }
        .pomo-btn-main.break { background: #34d399; box-shadow: 0 0 20px rgba(52,211,153,0.3); }
        .pomo-btn-main.long-break { background: #60a5fa; box-shadow: 0 0 20px rgba(96,165,250,0.3); }
        .pomo-btn-sec {
          width: 44px; height: 44px; font-size: 16px;
          background: var(--surface2);
          border: 1px solid var(--border); color: var(--muted);
        }
        .pomo-btn-sec:hover { color: var(--text); border-color: #3a3d45; }

        /* Topic picker */
        .topic-trigger {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 10px; padding: 12px 16px;
          display: flex; align-items: center;
          justify-content: space-between;
          cursor: pointer; margin-bottom: 20px;
          transition: border-color 0.2s;
        }
        .topic-trigger:hover { border-color: #3a3d45; }
        .topic-trigger-label { font-size: 11px; color: var(--muted); margin-bottom: 2px; }
        .topic-trigger-value { font-size: 13px; font-weight: 500; }
        .topic-chevron { font-size: 10px; color: var(--muted); }

        .topic-dropdown {
          background: var(--surface2); border: 1px solid var(--border);
          border-radius: 10px; overflow: hidden; margin-bottom: 20px;
        }
        .topic-option {
          padding: 11px 16px; cursor: pointer; font-size: 13px;
          display: flex; align-items: center; justify-content: space-between;
          transition: background 0.1s;
        }
        .topic-option:hover { background: rgba(255,255,255,0.04); }
        .topic-option-module { font-size: 11px; color: var(--muted); }

        /* Stats row */
        .pomo-stats {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 10px; margin-bottom: 24px;
        }
        .pomo-stat {
          background: var(--surface2); border-radius: 8px;
          padding: 10px 12px; text-align: center;
        }
        .pomo-stat-val {
          font-family: 'DM Mono', monospace;
          font-size: 22px; font-weight: 500; color: var(--text);
        }
        .pomo-stat-label { font-size: 10px; color: var(--muted); margin-top: 2px; }

        /* Log */
        .pomo-log-title {
          font-size: 11px; text-transform: uppercase;
          letter-spacing: 1px; color: var(--muted);
          margin-bottom: 10px;
        }
        .pomo-log-item {
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04);
          font-size: 12px; animation: fadeUp 0.3s ease both;
        }
        .pomo-log-label { color: var(--muted); flex: 1; }
        .pomo-log-time { color: var(--muted); font-family: 'DM Mono', monospace; font-size: 11px; margin-right: 8px; }
        .pomo-log-xp { color: #a3e635; font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500; }

        .empty-log { font-size: 12px; color: var(--muted); text-align: center; padding: 12px 0; }
      `}</style>

      <div className="pomo-root">
        <div className="pomo-card">
          {/* Phase Tabs */}
          <div className="phase-tabs">
            {(["focus", "short_break", "long_break"] as Phase[]).map((p) => (
              <button
                key={p}
                className={`phase-tab${phase === p ? " active" : ""}`}
                onClick={() => {
                  if (isRunning) return;
                  setPhase(p);
                  setSecondsLeft(phaseDuration(p, cfg));
                }}
              >
                {p === "focus" ? "Foco" : p === "short_break" ? "Pausa" : "Pausa longa"}
              </button>
            ))}
          </div>

          {/* Phase label */}
          <div className="phase-label" style={{ color: accent }}>
            {phaseLabel(phase)}
          </div>

          {/* Ring */}
          <div className="pomo-ring-area">
            <RingTimer
              progress={progress}
              phase={phase}
              timeStr={fmtTime(secondsLeft)}
              isRunning={isRunning}
            />
          </div>

          {/* Cycle dots */}
          <div className="cycle-dots">
            {Array.from({ length: cfg.cyclesBeforeLong }).map((_, i) => (
              <div
                key={i}
                className="cycle-dot"
                style={{
                  background:
                    i < cyclesThisRound % cfg.cyclesBeforeLong ||
                    (cyclesThisRound > 0 && cyclesThisRound % cfg.cyclesBeforeLong === 0)
                      ? accent
                      : "#2a2d35",
                  boxShadow: i < cyclesThisRound % cfg.cyclesBeforeLong
                    ? `0 0 6px ${accent}88`
                    : "none",
                }}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="pomo-controls">
            <button className="pomo-btn pomo-btn-sec" onClick={reset} title="Reiniciar">
              ↺
            </button>
            <button
              className={`pomo-btn pomo-btn-main${
                phase === "short_break" ? " break" : phase === "long_break" ? " long-break" : ""
              }`}
              onClick={toggle}
            >
              {isRunning ? "⏸" : "▶"}
            </button>
            <button className="pomo-btn pomo-btn-sec" onClick={skipPhase} title="Pular">
              ⏭
            </button>
          </div>

          {/* Stats */}
          <div className="pomo-stats">
            <div className="pomo-stat">
              <div className="pomo-stat-val" style={{ color: accent }}>{totalCycles}</div>
              <div className="pomo-stat-label">Ciclos totais</div>
            </div>
            <div className="pomo-stat">
              <div className="pomo-stat-val">{totalCycles * cfg.focusMin}</div>
              <div className="pomo-stat-label">Min. focados</div>
            </div>
            <div className="pomo-stat">
              <div className="pomo-stat-val" style={{ color: "#a3e635" }}>+{totalCycles * 20}</div>
              <div className="pomo-stat-label">XP ganho</div>
            </div>
          </div>

          {/* Topic */}
          <div
            className="topic-trigger"
            onClick={() => setShowTopicPicker((s) => !s)}
          >
            <div>
              <div className="topic-trigger-label">Tópico de estudo</div>
              <div className="topic-trigger-value">
                {selectedTopic ? selectedTopic.title : "Selecionar tópico..."}
              </div>
            </div>
            <span className="topic-chevron">{showTopicPicker ? "▲" : "▼"}</span>
          </div>

          {showTopicPicker && (
            <div className="topic-dropdown">
              {MOCK_TOPICS.map((t) => (
                <div
                  key={t.id}
                  className="topic-option"
                  onClick={() => {
                    setSelectedTopic(t);
                    setShowTopicPicker(false);
                  }}
                >
                  <span>{t.title}</span>
                  <span className="topic-option-module">{t.moduleTitle}</span>
                </div>
              ))}
            </div>
          )}

          {/* Session log */}
          <div className="pomo-log-title">Histórico da sessão</div>
          {log.length === 0 ? (
            <div className="empty-log">Nenhuma sessão completada ainda</div>
          ) : (
            log.map((entry, i) => (
              <div key={i} className="pomo-log-item">
                <span className="pomo-log-label">{entry.label}</span>
                <span className="pomo-log-time">{entry.time}</span>
                <span className="pomo-log-xp">+{entry.xp} XP</span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
