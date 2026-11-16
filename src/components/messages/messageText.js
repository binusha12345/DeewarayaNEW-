// Turns a message into text in the viewer's language (English / Sinhala).
// - System messages (trip, weather, safe) use their stored type + values and the i18n files.
// - Quick replies use the built-in English/Sinhala phrases.
// - Anything people typed is machine-translated (cached on the server) when it's in the other language.
import { QUICK_REPLIES } from "../../services/messagesApi";

const SINHALA = /[඀-෿]/;
export const uiLang = (i18n) => (i18n.language?.startsWith("si") ? "si" : "en");

const QUICK_BY_KEY = Object.fromEntries([...QUICK_REPLIES.driver, ...QUICK_REPLIES.owner].map((q) => [q.key, q]));

export function systemText(m, t) {
  const { key, params = {} } = m.meta || {};
  if (!key) return null;
  if (key === "tripEnded") {
    const mins = Number(params.minutes) || 0;
    const duration = mins >= 60 ? t("messages.durationHM", { h: Math.floor(mins / 60), m: mins % 60 }) : t("messages.durationM", { m: mins });
    return t("messages.sys.tripEnded", { duration, km: params.km ?? 0 });
  }
  if (key === "weather") {
    return t("messages.sys.weather", {
      place: params.place ? t("messages.sys.near", { place: params.place }) : "",
      wind: params.wind,
      dir: params.dir ? t("messages.sys.from", { dir: params.dir }) : "",
      waves: params.waves ? t("messages.sys.waves", { m: params.waves }) : "",
    });
  }
  return t(`messages.sys.${key}`, { name: params.name || "", defaultValue: m.text });
}

export const quickText = (m, lang) => (m.kind === "quick" && QUICK_BY_KEY[m.quickKey] ? QUICK_BY_KEY[m.quickKey][lang] : null);

// Does this message's typed text need machine translation for this language?
export function needsTranslation(m, lang) {
  if (!m || m.deletedAt || !m.text || m.meta?.key || quickText(m, lang)) return false;
  const isSinhala = SINHALA.test(m.text);
  return lang === "si" ? !isSinhala : isSinhala;
}

// Text to show, plus whether it's a translation.
export function displayText(m, { t, lang, translated, showOriginal }) {
  const sys = systemText(m, t);
  if (sys) return { text: sys, isTranslation: false };
  const quick = quickText(m, lang);
  if (quick) return { text: quick, isTranslation: false };
  if (!showOriginal && needsTranslation(m, lang)) {
    const tr = translated || m.translations?.[lang];
    if (tr) return { text: tr, isTranslation: true };
  }
  return { text: m.text || "", isTranslation: false };
}

// One-line preview for lists and pop-ups.
export function previewText(m, t, lang) {
  if (!m) return "";
  if (m.deletedAt) return t("messages.deleted", "This message was deleted");
  switch (m.kind) {
    case "photo": return `📷 ${t("messages.photo", "Photo")}`;
    case "voice": return `🎤 ${t("messages.voice", "Voice note")}`;
    case "location": return `📍 ${t("messages.sharedLocation", "Shared location")}`;
    case "catch": return `🐟 ${m.catch?.fishName} ${m.catch?.quantityKg} kg`;
    default: {
      const { text } = displayText(m, { t, lang });
      return m.kind === "sos" ? `🆘 SOS ${text}` : text;
    }
  }
}
