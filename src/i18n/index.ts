import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enCommon from "./locales/en/common.json";
import enAuth from "./locales/en/auth.json";
import enDashboard from "./locales/en/dashboard.json";
import enLanding from "./locales/en/landing.json";
import enCreatePdf from "./locales/en/create-pdf.json";
import enUpgrade from "./locales/en/upgrade.json";

import ptCommon from "./locales/pt/common.json";
import ptAuth from "./locales/pt/auth.json";
import ptDashboard from "./locales/pt/dashboard.json";
import ptLanding from "./locales/pt/landing.json";
import ptCreatePdf from "./locales/pt/create-pdf.json";
import ptUpgrade from "./locales/pt/upgrade.json";

const FALLBACK_LANGUAGE = "pt";
const storedLanguage =
  typeof window !== "undefined" ? window.localStorage.getItem("lang") ?? undefined : undefined;

const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    dashboard: enDashboard,
    landing: enLanding,
    "create-pdf": enCreatePdf,
    upgrade: enUpgrade,
  },
  pt: {
    common: ptCommon,
    auth: ptAuth,
    dashboard: ptDashboard,
    landing: ptLanding,
    "create-pdf": ptCreatePdf,
    upgrade: ptUpgrade,
  },
};

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: FALLBACK_LANGUAGE,
      lng: storedLanguage,
      supportedLngs: ["pt", "en"],
      load: "languageOnly",
      detection: {
        order: ["localStorage", "querystring", "navigator", "htmlTag"],
        lookupLocalStorage: "lang",
        caches: ["localStorage"],
      },
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
      ns: ["common", "auth", "dashboard", "landing", "create-pdf", "upgrade"],
      defaultNS: "common",
    });
}

const applyDocumentLanguage = (lng: string) => {
  if (typeof document !== "undefined") {
    document.documentElement.lang = lng;
  }
};

applyDocumentLanguage(i18n.language || FALLBACK_LANGUAGE);

i18n.on("languageChanged", (lng) => {
  applyDocumentLanguage(lng);
  if (typeof window !== "undefined") {
    window.localStorage.setItem("lang", lng);
  }
});

export default i18n;