"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Module {
  id: string;
  title: string;
  completedTasks: number;
  totalTasks: number;
  color: string;
}

interface DashboardData {
  userName: string;
  totalXp: number;
  level: number;
  xpToNextLevel: number;
  streak: number;
  totalMinutesToday: number;
  tasksCompletedToday: number;
  tasksPendingTotal: number;
  modules: Module[];
  weeklyHours: { day: string; hours: number }[];
  suggestion: string;
}

// ─── Mock (substituir por fetch real) ─────────────────────────────────────────

const MOCK: DashboardData = {
  userName: "Lucas",
  totalXp: 2340,
  level: 8,
  xpToNextLevel: 3000,
  streak: 12,
  totalMinutesToday: 94,
  tasksCompletedToday: 7,
  tasksPendingTotal: 14,
  modules: [
    { id: "1", title: "Algoritmos", completedTasks: 8, totalTasks: 10, color: "#a3e635" },
    { id: "2", title: "React Avançado", completedTasks: 5, totalTasks: 12, color: "#34d399" },
    { id: "3", title: "TypeScript", completedTasks: 3, totalTasks: 8, color: "#fb923c" },
    { id: "4", title: "PostgreSQL", completedTasks: 1, totalTasks: 6, color: "#60a5fa" },
  ],
  weeklyHours: [
    { day: "Seg", hours: 1.5 },
    { day: "Ter", hours: 2.2 },
    { day: "Qua", hours: 0.8 },
    { day: "Qui", hours: 3.1 },
    { day: "Sex", hours: 1.6 },
    { day: "Sáb", hours: 2.9 },
    { day: "Dom", hours: 1.0 },
  ],
  suggestion: "Você tem 30 min livres. Sugestão: revisar Closures em JavaScript — 3 tarefas pendentes.",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  unit,
  accent,
  animIndex,
}: {
  label: string;
  value: string | number;
  unit?: string;
  accent: string;
  animIndex: number;
}) {
  return (
    <div
      className="stat-card"
      style={{
        animationDelay: `${animIndex * 80}ms`,
        borderTop: `2px solid ${accent}`,
      }}
    >
      <span className="stat-label">{label}</span>
      <div className="stat-value-row">
        <span className="stat-value">{value}</span>
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
    </div>
  );
}

function XPBar({ xp, max, level }: { xp: number; max: number; level: number }) {
  const pct = Math.round((xp / max) * 100);
  return (
    <div className="xp-bar-wrapper">
      <div className="xp-bar-header">
        <span className="xp-level-badge">Nv. {level}</span>
        <span className="xp-text">
          {xp.toLocaleString()} / {max.toLocaleString()} XP
        </span>
      </div>
      <div className="xp-track">
        <div className="xp-fill" style={{ width: `${pct}%` }} />
        <div className="xp-glow" style={{ left: `${pct}%` }} />
      </div>
      <span className="xp-pct">{pct}% para o próximo nível</span>
    </div>
  );
}

