import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  Anchor,
  Bell,
  BellRing,
  Check,
  ChevronRight,
  CircleHelp,
  CloudSun,
  Compass,
  Eye,
  EyeOff,
  Gauge,
  Globe2,
  KeyRound,
  Loader2,
  LockKeyhole,
  MessageSquare,
  MessageSquareText,
  Radio,
  RotateCcw,
  Save,
  ShieldCheck,
  Smartphone,
  UserRound,
  Volume2,
  Wrench,
} from "lucide-react";
import DashboardNav from "../../components/DashboardNav";
import DriverSidebar from "../../components/DriverSidebar";
import OwnerSidebar from "../../components/OwnerSidebar";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { DEFAULT_SETTINGS, fetchSettings, readCachedSettings, saveSettings } from "../../services/userSettings";

function SettingsToggle({ checked, onChange, title, description, icon: Icon }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-4 ${checked ? "bg-green-600 focus:ring-green-100" : "bg-slate-300 focus:ring-slate-200"}`}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200 ${checked ? "left-6" : "left-1"}`} />
      </button>
    </div>
  );
}

function SettingsSelect({ label, description, value, onChange, children }) {
  return (
    <label className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <span>
        <span className="block text-sm font-semibold text-slate-800">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 min-w-48 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
      >
        {children}
      </select>
    </label>
  );
}

