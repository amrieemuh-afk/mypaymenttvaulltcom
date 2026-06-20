import { useState } from "react";
import { useLocation } from "wouter";
import { AuthHeader } from "@/components/auth-header";
import { CheckCircle, Eye, EyeOff } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const DEPARTMENTS = ["IT", "Finance", "HR", "Marketing", "Operations"];

export default function CreateAccount() {
  const [, navigate] = useLocation();
  const { t } = useI18n();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    employeeId: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const set =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const inputClass =
    "w-full h-11 px-3 border border-gray-300 rounded-sm text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-500 transition-all bg-white";

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.firstName || !form.lastName || !form.email || !form.department) {
      setError("Please fill in all required fields.");
      return;
    }
    setStep(2);
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.username.length < 4) { setError("Username must be at least 4 characters."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setDone(true);
  };

  const stepDesc = step === 1 ? t.personalInfoDesc : t.credentialsDesc;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AuthHeader />

      <div className="w-full overflow-hidden" style={{ maxHeight: "310px" }}>
        <img src="/hero-card-clean.png" alt="MyPaymentVault" className="w-full object-cover"
          style={{ maxHeight: "310px", objectPosition: "center 20%" }} />
      </div>

      {!done ? (
        <div className="flex-1 flex flex-col md:flex-row">
          <div className="md:w-1/2 px-8 py-8">
            <p className="text-[12px] text-gray-500 mb-1">{t.stepOf.replace("{n}", String(step))}</p>
            <h2 className="text-[22px] font-light text-gray-800 tracking-wide border-b border-gray-300 pb-3 mb-4">
              {t.createAccountPageTitle}
            </h2>
            <p className="text-[13px] text-gray-600 leading-relaxed">{stepDesc}</p>
          </div>

          <div className="md:w-1/2 px-8 py-8 flex items-start justify-center md:justify-start">
            <div className="w-full max-w-[360px] bg-white border border-gray-200 rounded-sm shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                {[1, 2].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold transition-colors ${
                      step === s ? "bg-[#1a1a1a] text-white" : step > s ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"
                    }`}>
                      {step > s ? "✓" : s}
                    </div>
                    {s < 2 && <div className="h-px bg-gray-200 w-8" />}
                  </div>
                ))}
              </div>

              {step === 1 && (
                <form onSubmit={handleStep1} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] text-gray-500 mb-1">{t.firstName}<span className="text-red-500">*</span></label>
                      <input type="text" value={form.firstName} onChange={set("firstName")} required placeholder={t.firstName} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-[12px] text-gray-500 mb-1">{t.lastName}<span className="text-red-500">*</span></label>
                      <input type="text" value={form.lastName} onChange={set("lastName")} required placeholder={t.lastName} className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] text-gray-500 mb-1">{t.emailAddress}<span className="text-red-500">*</span></label>
                    <input type="email" value={form.email} onChange={set("email")} required placeholder="your@email.com" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-[12px] text-gray-500 mb-1">{t.department}<span className="text-red-500">*</span></label>
                    <select value={form.department} onChange={set("department")} required className={inputClass}>
                      <option value="">{t.selectDepartment}</option>
                      {DEPARTMENTS.map((d) => (<option key={d} value={d}>{d}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] text-gray-500 mb-1">{t.employeeId} <span className="text-gray-400 font-normal">{t.optional}</span></label>
                    <input type="text" value={form.employeeId} onChange={set("employeeId")} placeholder="e.g. EMP-001" className={inputClass} />
                  </div>
                  {error && <p className="text-red-500 text-[12px]">{error}</p>}
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => navigate("/login")}
                      className="flex-1 h-11 border border-gray-800 text-gray-800 text-[13px] font-medium rounded-sm hover:bg-gray-50 transition-colors">
                      {t.cancel}
                    </button>
                    <button type="submit"
                      className="flex-1 h-11 bg-[#1a1a1a] text-white text-[13px] font-medium rounded-sm hover:bg-[#333] transition-colors">
                      {t.continueBtn}
                    </button>
                  </div>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={handleStep2} className="space-y-3">
                  <div>
                    <label className="block text-[12px] text-gray-500 mb-1">{t.username}<span className="text-red-500">*</span></label>
                    <input type="text" value={form.username} onChange={set("username")} required placeholder={t.atLeast4} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-[12px] text-gray-500 mb-1">{t.password}<span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} value={form.password} onChange={set("password")} required
                        placeholder={t.atLeast6} className={`${inputClass} pr-10`} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] text-gray-500 mb-1">{t.confirmPassword}<span className="text-red-500">*</span></label>
                    <input type="password" value={form.confirmPassword} onChange={set("confirmPassword")} required
                      placeholder={t.reenterPassword} className={inputClass} />
                  </div>
                  {error && <p className="text-red-500 text-[12px]">{error}</p>}
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => { setError(""); setStep(1); }}
                      className="flex-1 h-11 border border-gray-800 text-gray-800 text-[13px] font-medium rounded-sm hover:bg-gray-50 transition-colors">
                      {t.back}
                    </button>
                    <button type="submit" disabled={loading}
                      className="flex-1 h-11 bg-[#1a1a1a] text-white text-[13px] font-medium rounded-sm hover:bg-[#333] transition-colors disabled:opacity-50">
                      {loading ? t.creating : t.createAccountBtn}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-[400px] text-center py-10">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h2 className="text-[17px] font-light text-gray-800 mb-2">{t.accountCreatedTitle}</h2>
            <p className="text-[13px] text-gray-500 mb-1">
              {t.accountCreatedDesc1}{" "}
              <span className="font-medium text-gray-700">{form.firstName} {form.lastName}</span>!
            </p>
            <p className="text-[13px] text-gray-500 mb-5">
              <span className="font-medium text-gray-700">@{form.username}</span>{" "}
              {t.accountCreatedDesc2}
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
