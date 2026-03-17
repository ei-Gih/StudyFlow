"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou senha incorretos.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Ocorreu um erro. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogle() {
    setIsGoogleLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  function fillDemo() {
    setEmail("demo@studyflow.app");
    setPassword("demo1234");
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700&family=DM+Mono:wght@400;500&display=swap');

        .auth-root {
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
          display: grid;
          grid-template-columns: 1fr 1fr;
        }

        @media (max-width: 768px) {
          .auth-root { grid-template-columns: 1fr; }
          .auth-brand { display: none !important; }
        }

        /* ── Brand panel ── */
        .auth-brand {
          background: var(--surface);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 56px;
          position: relative;
          overflow: hidden;
        }
        .brand-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(163,230,53,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(163,230,53,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .brand-content { position: relative; z-index: 1; }
        .brand-logo {
          display: flex; align-items: center; gap: 10px;
          font-size: 22px; font-weight: 700;
          color: var(--accent); margin-bottom: 48px;
          letter-spacing: -0.5px;
        }
        .brand-logo-dot {
          width: 10px; height: 10px;
          background: var(--accent); border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.5)} }

        .brand-headline {
          font-size: 36px; font-weight: 700;
          line-height: 1.2; letter-spacing: -1px;
          margin-bottom: 16px;
        }
        .brand-headline span { color: var(--accent); }
        .brand-sub { font-size: 15px; color: var(--muted); line-height: 1.6; max-width: 360px; margin-bottom: 48px; }

        .brand-features { display: flex; flex-direction: column; gap: 12px; }
        .brand-feature {
          display: flex; align-items: center; gap: 12px;
          font-size: 13px; color: var(--muted);
        }
        .feature-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--accent); flex-shrink: 0;
        }

        .brand-stats {
          display: grid; grid-template-columns: repeat(3,1fr);
          gap: 16px; margin-top: 48px;
        }
        .brand-stat {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 10px; padding: 14px 16px;
        }
        .brand-stat-val {
          font-family: 'DM Mono', monospace;
          font-size: 22px; font-weight: 500;
          color: var(--accent);
        }
        .brand-stat-lbl { font-size: 11px; color: var(--muted); margin-top: 2px; }

        /* ── Form panel ── */
        .auth-form-panel {
          display: flex; align-items: center; justify-content: center;
          padding: 40px 24px;
        }
        .auth-card {
          width: 100%; max-width: 400px;
          animation: fadeUp 0.4s ease both;
        }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }

        .auth-title { font-size: 26px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 6px; }
        .auth-subtitle { font-size: 13px; color: var(--muted); margin-bottom: 32px; }
        .auth-subtitle a { color: var(--accent); text-decoration: none; font-weight: 600; }
        .auth-subtitle a:hover { text-decoration: underline; }

        /* Demo banner */
        .demo-banner {
          background: rgba(163,230,53,0.06);
          border: 1px solid rgba(163,230,53,0.2);
          border-radius: 10px; padding: 12px 14px;
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 20px; font-size: 12px;
        }
        .demo-info { color: var(--muted); }
        .demo-info strong { color: var(--text); }
        .demo-btn {
          background: rgba(163,230,53,0.12); color: var(--accent);
          border: 1px solid rgba(163,230,53,0.25);
          border-radius: 6px; padding: 5px 12px;
          font-size: 11px; font-weight: 600;
          cursor: pointer; transition: all 0.15s;
          font-family: 'Sora', sans-serif;
        }
        .demo-btn:hover { background: rgba(163,230,53,0.2); }

        /* Form elements */
        .form-group { margin-bottom: 16px; }
        .form-label { font-size: 12px; font-weight: 600; color: var(--muted); margin-bottom: 7px; display: block; text-transform: uppercase; letter-spacing: 0.5px; }
        .form-input {
          width: 100%; padding: 12px 14px;
          background: var(--surface2); border: 1px solid var(--border);
          border-radius: 10px; color: var(--text);
          font-family: 'Sora', sans-serif; font-size: 14px;
          outline: none; transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .form-input:focus { border-color: var(--accent); }
        .form-input::placeholder { color: var(--muted); }
        .form-input.error { border-color: #f87171; }

        .forgot-link {
          display: block; text-align: right;
          font-size: 12px; color: var(--muted);
          text-decoration: none; margin-top: -8px; margin-bottom: 16px;
        }
        .forgot-link:hover { color: var(--text); }

        .error-msg {
          background: rgba(248,113,113,0.1);
          border: 1px solid rgba(248,113,113,0.25);
          border-radius: 8px; padding: 10px 14px;
          font-size: 13px; color: #f87171;
          margin-bottom: 16px;
        }

        .submit-btn {
          width: 100%; padding: 13px;
          background: var(--accent); color: #0e0f11;
          border: none; border-radius: 10px;
          font-family: 'Sora', sans-serif;
          font-size: 14px; font-weight: 700;
          cursor: pointer; transition: all 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-bottom: 12px;
        }
        .submit-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(163,230,53,0.3); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .divider {
          display: flex; align-items: center; gap: 12px;
          margin: 16px 0; font-size: 11px; color: var(--muted);
        }
        .divider::before, .divider::after {
          content: ''; flex: 1; height: 1px; background: var(--border);
        }

        .google-btn {
          width: 100%; padding: 12px;
          background: var(--surface2); color: var(--text);
          border: 1px solid var(--border); border-radius: 10px;
          font-family: 'Sora', sans-serif;
          font-size: 13px; font-weight: 500;
          cursor: pointer; transition: all 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .google-btn:hover:not(:disabled) { border-color: #3a3d45; background: #1a1c20; }
        .google-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(0,0,0,0.2);
          border-top-color: #0e0f11;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .google-icon {
          width: 18px; height: 18px; flex-shrink: 0;
        }
      `}</style>

      <div className="auth-root">
        {/* Brand panel */}
        <div className="auth-brand">
          <div className="brand-grid" />
          <div className="brand-content">
            <div className="brand-logo">
              <div className="brand-logo-dot" />
              StudyFlow
            </div>
            <div className="brand-headline">
              Estude com <span>método</span>,<br />evolua com <span>dados</span>.
            </div>
            <div className="brand-sub">
              Planos de estudo, pomodoro, flashcards com revisão espaçada, gamificação e analytics — tudo em um lugar.
            </div>

            <div className="brand-features">
              {[
                "Revisão espaçada estilo Anki integrada",
                "Timer pomodoro com rastreamento de XP",
                "Dashboard com progresso em tempo real",
                "Sugestões inteligentes baseadas no seu ritmo",
                "Streak diário e sistema de conquistas",
              ].map((f) => (
                <div key={f} className="brand-feature">
                  <div className="feature-dot" />
                  {f}
                </div>
              ))}
            </div>

            <div className="brand-stats">
              <div className="brand-stat">
                <div className="brand-stat-val">SM-2</div>
                <div className="brand-stat-lbl">Algoritmo</div>
              </div>
              <div className="brand-stat">
                <div className="brand-stat-val">+10</div>
                <div className="brand-stat-lbl">XP por tarefa</div>
              </div>
              <div className="brand-stat">
                <div className="brand-stat-val">∞</div>
                <div className="brand-stat-lbl">Planos</div>
              </div>
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="auth-form-panel">
          <div className="auth-card">
            <div className="auth-title">Entrar</div>
            <div className="auth-subtitle">
              Não tem conta?{" "}
              <Link href="/register">Criar agora — é grátis</Link>
            </div>

            {/* Demo banner */}
            <div className="demo-banner">
              <div className="demo-info">
                <strong>Conta demo</strong> disponível para testar
              </div>
              <button className="demo-btn" onClick={fillDemo}>
                Preencher
              </button>
            </div>

            {error && <div className="error-msg">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className={`form-input${error ? " error" : ""}`}
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Senha</label>
                <input
                  type="password"
                  className={`form-input${error ? " error" : ""}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              <Link href="/forgot-password" className="forgot-link">
                Esqueci minha senha
              </Link>

              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? <div className="spinner" /> : "Entrar"}
              </button>
            </form>

            <div className="divider">ou</div>

            <button
              className="google-btn"
              onClick={handleGoogle}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <div className="spinner" style={{ borderTopColor: "#e8eaf0" }} />
              ) : (
                <svg className="google-icon" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continuar com Google
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
