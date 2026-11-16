import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Ship,
  Wrench,
  Download,
  TrendingUp,
  TrendingDown,
  Cloud,
  CloudRain,
  Sun,
  Siren,
  WifiOff,
  FileWarning,
  CheckCircle2,
  MessageSquare,
  RefreshCw,
  Loader2,
  Navigation,
} from 'lucide-react';
import OwnerSidebar from '../../../components/OwnerSidebar';
import DashboardNav from '../../../components/DashboardNav';
import DashboardPageHeader from '../../../components/DashboardPageHeader';
import FleetMap from '../../../components/dashboard/FleetMap';
import { useAuth } from '../../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../../../services/api';
import { formatDistance, tempUnit, tempValue, useUserSettings, windUnitLabel, windValue } from '../../../services/userSettings';

const lkr = (n, compact = true) =>
  `LKR ${new Intl.NumberFormat('en-LK', compact ? { notation: 'compact', maximumFractionDigits: 1 } : { maximumFractionDigits: 0 }).format(Math.round(n || 0))}`;

const pct = (now, before) => (before ? Math.round(((now - before) / Math.abs(before)) * 100) : null);

const fmtDate = (d, lang) => (d ? new Date(d).toLocaleDateString(lang === 'si' ? 'si-LK' : 'en-GB', { day: 'numeric', month: 'short' }) : '—');
const fmtTime = (d, lang) => (d ? new Date(d).toLocaleTimeString(lang === 'si' ? 'si-LK' : 'en-GB', { hour: '2-digit', minute: '2-digit' }) : '');
const weekday = (d, lang) => new Date(d).toLocaleDateString(lang === 'si' ? 'si-LK' : 'en-GB', { weekday: 'short' });

