import { useState } from "react";
import { useLocation } from "wouter";
import { useI18n, type Language } from "@/lib/i18n";
import { Globe, ChevronDown, ArrowLeft } from "lucide-react";

const languageOptions: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Espa\u00f1ol" },
  { code: "fr", label: "Fran\u00e7ais" },
];

interface AuthCardProps {
  children: React.ReactNode;
  showBack?: boolean;
  backTo?: string;
}

export function AuthCard({ children, showBack = false, backTo = "/login" }: AuthCardProps) {
  const { lang, setLang, langName } = useI18n();
  const [, navigate] = useLocation();
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-[440px]">
        <div className="bg-white border border-gray-200 rounded-sm shadow-[0_2px_20px_rgba(0,0,0,0.08)]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <div className="flex items-center gap-2">
              {showBack && (
                <button
                  type="button"
                  onClick={() => navigate(backTo)}
                  className="text-gray-400 hover:text-gray-600 transition-colors mr-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div className="text-[15px] tracking-wide font-normal text-gray-900 select-none">
                <span className="font-light">My</span>
                <span className="font-bold">Paymentt</span>
                <span className="font-light">Vaulltr</span>
              </div>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center gap-1 text-gray-500 text-[13px] hover:text-gray-700 transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span>{langName}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showLangDropdown ? "rotate-180" : ""}`} />
              </button>
              {showLangDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowLangDropdown(false)} />
                  <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-sm shadow-lg z-20 overflow-hidden">
                    {languageOptions.map((opt) => (
                      <button
                        key={opt.code}
                        type="button"
                        onClick={() => { setLang(opt.code); setShowLangDropdown(false); }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${lang === opt.code ? "text-gray-900 font-semibold" : "text-gray-600"}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {children}
        </div>

        {/* Bottom footer */}
        <p className="text-[11px] text-gray-400 text-center mt-6">
          &copy; 2026 Onbe, Inc. |{" "}
          <button className="underline hover:text-gray-600">Terms of Use</button>
          {" | "}
          <button className="underline hover:text-gray-600">Privacy and Cookies</button>
        </p>
      </div>
    </div>
  );
}
