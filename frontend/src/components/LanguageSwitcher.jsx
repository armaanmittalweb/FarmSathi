import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "hi", label: "हि" },
  { code: "pa", label: "ਪੰ" },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    try {
      localStorage.setItem("farmsathi_language", code);
    } catch {
      // ignore storage failures
    }
  };

  return (
    <div role="radiogroup" aria-label="Language" className="inline-flex gap-0.5 rounded-full bg-sand-100 p-1">
      {LANGUAGES.map((lang) => {
        const active = i18n.language === lang.code;
        return (
          <button
            key={lang.code}
            role="radio"
            aria-checked={active}
            onClick={() => changeLanguage(lang.code)}
            className={`min-w-9 rounded-full px-2 py-1 text-sm font-medium transition-colors ${
              active ? "bg-white text-moss-700 shadow-sm" : "text-sand-500 hover:text-sand-800"
            }`}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}
