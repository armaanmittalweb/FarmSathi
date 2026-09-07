import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import hi from "./locales/hi.json";
import pa from "./locales/pa.json";

// This i18n instance translates the app's UI chrome (buttons, labels).
// The chatbot's *content* is translated separately, server-side, by
// ai-service (see ai-service/llm.py + translate.py) — the two are
// intentionally decoupled.
const savedLanguage = (() => {
  try {
    return localStorage.getItem("farmsathi_language") || "en";
  } catch {
    return "en";
  }
})();

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    pa: { translation: pa },
  },
  lng: savedLanguage,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
