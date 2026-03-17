"use client";

import { useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Difficulty = "EASY" | "MEDIUM" | "HARD";
type ReviewResult = "AGAIN" | "HARD" | "GOOD" | "EASY";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  difficulty: Difficulty;
  nextReviewAt: Date;
  reviewCount: number;
  topicTitle: string;
  moduleTitle: string;
}

// ─── Spaced Repetition Algorithm ──────────────────────────────────────────────
// Simple SM-2 inspired: EASY→7d, GOOD→3d, HARD→1d, AGAIN→now

function getNextReviewDate(result: ReviewResult): Date {
  const now = new Date();
  const days: Record<ReviewResult, number> = {
    EASY: 7,
    GOOD: 3,
    HARD: 1,
    AGAIN: 0,
  };
  const d = new Date(now);
  d.setDate(d.getDate() + days[result]);
  return d;
}

function resultLabel(r: ReviewResult): string {
  const map: Record<ReviewResult, string> = {
    AGAIN: "Errei",
    HARD: "Difícil",
    GOOD: "Bom",
    EASY: "Fácil",
  };
  return map[r];
}

function resultAccent(r: ReviewResult): string {
  const map: Record<ReviewResult, string> = {
    AGAIN: "#f87171",
    HARD: "#fb923c",
    GOOD: "#34d399",
    EASY: "#a3e635",
  };
  return map[r];
}

