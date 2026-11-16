// The signed-in user's settings: saved on the server, mirrored in localStorage so pages can use
// them instantly, and shared with the whole app through useUserSettings().
import { useEffect, useState } from "react";
import api from "./api";

export const DEFAULT_SETTINGS = {
  language: "en",
  distanceUnit: "km",
  temperatureUnit: "celsius",
  windUnit: "knots",
  signalCoverage: false,
  alerts: { severeWeather: true, offlineBoat: true, maintenance: true, tripReminder: true },
  messages: { sound: true, popups: true, whatsappFallback: true },
};

const userKey = () => {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return `dw_settings_${u.id || u._id || "me"}`;
  } catch {
    return "dw_settings_me";
  }
};

const merge = (s) => ({
  ...DEFAULT_SETTINGS,
  ...(s || {}),
  alerts: { ...DEFAULT_SETTINGS.alerts, ...(s?.alerts || {}) },
  messages: { ...DEFAULT_SETTINGS.messages, ...(s?.messages || {}) },
});

export const readCachedSettings = () => {
  try {
    return merge(JSON.parse(localStorage.getItem(userKey()) || "null"));
  } catch {
    return merge(null);
  }
};

const cache = (s) => {
  try {
    localStorage.setItem(userKey(), JSON.stringify(s));
  } catch {
    /* storage blocked */
  }
  window.dispatchEvent(new CustomEvent("dw:settings", { detail: s }));
};

export async function fetchSettings() {
  const { data } = await api.get("/settings");
  const s = merge(data.data);
  cache(s);
  return s;
}

export async function saveSettings(next) {
  const { data } = await api.put("/settings", next);
  const s = merge(data.data);
  cache(s);
  return s;
}

// Live settings for any component; refreshes from the server once per mount.
export function useUserSettings() {
  const [settings, setSettings] = useState(readCachedSettings);
  useEffect(() => {
    const on = (e) => setSettings(merge(e.detail));
    window.addEventListener("dw:settings", on);
    if (localStorage.getItem("token")) fetchSettings().catch(() => {});
    return () => window.removeEventListener("dw:settings", on);
  }, []);
  return settings;
}

// ---------- unit helpers ----------
export const formatDistance = (km, unit = "km", digits = 1) => {
  if (km == null || Number.isNaN(Number(km))) return "—";
  if (unit === "nm") return `${(km / 1.852).toFixed(digits)} nm`;
  if (unit === "mi") return `${(km / 1.609344).toFixed(digits)} mi`;
  return `${Number(km).toFixed(digits)} km`;
};
export const tempValue = (c, unit = "celsius") => (c == null ? null : unit === "fahrenheit" ? Math.round((c * 9) / 5 + 32) : Math.round(c));
export const tempUnit = (unit = "celsius") => (unit === "fahrenheit" ? "°F" : "°C");
export const windValue = (kts, unit = "knots") => (kts == null ? null : unit === "kmh" ? Math.round(kts * 1.852) : Math.round(kts));
export const windUnitLabel = (unit = "knots") => (unit === "kmh" ? "km/h" : "kts");
