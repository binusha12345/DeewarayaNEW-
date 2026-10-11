import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Anchor,
  Bell,
  Check,
  ChevronRight,
  CircleHelp,
  CloudSun,
  Compass,
  Gauge,
  Globe2,
  LockKeyhole,
  Radio,
  RotateCcw,
  Save,
  ShieldCheck,
  Ship,
  UserRound,
  Wrench,
} from "lucide-react";
import DashboardNav from "../../components/DashboardNav";
import DriverSidebar from "../../components/DriverSidebar";
import OwnerSidebar from "../../components/OwnerSidebar";
import { useAuth } from "../../context/AuthContext";

const DEFAULT_SETTINGS = {
  language: "en",
  distanceUnit: "km",
  temperatureUnit: "celsius",
  signalCoverage: false,
  severeWeatherAlerts: true,
  tripReminderAlerts: true,
  maintenanceAlerts: true,
  offlineBoatAlerts: true,
};

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
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-4 ${
          checked
            ? "bg-green-600 focus:ring-green-100"
            : "bg-slate-300 focus:ring-slate-200"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200 ${
            checked ? "left-6" : "left-1"
          }`}
        />
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
        className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 sm:w-52"
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

function Settings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const accountId = user?._id || user?.id || user?.email || "account";
  const storageKey = `deewaraya-settings:${user?.role || "driver"}:${accountId}`;
  const coveragePreferenceKey = `signalCoverageEnabled:${user?._id || user?.id || "user"}`;
  const isOwner = user?.role === "owner";
  const roleLabel = isOwner ? t('settings.boatOwner') : t('settings.boatDriver');

  return (
    <SettingsPanel
      key={storageKey}
      coveragePreferenceKey={coveragePreferenceKey}
      isOwner={isOwner}
      roleLabel={roleLabel}
      storageKey={storageKey}
    />
  );
}

function SettingsPanel({ coveragePreferenceKey, isOwner, roleLabel, storageKey }) {
  const { t, i18n } = useTranslation();
  const fallbackLanguage = i18n.resolvedLanguage?.startsWith("si") ? "si" : "en";
  const [settings, setSettings] = useState(() =>
    readSettings(storageKey, coveragePreferenceKey, fallbackLanguage),
  );
  const [savedSettings, setSavedSettings] = useState(() =>
    readSettings(storageKey, coveragePreferenceKey, fallbackLanguage),
  );
  const [saveMessage, setSaveMessage] = useState("");
  const hasChanges = JSON.stringify(settings) !== JSON.stringify(savedSettings);

  const updateSetting = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }));
    setSaveMessage("");
  };

  const handleSave = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(settings));
      localStorage.setItem(coveragePreferenceKey, String(settings.signalCoverage));
      window.dispatchEvent(new Event("signal-coverage-setting"));
      if (i18n.language !== settings.language) {
        i18n.changeLanguage(settings.language);
      }
      setSavedSettings(settings);
      setSaveMessage(t('settings.savedOnDevice'));
    } catch (error) {
      console.error("Could not save settings.", error);
      setSaveMessage(t('settings.couldNotSave'));
    }
  };

  const handleReset = () => {
    setSettings({ ...DEFAULT_SETTINGS });
    setSaveMessage("");
  };

  const SETTINGS_SECTIONS = [
    { id: "preferences", label: t('settings.preferences'), icon: Gauge },
    { id: "alerts", label: t('settings.alerts'), icon: Bell },
    { id: "safety", label: t('settings.safetyLocation'), icon: Radio },
    { id: "account", label: t('settings.accountSecurity'), icon: ShieldCheck },
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
                    {t('settings.workspace', { role: roleLabel })}
                  </div>
                  <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{t('settings.settings')}</h1>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-cyan-50/80 sm:text-base">
                    {t('settings.settingsDescription')}
                  </p>
                </div>
                <Link
                  to="/profile"
                  className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  <UserRound size={17} />
                  {t('settings.viewProfile')}
                  <ChevronRight size={16} />
                </Link>
              </div>
              <div className="mt-7 flex flex-wrap gap-2 text-xs font-medium text-white/75">
                <span className="rounded-full bg-slate-950/15 px-3 py-1.5">{t('settings.accountPreferences')}</span>
                <span className="rounded-full bg-slate-950/15 px-3 py-1.5">{t('settings.safetyAlerts')}</span>
                <span className="rounded-full bg-slate-950/15 px-3 py-1.5">{t('settings.privacySecurity')}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
              <aside className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm lg:sticky lg:top-5">
                <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.17em] text-slate-400">
                  {t('settings.settingsMenu')}
                </p>
                <nav aria-label="Settings sections" className="flex gap-2 overflow-x-auto lg:flex-col">
                  {SETTINGS_SECTIONS.map(({ id, label, icon: Icon }) => (
                    <a
                      key={id}
                      href={`#${id}`}
                      className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-cyan-50 hover:text-cyan-800"
                    >
                      <Icon size={17} />
                      {label}
                    </a>
                  ))}
                </nav>
                <div className="mt-4 hidden rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500 lg:block">
                  <div className="mb-2 flex items-center gap-2 font-semibold text-slate-700">
                    <CircleHelp size={15} className="text-cyan-700" />
                    {t('settings.needHelp')}
                  </div>
                  {t('settings.contactSupportDesc')}
                  <Link to="/contact" className="mt-2 inline-flex items-center gap-1 font-semibold text-cyan-800 hover:text-cyan-950">
                    {t('settings.contactSupport')} <ChevronRight size={13} />
                  </Link>
                </div>
              </aside>

              <div className="min-w-0 space-y-5">
                <section id="preferences" className="scroll-mt-5">
                  <SettingsCard
                    eyebrow={t('settings.yourExperience')}
                    title={t('settings.appPreferences')}
                    description={t('settings.appPreferencesDesc')}
                    icon={Globe2}
                  >
                    <div className="divide-y divide-slate-100">
                      <SettingsSelect
                        label={t('settings.displayLanguage')}
                        description={t('settings.displayLanguageDesc')}
                        value={settings.language}
                        onChange={(value) => updateSetting("language", value)}
                      >
                        <option value="en">English</option>
                        <option value="si">සිංහල</option>
                      </SettingsSelect>
                      <SettingsSelect
                        label={t('settings.distanceUnits')}
                        description={t('settings.distanceUnitsDesc')}
                        value={settings.distanceUnit}
                        onChange={(value) => updateSetting("distanceUnit", value)}
                      >
                        <option value="km">{t('settings.kilometres')}</option>
                        <option value="mi">{t('settings.miles')}</option>
                      </SettingsSelect>
                      <SettingsSelect
                        label={t('settings.temperature')}
                        description={t('settings.temperatureDesc')}
                        value={settings.temperatureUnit}
                        onChange={(value) => updateSetting("temperatureUnit", value)}
                      >
                        <option value="celsius">{t('settings.celsius')}</option>
                        <option value="fahrenheit">{t('settings.fahrenheit')}</option>
                      </SettingsSelect>
                    </div>
                  </SettingsCard>
                </section>

                <section id="alerts" className="scroll-mt-5">
                  <SettingsCard
                    eyebrow={isOwner ? t('settings.fleetAwareness') : t('settings.onWaterAwareness')}
                    title={isOwner ? t('settings.fleetAlerts') : t('settings.tripSafetyAlerts')}
                    description={
                      isOwner
                        ? t('settings.fleetAlertsDesc')
                        : t('settings.tripAlertsDesc')
                    }
                    icon={Bell}
                  >
                    <div className="divide-y divide-slate-100">
                      <SettingsToggle
                        checked={settings.severeWeatherAlerts}
                        onChange={(value) => updateSetting("severeWeatherAlerts", value)}
                        title={t('settings.severeWeatherUpdates')}
                        description={t('settings.severeWeatherDesc')}
                        icon={CloudSun}
                      />
                      {isOwner ? (
                        <>
                          <SettingsToggle
                            checked={settings.offlineBoatAlerts}
                            onChange={(value) => updateSetting("offlineBoatAlerts", value)}
                            title={t('settings.boatConnectionReminders')}
                            description={t('settings.boatConnectionDesc')}
                            icon={Radio}
                          />
                          <SettingsToggle
                            checked={settings.maintenanceAlerts}
                            onChange={(value) => updateSetting("maintenanceAlerts", value)}
                            title={t('settings.maintenanceReminders')}
                            description={t('settings.maintenanceDesc')}
                            icon={Wrench}
                          />
                        </>
                      ) : (
                        <SettingsToggle
                          checked={settings.tripReminderAlerts}
                          onChange={(value) => updateSetting("tripReminderAlerts", value)}
                          title={t('settings.tripPrepReminders')}
                          description={t('settings.tripPrepDesc')}
                          icon={Compass}
                        />
                      )}
                    </div>
                    <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800">
                      {t('settings.savedPrefsNote')}
                    </p>
                  </SettingsCard>
                </section>

                <section id="safety" className="scroll-mt-5">
                  <SettingsCard
                    eyebrow={t('settings.locationSafety')}
                    title={t('settings.signalCoverageHistory')}
                    description={t('settings.signalCoverageDesc')}
                    icon={isOwner ? Ship : Radio}
                  >
                    <SettingsToggle
                      checked={settings.signalCoverage}
                      onChange={(value) => updateSetting("signalCoverage", value)}
                      title={t('settings.showSignalCoverage')}
                      description={t('settings.showSignalCoverageDesc')}
                      icon={Radio}
                    />
                    <p className="mt-2 rounded-xl bg-cyan-50 px-3 py-2.5 text-xs leading-5 text-cyan-900">
                      {t('settings.sensitiveInfoNote')}
                    </p>
                  </SettingsCard>
                </section>

                <section id="account" className="scroll-mt-5">
                  <SettingsCard
                    eyebrow={t('settings.account')}
                    title={t('settings.profileSecurity')}
                    description={t('settings.profileSecurityDesc')}
                    icon={LockKeyhole}
                  >
                    <div className="grid gap-3 pt-1 sm:grid-cols-2">
                      <Link
                        to="/profile"
                        className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-cyan-300 hover:bg-cyan-50/60"
                      >
                        <span className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 group-hover:bg-white group-hover:text-cyan-700">
                            <UserRound size={18} />
                          </span>
                          <span>
                            <span className="block text-sm font-semibold text-slate-800">{t('settings.personalProfile')}</span>
                            <span className="mt-1 block text-xs text-slate-500">{t('settings.reviewAccountInfo')}</span>
                          </span>
                        </span>
                        <ChevronRight size={17} className="text-slate-400" />
                      </Link>
                      <Link
                        to="/forgot-password"
                        className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-cyan-300 hover:bg-cyan-50/60"
                      >
                        <span className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 group-hover:bg-white group-hover:text-cyan-700">
                            <LockKeyhole size={18} />
                          </span>
                          <span>
                            <span className="block text-sm font-semibold text-slate-800">{t('settings.passwordSignIn')}</span>
                            <span className="mt-1 block text-xs text-slate-500">{t('settings.openPasswordRecovery')}</span>
                          </span>
                        </span>
                        <ChevronRight size={17} className="text-slate-400" />
                      </Link>
                    </div>
                  </SettingsCard>
                </section>

                <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:px-5">
                  <div className="flex min-h-8 items-center gap-2 text-xs text-slate-500" aria-live="polite">
                    {saveMessage ? (
                      <>
                        {saveMessage.startsWith(t('settings.savedOnDevice')) ? (
                          <Check size={15} className="text-emerald-600" />
                        ) : (
                          <CircleHelp size={15} className="text-rose-600" />
                        )}
                        <span>{saveMessage}</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={15} className="text-slate-400" />
                        {t('settings.settingsStored')}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                    >
                      <RotateCcw size={15} />
                      {t('settings.reset')}
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={!hasChanges}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 text-sm font-bold text-white shadow-md shadow-cyan-900/10 transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                    >
                      <Save size={16} />
                      {t('settings.saveChanges')}
                    </button>
                  </div>
                </div>

                <p className="flex items-center justify-center gap-2 pb-2 text-center text-xs text-slate-400">
                  <ShieldCheck size={14} />
                  {t('settings.prefsSeparate')}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function readSettings(storageKey, coveragePreferenceKey, fallbackLanguage) {
  try {
    const saved = localStorage.getItem(storageKey);
    const settings = saved
      ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
      : { ...DEFAULT_SETTINGS, language: fallbackLanguage };
    const savedCoveragePreference = localStorage.getItem(coveragePreferenceKey);
    if (savedCoveragePreference !== null) {
      settings.signalCoverage = savedCoveragePreference === "true";
    }
    return settings;
  } catch (error) {
    console.warn("Could not load saved settings; using defaults.", error);
    return DEFAULT_SETTINGS;
  }
}

export default Settings;