function resultInterval(r: ReviewResult): string {
  const map: Record<ReviewResult, string> = {
    AGAIN: "agora",
    HARD: "1 dia",
    GOOD: "3 dias",
    EASY: "7 dias",
  };
  return map[r];
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_CARDS: Flashcard[] = [
  {
    id: "1",
    front: "O que é Big O Notation?",
    back: "Uma notação matemática que descreve o comportamento limitante de uma função quando o argumento tende a um valor específico — usada para classificar algoritmos pela sua performance em termos de tempo ou espaço.",
    difficulty: "MEDIUM",
    nextReviewAt: new Date(),
    reviewCount: 3,
    topicTitle: "Big O Notation",
    moduleTitle: "Algoritmos",
  },
  {
    id: "2",
    front: "Qual a diferença entre `useEffect` e `useLayoutEffect`?",
    back: "`useEffect` roda de forma assíncrona após o paint do DOM. `useLayoutEffect` roda de forma síncrona após as mutações do DOM mas antes do paint — útil para medir o DOM ou evitar flashes visuais.",
    difficulty: "HARD",
    nextReviewAt: new Date(),
    reviewCount: 1,
    topicTitle: "React Hooks avançados",
    moduleTitle: "React",
  },
  {
    id: "3",
    front: "O que são Generics em TypeScript?",
    back: "Generics permitem criar componentes reutilizáveis que funcionam com múltiplos tipos. Exemplo: `function identity<T>(arg: T): T`. Isso mantém a tipagem sem abrir mão da flexibilidade.",
    difficulty: "EASY",
    nextReviewAt: new Date(),
    reviewCount: 8,
    topicTitle: "Generics",
    moduleTitle: "TypeScript",
  },
  {
    id: "4",
    front: "O que é um índice B-Tree no PostgreSQL?",
    back: "Um índice B-Tree (Balanced Tree) organiza os dados em uma estrutura de árvore balanceada. É o tipo padrão no Postgres e suporta buscas por igualdade e por range (>, <, BETWEEN). Operações em O(log n).",
    difficulty: "HARD",
    nextReviewAt: new Date(),
    reviewCount: 0,
    topicTitle: "Índices",
    moduleTitle: "PostgreSQL",
  },
];

// ─── Card Flip Component ───────────────────────────────────────────────────────

function FlipCard({
  card,
  isFlipped,
  onFlip,
}: {
  card: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
}) {
  return (
    <div className="flip-scene" onClick={onFlip}>
      <div className={`flip-card${isFlipped ? " flipped" : ""}`}>
        {/* Front */}
        <div className="flip-face flip-front">
          <div className="card-badge">
            <span className="card-module">{card.moduleTitle}</span>
            <span className="card-sep">›</span>
            <span className="card-topic">{card.topicTitle}</span>
          </div>
          <div className="card-question">{card.front}</div>
          <div className="card-flip-hint">Clique para revelar →</div>
          <div className="card-review-count">
            Revisão #{card.reviewCount + 1}
          </div>
        </div>

        {/* Back */}
        <div className="flip-face flip-back">
          <div className="card-back-label">Resposta</div>
          <div className="card-answer">{card.back}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Progress Bar ──────────────────────────────────────────────────────────────

function SessionProgress({
  done,
  total,
}: {
  done: number;
  total: number;
}) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="session-progress">
      <div className="session-progress-track">
        <div className="session-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="session-progress-label">
        {done} / {total} revisados
      </span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function FlashcardReview() {
  const [queue, setQueue] = useState<Flashcard[]>([...MOCK_CARDS]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [sessionLog, setSessionLog] = useState<
    { front: string; result: ReviewResult }[]
  >([]);
  const [finished, setFinished] = useState(false);
  const [showBack, setShowBack] = useState(false);

  const currentCard = queue[currentIndex];
  const totalCards = queue.length;

  const handleFlip = useCallback(() => {
    setIsFlipped((f) => !f);
    setShowBack(true);
  }, []);

  const handleRate = useCallback(
    (result: ReviewResult) => {
      if (!currentCard) return;

      // Log it
      setSessionLog((prev) => [
        { front: currentCard.front, result },
        ...prev,
      ]);

      // If AGAIN, push card back to end of queue with updated nextReview
      const updatedCard: Flashcard = {
        ...currentCard,
        reviewCount: currentCard.reviewCount + 1,
        nextReviewAt: getNextReviewDate(result),
        difficulty:
          result === "EASY"
            ? "EASY"
            : result === "HARD" || result === "AGAIN"
            ? "HARD"
            : "MEDIUM",
      };

      if (result === "AGAIN") {
        // Re-add at end
        setQueue((q) => {
          const newQ = [...q];
          newQ.splice(currentIndex, 1);
          newQ.push(updatedCard);
          return newQ;
        });
      } else {
        setQueue((q) => {
          const newQ = [...q];
          newQ[currentIndex] = updatedCard;
          return newQ;
        });
        setDoneCount((d) => d + 1);
        if (currentIndex + 1 >= queue.filter((c) => c.id !== (result === "AGAIN" ? "" : currentCard.id)).length) {
          // move forward
        }
      }

      // Advance or finish
      const nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length && result !== "AGAIN") {
        setFinished(true);
      } else {
        setCurrentIndex(result === "AGAIN" ? currentIndex : nextIndex % queue.length);
      }

      setIsFlipped(false);
      setShowBack(false);
    },
    [currentCard, currentIndex, queue]
  );

  function restart() {
    setQueue([...MOCK_CARDS]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowBack(false);
    setDoneCount(0);
    setSessionLog([]);
    setFinished(false);
  }

  // ── Styles ─────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700&family=DM+Mono:wght@400;500&display=swap');

        .fc-root {
          --bg: #0e0f11;
          --surface: #16181c;
          --surface2: #1e2026;
          --border: #2a2d35;
          --text: #e8eaf0;
          --muted: #6b7280;
          --accent: #a3e635;
          font-family: 'Sora', sans-serif;
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          padding: 48px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .fc-header {
          width: 100%; max-width: 540px;
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 20px;
          animation: fadeUp 0.3s ease both;
        }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }

        .fc-title { font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
        .fc-deck-size {
          font-family: 'DM Mono', monospace;
          font-size: 12px; color: var(--muted);
          background: var(--surface2);
          border: 1px solid var(--border);
          padding: 4px 10px; border-radius: 20px;
        }

        /* Progress */
        .session-progress {
          width: 100%; max-width: 540px;
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 28px;
          animation: fadeUp 0.3s 0.05s ease both;
        }
        .session-progress-track {
          flex: 1; height: 4px;
          background: var(--surface2); border-radius: 99px; overflow: hidden;
        }
        .session-progress-fill {
          height: 100%; background: var(--accent); border-radius: 99px;
          transition: width 0.6s cubic-bezier(0.16,1,0.3,1);
          box-shadow: 0 0 8px rgba(163,230,53,0.5);
        }
        .session-progress-label {
          font-family: 'DM Mono', monospace;
          font-size: 11px; color: var(--muted); white-space: nowrap;
        }

        /* Flip card */
        .flip-scene {
          width: 100%; max-width: 540px; height: 280px;
          perspective: 1200px; cursor: pointer;
          margin-bottom: 20px;
          animation: fadeUp 0.35s 0.1s ease both;
        }
        .flip-card {
          width: 100%; height: 100%; position: relative;
          transform-style: preserve-3d;
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .flip-card.flipped { transform: rotateY(180deg); }

        .flip-face {
          position: absolute; width: 100%; height: 100%;
          backface-visibility: hidden;
          border-radius: 16px;
          padding: 28px 32px;
          background: var(--surface);
          border: 1px solid var(--border);
          display: flex; flex-direction: column;
        }
        .flip-front { justify-content: center; }
        .flip-back {
          transform: rotateY(180deg);
          background: var(--surface2);
          border-color: rgba(163,230,53,0.2);
          justify-content: flex-start;
        }

        .card-badge {
          display: flex; align-items: center; gap: 6px;
          font-size: 11px; color: var(--muted);
          margin-bottom: 20px;
        }
        .card-module { color: var(--accent); font-weight: 600; }
        .card-sep { color: var(--muted); }
        .card-question {
          font-size: 18px; font-weight: 600;
          line-height: 1.45; letter-spacing: -0.3px;
          flex: 1;
        }
        .card-flip-hint {
          font-size: 11px; color: var(--muted);
          text-align: right; margin-top: 12px;
        }
        .card-review-count {
          position: absolute; top: 16px; right: 20px;
          font-family: 'DM Mono', monospace;
          font-size: 10px; color: var(--muted);
        }

        .card-back-label {
          font-size: 10px; text-transform: uppercase;
          letter-spacing: 1.5px; color: var(--accent);
          margin-bottom: 14px; font-weight: 600;
        }
        .card-answer {
          font-size: 14px; line-height: 1.7;
          color: var(--text); overflow-y: auto;
          max-height: 180px;
        }
        .card-answer code {
          font-family: 'DM Mono', monospace;
          background: rgba(255,255,255,0.06);
          padding: 2px 6px; border-radius: 4px;
          font-size: 13px;
        }

        /* Rating buttons */
        .rating-row {
          width: 100%; max-width: 540px;
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 8px; margin-bottom: 28px;
          animation: fadeUp 0.35s 0.15s ease both;
        }
        .rating-btn {
          border: 1px solid var(--border);
          background: var(--surface2);
          border-radius: 10px; padding: 12px 8px;
          cursor: pointer; transition: all 0.15s;
          display: flex; flex-direction: column;
          align-items: center; gap: 4px;
          opacity: ${showBack ? 1 : 0.3};
          pointer-events: ${showBack ? "auto" : "none"};
        }
        .rating-btn:hover { transform: translateY(-2px); }
        .rating-label { font-size: 12px; font-weight: 600; color: var(--text); }
        .rating-interval { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--muted); }

        /* Session log */
        .session-log {
          width: 100%; max-width: 540px;
          animation: fadeUp 0.35s 0.2s ease both;
        }
        .log-title {
          font-size: 11px; text-transform: uppercase;
          letter-spacing: 1px; color: var(--muted);
          margin-bottom: 10px;
        }
        .log-item {
          display: flex; align-items: center;
          gap: 10px; padding: 8px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          font-size: 12px;
        }
        .log-result-badge {
          font-size: 10px; font-weight: 600;
          padding: 2px 8px; border-radius: 20px;
          white-space: nowrap;
        }
        .log-front { color: var(--muted); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        /* Finished screen */
        .finished-screen {
          text-align: center; padding: 48px 24px;
          width: 100%; max-width: 540px;
          animation: fadeUp 0.4s ease both;
        }
        .finished-icon { font-size: 48px; margin-bottom: 16px; }
        .finished-title { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 8px; }
        .finished-sub { font-size: 14px; color: var(--muted); margin-bottom: 28px; }
        .finished-stats {
          display: grid; grid-template-columns: repeat(3,1fr);
          gap: 12px; margin-bottom: 28px;
        }
        .finished-stat {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 10px; padding: 14px;
        }
        .finished-stat-val {
          font-family: 'DM Mono', monospace;
          font-size: 24px; font-weight: 500; color: var(--accent);
        }
        .finished-stat-label { font-size: 11px; color: var(--muted); margin-top: 4px; }
        .btn-restart {
          background: var(--accent); color: #0e0f11;
          border: none; border-radius: 10px;
          padding: 12px 28px; font-family: 'Sora', sans-serif;
          font-size: 14px; font-weight: 700;
          cursor: pointer; transition: all 0.15s;
        }
        .btn-restart:hover { transform: scale(1.04); box-shadow: 0 0 20px rgba(163,230,53,0.4); }

        .flip-hint-bar {
          width: 100%; max-width: 540px;
          text-align: center; font-size: 12px;
          color: var(--muted); margin-bottom: 14px;
          animation: fadeUp 0.35s 0.15s ease both;
        }
      `}</style>

      <div className="fc-root">
        {finished ? (
          <div className="finished-screen">
            <div className="finished-icon">🎉</div>
            <div className="finished-title">Sessão concluída!</div>
            <div className="finished-sub">
              Você revisou {doneCount} flashcards nesta sessão.
            </div>
            <div className="finished-stats">
              {(["EASY", "GOOD", "HARD", "AGAIN"] as ReviewResult[]).map((r) => {
                const count = sessionLog.filter((l) => l.result === r).length;
                return (
                  <div key={r} className="finished-stat">
                    <div
                      className="finished-stat-val"
                      style={{ color: resultAccent(r) }}
                    >
                      {count}
                    </div>
                    <div className="finished-stat-label">{resultLabel(r)}</div>
                  </div>
                );
              })}
              <div className="finished-stat">
                <div className="finished-stat-val">+{doneCount * 5}</div>
                <div className="finished-stat-label">XP ganho</div>
              </div>
            </div>
            <button className="btn-restart" onClick={restart}>
              Revisar novamente
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="fc-header">
              <div className="fc-title">Flashcards</div>
              <div className="fc-deck-size">{totalCards} cards</div>
            </div>

            {/* Progress */}
            <SessionProgress done={doneCount} total={MOCK_CARDS.length} />

            {/* Card */}
            {currentCard && (
              <FlipCard
                card={currentCard}
                isFlipped={isFlipped}
                onFlip={handleFlip}
              />
            )}

            {/* Hint */}
            <div className="flip-hint-bar">
              {!showBack
                ? "Clique no card para revelar a resposta"
                : "Como você se saiu?"}
            </div>

            {/* Rating buttons */}
            <div className="rating-row">
              {(["AGAIN", "HARD", "GOOD", "EASY"] as ReviewResult[]).map(
                (r) => (
                  <button
                    key={r}
                    className="rating-btn"
                    style={{
                      borderColor: showBack ? `${resultAccent(r)}44` : "var(--border)",
                      opacity: showBack ? 1 : 0.3,
                      pointerEvents: showBack ? "auto" : "none",
                    }}
                    onClick={() => handleRate(r)}
                  >
                    <span
                      className="rating-label"
                      style={{ color: resultAccent(r) }}
                    >
                      {resultLabel(r)}
                    </span>
                    <span className="rating-interval">
                      {resultInterval(r)}
                    </span>
                  </button>
                )
              )}
            </div>

            {/* Session log */}
            {sessionLog.length > 0 && (
              <div className="session-log">
                <div className="log-title">Revisados agora</div>
                {sessionLog.slice(0, 5).map((entry, i) => (
                  <div key={i} className="log-item">
                    <span
                      className="log-result-badge"
                      style={{
                        background: `${resultAccent(entry.result)}22`,
                        color: resultAccent(entry.result),
                        border: `1px solid ${resultAccent(entry.result)}44`,
                      }}
                    >
                      {resultLabel(entry.result)}
                    </span>
                    <span className="log-front">{entry.front}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