const BoatOwnerDashboard = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const settings = useUserSettings();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const handleLanguageToggle = () => {
    const newLang = i18n.language === "en" ? "si" : "en";
    i18n.changeLanguage(newLang);
  };

  const load = useCallback(() => {
    return api
      .get('/dashboard/owner')
      .then(({ data: res }) => {
        setData(res.data);
        setError('');
      })
      .catch((err) => setError(err.response?.data?.message || t('dash.loadFailed', 'Could not load dashboard data.')))
      .finally(() => setRefreshing(false));
  }, [t]);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000); // live positions + alerts
    return () => clearInterval(id);
  }, [load]);

  const lang = i18n.language;
  const stats = data?.stats;
  const incomeTrend = stats ? pct(stats.month.income, stats.lastMonth.income) : null;
  const expenseTrend = stats ? pct(stats.month.expenses, stats.lastMonth.expenses) : null;
  const attention = (data?.attention || []).filter((a) => settings.alerts.maintenance || !['maintenance', 'document'].includes(a.type));
  const w = data?.weather;
  const unit = tempUnit(settings.temperatureUnit);

  const mapBoats = (data?.fleet || []).map((b) => ({
    id: b._id,
    name: b.boatName,
    lat: b.position?.latitude,
    lng: b.position?.longitude,
    heading: b.trip?.headingDeg,
    state: b.boatStatus === 'MAINTENANCE' ? 'maintenance' : b.atSea && b.connectionStatus === 'offline' ? 'alert' : b.atSea ? 'sea' : 'port',
    lines: [
      b.driver?.name && `${t('dash.driver', 'Driver')}: ${b.driver.name}`,
      b.atSea ? `${t('dash.atSea', 'At sea')} · ${formatDistance(b.trip?.distanceKm, settings.distanceUnit)}` : t('dash.inPort', 'In port / not on a trip'),
      b.trip?.speedKnots != null && `${b.trip.speedKnots} kts · ${b.trip.headingDeg}°`,
    ],
  }));

  const downloadReport = () => {
    if (!data) return;
    const rows = [
      ['Deewaraya fleet report', new Date().toLocaleString()],
      [],
      ['This month', 'Income (LKR)', 'Expenses (LKR)', 'Net profit (LKR)', 'Fishing days', 'Fish (kg)'],
      ['', stats.month.income, stats.month.expenses, stats.month.profit, stats.month.days, stats.month.fishKg],
      ['Last month', stats.lastMonth.income, stats.lastMonth.expenses, stats.lastMonth.profit, stats.lastMonth.days, stats.lastMonth.fishKg],
      [],
      ['Boat', 'Registration', 'Status', 'Connection', 'Driver', 'At sea', 'Trip distance (km)'],
      ...data.fleet.map((b) => [b.boatName, b.registrationNumber, b.boatStatus, b.connectionStatus, b.driver?.name || '', b.atSea ? 'yes' : 'no', b.trip?.distanceKm ?? '']),
      [],
      ['Recent trips', 'Driver', 'Started', 'Ended', 'Distance (km)'],
      ...data.recentTrips.map((r) => [r.boat, r.driver, r.startedAt, r.endedAt || 'ongoing', r.distanceKm]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `deewaraya-fleet-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const attentionText = (a) => {
    const p = a.params || {};
    if (a.type === 'sos') return t('dash.att.sos', { driver: p.driver, kind: t(`dash.emergency.${p.kind}`, String(p.kind || '').replace(/_/g, ' ')), defaultValue: '{{driver}} sent an SOS — {{kind}}' });
    if (a.type === 'maintenance') return t('dash.att.maintenance', 'Marked as under maintenance');
    if (a.type === 'signal') return p.offline ? t('dash.att.offline', 'At sea and offline') : t('dash.att.weak', 'Weak signal at sea');
    if (a.type === 'document') return p.expired ? t('dash.att.docExpired', { name: p.name, date: p.date, defaultValue: '{{name}} expired on {{date}}' }) : t('dash.att.docExpires', { name: p.name, date: p.date, defaultValue: '{{name}} expires on {{date}}' });
    return a.text;
  };

  const ATT_STYLE = {
    sos: { icon: Siren, iconColor: 'bg-red-100 text-red-600', border: 'border-l-4 border-l-red-500', tag: t('dash.tag.sos', 'SOS'), tagColor: 'bg-red-50 text-red-600' },
    signal: { icon: WifiOff, iconColor: 'bg-amber-100 text-amber-700', border: 'border-l-4 border-l-amber-500', tag: t('dash.tag.signal', 'Signal'), tagColor: 'bg-amber-50 text-amber-700' },
    maintenance: { icon: Wrench, iconColor: 'bg-blue-100 text-blue-600', border: 'border-l-4 border-l-blue-900', tag: t('dash.tag.maintenance', 'Service'), tagColor: 'bg-slate-100 text-slate-600' },
    document: { icon: FileWarning, iconColor: 'bg-violet-100 text-violet-600', border: 'border-l-4 border-l-violet-500', tag: t('dash.tag.document', 'Document'), tagColor: 'bg-violet-50 text-violet-600' },
  };

  const WeatherIcon = !w ? Cloud : /rain|storm|drizzle|thunder/i.test(w.condition || w.description || '') ? CloudRain : /clear|sun/i.test(w.condition || '') ? Sun : Cloud;

  return (
    <div data-tour="dashboard-overview" className="flex h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">

      <style>{ownerDashboardStyles}</style>
      {/* Sidebar */}
      <OwnerSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* Top Header Bar */}
        <DashboardNav />

        {/* Dashboard Main Area */}
        <main className="flex-1 overflow-y-auto p-8">

          {/* Language Toggle + refresh */}
          <div className="flex justify-end items-center gap-3 mb-4">
            <button
              onClick={() => {
                setRefreshing(true);
                load();
              }}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> {t('dash.refresh', 'Refresh')}
            </button>
            <button
              onClick={handleLanguageToggle}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold rounded-full shadow-md transition-all"
            >
              {i18n.language === "en" ? "🇱🇰 සිංහල" : "🇬🇧 English"}
            </button>
          </div>

          <DashboardPageHeader
            eyebrow={t("ownerDashboard.overview")}
            title={t("ownerDashboard.welcome", { name: user?.name || "Owner" })}
            description={t("ownerDashboard.manageFleet")}
            icon={Ship}
            theme="blue"
            action={
              <button onClick={downloadReport} disabled={!data} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-[16px] font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition cursor-pointer disabled:opacity-60">
                <Download size={16} /> {t("ownerDashboard.downloadReport")}
              </button>
            }
          />

          {error && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
          )}

          {!data && !error ? (
            <div className="flex items-center justify-center gap-2 py-24 text-slate-500">
              <Loader2 className="animate-spin" size={20} /> {t('dash.loading', 'Loading your fleet…')}
            </div>
          ) : data && (
          <>
          {/* Key Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <StatCard
              title={t("ownerDashboard.stats.totalBoats")}
              value={stats.totalBoats}
              sub={t('dash.withDriver', { count: stats.withDriver, defaultValue: '{{count}} with a driver' })}
            />
            <StatCard
              title={t("dash.atSeaNow", "At sea now")}
              value={stats.atSea}
              sub={t('dash.activeOf', { count: stats.activeBoats, defaultValue: '{{count}} active boats' })}
              indicator={stats.atSea ? "bg-green-500" : "bg-slate-300"}
            />
            <StatCard
              title={t("ownerDashboard.stats.monthlyIncome")}
              value={lkr(stats.month.income)}
              sub={<Trend value={incomeTrend} good="up" />}
            />
            <StatCard
              title={t("ownerDashboard.stats.monthlyExpenses")}
              value={lkr(stats.month.expenses)}
              sub={<Trend value={expenseTrend} good="down" />}
            />

            {/* Net Profit Card */}
            <div className="bg-gradient-to-br from-blue-900 to-cyan-600 p-5 rounded-xl text-white shadow-lg flex flex-col justify-between">
              <p className="text-[10px] font-bold uppercase text-white/60">
                {t("ownerDashboard.stats.netProfit")}
              </p>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-sm font-medium text-white/60">LKR</span>
                <span className="text-2xl font-black">{new Intl.NumberFormat('en-LK', { notation: 'compact', maximumFractionDigits: 1 }).format(Math.round(stats.month.profit))}</span>
              </div>
              <p className="text-[10px] text-white/70 mt-1">
                {t('dash.monthSummary', { days: stats.month.days, kg: Math.round(stats.month.fishKg).toLocaleString(), defaultValue: '{{days}} fishing days · {{kg}} kg fish' })}
              </p>
            </div>
          </div>

          {/* Map and Side Widgets Row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Map Section */}
            <div className="xl:col-span-2 relative h-[500px] rounded-2xl overflow-hidden shadow-sm bg-slate-200">
              {mapBoats.some((b) => b.lat != null) ? (
                <FleetMap boats={mapBoats} />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-slate-500">
                  <Navigation size={28} className="text-slate-400" />
                  {t('dash.noPositions', 'No boat positions yet — they appear once a driver starts a trip.')}
                </div>
              )}

              {/* Floating Info */}
              <div className="absolute top-6 left-6 z-[400] flex bg-white/90 backdrop-blur rounded-xl shadow-md border border-white/40 pointer-events-none">
                <div className="p-3 border-r border-slate-200">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                    {t("dash.boatsAtSea", "Boats at sea")}
                  </p>
                  <p className="text-xs font-bold text-slate-900">{stats.atSea} / {stats.totalBoats}</p>
                </div>
                <div className="p-3">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                    {t("ownerDashboard.map.windSpeed")}
                  </p>
                  <p className="text-xs font-bold text-slate-900">
                    {w?.windSpeedKts != null ? `${windValue(w.windSpeedKts, settings.windUnit)} ${windUnitLabel(settings.windUnit)} ${w.windDirection || ''}` : '—'}
                  </p>
                </div>
              </div>

              {/* Legend */}
              <div className="absolute bottom-6 left-6 z-[400] flex flex-wrap gap-3 bg-white/90 backdrop-blur rounded-lg shadow-md px-3 py-2 text-[10px] font-semibold text-slate-600 pointer-events-none">
                <Legend color="bg-sky-600" label={t('dash.atSea', 'At sea')} />
                <Legend color="bg-slate-900" label={t('dash.inPortShort', 'In port')} />
                <Legend color="bg-red-600" label={t('dash.offline', 'Offline')} />
                <Legend color="bg-amber-600" label={t('dash.maintenance', 'Maintenance')} />
              </div>
            </div>

            {/* Right Side Widgets */}
            <div className="space-y-6">

              {/* Needs attention */}
              <div className="bg-[#f8fafc] rounded-3xl p-6 border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold text-slate-900">
                    {t("dash.needsAttention", "Needs your attention")}
                  </h3>
                  <Link to="/owner/messages" className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 uppercase hover:underline">
                    <MessageSquare size={12} /> {t('dash.unreadMessages', { count: data.unreadMessages, defaultValue: '{{count}} unread' })}
                  </Link>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {attention.length === 0 ? (
                    <div className="flex items-center gap-3 rounded-xl bg-white p-3 text-xs text-slate-500 border border-slate-100">
                      <CheckCircle2 size={18} className="text-emerald-500" /> {t('dash.allClear', 'All clear — nothing needs you right now.')}
                    </div>
                  ) : (
                    attention.map((a, i) => {
                      const s = ATT_STYLE[a.type] || ATT_STYLE.maintenance;
                      return (
                        <MaintenanceItem
                          key={`${a.type}-${a.boat}-${i}`}
                          title={a.boat || '—'}
                          desc={attentionText(a)}
                          tag={s.tag}
                          tagColor={s.tagColor}
                          iconColor={s.iconColor}
                          border={s.border}
                          Icon={s.icon}
                        />
                      );
                    })
                  )}
                </div>
              </div>

              {/* Weather Forecast Card */}
              <Link to="/weather" className="block bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-900 rounded-3xl p-6 text-white shadow-4xl hover:brightness-110 transition">
                <p className="text-[10px] font-bold uppercase text-white/60 tracking-widest mb-1">
                  {t("ownerDashboard.weather.title")}{w?.placeName ? ` · ${w.placeName}` : ''}
                </p>

                {w ? (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold capitalize">{w.description || w.condition}</h3>
                        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${w.safe ? 'bg-emerald-400/20 text-emerald-100' : 'bg-red-500/30 text-red-100'}`}>
                          {w.safe ? t('dash.safeToSail', 'Safe to sail') : t('dash.roughSea', 'Rough sea — take care')}
                        </span>
                      </div>
                      <WeatherIcon className="text-white/70" size={32} />
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                      <span className="text-5xl font-black">{tempValue(w.temperature, settings.temperatureUnit)}{unit}</span>
                      <div className="text-[10px] text-white/60 space-y-0.5">
                        <p>{t("ownerDashboard.weather.humidity", { value: w.humidity ?? '—' })}</p>
                        <p>{t('dash.wave', { value: w.waveHeight ?? '—', defaultValue: 'Waves {{value}} m' })}</p>
                        <p>{t('dash.checkedAt', { time: fmtTime(w.checkedAt, lang), defaultValue: 'Checked {{time}}' })}</p>
                      </div>
                    </div>

                    {w.daily?.length > 0 && (
                      <div className="flex justify-between border-t border-white/20 pt-4">
                        {w.daily.map((d) => (
                          <DayForecast key={d.date} day={weekday(d.date, lang)} temp={`${tempValue(d.maxTemp, settings.temperatureUnit)}°`} rain={d.rainProbability} />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-white/70 py-6">{t('dash.noWeather', 'No weather checks yet. Open Weather to check your area.')}</p>
                )}
              </Link>

            </div>
          </div>

          {/* Fleet + recent trips */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">
            <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">{t('dash.yourFleet', 'Your fleet')}</h3>
                <Link to="/boatownerboats" className="text-[10px] font-bold text-blue-600 uppercase hover:underline">{t('ownerDashboard.maintenance.seeAll')}</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-5 py-3 font-bold">{t('dash.boat', 'Boat')}</th>
                      <th className="px-5 py-3 font-bold">{t('dash.driver', 'Driver')}</th>
                      <th className="px-5 py-3 font-bold">{t('dash.status', 'Status')}</th>
                      <th className="px-5 py-3 font-bold">{t('dash.signal', 'Signal')}</th>
                      <th className="px-5 py-3 font-bold">{t('dash.trip', 'Trip')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {data.fleet.length === 0 && (
                      <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                        {t('dash.noBoats', 'No boats yet.')} <Link to="/addnewboat" className="font-semibold text-blue-600 hover:underline">{t('dash.addBoat', 'Add your first boat')}</Link>
                      </td></tr>
                    )}
                    {data.fleet.map((b) => (
                      <tr key={b._id} className="hover:bg-slate-50">
                        <td className="px-5 py-3">
                          <Link to={`/boatdetails/${b._id}`} className="font-bold text-slate-900 hover:text-blue-700">{b.boatName}</Link>
                          <p className="text-[10px] text-slate-400">{b.registrationNumber}</p>
                        </td>
                        <td className="px-5 py-3 text-slate-600">{b.driver?.name || <span className="text-slate-400">{t('dash.noDriver', 'Not assigned')}</span>}</td>
                        <td className="px-5 py-3"><StatusPill status={b.boatStatus} t={t} /></td>
                        <td className="px-5 py-3"><SignalPill status={b.connectionStatus} t={t} /></td>
                        <td className="px-5 py-3 text-slate-600">
                          {b.atSea
                            ? <span className="font-semibold text-sky-700">{t('dash.atSea', 'At sea')} · {formatDistance(b.trip?.distanceKm, settings.distanceUnit)}{b.trip?.speedKnots != null ? ` · ${b.trip.speedKnots} kts` : ''}</span>
                            : <span className="text-slate-400">{t('dash.inPortShort', 'In port')}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">{t('dash.recentTrips', 'Recent trips')}</h3>
                <Link to="/owner/trips" className="text-[10px] font-bold text-blue-600 uppercase hover:underline">{t('ownerDashboard.maintenance.seeAll')}</Link>
              </div>
              <div className="divide-y divide-slate-100">
                {data.recentTrips.length === 0 && <p className="px-5 py-8 text-center text-xs text-slate-400">{t('dash.noTrips', 'No trips yet.')}</p>}
                {data.recentTrips.map((r) => (
                  <div key={r._id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-900">{r.boat}</p>
                      <p className="text-[10px] text-slate-400">{r.driver} · {fmtDate(r.startedAt, lang)} {fmtTime(r.startedAt, lang)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-700">{formatDistance(r.distanceKm, settings.distanceUnit)}</p>
                      <p className={`text-[10px] font-semibold ${r.endedAt ? 'text-slate-400' : 'text-emerald-600'}`}>
                        {r.endedAt ? t('dash.hours', { value: ((r.durationSeconds || 0) / 3600).toFixed(1), defaultValue: '{{value}} h' }) : t('dash.live', 'Live')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </>
          )}

        </main>
      </div>
    </div>
  );
};

// ===============================================
// ✅ Reusable Components
// ===============================================

const StatCard = ({ title, value, sub, indicator }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-tight">
      {title}
    </p>
    <div className="mt-2 flex flex-wrap items-baseline gap-2">
      <h3 className="text-2xl font-black text-slate-900">{value}</h3>
      <div className="flex items-center gap-1">
        {indicator && <div className={`w-1.5 h-1.5 rounded-full ${indicator}`}></div>}
        <span className="text-[10px] font-bold text-slate-500">{sub}</span>
      </div>
    </div>
  </div>
);

const Trend = ({ value, good }) => {
  const { t } = useTranslation();
  if (value == null) return <span>{t('dash.vsLastMonthNone', 'no data last month')}</span>;
  const up = value >= 0;
  const positive = good === 'up' ? up : !up;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={positive ? 'text-green-600' : 'text-red-500'}>
      <Icon size={14} className="inline mr-0.5" />
      {up ? '+' : ''}{value}% {t('dash.vsLastMonth', 'vs last month')}
    </span>
  );
};

const Legend = ({ color, label }) => (
  <span className="inline-flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${color}`} />{label}</span>
);

const StatusPill = ({ status, t }) => {
  const map = { ACTIVE: 'bg-emerald-50 text-emerald-700', MAINTENANCE: 'bg-amber-50 text-amber-700', 'NON-ACTIVE': 'bg-slate-100 text-slate-500' };
  return <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${map[status] || map['NON-ACTIVE']}`}>{t(`dash.boatStatus.${status}`, status)}</span>;
};

const SignalPill = ({ status, t }) => {
  const map = { good: 'text-emerald-600', medium: 'text-amber-500', poor: 'text-amber-600', offline: 'text-red-600' };
  return <span className={`text-[11px] font-semibold ${map[status] || 'text-slate-400'}`}>● {t(`dash.signalStatus.${status || 'unknown'}`, status || 'unknown')}</span>;
};

const MaintenanceItem = ({ title, desc, tag, tagColor, iconColor, border, Icon = Wrench }) => (
  <div className={`bg-white p-3 rounded-xl shadow-sm border border-slate-100 ${border} flex items-center justify-between gap-2`}>
    <div className="flex items-center gap-3 min-w-0">
      <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center ${iconColor}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <h4 className="text-xs font-bold text-slate-900">{title}</h4>
        <p className="text-[10px] text-slate-400 leading-tight">{desc}</p>
      </div>
    </div>
    <span className={`shrink-0 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter ${tagColor}`}>
      {tag}
    </span>
  </div>
);

const DayForecast = ({ day, temp, rain }) => (
  <div className="flex flex-col items-center gap-1">
    <span className="text-[8px] font-bold text-white/60 uppercase">{day}</span>
    <span className="text-[9px] text-cyan-200">{rain != null ? `${rain}%` : ''}</span>
    <span className="text-[10px] font-bold">{temp}</span>
  </div>
);

// ============================================================
// ✅ RESPONSIVE STYLES - Unchanged
// ============================================================

const ownerDashboardStyles = `

  /* ==============================
     BASE - Dashboard foundation
     ============================== */
  .owner-page {
    min-height: 100vh;
  }


  /* ==============================
     LARGE DESKTOP (1280px+)
     - Everything stays original
     ============================== */


  /* ==============================
     LAPTOP (max-width: 1280px)
     ============================== */
  @media (max-width: 1280px) {

    /* Main padding */
    main {
      padding: 1.75rem !important;
    }

    /* Welcome heading */
    main h1 {
      font-size: 1.875rem !important;
    }

    /* Map height */
    main .h-\\[500px\\] {
      height: 400px !important;
    }

    /* Stat cards value */
    main .text-2xl.font-black {
      font-size: 1.5rem !important;
    }

    /* Weather temp */
    main .text-5xl.font-black {
      font-size: 2.75rem !important;
    }

    /* Weather card */
    main .text-lg.font-bold {
      font-size: 1rem !important;
    }

    /* Right widgets */
    main .rounded-3xl.p-6 {
      padding: 1.25rem !important;
    }
  }


  /* ==============================
     SMALL LAPTOP (max-width: 1024px)
     ============================== */
  @media (max-width: 1024px) {

    main {
      padding: 1.5rem !important;
    }

    main h1 {
      font-size: 1.75rem !important;
    }

    main p.text-sm.text-slate-500 {
      font-size: 0.75rem !important;
    }

    /* Map height */
    main .h-\\[500px\\] {
      height: 360px !important;
    }

    /* Map floating info */
    main .absolute.top-6.left-6 {
      top: 0.75rem !important;
      left: 0.75rem !important;
    }

    /* Map controls */
    main .absolute.bottom-6.right-6 {
      bottom: 0.75rem !important;
      right: 0.75rem !important;
    }

    /* Stack xl:grid-cols-3 earlier */
    main .grid.grid-cols-1.xl\\:grid-cols-3 {
      grid-template-columns: 1fr !important;
    }

    /* Stat cards grid */
    main .grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-5 {
      grid-template-columns: repeat(3, 1fr) !important;
    }

    /* Stat card value */
    main .text-2xl.font-black {
      font-size: 1.375rem !important;
    }

    /* Weather temp */
    main .text-5xl.font-black {
      font-size: 2.5rem !important;
    }

    /* Maintenance card */
    main .rounded-3xl.p-6 {
      padding: 1.25rem !important;
    }

    /* Download report button */
    main button.bg-blue-600 {
      font-size: 0.875rem !important;
      padding: 0.5rem 1rem !important;
    }
  }


  /* ==============================
     TABLET (max-width: 768px)
     - Stack layout vertically
     - Compact all sections
     ============================== */
  @media (max-width: 768px) {

    main {
      padding: 1.25rem !important;
    }

    /* Section header */
    main > div:first-child {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 0.875rem !important;
      margin-bottom: 1.5rem !important;
    }

    main h1 {
      font-size: 1.5rem !important;
    }

    main p.text-sm.text-slate-500 {
      font-size: 0.7rem !important;
    }

    /* Download button */
    main button.bg-blue-600 {
      font-size: 0.8125rem !important;
      padding: 0.5rem 0.875rem !important;
    }

    /* Stat cards - 2 columns */
    main .grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-5 {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 0.75rem !important;
      margin-bottom: 1.5rem !important;
    }

    /* Stat card padding */
    main .bg-white.p-5.rounded-xl {
      padding: 1rem !important;
    }

    /* Stat card value */
    main .text-2xl.font-black {
      font-size: 1.375rem !important;
    }

    /* Net profit card */
    main .bg-gradient-to-br.from-blue-900.to-cyan-600.p-5 {
      padding: 1rem !important;
    }

    /* Main grid - single column */
    main .grid.grid-cols-1.xl\\:grid-cols-3 {
      grid-template-columns: 1fr !important;
      gap: 1.25rem !important;
    }

    /* Map height */
    main .h-\\[500px\\] {
      height: 300px !important;
      border-radius: 1rem !important;
    }

    /* Map floating info */
    main .absolute.top-6.left-6 {
      top: 0.625rem !important;
      left: 0.625rem !important;
    }

    main .absolute.top-6.left-6 p.text-\\[10px\\] {
      font-size: 0.55rem !important;
    }

    main .absolute.top-6.left-6 p.text-xs {
      font-size: 0.6875rem !important;
    }

    /* Map controls */
    main .absolute.bottom-6.right-6 {
      bottom: 0.625rem !important;
      right: 0.625rem !important;
    }

    /* Maintenance card */
    main .rounded-3xl.p-6 {
      padding: 1.25rem !important;
      border-radius: 1.25rem !important;
    }

    /* Weather temp */
    main .text-5xl.font-black {
      font-size: 2.25rem !important;
    }

    /* Weather card */
    main .text-lg.font-bold {
      font-size: 0.9375rem !important;
    }

    /* Day forecast text */
    main .text-\\[8px\\] {
      font-size: 0.5625rem !important;
    }

    main .text-\\[10px\\].font-bold {
      font-size: 0.625rem !important;
    }

    /* Space-y-6 */
    main .space-y-6 > * + * {
      margin-top: 1rem !important;
    }
  }


  /* ==============================
     MOBILE (max-width: 640px)
     ============================== */
  @media (max-width: 640px) {

    main {
      padding: 1rem !important;
    }

    main h1 {
      font-size: 1.375rem !important;
    }

    /* Stat cards - 2 cols */
    main .grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-5 {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 0.625rem !important;
    }

    /* Stat card */
    main .bg-white.p-5.rounded-xl {
      padding: 0.875rem !important;
    }

    main .text-2xl.font-black {
      font-size: 1.25rem !important;
    }

    /* Map */
    main .h-\\[500px\\] {
      height: 260px !important;
      border-radius: 0.875rem !important;
    }

    /* Map floating info padding */
    main .absolute.top-6.left-6 .p-3 {
      padding: 0.5rem !important;
    }

    /* Maintenance item */
    main .bg-white.p-3.rounded-xl {
      padding: 0.625rem !important;
    }

    /* Maintenance icon */
    main .w-10.h-10.rounded-lg {
      width: 2rem !important;
      height: 2rem !important;
    }

    /* Weather card padding */
    main .rounded-3xl.p-6 {
      padding: 1rem !important;
    }

    /* Weather temp */
    main .text-5xl.font-black {
      font-size: 2rem !important;
    }

    /* Quick actions sections below */
    main .mt-8 {
      margin-top: 1.25rem !important;
    }

    /* Quick action buttons grid */
    main .mt-8.grid.grid-cols-2.sm\\:grid-cols-4 {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 0.75rem !important;
    }

    /* Fleet table font */
    main table th {
      font-size: 0.55rem !important;
      padding: 0.5rem !important;
    }

    main table td {
      font-size: 0.6875rem !important;
      padding: 0.625rem 0.5rem !important;
    }
  }


  /* ==============================
     SMALL MOBILE (max-width: 480px)
     ============================== */
  @media (max-width: 480px) {

    main {
      padding: 0.875rem !important;
    }

    main h1 {
      font-size: 1.25rem !important;
    }

    /* Stat cards - stack to 1 col */
    main .grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-5 {
      grid-template-columns: 1fr 1fr !important;
      gap: 0.5rem !important;
    }

    /* Stat card */
    main .bg-white.p-5.rounded-xl {
      padding: 0.75rem !important;
      border-radius: 0.75rem !important;
    }

    main .text-2xl.font-black {
      font-size: 1.125rem !important;
    }

    /* Map */
    main .h-\\[500px\\] {
      height: 220px !important;
    }

    /* Map floating info */
    main .absolute.top-6.left-6 {
      top: 0.375rem !important;
      left: 0.375rem !important;
    }

    main .absolute.top-6.left-6 .p-3 {
      padding: 0.375rem !important;
    }

    /* Weather temp */
    main .text-5xl.font-black {
      font-size: 1.75rem !important;
    }

    /* Weather card padding */
    main .rounded-3xl.p-6 {
      padding: 0.875rem !important;
      border-radius: 1rem !important;
    }

    /* Maintenance card */
    main .text-sm.font-bold.text-slate-900 {
      font-size: 0.75rem !important;
    }

    /* Fleet table - hide some columns */
    main table th:nth-child(3),
    main table td:nth-child(3) {
      display: none !important;
    }

    /* Activity feed */
    main .divide-y > div {
      padding: 0.75rem 1rem !important;
    }

    /* Top performing bars */
    main .w-20 {
      width: 3rem !important;
    }

    /* Space-y-6 */
    main .space-y-6 > * + * {
      margin-top: 0.875rem !important;
    }
  }


  /* ==============================
     VERY SMALL (max-width: 360px)
     ============================== */
  @media (max-width: 360px) {

    main {
      padding: 0.625rem !important;
    }

    main h1 {
      font-size: 1.125rem !important;
    }

    /* Stat cards */
    main .bg-white.p-5.rounded-xl {
      padding: 0.625rem !important;
    }

    main .text-2xl.font-black {
      font-size: 1rem !important;
    }

    /* Map */
    main .h-\\[500px\\] {
      height: 190px !important;
    }

    /* Weather temp */
    main .text-5xl.font-black {
      font-size: 1.5rem !important;
    }

    /* Weather card */
    main .rounded-3xl.p-6 {
      padding: 0.75rem !important;
    }

    /* Fleet table - hide more columns */
    main table th:nth-child(4),
    main table td:nth-child(4) {
      display: none !important;
    }

    /* Quick action buttons */
    main .mt-8.grid.grid-cols-2.sm\\:grid-cols-4 {
      grid-template-columns: 1fr 1fr !important;
      gap: 0.5rem !important;
    }

    /* Activity feed items */
    main .divide-y > div {
      padding: 0.625rem 0.75rem !important;
      gap: 0.625rem !important;
    }

    /* Space adjustments */
    main .space-y-6 > * + * {
      margin-top: 0.75rem !important;
    }

    main .mt-8 {
      margin-top: 1rem !important;
    }
  }


  /* ==============================
     ANIMATIONS
     ============================== */
  @keyframes ownerDashFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0);   }
  }

  main {
    animation: ownerDashFadeIn 0.3s ease forwards;
  }
`;

export default BoatOwnerDashboard;