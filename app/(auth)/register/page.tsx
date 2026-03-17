"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function StrengthBar({ password }: { password: string }) {
  const checks = [
    { label: "8+ caracteres", ok: password.length >= 8 },
    { label: "Letra maiúscula", ok: /[A-Z]/.test(password) },
    { label: "Número", ok: /\d/.test(password) },
    { label: "Caractere especial", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ["#f87171", "#fb923c", "#fbbf24", "#a3e635"];
  const labels = ["Fraca", "Regular", "Boa", "Forte"];

  if (!password) return null;

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              flex: 1, height: 3, borderRadius: 99,
              background: i < score ? colors[score - 1] : "#2a2d35",
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {checks.map((c) => (
            <span
              key={c.label}
              style={{
                fontSize: 10, color: c.ok ? "#a3e635" : "#6b7280",
                display: "flex", alignItems: "center", gap: 3,
              }}
            >
              {c.ok ? "✓" : "○"} {c.label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span style={{ fontSize: 10, color: colors[score - 1], fontWeight: 600 }}>
            {labels[score - 1]}
          </span>
        )}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"form" | "success">("form");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const body = await res.json();

      if (!res.ok) {
        setError(body.error ?? "Erro ao criar conta.");
        return;
      }

      // Auto-login após registro
      const loginResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (loginResult?.ok) {
        router.replace("/dashboard");
        router.refresh();
      } else {
        setStep("success");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  if (step === "success") {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#0e0f11",
        fontFamily: "'Sora', sans-serif", color: "#e8eaf0", padding: 24,
      }}>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Conta criada!</div>
          <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>
            Acesse com suas credenciais para começar a estudar.
          </div>
          <Link href="/login" style={{
            background: "#a3e635", color: "#0e0f11",
            padding: "12px 28px", borderRadius: 10,
            fontWeight: 700, textDecoration: "none", fontSize: 14,
          }}>
            Fazer login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700&family=DM+Mono:wght@400;500&display=swap');
        .reg-root {
          --bg:#0e0f11;--surface:#16181c;--surface2:#1e2026;
          --border:#2a2d35;--text:#e8eaf0;--muted:#6b7280;--accent:#a3e635;
          font-family:'Sora',sans-serif;background:var(--bg);color:var(--text);
          min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px 24px;
        }
        .reg-card{width:100%;max-width:440px;animation:fadeUp .4s ease both}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        .reg-logo{display:flex;align-items:center;gap:8px;font-size:18px;font-weight:700;color:var(--accent);margin-bottom:32px;letter-spacing:-.5px}
        .reg-logo-dot{width:8px;height:8px;background:var(--accent);border-radius:50%;animation:pulse 2s ease-in-out infinite}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.5)}}
        .reg-title{font-size:26px;font-weight:700;letter-spacing:-.5px;margin-bottom:6px}
        .reg-sub{font-size:13px;color:var(--muted);margin-bottom:28px}
        .reg-sub a{color:var(--accent);text-decoration:none;font-weight:600}
        .reg-sub a:hover{text-decoration:underline}
        .form-group{margin-bottom:16px}
        .form-label{font-size:11px;font-weight:600;color:var(--muted);margin-bottom:7px;display:block;text-transform:uppercase;letter-spacing:.5px}
        .form-input{width:100%;padding:12px 14px;background:var(--surface2);border:1px solid var(--border);border-radius:10px;color:var(--text);font-family:'Sora',sans-serif;font-size:14px;outline:none;transition:border-color .2s;box-sizing:border-box}
        .form-input:focus{border-color:var(--accent)}
        .form-input::placeholder{color:var(--muted)}
        .form-input.error{border-color:#f87171}
        .form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .error-msg{background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.25);border-radius:8px;padding:10px 14px;font-size:13px;color:#f87171;margin-bottom:16px}
        .submit-btn{width:100%;padding:13px;background:var(--accent);color:#0e0f11;border:none;border-radius:10px;font-family:'Sora',sans-serif;font-size:14px;font-weight:700;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:16px}
        .submit-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 4px 20px rgba(163,230,53,.3)}
        .submit-btn:disabled{opacity:.6;cursor:not-allowed;transform:none}
        .divider{display:flex;align-items:center;gap:12px;margin:0 0 16px;font-size:11px;color:var(--muted)}
        .divider::before,.divider::after{content:'';flex:1;height:1px;background:var(--border)}
        .google-btn{width:100%;padding:12px;background:var(--surface2);color:var(--text);border:1px solid var(--border);border-radius:10px;font-family:'Sora',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:10px}
        .google-btn:hover{border-color:#3a3d45;background:#1a1c20}
        .terms{font-size:11px;color:var(--muted);text-align:center;margin-top:16px;line-height:1.5}
        .terms a{color:var(--muted);text-decoration:underline}
        .spinner{width:16px;height:16px;border:2px solid rgba(0,0,0,.2);border-top-color:#0e0f11;border-radius:50%;animation:spin .7s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <div className="reg-root">
        <div className="reg-card">
          <div className="reg-logo">
            <div className="reg-logo-dot" />
            StudyFlow
          </div>

          <div className="reg-title">Criar conta grátis</div>
          <div className="reg-sub">
            Já tem conta? <Link href="/login">Fazer login</Link>
          </div>

          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nome completo</label>
              <input
                type="text"
                className="form-input"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Senha</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <StrengthBar password={password} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirmar senha</label>
                <input
                  type="password"
                  className={`form-input${confirm && confirm !== password ? " error" : ""}`}
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                {confirm && confirm !== password && (
                  <div style={{ fontSize: 11, color: "#f87171", marginTop: 5 }}>
                    Senhas não coincidem
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={isLoading || (!!confirm && confirm !== password)}
            >
              {isLoading ? <div className="spinner" /> : "Criar minha conta"}
            </button>
          </form>

          <div className="divider">ou</div>

          <button
            className="google-btn"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar com Google
          </button>

          <div className="terms">
            Ao criar uma conta você concorda com os{" "}
            <Link href="/terms">Termos de Uso</Link> e{" "}
            <Link href="/privacy">Política de Privacidade</Link>.
          </div>
        </div>
      </div>
    </>
  );
}
