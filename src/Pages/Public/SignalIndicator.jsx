import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, MapPin, RefreshCw, Signal, ShieldCheck } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import HomeNavBar from "../../components/HomeNavBar";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import useInternetStatus from "../../hooks/useInternetStatus";

const SIGNAL_STYLES = {
  good: { label: "Good", color: "#15803d", pill: "bg-emerald-100 text-emerald-800" },
  medium: { label: "Weak", color: "#d97706", pill: "bg-amber-100 text-amber-800" },
  poor: { label: "Poor", color: "#dc2626", pill: "bg-red-100 text-red-800" },
  offline: { label: "Offline", color: "#7f1d1d", pill: "bg-red-100 text-red-900" },
  checking: { label: "Waiting", color: "#64748b", pill: "bg-slate-100 text-slate-700" },
};

const DEFAULT_CENTER = [7.8, 80.7];

function formatCoordinates(reading) {
  return `${Number(reading.latitude).toFixed(4)}, ${Number(reading.longitude).toFixed(4)}`;
}

function toLatLng(point) {
  if (!point || point.latitude == null || point.longitude == null || point.latitude === "" || point.longitude === "") {
    return null;
  }
  const latitude = Number(point.latitude);
  const longitude = Number(point.longitude);
  if (
    !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
    latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180
  ) {
    return null;
  }
  return [latitude, longitude];
}

function CoverageViewport({ readings, liveLocation }) {
  const map = useMap();

  useEffect(() => {
    const points = readings.map(toLatLng).filter(Boolean);
    const livePoint = toLatLng(liveLocation);
    if (livePoint) points.push(livePoint);
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], 9, { animate: false });
      return;
    }
    map.fitBounds(points, { padding: [36, 36], maxZoom: 9, animate: false });
  }, [map, readings, liveLocation]);

  return null;
}

