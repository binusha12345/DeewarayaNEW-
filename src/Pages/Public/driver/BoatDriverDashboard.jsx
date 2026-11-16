import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DriverSidebar from '../../../components/DriverSidebar';
import DashboardNav from '../../../components/DashboardNav';
import DashboardPageHeader from '../../../components/DashboardPageHeader';
import FleetMap from '../../../components/dashboard/FleetMap';
import { useAuth } from '../../../context/AuthContext';
import useInternetStatus from '../../../hooks/useInternetStatus';
import api, { apiUrl } from '../../../services/api';
import { formatDistance, tempUnit, tempValue, useUserSettings, windUnitLabel, windValue } from '../../../services/userSettings';
import {
  Wind,
  Thermometer,
  Anchor,
  Crosshair,
  Info,
  Droplet,
  Compass,
  Siren,
  MessageSquare,
  Navigation,
  Loader2,
  ShieldCheck,
  TriangleAlert,
  Route,
  Clock,
} from 'lucide-react';

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const compassPoint = (deg) => (deg == null ? '' : COMPASS[Math.round(deg / 45) % 8]);

const fmtDate = (d, lang) => (d ? new Date(d).toLocaleDateString(lang === 'si' ? 'si-LK' : 'en-GB', { day: 'numeric', month: 'short' }) : '—');
const fmtTime = (d, lang) => (d ? new Date(d).toLocaleTimeString(lang === 'si' ? 'si-LK' : 'en-GB', { hour: '2-digit', minute: '2-digit' }) : '');
const hoursSince = (d, now) => (d ? Math.max(0, (now - new Date(d).getTime()) / 3600000) : 0);

