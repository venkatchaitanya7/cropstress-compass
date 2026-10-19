// i18n helper: one t(key) function, pre-translated JSON files, no runtime translation API.
// Every JSON file is marked "_note": "needs review by a native speaker".
import en from "@/i18n/en.json";
import hi from "@/i18n/hi.json";
import kn from "@/i18n/kn.json";
import te from "@/i18n/te.json";
import ta from "@/i18n/ta.json";

export const LANGS = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "te", label: "తెలుగు" },
  { code: "ta", label: "தமிழ்" },
] as const;

export type Lang = (typeof LANGS)[number]["code"];

const DICTS: Record<Lang, Record<string, string>> = { en, hi, kn, te, ta };

const KEY = "agrosentinel-lang";

export function getStoredLang(): Lang {
  if (typeof window === "undefined") return "en";
  const v = window.localStorage.getItem(KEY);
  return (LANGS.some((l) => l.code === v) ? v : "en") as Lang;
}

export function storeLang(l: Lang) {
  window.localStorage.setItem(KEY, l);
}

export function makeT(lang: Lang) {
  const dict = DICTS[lang];
  return (key: string, params?: Record<string, string | number>): string => {
    let s = dict[key] ?? DICTS.en[key] ?? key;
    if (params) for (const [k, v] of Object.entries(params)) s = s.replace(`{${k}}`, String(v));
    return s;
  };
}

/** BCP-47 codes for speechSynthesis. */
export const SPEECH_LANG: Record<Lang, string> = {
  en: "en-IN",
  hi: "hi-IN",
  kn: "kn-IN",
  te: "te-IN",
  ta: "ta-IN",
};
