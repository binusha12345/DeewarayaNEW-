import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";

const languages = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "si", label: "සිංහල",   flag: "🇱🇰" },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const currentLang =
    languages.find((l) => (i18n.language || "").startsWith(l.code)) || languages[0];

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem("appLang", code);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-full
                   bg-blue-600 hover:bg-blue-700 text-white text-sm
                   font-medium transition-all shadow-md"
      >
        <Globe size={16} />
        <span>{currentLang.flag}</span>
        <span>{currentLang.label}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl
                        shadow-2xl border border-gray-100 overflow-hidden z-[9999]">
          {languages.map((lang) => {
            const isSelected = (i18n.language || "").startsWith(lang.code);
            return (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm
                            hover:bg-blue-50 transition
                            ${isSelected
                              ? "bg-blue-50 text-blue-600 font-bold"
                              : "text-gray-700"}`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="flex-1 text-left">{lang.label}</span>
                {isSelected && <Check size={16} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
