import { useState } from "react";
import { useI18n, type Language } from "@/lib/i18n";
import { Globe, ChevronDown } from "lucide-react";

const languageOptions: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Espa\u00f1ol" },
  { code: "fr", label: "Fran\u00e7ais" },
];

export function AuthHeader() {
  const { lang, setLang, langName } = useI18n();
  const [showDrop, setShowDrop] = useState(false);

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
      <div className="text-[13px] font-semibold tracking-[0.2em] text-gray-800 select-none">
        MyPaymenttVaulltr
      </div>
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowDrop(!showDrop)}
          className="flex items-center gap-1 text-gray-500 text-[13px] hover:text-gray-700 transition-colors"
        >
          <Globe className="w-4 h-4" />
          <span>{langName}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDrop ? "rotate-180" : ""}`} />
        </button>
        {showDrop && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowDrop(false)} />
            <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-sm shadow-lg z-20 overflow-hidden">
              {languageOptions.map((opt) => (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => { setLang(opt.code); setShowDrop(false); }}
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
  );
}