function CoverageMap({ readings, liveLocation, placeName }) {
  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={6}
      scrollWheelZoom={false}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <CoverageViewport readings={readings} liveLocation={liveLocation} />
      {readings.map((reading, index) => {
        const position = toLatLng(reading);
        if (!position) return null;
        const style = SIGNAL_STYLES[reading.status] || SIGNAL_STYLES.checking;
        return (
          <CircleMarker
            key={reading._id || `${reading.recordedAt}-${index}`}
            center={position}
            radius={8}
            pathOptions={{ color: "#ffffff", weight: 2, fillColor: style.color, fillOpacity: 0.95 }}
          >
            <Popup>
              <div className="min-w-40 text-sm">
                <p className="font-bold" style={{ color: style.color }}>{style.label} connection</p>
                <p className="mt-1 text-slate-600">{formatCoordinates(reading)}</p>
                <p className="mt-1 text-slate-600">{new Date(reading.recordedAt).toLocaleString()}</p>
                {reading.latency != null && <p className="mt-1 text-slate-600">Service response: {reading.latency} ms</p>}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
      {toLatLng(liveLocation) && (
        <CircleMarker
          center={toLatLng(liveLocation)}
          radius={12}
          pathOptions={{ color: "#0e7490", weight: 3, fillColor: "#22d3ee", fillOpacity: 1 }}
        >
          <Popup>
            <div className="min-w-40 text-sm">
              <p className="font-bold text-cyan-800">Driver GPS position</p>
              <p className="mt-1 text-slate-600">{placeName || "Place name unavailable"}</p>
              <p className="mt-1 text-slate-600">{formatCoordinates(liveLocation)}</p>
              <p className="mt-1 text-slate-600">Updated {new Date(liveLocation.recordedAt).toLocaleString()}</p>
            </div>
          </Popup>
        </CircleMarker>
      )}
    </MapContainer>
  );
}

export default function SignalIndicator() {
  const { user } = useAuth();
  const isDriver = user?.role === "driver";
  const [boats, setBoats] = useState([]);
  const [boatId, setBoatId] = useState("");
  const [boatSnapshot, setBoatSnapshot] = useState(null);
  const [readings, setReadings] = useState([]);
  const [loadingBoats, setLoadingBoats] = useState(true);
  const [loadingReadings, setLoadingReadings] = useState(false);
  const [pageError, setPageError] = useState("");
  const [coverageError, setCoverageError] = useState("");
  const [coverageEnabled, setCoverageEnabled] = useState(false);
  const [livePlaceName, setLivePlaceName] = useState("");
  const placeNameCache = useRef(new Map());
  const coveragePreferenceKey = `signalCoverageEnabled:${user?._id || user?.id || "user"}`;
  const connection = useInternetStatus({ boatId: isDriver ? boatId : "", report: isDriver });

  useEffect(() => {
    if (!user || !["owner", "driver"].includes(user.role)) return undefined;
    let active = true;
    setLoadingBoats(true);
    api.get(user.role === "owner" ? "/boats" : "/boats/assigned")
      .then(({ data }) => {
        if (!active) return;
        const nextBoats = Array.isArray(data) ? data : [];
        setBoats(nextBoats);
        const savedId = localStorage.getItem(`signalBoatId:${user.role}`)
          || (user.role === "driver" ? localStorage.getItem("signalBoatId") : "");
        const selected = nextBoats.find((boat) => boat._id === savedId) || nextBoats[0];
        const nextBoatId = selected?._id || "";
        setBoatId(nextBoatId);
        if (nextBoatId) localStorage.setItem(`signalBoatId:${user.role}`, nextBoatId);
      })
      .catch((error) => {
        if (active) setPageError(error.response?.data?.message || "Could not load your boats");
      })
      .finally(() => {
        if (active) setLoadingBoats(false);
      });
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    setCoverageEnabled(localStorage.getItem(coveragePreferenceKey) === "true");
  }, [coveragePreferenceKey]);

  useEffect(() => {
    if (!boatId) {
      setReadings([]);
      setBoatSnapshot(null);
      return undefined;
    }

    let active = true;
    const loadCoverage = async () => {
      setLoadingReadings(true);
      try {
        const { data } = await api.get(`/signal/readings/${boatId}`);
        if (!active) return;
        setBoatSnapshot(data.boat);
        setReadings(Array.isArray(data.readings) ? data.readings.filter(toLatLng) : []);
        setPageError("");
      } catch (error) {
        if (active) setPageError(error.response?.data?.message || "Could not load signal coverage");
      } finally {
        if (active) setLoadingReadings(false);
      }
    };

    loadCoverage();
    const interval = setInterval(loadCoverage, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [boatId]);

  useEffect(() => {
    const handleCoverageResult = (event) => setCoverageError(event.detail?.error || "");
    window.addEventListener("signal-coverage-result", handleCoverageResult);
    return () => window.removeEventListener("signal-coverage-result", handleCoverageResult);
  }, []);

  const selectedBoat = boats.find((boat) => boat._id === boatId);
  const latestGoodReading = [...readings].reverse().find((reading) => reading.status === "good");
  const latestLostReading = [...readings].reverse().find((reading) => reading.status === "poor" || reading.status === "offline");
  const liveLocation = boatSnapshot?.signalLocation;
  const livePoint = toLatLng(liveLocation);
  const liveLocationKey = livePoint ? `${livePoint[0].toFixed(3)},${livePoint[1].toFixed(3)}` : "";
  const liveLocationIsFresh = liveLocation?.recordedAt && Date.now() - new Date(liveLocation.recordedAt).getTime() <= 2 * 60 * 1000;
  const currentStatus = isDriver
    ? connection.status
    : !boatSnapshot?.connectionCheckedAt
      ? "checking"
      : Date.now() - new Date(boatSnapshot.connectionCheckedAt).getTime() > 2 * 60 * 1000
        ? "offline"
        : boatSnapshot.connectionStatus || "checking";
  const statusStyle = SIGNAL_STYLES[currentStatus] || SIGNAL_STYLES.checking;
  const statusCounts = useMemo(() => readings.reduce((counts, reading) => {
    counts[reading.status] = (counts[reading.status] || 0) + 1;
    return counts;
  }, {}), [readings]);

  useEffect(() => {
    if (!liveLocationKey) {
      setLivePlaceName("");
      return undefined;
    }

    const cachedPlace = placeNameCache.current.get(liveLocationKey)
      || sessionStorage.getItem(`signalPlaceName:${liveLocationKey}`);
    if (cachedPlace) {
      setLivePlaceName(cachedPlace);
      return undefined;
    }

    let active = true;
    const [latitude, longitude] = liveLocationKey.split(",");
    fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
      .then((response) => {
        if (!response.ok) throw new Error("Place lookup failed");
        return response.json();
      })
      .then((data) => {
        const locality = data.locality || data.city;
        const place = [locality, data.principalSubdivision, data.countryName]
          .filter((part, index, parts) => part && parts.indexOf(part) === index)
          .join(", ");
        if (!active) return;
        if (place) {
          placeNameCache.current.set(liveLocationKey, place);
          sessionStorage.setItem(`signalPlaceName:${liveLocationKey}`, place);
          setLivePlaceName(place);
        } else {
          setLivePlaceName("Place name unavailable");
        }
      })
      .catch(() => {
        if (active) setLivePlaceName("Place name unavailable");
      });

    return () => { active = false; };
  }, [liveLocationKey]);

  const handleSelectBoat = (event) => {
    const nextBoatId = event.target.value;
    setBoatId(nextBoatId);
    setBoatSnapshot(null);
    localStorage.setItem(`signalBoatId:${user.role}`, nextBoatId);
    if (isDriver) localStorage.setItem("signalBoatId", nextBoatId);
    window.dispatchEvent(new Event("signal-boat-change"));
  };

  const toggleCoverage = () => {
    const nextEnabled = !coverageEnabled;
    setCoverageEnabled(nextEnabled);
    setCoverageError("");
    localStorage.setItem(coveragePreferenceKey, String(nextEnabled));
    window.dispatchEvent(new Event("signal-coverage-setting"));
    if (nextEnabled && !navigator.geolocation) {
      setCoverageError("GPS location is not supported by this browser.");
    }
  };

  const refreshCoverage = async () => {
    if (!boatId) return;
    setLoadingReadings(true);
    try {
      const { data } = await api.get(`/signal/readings/${boatId}`);
      setBoatSnapshot(data.boat);
      setReadings(Array.isArray(data.readings) ? data.readings.filter(toLatLng) : []);
      setPageError("");
    } catch (error) {
      setPageError(error.response?.data?.message || "Could not refresh signal coverage");
    } finally {
      setLoadingReadings(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f2] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <HomeNavBar opaqueBackground />
      <main className="mx-auto max-w-7xl px-4 pb-10 pt-7 sm:px-8 sm:pt-10">
        <header className="mb-7 flex flex-col gap-5 border-b border-slate-200 pb-6 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-950 text-white shadow-sm dark:bg-emerald-800">
              <Signal size={22} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-800 dark:text-emerald-300">Maritime operations</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white sm:text-3xl">Signal coverage</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Connection quality recorded by the assigned driver's device at saved GPS points. This measures service connectivity, not cellular radio strength.
              </p>
            </div>
          </div>
          <div className="flex items-end gap-2 sm:pl-16">
            {boats.length > 1 && (
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Vessel
                <select value={boatId} onChange={handleSelectBoat} className="mt-1 block min-w-56 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold normal-case tracking-normal text-slate-800 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-cyan-950">
                  {boats.map((boat) => <option key={boat._id} value={boat._id}>{boat.boatName} · {boat.registrationNumber}</option>)}
                </select>
              </label>
            )}
            <button onClick={refreshCoverage} disabled={!boatId || loadingReadings} title="Refresh coverage" aria-label="Refresh coverage" className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:border-cyan-600 hover:text-cyan-800 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-cyan-300">
              <RefreshCw size={17} className={loadingReadings ? "animate-spin" : ""} />
            </button>
          </div>
        </header>

        {pageError && <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">{pageError}</p>}

        {loadingBoats ? (
          <div className="flex min-h-72 items-center justify-center text-sm text-slate-600 dark:text-slate-300">Loading assigned boats…</div>
        ) : boats.length === 0 ? (
          <section className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center dark:border-slate-800 dark:bg-slate-900">
            <Signal size={30} className="mx-auto text-cyan-800 dark:text-cyan-300" />
            <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">No boat assigned</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{isDriver ? "Ask the boat owner to assign your driver account to a boat." : "Register a boat to monitor its connection coverage."}</p>
          </section>
        ) : (
          <>
            <section className="mb-6 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Selected vessel</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-white">{boatSnapshot?.boatName || selectedBoat?.boatName}</h2>
                <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <div className="flex flex-wrap gap-x-2">
                    <dt className="text-slate-500 dark:text-slate-400">Registration number:</dt>
                    <dd className="font-semibold text-slate-800 dark:text-slate-100">({boatSnapshot?.registrationNumber || selectedBoat?.registrationNumber || "Not available"})</dd>
                  </div>
                  <div className="flex flex-wrap gap-x-2">
                    <dt className="text-slate-500 dark:text-slate-400">Assigned driver:</dt>
                    <dd className="font-semibold text-slate-800 dark:text-slate-100">{boatSnapshot?.driver?.name || selectedBoat?.driver?.name || "Not assigned"}</dd>
                  </div>
                </dl>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-950/70" aria-live="polite">
                <span className="h-3 w-3 rounded-full ring-4 ring-current/10" style={{ color: statusStyle.color, backgroundColor: statusStyle.color }} />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{isDriver ? "This device" : "Latest driver check"}</p>
                  <p className="text-lg font-bold" style={{ color: statusStyle.color }}>{statusStyle.label}</p>
                </div>
                {isDriver && connection.latency != null && <p className="border-l border-slate-200 pl-3 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">{connection.latency} ms</p>}
                {!isDriver && boatSnapshot?.connectionCheckedAt && <p className="border-l border-slate-200 pl-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">{new Date(boatSnapshot.connectionCheckedAt).toLocaleString()}</p>}
              </div>
            </section>

            <section className="mb-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-emerald-200 bg-white p-5 shadow-sm dark:border-emerald-950 dark:bg-slate-900">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">Last good signal</p>
                {latestGoodReading ? (
                  <>
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{formatCoordinates(latestGoodReading)}</p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{new Date(latestGoodReading.recordedAt).toLocaleString()}</p>
                  </>
                ) : <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">No good signal location recorded yet.</p>}
              </div>
              <div className="rounded-xl border border-red-200 bg-white p-5 shadow-sm dark:border-red-950 dark:bg-slate-900">
                <p className="text-xs font-bold uppercase tracking-wide text-red-800 dark:text-red-300">Last poor or lost signal</p>
                {latestLostReading ? (
                  <>
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{formatCoordinates(latestLostReading)} · {SIGNAL_STYLES[latestLostReading.status]?.label || latestLostReading.status}</p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{new Date(latestLostReading.recordedAt).toLocaleString()}</p>
                  </>
                ) : currentStatus === "offline" ? (
                  <>
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">No driver check since {boatSnapshot?.connectionCheckedAt ? new Date(boatSnapshot.connectionCheckedAt).toLocaleString() : "unknown"}</p>
                    {livePoint && liveLocation?.recordedAt && <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Last GPS: {formatCoordinates(liveLocation)} · {new Date(liveLocation.recordedAt).toLocaleString()}</p>}
                  </>
                ) : <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">No poor or lost signal location recorded.</p>}
              </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(19rem,0.85fr)]">
              <section className="flex h-[38rem] min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950 dark:text-white">Driver location and signal coverage</h2>
                    <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {liveLocation ? `${livePlaceName || "Resolving place name…"} · ${formatCoordinates(liveLocation)}` : "No GPS position shared yet"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Last 30 days · select a point for signal details</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{liveLocationIsFresh ? "GPS live" : livePoint ? "GPS last known" : "GPS not shared"} · {readings.length} saved points</span>
                </div>
                {readings.length || livePoint ? (
                  <div className="min-h-0 flex-1">
                    <CoverageMap readings={readings} liveLocation={liveLocation} placeName={livePlaceName} />
                  </div>
                ) : (
                  <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-12 text-center">
                    <MapPin size={28} className="text-cyan-800 dark:text-cyan-300" />
                    <h3 className="mt-3 font-bold text-slate-900 dark:text-white">No coverage points recorded yet</h3>
                    <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {isDriver
                        ? "Enable location logging to add connection readings along your route."
                        : "The assigned driver must enable location logging before coverage points appear."}
                    </p>
                  </div>
                )}
              </section>

              <aside className="space-y-6">
                {isDriver && (
                  <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300"><ShieldCheck size={19} /></span>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">GPS coverage logging</h2>
                        <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">Saves a GPS point with connection status every 15 minutes. Shared with this boat's owner and assigned driver; records expire after 90 days.</p>
                      </div>
                    </div>
                    {coverageError && <p role="alert" className="mt-3 text-xs font-semibold text-red-700 dark:text-red-300">{coverageError}</p>}
                    <button role="switch" aria-checked={coverageEnabled} onClick={toggleCoverage} className={`mt-5 flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-bold transition ${coverageEnabled ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200" : "border-slate-300 bg-slate-50 text-slate-700 hover:border-cyan-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"}`}>
                      <span>{coverageEnabled ? "Location logging on" : "Location logging off"}</span>
                      <span className={`relative h-6 w-11 rounded-full transition-colors ${coverageEnabled ? "bg-emerald-600" : "bg-slate-400 dark:bg-slate-600"}`}>
                        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${coverageEnabled ? "translate-x-6" : "translate-x-1"}`} />
                      </span>
                    </button>
                    {!navigator.geolocation && <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">GPS is not available in this browser.</p>}
                  </section>
                )}

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white">Coverage summary</h2>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Saved points by status</p>
                    </div>
                    <Activity size={18} className="text-cyan-800 dark:text-cyan-300" />
                  </div>
                  <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                    {[
                      ["Good", statusCounts.good || 0, SIGNAL_STYLES.good.color],
                      ["Weak", statusCounts.medium || 0, SIGNAL_STYLES.medium.color],
                      ["Poor", statusCounts.poor || 0, SIGNAL_STYLES.poor.color],
                      ["Offline", statusCounts.offline || 0, SIGNAL_STYLES.offline.color],
                    ].map(([label, count, color]) => (
                      <div key={label} className="flex items-center justify-between py-2.5">
                        <span className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />{label}</span>
                        <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">{count}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Latest readings</h2>
                  {readings.length ? (
                    <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                      {[...readings].reverse().slice(0, 5).map((reading) => {
                        const style = SIGNAL_STYLES[reading.status] || SIGNAL_STYLES.checking;
                        return (
                          <div key={reading._id} className="py-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{formatCoordinates(reading)}</span>
                              <span className="h-2.5 w-2.5 shrink-0 rounded-full" title={style.label} style={{ backgroundColor: style.color }} />
                            </div>
                            <div className="mt-1 flex justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                              <span>{new Date(reading.recordedAt).toLocaleString()}</span>
                              <span>{reading.latency == null ? style.label : `${reading.latency} ms · ${style.label}`}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No saved readings for this boat yet.</p>}
                </section>
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  );
}