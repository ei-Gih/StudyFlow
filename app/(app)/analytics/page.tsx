"use client";

import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, RadialBarChart, RadialBar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts";
import { useAnalytics } from "@/hooks/useAnalytics";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, accent, animDelay = 0,
}: {
  label: string; value: string | number; sub?: string; accent: string; animDelay?: number;
}) {
  return (
    <div className="stat-card" style={{ animationDelay: `${animDelay}ms`, borderTop: `2px solid ${accent}` }}>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color: accent }}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

const CustomAreaTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="tt-date">{fmtDate(label)}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="tt-row">
          <span className="tt-dot" style={{ background: p.color }} />
          <span className="tt-label">{p.name}</span>
          <span className="tt-val">{fmtHours(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="tt-date">{fmtDate(label)}</div>
      <div className="tt-row">
        <span className="tt-dot" style={{ background: "#34d399" }} />
        <span className="tt-label">Tarefas</span>
        <span className="tt-val">{payload[0]?.value}</span>
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [range, setRange] = useState<7 | 30 | 90>(7);
  const { data, isLoading, error } = useAnalytics(range);

  const RANGE_OPTIONS: { label: string; value: 7 | 30 | 90 }[] = [
    { label: "7 dias", value: 7 },
    { label: "30 dias", value: 30 },
    { label: "90 dias", value: 90 },
  ];

  const reviewData = data
    ? [
        { name: "Fácil",   value: data.reviewBreakdown.EASY,  fill: "#a3e635" },
        { name: "Bom",     value: data.reviewBreakdown.GOOD,  fill: "#34d399" },
        { name: "Difícil", value: data.reviewBreakdown.HARD,  fill: "#fb923c" },
        { name: "Errei",   value: data.reviewBreakdown.AGAIN, fill: "#f87171" },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700&family=DM+Mono:wght@400;500&display=swap');

        .analytics-root {
          --bg:#0e0f11;--surface:#16181c;--surface2:#1e2026;
          --border:#2a2d35;--text:#e8eaf0;--muted:#6b7280;--accent:#a3e635;
          font-family:'Sora',sans-serif;background:var(--bg);color:var(--text);
          min-height:100vh;padding:32px 36px;
        }
        .an-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:28px;animation:fadeUp .35s ease both}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        .an-title{font-size:24px;font-weight:700;letter-spacing:-.5px}
        .an-sub{font-size:13px;color:var(--muted);margin-top:4px}
        .range-tabs{display:flex;gap:6px;background:var(--surface2);border-radius:10px;padding:4px}
        .range-tab{padding:7px 16px;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;color:var(--muted);border:none;background:transparent;font-family:'Sora',sans-serif}
        .range-tab.active{background:var(--bg);color:var(--text)}

        .stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px}
        .stat-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px 18px;animation:fadeUp .4s ease both;transition:border-color .2s}
        .stat-card:hover{border-color:#3a3d45}
        .stat-label{font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--muted)}
        .stat-value{font-family:'DM Mono',monospace;font-size:28px;font-weight:500;line-height:1;margin-top:6px}
        .stat-sub{font-size:11px;color:var(--muted);margin-top:4px}

        .charts-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px}
        .chart-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px 22px;animation:fadeUp .4s .1s ease both}
        .chart-title{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:16px}
        .full-width{grid-column:1/-1}

        .chart-tooltip{background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:10px 14px;font-family:'DM Mono',monospace;min-width:120px}
        .tt-date{font-size:10px;color:var(--muted);margin-bottom:6px}
        .tt-row{display:flex;align-items:center;gap:6px;font-size:12px;margin-top:3px}
        .tt-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
        .tt-label{flex:1;color:var(--muted);font-size:11px}
        .tt-val{color:var(--text);font-weight:500}

        .plans-list{display:flex;flex-direction:column;gap:14px}
        .plan-row{padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,.04)}
        .plan-row:last-child{border-bottom:none;padding-bottom:0}
        .plan-meta{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
        .plan-name{font-size:13px;font-weight:600}
        .plan-pct{font-family:'DM Mono',monospace;font-size:12px;font-weight:500;color:var(--accent)}
        .plan-bar-track{height:5px;background:var(--surface2);border-radius:99px;overflow:hidden;margin-bottom:4px}
        .plan-bar-fill{height:100%;border-radius:99px;transition:width 1s cubic-bezier(.16,1,.3,1)}
        .plan-tasks{font-size:11px;color:var(--muted)}

        .review-legend{display:flex;flex-direction:column;gap:8px;margin-top:12px}
        .rev-row{display:flex;align-items:center;gap:8px;font-size:12px}
        .rev-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
        .rev-name{flex:1;color:var(--muted)}
        .rev-count{font-family:'DM Mono',monospace;font-weight:500}
        .rev-pct{font-size:10px;color:var(--muted)}

        .xp-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px 22px;animation:fadeUp .4s .15s ease both}
        .xp-header{display:flex;align-items:center;gap:10px;margin-bottom:12px}
        .xp-level{font-family:'DM Mono',monospace;font-size:11px;font-weight:500;background:rgba(163,230,53,.12);color:var(--accent);border:1px solid rgba(163,230,53,.25);padding:2px 8px;border-radius:20px}
        .xp-total{font-family:'DM Mono',monospace;font-size:12px;color:var(--muted)}
        .xp-track{height:6px;background:var(--surface2);border-radius:99px;overflow:hidden;position:relative}
        .xp-fill{height:100%;background:var(--accent);border-radius:99px;box-shadow:0 0 10px rgba(163,230,53,.4);transition:width 1.2s cubic-bezier(.16,1,.3,1)}
        .xp-sub{font-size:11px;color:var(--muted);margin-top:6px}

        .streak-display{display:flex;align-items:center;gap:16px;padding:16px;background:var(--surface2);border-radius:10px;margin-top:16px}
        .streak-num{font-family:'DM Mono',monospace;font-size:42px;font-weight:500;color:var(--accent);line-height:1}
        .streak-info{flex:1}
        .streak-label{font-size:13px;font-weight:600}
        .streak-sub{font-size:11px;color:var(--muted);margin-top:2px}
        .streak-fire{font-size:24px;letter-spacing:2px}

        .loading{display:flex;align-items:center;justify-content:center;height:400px;font-size:14px;color:var(--muted)}
        .error{text-align:center;padding:48px;color:#f87171;font-size:14px}
      `}</style>

      <div className="analytics-root">
        {/* Header */}
        <div className="an-header">
          <div>
            <div className="an-title">Analytics</div>
            <div className="an-sub">Acompanhe sua evolução e produtividade</div>
          </div>
          <div className="range-tabs">
            {RANGE_OPTIONS.map((o) => (
              <button
                key={o.value}
                className={`range-tab${range === o.value ? " active" : ""}`}
                onClick={() => setRange(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading && <div className="loading">Carregando métricas...</div>}
        {error && <div className="error">Erro ao carregar analytics: {error}</div>}

        {data && !isLoading && (
          <>
            {/* Stat cards */}
            <div className="stat-grid">
              <StatCard
                label="Tempo estudado"
                value={fmtHours(data.summary.totalMinutes)}
                sub={`${range} dias`}
                accent="#a3e635"
                animDelay={0}
              />
              <StatCard
                label="Tarefas concluídas"
                value={data.summary.totalTasks}
                sub={`${range} dias`}
                accent="#34d399"
                animDelay={60}
              />
              <StatCard
                label="Sessões pomodoro"
                value={data.summary.totalPomodoros}
                sub="ciclos de foco"
                accent="#60a5fa"
                animDelay={120}
              />
              <StatCard
                label="Flashcards revisados"
                value={data.summary.totalReviews}
                sub={`${range} dias`}
                accent="#fb923c"
                animDelay={180}
              />
            </div>

            {/* Charts grid */}
            <div className="charts-grid">
              {/* Horas por dia */}
              <div className="chart-card full-width">
                <div className="chart-title">Minutos estudados por dia</div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart
                    data={data.dailyMinutes}
                    margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="gStudy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a3e635" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#a3e635" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gPomo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#6b7280", fontSize: 10, fontFamily: "DM Mono" }}
                      tickFormatter={fmtDate}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#6b7280", fontSize: 10, fontFamily: "DM Mono" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v}m`}
                    />
                    <Tooltip content={<CustomAreaTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="minutes"
                      name="Sessões livres"
                      stroke="#a3e635"
                      strokeWidth={2}
                      fill="url(#gStudy)"
                      dot={false}
                      activeDot={{ r: 4, fill: "#a3e635", strokeWidth: 0 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="pomodoroMinutes"
                      name="Pomodoro"
                      stroke="#60a5fa"
                      strokeWidth={2}
                      fill="url(#gPomo)"
                      dot={false}
                      activeDot={{ r: 4, fill: "#60a5fa", strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Tarefas por dia */}
              <div className="chart-card">
                <div className="chart-title">Tarefas concluídas por dia</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart
                    data={data.dailyTasks}
                    margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#6b7280", fontSize: 10, fontFamily: "DM Mono" }}
                      tickFormatter={fmtDate}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#6b7280", fontSize: 10, fontFamily: "DM Mono" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Bar dataKey="completed" radius={[4, 4, 0, 0]}>
                      {data.dailyTasks.map((_, i) => (
                        <Cell
                          key={i}
                          fill={_.completed > 0 ? "#34d399" : "#1e2026"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Revisão de flashcards */}
              <div className="chart-card">
                <div className="chart-title">Qualidade das revisões</div>
                {reviewData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={120}>
                      <RadialBarChart
                        innerRadius="40%"
                        outerRadius="100%"
                        data={reviewData}
                        startAngle={180}
                        endAngle={0}
                        barSize={12}
                      >
                        <RadialBar dataKey="value" cornerRadius={4} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="review-legend">
                      {reviewData.map((r) => {
                        const total = reviewData.reduce((a, b) => a + b.value, 0);
                        return (
                          <div key={r.name} className="rev-row">
                            <div className="rev-dot" style={{ background: r.fill }} />
                            <span className="rev-name">{r.name}</span>
                            <span className="rev-count" style={{ color: r.fill }}>{r.value}</span>
                            <span className="rev-pct">
                              {total > 0 ? `${Math.round((r.value / total) * 100)}%` : ""}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: "center", padding: "32px 0", fontSize: 13, color: "#6b7280" }}>
                    Sem revisões neste período
                  </div>
                )}
              </div>
            </div>

            {/* XP + Streak */}
            {data.userStats && (
              <div className="xp-card" style={{ marginBottom: 20 }}>
                <div className="xp-header">
                  <span className="xp-level">Nv. {data.userStats.level}</span>
                  <span className="xp-total">
                    {data.userStats.totalXp.toLocaleString("pt-BR")} XP no total
                  </span>
                </div>
                <div className="xp-track">
                  <div
                    className="xp-fill"
                    style={{
                      width: `${Math.round(((data.userStats.totalXp % 300) / 300) * 100)}%`,
                    }}
                  />
                </div>
                <div className="xp-sub">
                  {300 - (data.userStats.totalXp % 300)} XP para o próximo nível
                </div>

                <div className="streak-display">
                  <div className="streak-num">{data.userStats.streak}</div>
                  <div className="streak-info">
                    <div className="streak-label">dias de streak</div>
                    <div className="streak-sub">
                      Maior sequência: {data.userStats.longestStreak} dias
                    </div>
                  </div>
                  <div className="streak-fire">
                    {"🔥".repeat(Math.min(5, Math.ceil(data.userStats.streak / 3)))}
                  </div>
                </div>
              </div>
            )}

            {/* Progresso por plano */}
            {data.plansProgress.length > 0 && (
              <div className="chart-card">
                <div className="chart-title">Progresso por plano de estudo</div>
                <div className="plans-list">
                  {data.plansProgress.map((plan, i) => {
                    const colors = ["#a3e635", "#34d399", "#60a5fa", "#fb923c"];
                    const color = colors[i % colors.length];
                    return (
                      <div key={plan.id} className="plan-row">
                        <div className="plan-meta">
                          <span className="plan-name">{plan.title}</span>
                          <span className="plan-pct" style={{ color }}>
                            {plan.progressPct}%
                          </span>
                        </div>
                        <div className="plan-bar-track">
                          <div
                            className="plan-bar-fill"
                            style={{ width: `${plan.progressPct}%`, background: color }}
                          />
                        </div>
                        <div className="plan-tasks">
                          {plan.completedTasks} de {plan.totalTasks} tarefas concluídas
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