function ModuleProgress({ modules }: { modules: Module[] }) {
  return (
    <div className="module-list">
      {modules.map((m, i) => {
        const pct = Math.round((m.completedTasks / m.totalTasks) * 100);
        return (
          <div key={m.id} className="module-row" style={{ animationDelay: `${i * 60 + 200}ms` }}>
            <div className="module-meta">
              <span className="module-dot" style={{ background: m.color }} />
              <span className="module-title">{m.title}</span>
              <span className="module-count">
                {m.completedTasks}/{m.totalTasks}
              </span>
              <span className="module-pct" style={{ color: m.color }}>
                {pct}%
              </span>
            </div>
            <div className="module-track">
              <div
                className="module-fill"
                style={{ width: `${pct}%`, background: m.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="chart-tooltip">
        <span className="tooltip-day">{label}</span>
        <span className="tooltip-val">{payload[0].value}h</span>
      </div>
    );
  }
  return null;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [data] = useState<DashboardData>(MOCK);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const hours = String(time.getHours()).padStart(2, "0");
  const mins = String(time.getMinutes()).padStart(2, "0");
  const dateStr = time.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700&family=DM+Mono:wght@400;500&display=swap');

        .sf-dashboard {
          --bg: #0e0f11;
          --surface: #16181c;
          --surface2: #1e2026;
          --border: #2a2d35;
          --text: #e8eaf0;
          --muted: #6b7280;
          --accent: #a3e635;
          --accent2: #34d399;
          --danger: #f87171;
          font-family: 'Sora', sans-serif;
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          padding: 0;
        }

        /* ── Layout ── */
        .sf-layout { display: grid; grid-template-columns: 240px 1fr; min-height: 100vh; }

        /* ── Sidebar ── */
        .sf-sidebar {
          background: var(--surface);
          border-right: 1px solid var(--border);
          padding: 28px 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .sf-logo {
          font-size: 18px;
          font-weight: 700;
          color: var(--accent);
          letter-spacing: -0.5px;
          margin-bottom: 28px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sf-logo-dot {
          width: 8px; height: 8px;
          background: var(--accent);
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }
        .sf-nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 8px;
          font-size: 13px; color: var(--muted);
          cursor: pointer; transition: all 0.15s;
          border: 1px solid transparent;
        }
        .sf-nav-item:hover { color: var(--text); background: var(--surface2); }
        .sf-nav-item.active {
          color: var(--accent); background: rgba(163,230,53,0.08);
          border-color: rgba(163,230,53,0.2);
        }
        .sf-nav-icon { font-size: 15px; width: 18px; text-align: center; }
        .sf-sidebar-spacer { flex: 1; }
        .sf-user-pill {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 8px;
          background: var(--surface2); border: 1px solid var(--border);
        }
        .sf-avatar {
          width: 30px; height: 30px; border-radius: 50%;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; color: #0e0f11;
        }
        .sf-user-name { font-size: 13px; font-weight: 600; }
        .sf-user-level { font-size: 11px; color: var(--muted); font-family: 'DM Mono', monospace; }

        /* ── Main ── */
        .sf-main { padding: 32px 36px; overflow-y: auto; }

        /* ── Header ── */
        .sf-header {
          display: flex; align-items: flex-start;
          justify-content: space-between; margin-bottom: 32px;
          animation: fadeUp 0.4s ease both;
        }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        .sf-greeting { font-size: 26px; font-weight: 700; letter-spacing: -0.8px; }
        .sf-greeting span { color: var(--accent); }
        .sf-date { font-size: 13px; color: var(--muted); margin-top: 4px; text-transform: capitalize; }
        .sf-clock {
          font-family: 'DM Mono', monospace;
          font-size: 36px; font-weight: 500;
          color: var(--text); letter-spacing: -1px;
          line-height: 1;
        }
        .sf-clock-sep { animation: blink 1s step-end infinite; }
        @keyframes blink { 50%{opacity:0} }

        /* ── Stats row ── */
        .sf-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 14px; margin-bottom: 24px;
        }
        .stat-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px 18px;
          animation: fadeUp 0.4s ease both;
          transition: border-color 0.2s;
        }
        .stat-card:hover { border-color: #3a3d45; }
        .stat-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.8px; }
        .stat-value-row { display: flex; align-items: baseline; gap: 4px; margin-top: 6px; }
        .stat-value { font-family: 'DM Mono', monospace; font-size: 28px; font-weight: 500; line-height: 1; }
        .stat-unit { font-size: 12px; color: var(--muted); }

        /* ── XP Bar ── */
        .xp-bar-wrapper {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 12px; padding: 16px 20px;
          margin-bottom: 24px;
          animation: fadeUp 0.4s 0.1s ease both;
        }
        .xp-bar-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .xp-level-badge {
          font-family: 'DM Mono', monospace;
          font-size: 11px; font-weight: 500;
          background: rgba(163,230,53,0.12); color: var(--accent);
          border: 1px solid rgba(163,230,53,0.25);
          padding: 2px 8px; border-radius: 20px;
        }
        .xp-text { font-family: 'DM Mono', monospace; font-size: 12px; color: var(--muted); }
        .xp-track {
          height: 6px; background: var(--surface2);
          border-radius: 99px; position: relative; overflow: hidden;
        }
        .xp-fill {
          height: 100%; background: var(--accent);
          border-radius: 99px;
          transition: width 1.2s cubic-bezier(0.16,1,0.3,1);
          box-shadow: 0 0 12px rgba(163,230,53,0.5);
        }
        .xp-glow {
          position: absolute; top: -2px;
          width: 8px; height: 10px;
          background: white; filter: blur(3px);
          border-radius: 99px;
          transform: translateX(-50%);
          pointer-events: none;
        }
        .xp-pct { font-size: 11px; color: var(--muted); margin-top: 6px; display: block; }

        /* ── Grid bottom ── */
        .sf-grid-2 {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 20px; margin-bottom: 24px;
        }
        .sf-panel {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 12px; padding: 20px 22px;
          animation: fadeUp 0.4s 0.2s ease both;
        }
        .sf-panel-title {
          font-size: 11px; text-transform: uppercase;
          letter-spacing: 1px; color: var(--muted);
          margin-bottom: 16px;
        }

        /* ── Modules ── */
        .module-list { display: flex; flex-direction: column; gap: 12px; }
        .module-row { animation: fadeUp 0.35s ease both; }
        .module-meta {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 5px; font-size: 13px;
        }
        .module-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .module-title { flex: 1; font-weight: 500; }
        .module-count { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--muted); }
        .module-pct { font-family: 'DM Mono', monospace; font-size: 12px; font-weight: 500; min-width: 34px; text-align: right; }
        .module-track {
          height: 4px; background: var(--surface2);
          border-radius: 99px; overflow: hidden;
        }
        .module-fill {
          height: 100%; border-radius: 99px;
          transition: width 1s cubic-bezier(0.16,1,0.3,1);
        }

        /* ── Chart ── */
        .chart-tooltip {
          background: var(--surface2); border: 1px solid var(--border);
          border-radius: 8px; padding: 8px 12px;
          font-family: 'DM Mono', monospace;
        }
        .tooltip-day { font-size: 11px; color: var(--muted); display: block; }
        .tooltip-val { font-size: 16px; color: var(--accent); font-weight: 500; }

        /* ── AI Suggestion ── */
        .sf-suggestion {
          background: rgba(163,230,53,0.05);
          border: 1px solid rgba(163,230,53,0.2);
          border-radius: 12px; padding: 16px 20px;
          display: flex; align-items: flex-start; gap: 12px;
          animation: fadeUp 0.4s 0.3s ease both;
        }
        .suggestion-icon {
          font-size: 18px; flex-shrink: 0; margin-top: 1px;
        }
        .suggestion-label {
          font-size: 10px; text-transform: uppercase;
          letter-spacing: 1px; color: var(--accent);
          margin-bottom: 4px; font-weight: 600;
        }
        .suggestion-text { font-size: 13px; color: var(--text); line-height: 1.5; }

        /* ── Streak badge ── */
        .streak-display {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; height: 100%;
          padding: 8px;
        }
        .streak-number {
          font-family: 'DM Mono', monospace;
          font-size: 56px; font-weight: 500;
          color: var(--accent); line-height: 1;
          text-shadow: 0 0 30px rgba(163,230,53,0.4);
        }
        .streak-label { font-size: 12px; color: var(--muted); margin-top: 4px; }
        .streak-flames { font-size: 20px; margin-top: 8px; letter-spacing: 2px; }
      `}</style>

      <div className="sf-dashboard">
        <div className="sf-layout">
          {/* ── Sidebar ── */}
          <aside className="sf-sidebar">
            <div className="sf-logo">
              <div className="sf-logo-dot" />
              StudyFlow
            </div>
            {[
              { icon: "◈", label: "Dashboard", active: true },
              { icon: "◻", label: "Planos de Estudo" },
              { icon: "◷", label: "Pomodoro" },
              { icon: "◈", label: "Flashcards" },
              { icon: "◑", label: "Agenda" },
              { icon: "◔", label: "Analytics" },
              { icon: "◎", label: "Configurações" },
            ].map((item) => (
              <div
                key={item.label}
                className={`sf-nav-item${item.active ? " active" : ""}`}
              >
                <span className="sf-nav-icon">{item.icon}</span>
                {item.label}
              </div>
            ))}
            <div className="sf-sidebar-spacer" />
            <div className="sf-user-pill">
              <div className="sf-avatar">
                {data.userName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="sf-user-name">{data.userName}</div>
                <div className="sf-user-level">Nv. {data.level} · {data.totalXp.toLocaleString()} XP</div>
              </div>
            </div>
          </aside>

          {/* ── Main ── */}
          <main className="sf-main">
            {/* Header */}
            <header className="sf-header">
              <div>
                <div className="sf-greeting">
                  Olá, <span>{data.userName}</span> 👋
                </div>
                <div className="sf-date">{dateStr}</div>
              </div>
              <div className="sf-clock">
                {hours}
                <span className="sf-clock-sep">:</span>
                {mins}
              </div>
            </header>

            {/* Stats */}
            <div className="sf-stats">
              <StatCard label="Min. hoje" value={data.totalMinutesToday} unit="min" accent="#a3e635" animIndex={0} />
              <StatCard label="Tarefas hoje" value={data.tasksCompletedToday} accent="#34d399" animIndex={1} />
              <StatCard label="Pendentes" value={data.tasksPendingTotal} accent="#fb923c" animIndex={2} />
              <StatCard label="Streak" value={data.streak} unit="dias" accent="#60a5fa" animIndex={3} />
            </div>

            {/* XP */}
            <XPBar xp={data.totalXp} max={data.xpToNextLevel} level={data.level} />

            {/* Grid 2 col */}
            <div className="sf-grid-2">
              {/* Módulos */}
              <div className="sf-panel">
                <div className="sf-panel-title">Progresso por módulo</div>
                <ModuleProgress modules={data.modules} />
              </div>

              {/* Chart */}
              <div className="sf-panel">
                <div className="sf-panel-title">Horas estudadas — semana</div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={data.weeklyHours} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a3e635" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#a3e635" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 11, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 10, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="hours" stroke="#a3e635" strokeWidth={2} fill="url(#areaGrad)" dot={false} activeDot={{ r: 4, fill: "#a3e635", strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>

                {/* Streak */}
                <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
                  <div className="streak-display">
                    <div className="streak-number">{data.streak}</div>
                    <div className="streak-label">dias consecutivos</div>
                    <div className="streak-flames">
                      {"🔥".repeat(Math.min(data.streak, 5))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Suggestion */}
            <div className="sf-suggestion">
              <span className="suggestion-icon">✦</span>
              <div>
                <div className="suggestion-label">Sugestão de IA</div>
                <div className="suggestion-text">{data.suggestion}</div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
