import { useEffect, useMemo, useState } from "react";
import { Activity, MapPin, Radio, RefreshCw, Timer, Wifi } from "lucide-react";
import DashboardNav from "../../components/DashboardNav";
import DriverSidebar from "../../components/DriverSidebar";
import OwnerSidebar from "../../components/OwnerSidebar";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import useInternetStatus from "../../hooks/useInternetStatus";

const STATUS = {
  good: { label: "Good", icon: "🟢", color: "text-emerald-700", bg: "bg-emerald-50", hint: "Stable connection" },
  medium: { label: "Medium", icon: "🟡", color: "text-amber-700", bg: "bg-amber-50", hint: "Connection is slower than usual" },
  poor: { label: "Poor", icon: "🔴", color: "text-red-700", bg: "bg-red-50", hint: "Connection may interrupt updates" },
  offline: { label: "Offline", icon: "⚫", color: "text-slate-700", bg: "bg-slate-100", hint: "No internet connection" },
  checking: { label: "Checking", icon: "◌", color: "text-slate-600", bg: "bg-slate-100", hint: "Measuring internet connection" },
};

const SIGNAL_SCORE = { good: 100, medium: 65, poor: 30, offline: 0 };

async function getPlaceName(latitude, longitude) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=18&addressdetails=1`,
    { headers: { "Accept-Language": "en" } }
  );
  if (!response.ok) throw new Error("Place lookup failed");

  const data = await response.json();
  const address = data.address || {};
  const locality = address.city || address.town || address.village || address.suburb || address.hamlet || address.county;
  const street = address.road || address.pedestrian || address.residential;
  const place = [locality, street].filter((part, index, parts) => part && parts.indexOf(part) === index);
  return place.length ? place.join(", ") : data.display_name?.split(",").slice(0, 3).join(", ");
}

function requestDeviceLocation(onPosition, onPlaceName, onError) {
  if (!navigator.geolocation) {
    onError("unsupported");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
      onPosition(coords.accuracy);
      try {
        const name = await getPlaceName(coords.latitude, coords.longitude);
        onPlaceName(name || "Current location");
      } catch {
        onPlaceName("Current location");
      }
    },
    (error) => onError(error.code === 1 ? "denied" : "unavailable"),
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
  );
}

function hourlyStrength(history, currentStatus) {
  const now = Date.now();
  return [3, 2, 1].map((hoursAgo) => {
    const start = now - hoursAgo * 60 * 60 * 1000;
    const end = start + 60 * 60 * 1000;
    const hourSamples = history.filter((sample) => sample.checkedAt >= start && sample.checkedAt < end);
    const score = hourSamples.length
      ? Math.round(hourSamples.reduce((total, sample) => total + (SIGNAL_SCORE[sample.status] ?? 0), 0) / hourSamples.length)
      : null;
    return { label: hoursAgo === 0 ? "Now" : `${hoursAgo}h ago`, score };
  }).concat({ label: "Now", score: SIGNAL_SCORE[currentStatus] ?? null });
}

export default function SignalIndicator() {
  const { user } = useAuth();
  const isDriver = user?.role === "driver";
  const [boats, setBoats] = useState([]);
  const [boatId, setBoatId] = useState(localStorage.getItem("signalBoatId") || "");
  const connection = useInternetStatus({ boatId, report: isDriver });
  const details = STATUS[connection.status] || STATUS.checking;
  const [placeName, setPlaceName] = useState("");
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [locationStatus, setLocationStatus] = useState("requesting");
  const chartPoints = useMemo(
    () => hourlyStrength(connection.history, connection.status),
    [connection.history, connection.status]
  );

  useEffect(() => {
    requestDeviceLocation(
      (accuracy) => {
        setLocationAccuracy(Math.round(accuracy));
        setLocationStatus("granted");
      },
      setPlaceName,
      setLocationStatus
    );
  }, []);

  useEffect(() => {
    if (!isDriver) return;
    api.get("/boats/all").then(({ data }) => setBoats(Array.isArray(data) ? data : [])).catch(() => setBoats([]));
  }, [isDriver]);

  const selectBoat = (event) => {
    const value = event.target.value;
    setBoatId(value);
    localStorage.setItem("signalBoatId", value);
  };
  const locationMessage = placeName || (locationStatus === "requesting"
    ? "Waiting for the browser location permission..."
    : locationStatus === "denied"
      ? "Location access was denied in the browser"
      : locationStatus === "unsupported"
        ? "Location is not supported by this browser"
        : "Could not read your current location");

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 text-slate-900">
      {isDriver ? <DriverSidebar /> : <OwnerSidebar />}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardNav />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-9">
          <div className="mx-auto max-w-4xl">
            <div className="mb-7 flex items-start gap-4">
              <div className="rounded-lg bg-cyan-900 p-3 text-white"><Radio size={22} /></div>
              <div>
                <p className="text-sm font-semibold uppercase text-cyan-800">Network health</p>
                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Signal Indicator</h1>
                <p className="mt-2 max-w-xl text-sm text-slate-600">Internet connection quality measured between this device and the Deewaraya service.</p>
              </div>
            </div>
            {isDriver && (
              <label className="mb-5 block max-w-lg text-sm font-semibold text-slate-700">
                Boat for connection alerts
                <select value={boatId} onChange={selectBoat} className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-3 font-normal outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100">
                  <option value="">Choose a boat</option>
                  {boats.map((boat) => <option key={boat._id} value={boat._id}>{boat.boatName} · {boat.registrationNumber}</option>)}
                </select>
              </label>
            )}
            <section aria-live="polite" className={`rounded-xl border border-slate-200 ${details.bg} p-5 shadow-sm sm:p-8`}>
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">Current internet status</p>
                  <div className={`mt-2 flex items-center gap-3 text-3xl font-bold ${details.color}`}><span aria-hidden="true" className="text-2xl">{details.icon}</span>{details.label}</div>
                  <p className="mt-2 text-sm text-slate-600">{details.hint}</p>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-white/70 bg-white/75 px-4 py-3">
                  <Activity size={20} className="text-cyan-900" />
                  <div><p className="text-xs font-semibold uppercase text-slate-500">Service latency</p><p className="text-xl font-bold">{connection.latency == null ? "--" : `${connection.latency} ms`}</p></div>
                </div>
              </div>
              <div className="mt-5 flex items-start gap-3 border-t border-slate-300/60 pt-4">
                <MapPin size={18} className="mt-0.5 shrink-0 text-cyan-900" />
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Current location</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{locationMessage}</p>
                  {locationAccuracy != null && <p className="mt-1 text-xs text-slate-500">GPS accuracy: about {locationAccuracy} m</p>}
                </div>
              </div>
              <p className="mt-6 border-t border-slate-300/60 pt-4 text-xs text-slate-500">{connection.checkedAt ? `Last checked ${connection.checkedAt.toLocaleTimeString()}` : "Waiting for first measurement"} · Refreshes every 10 seconds</p>
            </section>
            <section aria-label="Signal strength over the last three hours" className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">Connection history</p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">Signal strength · last 3 hours</h2>
                </div>
                <p className="text-xs text-slate-500">Higher line = stronger connection</p>
              </div>
              <div className="mt-4">
                <svg viewBox="0 0 600 190" role="img" aria-label="Hourly signal strength from three hours ago to now" className="h-44 w-full overflow-visible">
                  {[0, 50, 100].map((value) => {
                    const y = 145 - value * 1.15;
                    return <g key={value}>
                      <line x1="48" x2="580" y1={y} y2={y} stroke="#e2e8f0" strokeDasharray={value === 0 ? "0" : "4 5"} />
                      <text x="36" y={y + 4} textAnchor="end" fill="#64748b" fontSize="11">{value}%</text>
                    </g>;
                  })}
                  {chartPoints.map((point, index) => {
                    const x = 70 + index * 165;
                    const y = point.score == null ? null : 145 - point.score * 1.15;
                    const previous = chartPoints[index - 1];
                    const previousY = previous?.score == null ? null : 145 - previous.score * 1.15;
                    return <g key={point.label}>
                      {y != null && previousY != null && <line x1={x - 165} y1={previousY} x2={x} y2={y} stroke="#0891b2" strokeWidth="4" strokeLinecap="round" />}
                      {y != null && <>
                        <circle cx={x} cy={y} r="8" fill="#fff" stroke="#0891b2" strokeWidth="4" />
                        <text x={x} y={y - 15} textAnchor="middle" fill="#0e7490" fontSize="12" fontWeight="700">{point.score}%</text>
                      </>}
                      <text x={x} y="174" textAnchor="middle" fill="#475569" fontSize="12" fontWeight="600">{point.label}</text>
                    </g>;
                  })}
                </svg>
              </div>
              {!connection.history.length && <p className="text-xs text-slate-500">Hourly history will build as connection checks run on this device.</p>}
            </section>
            <section aria-label="Recent connection performance" className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500">Average latency</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{connection.averageLatency == null ? "--" : `${connection.averageLatency} ms`}</p>
                  </div>
                  <span className="rounded-lg bg-cyan-50 p-3 text-cyan-900"><Timer size={21} /></span>
                </div>
                <p className="mt-3 text-xs text-slate-500">From {connection.latencySampleCount} successful checks in the recent window</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500">Connection stability</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{connection.stability == null ? "--" : `${connection.stability}%`}</p>
                  </div>
                  <span className="rounded-lg bg-emerald-50 p-3 text-emerald-800"><Wifi size={21} /></span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Connection stability" aria-valuemin={0} aria-valuemax={100} aria-valuenow={connection.stability ?? 0}>
                  <div className="h-full rounded-full bg-emerald-600 transition-[width] duration-500" style={{ width: `${connection.stability ?? 0}%` }} />
                </div>
                <p className="mt-3 text-xs text-slate-500">Successful checks across the latest {connection.sampleCount} attempts</p>
              </div>
            </section>
            {isDriver && !boatId && <p className="mt-4 text-sm text-amber-800">Choose the boat you are operating to send connection alerts to its owner.</p>}
            <button onClick={() => window.dispatchEvent(new Event("online"))} className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw size={16} /> Check now</button>
          </div>
        </main>
      </div>
    </div>
  );
}