function SettingsCard({ eyebrow, title, description, icon: Icon, children }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-3 flex items-start gap-3 border-b border-slate-100 pb-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
          <Icon size={20} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-700">{eyebrow}</p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

// Change password right here (uses the existing /api/auth/change-password).
function PasswordForm() {
  const { t } = useTranslation();
  const [f, setF] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (f.newPassword.length < 6) return setError(t("settings.pwTooShort", "The new password must be at least 6 characters."));
    if (f.newPassword !== f.confirmPassword) return setError(t("settings.pwMismatch", "The new passwords don't match."));
    setBusy(true);
    try {
      const { data } = await api.put("/auth/change-password", f);
      toast.success(data?.message || t("settings.pwChanged", "Password changed"));
      setF({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError(err.response?.data?.message || t("settings.pwFailed", "Could not change the password."));
    } finally {
      setBusy(false);
    }
  };

  const input = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100";
  return (
    <form onSubmit={submit} className="rounded-xl border border-slate-200 p-4">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
        <KeyRound size={17} className="text-cyan-700" /> {t("settings.changePassword", "Change password")}
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <input type={show ? "text" : "password"} autoComplete="current-password" required value={f.currentPassword} onChange={set("currentPassword")} placeholder={t("settings.currentPassword", "Current password")} aria-label={t("settings.currentPassword", "Current password")} className={input} />
        <input type={show ? "text" : "password"} autoComplete="new-password" required value={f.newPassword} onChange={set("newPassword")} placeholder={t("settings.newPassword", "New password")} aria-label={t("settings.newPassword", "New password")} className={input} />
        <input type={show ? "text" : "password"} autoComplete="new-password" required value={f.confirmPassword} onChange={set("confirmPassword")} placeholder={t("settings.confirmPassword", "Confirm new password")} aria-label={t("settings.confirmPassword", "Confirm new password")} className={input} />
      </div>
      {error && <p className="mt-2 text-xs font-medium text-rose-600">{error}</p>}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={() => setShow((v) => !v)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700">
          {show ? <EyeOff size={14} /> : <Eye size={14} />} {show ? t("settings.hidePasswords", "Hide passwords") : t("settings.showPasswords", "Show passwords")}
        </button>
        <div className="flex items-center gap-3">
          <Link to="/forgot-password" className="text-xs font-semibold text-cyan-800 hover:underline">{t("settings.forgotPassword", "Forgot your current password?")}</Link>
          <button type="submit" disabled={busy} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
            {busy && <Loader2 size={15} className="animate-spin" />} {t("settings.updatePassword", "Update password")}
          </button>
        </div>
      </div>
    </form>
  );
}

function Settings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const roleLabel = isOwner ? t("settings.boatOwner") : t("settings.boatDriver");
  const coveragePreferenceKey = `signalCoverageEnabled:${user?._id || user?.id || "user"}`;
  return <SettingsPanel key={user?.id || user?._id || "me"} isOwner={isOwner} roleLabel={roleLabel} coveragePreferenceKey={coveragePreferenceKey} />;
}

const clone = (s) => JSON.parse(JSON.stringify(s));

function SettingsPanel({ isOwner, roleLabel, coveragePreferenceKey }) {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState(readCachedSettings);
  const [saved, setSaved] = useState(readCachedSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ ok: true, text: "" });
  const hasChanges = JSON.stringify(settings) !== JSON.stringify(saved);

  useEffect(() => {
    fetchSettings()
      .then((s) => {
        setSettings(clone(s));
        setSaved(clone(s));
      })
      .catch(() => setSaveMessage({ ok: false, text: t("settings.loadFailed", "Couldn't load your saved settings — showing the last ones on this device.") }))
      .finally(() => setLoading(false));
  }, [t]);

  const update = (key, value) => {
    setSettings((cur) => ({ ...cur, [key]: value }));
    setSaveMessage({ ok: true, text: "" });
  };
  const updateIn = (group, key, value) => {
    setSettings((cur) => ({ ...cur, [group]: { ...cur[group], [key]: value } }));
    setSaveMessage({ ok: true, text: "" });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const s = await saveSettings(settings);
      setSettings(clone(s));
      setSaved(clone(s));
      // Signal-coverage map overlay reads this key (existing behaviour).
      localStorage.setItem(coveragePreferenceKey, String(s.signalCoverage));
      window.dispatchEvent(new Event("signal-coverage-setting"));
      if (i18n.language !== s.language) i18n.changeLanguage(s.language);
      setSaveMessage({ ok: true, text: t("settings.savedToAccount", "Saved to your account — applies on every device you sign in on.") });
    } catch (error) {
      setSaveMessage({ ok: false, text: error.response?.data?.message || t("settings.couldNotSave") });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(clone({ ...DEFAULT_SETTINGS, language: settings.language }));
    setSaveMessage({ ok: true, text: "" });
  };

  const SECTIONS = [
    { id: "preferences", label: t("settings.preferences"), icon: Gauge },
    { id: "alerts", label: t("settings.alerts"), icon: Bell },
    { id: "messages", label: t("settings.messagesSection", "Messages"), icon: MessageSquare },
    { id: "safety", label: t("settings.safetyLocation"), icon: Radio },
    { id: "account", label: t("settings.accountSecurity"), icon: ShieldCheck },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f7fb] font-sans text-slate-800">
      {isOwner ? <OwnerSidebar /> : <DriverSidebar />}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardNav />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
            <div className="mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b2742] via-[#075985] to-[#0891b2] p-6 text-white shadow-lg shadow-cyan-950/10 sm:p-8">
              <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-cyan-50">
                    <Anchor size={14} />
                    {t("settings.workspace", { role: roleLabel })}
                  </div>
                  <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{t("settings.settings")}</h1>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-cyan-50/80 sm:text-base">{t("settings.settingsDescription")}</p>
                </div>
                <Link to="/profile" className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
                  <UserRound size={17} />
                  {t("settings.viewProfile")}
                  <ChevronRight size={16} />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
              <aside className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm lg:sticky lg:top-5">
                <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.17em] text-slate-400">{t("settings.settingsMenu")}</p>
                <nav aria-label="Settings sections" className="flex gap-2 overflow-x-auto lg:flex-col">
                  {SECTIONS.map(({ id, label, icon: Icon }) => (
                    <a key={id} href={`#${id}`} className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-cyan-50 hover:text-cyan-800">
                      <Icon size={17} />
                      {label}
                    </a>
                  ))}
                </nav>
                <div className="mt-4 hidden rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500 lg:block">
                  <div className="mb-2 flex items-center gap-2 font-semibold text-slate-700">
                    <CircleHelp size={15} className="text-cyan-700" />
                    {t("settings.needHelp")}
                  </div>
                  {t("settings.contactSupportDesc")}
                  <Link to="/contact" className="mt-2 inline-flex items-center gap-1 font-semibold text-cyan-800 hover:text-cyan-950">
                    {t("settings.contactSupport")} <ChevronRight size={13} />
                  </Link>
                </div>
              </aside>

              <div className="min-w-0 space-y-5">
                {loading && (
                  <p className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                    <Loader2 size={16} className="animate-spin" /> {t("settings.loading", "Loading your settings…")}
                  </p>
                )}

                <section id="preferences" className="scroll-mt-5">
                  <SettingsCard eyebrow={t("settings.yourExperience")} title={t("settings.appPreferences")} description={t("settings.appPreferencesDesc")} icon={Globe2}>
                    <div className="divide-y divide-slate-100">
                      <SettingsSelect label={t("settings.displayLanguage")} description={t("settings.displayLanguageDesc")} value={settings.language} onChange={(v) => update("language", v)}>
                        <option value="en">English</option>
                        <option value="si">සිංහල</option>
                      </SettingsSelect>
                      <SettingsSelect label={t("settings.distanceUnits")} description={t("settings.distanceUnitsDesc2", "Used for trip distances on your dashboard.")} value={settings.distanceUnit} onChange={(v) => update("distanceUnit", v)}>
                        <option value="km">{t("settings.kilometres")}</option>
                        <option value="nm">{t("settings.nauticalMiles", "Nautical miles")}</option>
                        <option value="mi">{t("settings.miles")}</option>
                      </SettingsSelect>
                      <SettingsSelect label={t("settings.temperature")} description={t("settings.temperatureDesc2", "Used for weather on your dashboard.")} value={settings.temperatureUnit} onChange={(v) => update("temperatureUnit", v)}>
                        <option value="celsius">{t("settings.celsius")}</option>
                        <option value="fahrenheit">{t("settings.fahrenheit")}</option>
                      </SettingsSelect>
                      <SettingsSelect label={t("settings.windUnit", "Wind speed")} description={t("settings.windUnitDesc", "Knots are standard at sea.")} value={settings.windUnit} onChange={(v) => update("windUnit", v)}>
                        <option value="knots">{t("settings.knots", "Knots")}</option>
                        <option value="kmh">{t("settings.kmh", "Kilometres per hour")}</option>
                      </SettingsSelect>
                    </div>
                  </SettingsCard>
                </section>

                <section id="alerts" className="scroll-mt-5">
                  <SettingsCard
                    eyebrow={isOwner ? t("settings.fleetAwareness") : t("settings.onWaterAwareness")}
                    title={isOwner ? t("settings.fleetAlerts") : t("settings.tripSafetyAlerts")}
                    description={t("settings.alertsDesc2", "Choose which alerts reach you by WhatsApp and which reminders appear on your dashboard. SOS alerts are always sent.")}
                    icon={Bell}
                  >
                    <div className="divide-y divide-slate-100">
                      <SettingsToggle checked={settings.alerts.severeWeather} onChange={(v) => updateIn("alerts", "severeWeather", v)} title={t("settings.severeWeatherUpdates")} description={t("settings.severeWeatherDesc2", "WhatsApp me weather warnings for my boats when I'm not using the dashboard.")} icon={CloudSun} />
                      {isOwner ? (
                        <>
                          <SettingsToggle checked={settings.alerts.offlineBoat} onChange={(v) => updateIn("alerts", "offlineBoat", v)} title={t("settings.boatConnectionReminders")} description={t("settings.boatConnectionDesc2", "WhatsApp me when a boat loses its connection at sea.")} icon={Radio} />
                          <SettingsToggle checked={settings.alerts.maintenance} onChange={(v) => updateIn("alerts", "maintenance", v)} title={t("settings.maintenanceReminders")} description={t("settings.maintenanceDesc2", "Show boats under maintenance and expiring licences or documents on my dashboard.")} icon={Wrench} />
                        </>
                      ) : (
                        <SettingsToggle checked={settings.alerts.tripReminder} onChange={(v) => updateIn("alerts", "tripReminder", v)} title={t("settings.tripPrepReminders")} description={t("settings.tripPrepDesc2", "Show a weather and safety check on my dashboard before I go out.")} icon={Compass} />
                      )}
                    </div>
                  </SettingsCard>
                </section>

                <section id="messages" className="scroll-mt-5">
                  <SettingsCard eyebrow={t("settings.messagesSection", "Messages")} title={t("settings.messageNotifications", "Message notifications")} description={t("settings.messageNotificationsDesc", "How new chat messages reach you.")} icon={MessageSquareText}>
                    <div className="divide-y divide-slate-100">
                      <SettingsToggle checked={settings.messages.sound} onChange={(v) => updateIn("messages", "sound", v)} title={t("settings.msgSound", "Sound")} description={t("settings.msgSoundDesc", "Play a short tone when a message arrives.")} icon={Volume2} />
                      <SettingsToggle checked={settings.messages.popups} onChange={(v) => updateIn("messages", "popups", v)} title={t("settings.msgPopups", "Pop-up previews")} description={t("settings.msgPopupsDesc", "Show a preview at the top of the screen when I'm on another page.")} icon={BellRing} />
                      <SettingsToggle checked={settings.messages.whatsappFallback} onChange={(v) => updateIn("messages", "whatsappFallback", v)} title={t("settings.msgWhatsapp", "WhatsApp when I'm away")} description={t("settings.msgWhatsappDesc", "Forward messages to my WhatsApp if I haven't opened the dashboard for 10 minutes.")} icon={Smartphone} />
                    </div>
                  </SettingsCard>
                </section>

                <section id="safety" className="scroll-mt-5">
                  <SettingsCard eyebrow={t("settings.locationSafety")} title={t("settings.signalCoverageHistory")} description={t("settings.signalCoverageDesc")} icon={Radio}>
                    <SettingsToggle checked={settings.signalCoverage} onChange={(v) => update("signalCoverage", v)} title={t("settings.showSignalCoverage")} description={t("settings.showSignalCoverageDesc")} icon={Radio} />
                    <p className="mt-2 rounded-xl bg-cyan-50 px-3 py-2.5 text-xs leading-5 text-cyan-900">{t("settings.sensitiveInfoNote")}</p>
                  </SettingsCard>
                </section>

                <section id="account" className="scroll-mt-5">
                  <SettingsCard eyebrow={t("settings.account")} title={t("settings.profileSecurity")} description={t("settings.profileSecurityDesc")} icon={LockKeyhole}>
                    <div className="space-y-3 pt-1">
                      <Link to="/profile" className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-cyan-300 hover:bg-cyan-50/60">
                        <span className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 group-hover:bg-white group-hover:text-cyan-700">
                            <UserRound size={18} />
                          </span>
                          <span>
                            <span className="block text-sm font-semibold text-slate-800">{t("settings.personalProfile")}</span>
                            <span className="mt-1 block text-xs text-slate-500">{t("settings.reviewAccountInfo")}</span>
                          </span>
                        </span>
                        <ChevronRight size={17} className="text-slate-400" />
                      </Link>
                      <PasswordForm />
                    </div>
                  </SettingsCard>
                </section>

                <div className="sticky bottom-3 flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:px-5">
                  <div className="flex min-h-8 items-center gap-2 text-xs text-slate-500" aria-live="polite">
                    {saveMessage.text ? (
                      <>
                        {saveMessage.ok ? <Check size={15} className="text-emerald-600" /> : <CircleHelp size={15} className="text-rose-600" />}
                        <span>{saveMessage.text}</span>
                      </>
                    ) : hasChanges ? (
                      <span className="font-semibold text-amber-700">{t("settings.unsaved", "You have unsaved changes")}</span>
                    ) : (
                      <>
                        <ShieldCheck size={15} className="text-slate-400" />
                        {t("settings.storedOnAccount", "Settings are saved to your account.")}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={handleReset} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">
                      <RotateCcw size={15} />
                      {t("settings.reset")}
                    </button>
                    <button type="button" onClick={handleSave} disabled={!hasChanges || saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 text-sm font-bold text-white shadow-md shadow-cyan-900/10 transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none">
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      {t("settings.saveChanges")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Settings;