const BoatDriverDashboard = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const settings = useUserSettings();
  const [boatId, setBoatId] = useState(() => localStorage.getItem('signalBoatId:driver') || '');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const signalBoatId = data?.boat?._id || '';
  const connection = useInternetStatus({ boatId: signalBoatId, report: Boolean(signalBoatId) });
  const connectionLabel = {
    good: t('driverDashboard.systemConnected'),
    medium: t('driverDashboard.weakConnection'),
    poor: t('driverDashboard.poorConnection'),
    offline: t('driverDashboard.offline'),
    checking: t('driverDashboard.checkingConnection'),
  }[connection.status] || t('driverDashboard.checkingConnection');
  const connectionIndicator = {
    good: "bg-emerald-300",
    medium: "bg-amber-300",
    poor: "bg-orange-300",
    offline: "bg-red-300",
    checking: "bg-white/60 animate-pulse",
  }[connection.status] || "bg-white/60 animate-pulse";

  const load = useCallback(() => {
    return api
      .get('/dashboard/driver', { params: boatId ? { boatId } : {} })
      .then(({ data: res }) => {
        setData(res.data);
        setNow(Date.now());
        setError('');
        if (res.data.boat?._id) localStorage.setItem('signalBoatId:driver', res.data.boat._id);
      })
      .catch((err) => setError(err.response?.data?.message || t('dash.loadFailed', 'Could not load dashboard data.')));
  }, [boatId, t]);

  useEffect(() => {
    load();
    const id = setInterval(load, 20000); // keep speed / position fresh while at sea
    return () => clearInterval(id);
  }, [load]);

  const lang = i18n.language;
  const boat = data?.boat;
  const trip = data?.activeTrip;
  const w = data?.weather;
  const windKts = w?.windSpeedKts;
  const windBars = windKts == null ? 0 : Math.min(8, Math.ceil(windKts / 4));
  const showReminder = settings.alerts.tripReminder && !trip && boat;

  const mapBoats = boat?.position
    ? [{
        id: boat._id,
        name: boat.boatName,
        lat: boat.position.latitude,
        lng: boat.position.longitude,
        heading: trip?.headingDeg,
        state: trip ? 'sea' : 'port',
        lines: [trip ? `${t('dash.onTripSince', { time: fmtTime(trip.startedAt, lang), defaultValue: 'On a trip since {{time}}' })}` : t('dash.lastKnown', 'Last known position'), boat.position.placeName],
      }]
    : [];

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans text-slate-800 overflow-hidden">

      <style>{driverDashboardStyles}</style>

      {/* Sidebar */}
      <DriverSidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Top Navigation */}
        <DashboardNav />

        {/* Dashboard area */}
        <main className="flex-1 overflow-y-auto p-8">
          {(connection.status === 'poor' || connection.status === 'offline') && (
            <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
              <span>{connection.status === 'offline' ? t('driverDashboard.internetOffline') : t('driverDashboard.internetPoor')}</span>
              <a href="/signal-indicator" className="underline underline-offset-2">{t('driverDashboard.viewSignalStatus')}</a>
            </div>
          )}

          {data?.activeEmergency && (
            <Link to="/driver/emergency" role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-300 bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-md">
              <span className="flex items-center gap-2"><Siren size={18} /> {t('dash.sosActive', 'Your SOS is active — help has been alerted.')}</span>
              <span className="underline underline-offset-2">{t('dash.openEmergency', 'Open emergency')}</span>
            </Link>
          )}

          <DashboardPageHeader
            eyebrow={t('driverDashboard.eyebrow')}
            title={t('driverDashboard.welcome', { name: user?.name || 'Driver' })}
            description={t('driverDashboard.description')}
            icon={Anchor}
            theme="cyan"
            action={
              <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 p-3">
                <span className={`h-2.5 w-2.5 rounded-full ${connectionIndicator}`} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">{t('driverDashboard.connection')}</p>
                  <p className="text-sm font-bold">{connectionLabel}</p>
                </div>
              </div>
            }
          />

          {error && <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

          {data?.boats?.length > 1 && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">{t('dash.showingBoat', 'Boat:')}</span>
              {data.boats.map((b) => (
                <button
                  key={b._id}
                  onClick={() => setBoatId(b._id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${b._id === boat?._id ? 'bg-cyan-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-cyan-50'}`}
                >
                  {b.boatName}
                </button>
              ))}
            </div>
          )}

          {!data && !error ? (
            <div className="flex items-center justify-center gap-2 py-24 text-slate-500">
              <Loader2 className="animate-spin" size={20} /> {t('dash.loadingBoat', 'Loading your boat…')}
            </div>
          ) : data && !boat ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              <Anchor className="mx-auto mb-3 text-slate-400" size={28} />
              {t('dash.noAssignedBoat', 'No boat is assigned to you yet. Ask your boat owner to assign you, or scan a boat QR code.')}
              <div className="mt-4"><Link to="/driver/qr-code" className="font-semibold text-cyan-700 hover:underline">{t('dash.scanQr', 'Scan boat QR')}</Link></div>
            </div>
          ) : data && (
          <>
          {/* Trip reminder */}
          {showReminder && (
            <div className={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 ${w && !w.safe ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>
              <div className="flex items-start gap-3">
                {w && !w.safe ? <TriangleAlert size={22} className="mt-0.5 shrink-0" /> : <ShieldCheck size={22} className="mt-0.5 shrink-0" />}
                <div>
                  <p className="text-sm font-bold">{t('dash.beforeYouGo', 'Before you go out')}</p>
                  <p className="text-xs leading-5">
                    {w
                      ? (w.safe
                          ? t('dash.reminderSafe', { wind: `${windValue(w.windSpeedKts, settings.windUnit)} ${windUnitLabel(settings.windUnit)}`, defaultValue: 'Sea looks calm (wind {{wind}}). Check fuel, life jackets and radio before starting your trip.' })
                          : t('dash.reminderRough', { wind: `${windValue(w.windSpeedKts, settings.windUnit)} ${windUnitLabel(settings.windUnit)}`, defaultValue: 'Strong wind ({{wind}}). Think twice before going out and tell your owner your plan.' }))
                      : t('dash.reminderNoWeather', 'Check the weather and your safety gear before starting a trip.')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link to="/weather" className="rounded-xl border border-current/20 bg-white px-3 py-2 text-xs font-bold">{t('dash.checkWeather', 'Check weather')}</Link>
                <Link to="/driver/trips" className="rounded-xl bg-cyan-800 px-3 py-2 text-xs font-bold text-white">{t('dash.startTrip', 'Start trip')}</Link>
              </div>
            </div>
          )}

          {/* Grid Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Left column (Map + Telemetry Cards) */}
            <div className="xl:col-span-2 space-y-6">

              {/* Map View */}
              <div className="relative h-[540px] overflow-hidden rounded-2xl bg-slate-200 shadow-lg ring-1 ring-slate-200">
                {mapBoats.length ? (
                  <FleetMap boats={mapBoats} path={trip?.path || []} />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-slate-500">
                    <Navigation size={28} className="text-slate-400" />
                    {t('dash.noBoatPosition', 'No position yet — start a trip to see your boat on the map.')}
                  </div>
                )}
                <div className="absolute right-5 top-5 z-[400] flex items-center gap-2 rounded-full border border-white/50 bg-white/90 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-700 shadow-md backdrop-blur pointer-events-none">
                  <span className={`h-2 w-2 rounded-full ${trip ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {trip ? t('dash.tripLive', 'Trip live') : t('dash.notOnTrip', 'Not on a trip')}
                </div>

                {/* HUD Overlay */}
                <div className="absolute top-6 left-6 z-[400] min-w-[200px] rounded-3xl border border-white/60 bg-white/90 p-5 shadow-xl backdrop-blur-md pointer-events-none">
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                      {t('driverDashboard.navigationHud')}
                    </p>
                    {trip && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>}
                  </div>

                  <div className="mb-4">
                    <span className="text-4xl font-bold text-slate-900">{trip?.speedKnots != null ? trip.speedKnots.toFixed(1) : '—'}</span>
                    <span className="text-xs font-bold text-slate-500 ml-1">{t('driverDashboard.knots')}</span>
                  </div>

                  <div className="flex gap-6 border-t border-slate-200 pt-3">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{t('driverDashboard.heading')}</p>
                      <p className="text-sm font-bold text-slate-900">{trip?.headingDeg != null ? `${trip.headingDeg}° ${compassPoint(trip.headingDeg)}` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{t('dash.thisTrip', 'This trip')}</p>
                      <p className="text-sm font-bold text-slate-900">
                        {trip ? `${formatDistance(trip.distanceKm, settings.distanceUnit)} · ${hoursSince(trip.startedAt, now).toFixed(1)} h` : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Today / this month */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MiniStat icon={Route} label={t('dash.tripsToday', 'Trips today')} value={data.today.trips} />
                <MiniStat icon={Compass} label={t('dash.distanceToday', 'Distance today')} value={formatDistance(data.today.distanceKm, settings.distanceUnit)} />
                <MiniStat icon={Route} label={t('dash.tripsMonth', 'Trips this month')} value={data.month.trips} />
                <MiniStat icon={Clock} label={t('dash.hoursMonth', 'Hours at sea (month)')} value={`${data.month.hours} h`} />
              </div>

              {/* Bottom Cards (Wind & Temp) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Wind Card */}
                <div className="group relative overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-white via-white to-sky-50 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="absolute -right-5 -top-8 h-24 w-24 rounded-full bg-sky-100/70 transition-transform group-hover:scale-110" />
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {t('driverDashboard.windVelocity')}
                    </h3>
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700 ring-1 ring-sky-200">
                      <Wind size={20} />
                    </div>
                  </div>
                  <div className="relative mb-2">
                    <span className="text-5xl font-bold text-slate-900">{windKts != null ? windValue(windKts, settings.windUnit) : '—'}</span>
                    <span className="ml-1 text-lg font-bold text-slate-500">{windUnitLabel(settings.windUnit)} {w?.windDirection || ''}</span>
                  </div>
                  <p className="text-sm text-slate-500">
                    {w ? (w.safe ? t('dash.safeToSail', 'Safe to sail') : t('dash.roughSea', 'Rough sea — take care')) : t('dash.noWeatherShort', 'No weather check yet')}
                    {w?.waveHeight != null && ` · ${t('dash.wave', { value: w.waveHeight, defaultValue: 'Waves {{value}} m' })}`}
                  </p>
                  <div className="mt-5 flex items-center gap-1.5" aria-label={t('driverDashboard.windVelocity')}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((bar) => (
                      <span key={bar} className={`h-1.5 flex-1 rounded-full ${bar <= windBars ? (windBars >= 5 ? "bg-red-500" : "bg-sky-500") : "bg-sky-100"}`} />
                    ))}
                  </div>
                </div>

                {/* Temperature Card */}
                <div className="group relative overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-white via-white to-orange-50 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="absolute -right-5 -top-8 h-24 w-24 rounded-full bg-orange-100/70 transition-transform group-hover:scale-110" />
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {t('driverDashboard.temperature')}
                    </h3>
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-700 ring-1 ring-orange-200">
                      <Thermometer size={20} />
                    </div>
                  </div>
                  <div className="relative mb-2">
                    <span className="text-5xl font-bold text-slate-900">{w ? tempValue(w.temperature, settings.temperatureUnit) : '—'}</span>
                    <span className="ml-1 text-2xl font-bold text-slate-500">{tempUnit(settings.temperatureUnit)}</span>
                  </div>
                  <p className="text-sm capitalize text-slate-500">
                    {w ? `${w.description || w.condition || ''}${w.placeName ? ` · ${w.placeName}` : ''}` : t('dash.noWeatherShort', 'No weather check yet')}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {w && t('dash.humidityRain', { humidity: w.humidity ?? '—', rain: w.rainChance ?? '—', defaultValue: 'Humidity {{humidity}}% · Rain {{rain}}%' })}
                  </p>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-orange-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${Math.min(100, Math.max(5, ((w?.temperature ?? 0) / 40) * 100))}%` }} />
                  </div>
                </div>

              </div>
            </div>

            {/* Right Column (Sidebar Widgets) */}
            <div className="space-y-6">

              {/* Boat Details Card */}
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg">
                {/* Decorative blob top right */}
                <div className="absolute -right-10 -top-10 z-0 h-36 w-36 rounded-full bg-gradient-to-br from-cyan-100 to-sky-50"></div>

                <div className="flex items-center gap-2 mb-6 relative z-10">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-800 text-white shadow-sm">
                    <Info size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-700">{t('driverDashboard.vesselProfile')}</p>
                    <h3 className="text-lg font-bold text-slate-900">{t('driverDashboard.boatDetails')}</h3>
                  </div>
                </div>

                <div className="relative mb-5 h-40 overflow-hidden rounded-2xl bg-slate-100">
                  <img
                    src={boat.imageUrl ? apiUrl(boat.imageUrl) : "src/assets/bddash.png"}
                    alt={boat.boatName}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <span className="absolute bottom-3 left-3 rounded-full border border-white/40 bg-slate-950/65 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
                    {t(`dash.boatStatus.${boat.boatStatus}`, boat.boatStatus || t('driverDashboard.assignedVessel'))}
                  </span>
                </div>

                <div className="mb-5 grid grid-cols-2 gap-3">
                  <div className="col-span-2 rounded-xl bg-cyan-50/80 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t('driverDashboard.boatName')}</p>
                    <p className="mt-1 text-lg font-bold text-cyan-900">{boat.boatName}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t('driverDashboard.registration')}</p>
                    <p className="mt-1 text-sm font-bold text-slate-900 break-all">{boat.registrationNumber || '—'}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t('dash.boatType', 'Type')}</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">{boat.boatType || '—'}{boat.modelYear ? ` · ${boat.modelYear}` : ''}</p>
                  </div>
                  <div className="col-span-2 flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5">
                    <span className="text-xs font-semibold text-slate-500">{t('driverDashboard.engineType')}</span>
                    <span className="text-sm font-bold text-slate-900">{[boat.engineType, boat.horsepower && `${boat.horsepower} HP`].filter(Boolean).join(' · ') || '—'}</span>
                  </div>
                  {boat.owner && (
                    <div className="col-span-2 flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5">
                      <span className="text-xs font-semibold text-slate-500">{t('dash.owner', 'Owner')}</span>
                      <span className="text-sm font-bold text-slate-900">{boat.owner.name}{boat.owner.phone ? ` · ${boat.owner.phone}` : ''}</span>
                    </div>
                  )}
                </div>

                {/* Fuel capacity */}
                <div className="flex items-center gap-4 rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 to-cyan-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sky-700 shadow-sm">
                    <Droplet size={21} fill="currentColor" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">{t('dash.fuelCapacity', 'Fuel tank')}</span>
                      <span className="text-xs font-extrabold text-cyan-900">{boat.fuelCapacity ? `${boat.fuelCapacity} L` : '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-cyan-950 to-cyan-800 p-6 text-white shadow-lg shadow-cyan-950/15">
                <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full border border-white/10" />
                <div className="relative mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                    <Crosshair size={19} />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-200">{t('driverDashboard.atYourFingertips')}</p>
                    <h3 className="text-sm font-bold">{t('driverDashboard.quickActions')}</h3>
                  </div>
                </div>

                <div className="relative space-y-3">
                  <Link to="/driver/trips" className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-cyan-400">
                    <Anchor size={18} />
                    {trip ? t('dash.manageTrip', 'Manage current trip') : t('dash.startTrip', 'Start trip')}
                  </Link>

                  <Link to="/driver/messages" className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/15">
                    <MessageSquare size={18} />
                    {t('dash.messagesBtn', 'Messages')}
                    {data.unreadMessages > 0 && <span className="rounded-full bg-cyan-400 px-2 py-0.5 text-[10px] font-black text-slate-900">{data.unreadMessages}</span>}
                  </Link>

                  <Link to="/driver/emergency" className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/15">
                    <span className="rounded-md bg-red-500 px-2 py-1 text-[10px] font-black tracking-widest text-white">SOS</span>
                    {t('driverDashboard.emergencyBroadcast')}
                  </Link>
                </div>
              </div>

              {/* Recent trips */}
              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">{t('dash.recentTrips', 'Recent trips')}</h3>
                  <Link to="/driver/trips" className="text-[10px] font-bold text-cyan-700 uppercase hover:underline">{t('ownerDashboard.maintenance.seeAll')}</Link>
                </div>
                <div className="divide-y divide-slate-100">
                  {data.recentTrips.length === 0 && <p className="px-5 py-6 text-center text-xs text-slate-400">{t('dash.noTrips', 'No trips yet.')}</p>}
                  {data.recentTrips.map((r) => (
                    <div key={r._id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-900">{r.boat}</p>
                        <p className="text-[10px] text-slate-400">{fmtDate(r.startedAt, lang)} {fmtTime(r.startedAt, lang)}</p>
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
          </div>
          </>
          )}

        </main>
      </div>
    </div>
  );
};

const MiniStat = ({ icon: Icon, label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
      <Icon size={14} className="text-cyan-700" /> {label}
    </div>
    <p className="mt-2 text-xl font-black text-slate-900">{value}</p>
  </div>
);

// ============================================================
// ✅ RESPONSIVE STYLES - Proper & Clean
// ============================================================

const driverDashboardStyles = `

  /* ==============================
     BASE - Dashboard foundation
     ============================== */
  .driver-page {
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

    /* Header */
    main h1 {
      font-size: 1.75rem !important;
    }

    /* Map height */
    main .relative.h-\\[540px\\] {
      height: 420px !important;
    }

    /* HUD overlay */
    main .absolute.top-6.left-6 {
      padding: 1rem !important;
      min-width: 170px !important;
    }

    main .absolute.top-6.left-6 span.text-4xl {
      font-size: 2.25rem !important;
    }

    /* Wind & Temp cards */
    main .text-5xl {
      font-size: 2.75rem !important;
    }

    /* Right column boat image */
    main .h-40 {
      height: 8rem !important;
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
      font-size: 1.625rem !important;
    }

    main p.text-slate-600 {
      font-size: 0.8125rem !important;
    }

    /* Map height */
    main .relative.h-\\[540px\\] {
      height: 380px !important;
    }

    /* HUD overlay */
    main .absolute.top-6.left-6 {
      padding: 0.875rem !important;
      min-width: 160px !important;
      border-radius: 1.25rem !important;
    }

    main .absolute.top-6.left-6 span.text-4xl {
      font-size: 2rem !important;
    }

    main .absolute.top-6.left-6 .text-sm {
      font-size: 0.75rem !important;
    }

    /* Grid - stack xl:col-span-2 earlier */
    main .grid.grid-cols-1.xl\\:grid-cols-3 {
      grid-template-columns: 1fr !important;
    }

    /* Wind & Temp number */
    main .text-5xl {
      font-size: 2.5rem !important;
    }

    /* Boat details card */
    main .rounded-3xl.p-6 {
      padding: 1.25rem !important;
    }

    main .h-40 {
      height: 7rem !important;
    }
  }


  /* ==============================
     TABLET (max-width: 768px)
     - Stack layout vertically
     - Compact map & cards
     ============================== */
  @media (max-width: 768px) {

    main {
      padding: 1.25rem !important;
    }

    /* Dashboard header */
    main > div:first-child {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 1rem !important;
      margin-bottom: 1.5rem !important;
    }

    main h1 {
      font-size: 1.5rem !important;
      margin-bottom: 0.25rem !important;
    }

    main p.text-slate-600 {
      font-size: 0.75rem !important;
    }

    /* Status badge */
    main > div:first-child > div:last-child {
      width: 100% !important;
      justify-content: flex-start !important;
    }

    /* Main grid - single column */
    main .grid.grid-cols-1.xl\\:grid-cols-3 {
      grid-template-columns: 1fr !important;
      gap: 1.25rem !important;
    }

    /* Map height */
    main .relative.h-\\[540px\\] {
      height: 320px !important;
      border-radius: 1rem !important;
    }

    /* HUD overlay */
    main .absolute.top-6.left-6 {
      top: 0.75rem !important;
      left: 0.75rem !important;
      padding: 0.75rem !important;
      min-width: 150px !important;
      border-radius: 1rem !important;
    }

    main .absolute.top-6.left-6 span.text-4xl {
      font-size: 1.75rem !important;
    }

    main .absolute.top-6.left-6 .text-xs {
      font-size: 0.6rem !important;
    }

    /* Map controls */
    main .absolute.bottom-6.right-6 {
      bottom: 0.75rem !important;
      right: 0.75rem !important;
    }

    /* Wind & Temp grid */
    main .grid.grid-cols-1.md\\:grid-cols-2 {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 1rem !important;
    }

    /* Wind & Temp numbers */
    main .text-5xl {
      font-size: 2.25rem !important;
    }

    main .text-lg.font-bold.text-slate-700 {
      font-size: 0.875rem !important;
    }

    main .text-2xl.font-bold.text-slate-900 {
      font-size: 1.25rem !important;
    }

    /* Right column cards */
    main .rounded-3xl {
      border-radius: 1.25rem !important;
    }

    main .rounded-3xl.p-6 {
      padding: 1.25rem !important;
    }

    main .h-40 {
      height: 9rem !important;
    }

    /* Quick actions */
    main .bg-\\[\\#e2e8f0\\].rounded-3xl.p-6 {
      padding: 1.25rem !important;
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

    /* Map height */
    main .relative.h-\\[540px\\] {
      height: 280px !important;
      border-radius: 0.875rem !important;
    }

    /* HUD overlay */
    main .absolute.top-6.left-6 {
      top: 0.625rem !important;
      left: 0.625rem !important;
      padding: 0.625rem !important;
      min-width: 130px !important;
    }

    main .absolute.top-6.left-6 span.text-4xl {
      font-size: 1.5rem !important;
    }

    /* Wind & Temp grid - stack */
    main .grid.grid-cols-1.md\\:grid-cols-2 {
      grid-template-columns: 1fr !important;
      gap: 0.875rem !important;
    }

    /* Wind & Temp card */
    main .rounded-2xl.p-6 {
      padding: 1rem !important;
      border-radius: 1rem !important;
    }

    main .text-5xl {
      font-size: 2rem !important;
    }

    /* Boat details */
    main .rounded-3xl.p-6 {
      padding: 1rem !important;
    }

    main .h-40 {
      height: 8rem !important;
    }

    main .text-lg.font-bold.text-\\[\\#005a8d\\] {
      font-size: 1rem !important;
    }

    /* Fuel bar */
    main .bg-\\[\\#f0f4f8\\].rounded-xl.p-4 {
      padding: 0.75rem !important;
    }

    /* Quick actions buttons */
    main .space-y-3 button {
      padding-top: 0.625rem !important;
      padding-bottom: 0.625rem !important;
      font-size: 0.875rem !important;
    }

    /* Gap adjustments */
    main .space-y-6 > * + * {
      margin-top: 1rem !important;
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

    main p.text-slate-600 {
      font-size: 0.7rem !important;
    }

    /* Map height */
    main .relative.h-\\[540px\\] {
      height: 240px !important;
      border-radius: 0.75rem !important;
    }

    /* HUD overlay */
    main .absolute.top-6.left-6 {
      top: 0.5rem !important;
      left: 0.5rem !important;
      padding: 0.5rem !important;
      min-width: 115px !important;
      border-radius: 0.875rem !important;
    }

    main .absolute.top-6.left-6 span.text-4xl {
      font-size: 1.375rem !important;
    }

    main .absolute.top-6.left-6 .mb-3 p {
      font-size: 0.55rem !important;
    }

    main .absolute.top-6.left-6 .flex.gap-6 {
      gap: 0.75rem !important;
    }

    /* Wind & Temp cards */
    main .text-5xl {
      font-size: 1.75rem !important;
    }

    main .text-sm.text-slate-500 {
      font-size: 0.7rem !important;
    }

    /* Boat details card */
    main .rounded-3xl.p-6 {
      padding: 0.875rem !important;
      border-radius: 1rem !important;
    }

    main .h-40 {
      height: 7rem !important;
    }

    main .text-lg.font-bold.text-slate-900 {
      font-size: 0.9375rem !important;
    }

    /* Space-y-4 in boat details */
    main .space-y-4 > * + * {
      margin-top: 0.75rem !important;
    }

    /* Quick actions */
    main .space-y-3 button {
      padding: 0.5rem 1rem !important;
      font-size: 0.8125rem !important;
      border-radius: 0.75rem !important;
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

    /* Map */
    main .relative.h-\\[540px\\] {
      height: 200px !important;
    }

    /* HUD overlay */
    main .absolute.top-6.left-6 {
      min-width: 100px !important;
      padding: 0.375rem !important;
    }

    main .absolute.top-6.left-6 span.text-4xl {
      font-size: 1.25rem !important;
    }

    /* Cards */
    main .text-5xl {
      font-size: 1.5rem !important;
    }

    main .rounded-2xl.p-6 {
      padding: 0.875rem !important;
    }

    /* Boat details */
    main .h-40 {
      height: 6rem !important;
    }

    main .rounded-3xl.p-6 {
      padding: 0.75rem !important;
    }

    /* Quick actions */
    main .space-y-3 button {
      padding: 0.5rem 0.75rem !important;
      font-size: 0.75rem !important;
    }
  }


  /* ==============================
     ANIMATIONS
     ============================== */
  @keyframes dashFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0);   }
  }

  main {
    animation: dashFadeIn 0.3s ease forwards;
  }
`;

export default BoatDriverDashboard;