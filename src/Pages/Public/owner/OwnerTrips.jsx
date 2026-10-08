import { useCallback, useEffect, useState } from "react";
import {
  Anchor,
  CalendarClock,
  CheckCircle2,
  Clock,
  Clock3,
  Gauge,
  History,
  MapPin,
  RefreshCw,
  Route,
  User,
} from "lucide-react";
import OwnerSidebar from "../../../components/OwnerSidebar";
import DashboardNav from "../../../components/DashboardNav";
import DashboardPageHeader from "../../../components/DashboardPageHeader";
import api from "../../../services/api";

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
    : "—";

const formatDuration = (seconds) => {
  const total = Math.max(0, Math.floor(seconds || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainingSeconds = total % 60;
  return [hours, minutes, remainingSeconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
};

const OwnerTrips = () => {
  const [boats, setBoats] = useState([]);
  const [selectedBoatId, setSelectedBoatId] = useState("");
  const [trips, setTrips] = useState([]);
  const [summary, setSummary] = useState({ totalDistanceKm: 0, totalDurationSeconds: 0, tripCount: 0 });
  const [summaryUpdatedAt, setSummaryUpdatedAt] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [boatsLoading, setBoatsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [now, setNow] = useState(Date.now());

  const loadBoats = useCallback(async () => {
    try {
      const { data } = await api.get("/boats");
      if (!Array.isArray(data)) {
        throw new Error("Boat list response was invalid.");
      }
      setBoats(data);
      setSelectedBoatId((current) => current || data[0]?._id || "");
      setLoadError("");
    } catch (error) {
      setLoadError(error.response?.data?.message || error.message || "Could not load your registered boats.");
    } finally {
      setBoatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBoats();
  }, [loadBoats]);

  const loadTrips = useCallback(async () => {
    if (!selectedBoatId) {
      setTrips([]);
      setSummary({ totalDistanceKm: 0, totalDurationSeconds: 0, tripCount: 0 });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.get("/trips/owner", { params: { boatId: selectedBoatId } });
      if (!Array.isArray(data.trips) || !data.summary) {
        throw new Error("Trip history response was invalid.");
      }
      setTrips(data.trips);
      setSummary(data.summary);
      setSummaryUpdatedAt(Date.now());
      setLoadError("");
    } catch (error) {
      setTrips([]);
      setSummary({ totalDistanceKm: 0, totalDurationSeconds: 0, tripCount: 0 });
      setSummaryUpdatedAt(Date.now());
      setLoadError(error.response?.data?.message || error.message || "Could not load trip history.");
    } finally {
      setLoading(false);
    }
  }, [selectedBoatId]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const hasActiveTrips = trips.some((trip) => !trip.endedAt);
  const selectedBoat = boats.find((boat) => boat._id === selectedBoatId);
  const totalDurationSeconds = hasActiveTrips
    ? Number(summary.totalDurationSeconds) + Math.floor((now - summaryUpdatedAt) / 1000)
    : Number(summary.totalDurationSeconds) || 0;

  const latestTrip = trips[0];

  useEffect(() => {
    if (!hasActiveTrips) return undefined;
    const clock = window.setInterval(() => setNow(Date.now()), 1000);
    const refresh = window.setInterval(loadTrips, 15000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") loadTrips();
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(clock);
      window.clearInterval(refresh);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [hasActiveTrips, loadTrips]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans text-slate-800">
      <OwnerSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardNav />
        <main className="flex-1 overflow-y-auto p-5 md:p-8">
          <div className="mx-auto w-full max-w-7xl space-y-6">
            <DashboardPageHeader
              eyebrow="Fleet activity"
              title="Boat trips"
              description="Review trip distance, total km, duration, start and end times for your boats."
              icon={History}
              theme="blue"
              action={
                <button
                  type="button"
                  onClick={loadTrips}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20 disabled:opacity-60"
                >
                  <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                  Refresh
                </button>
              }
            />

            {loadError && (
              <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                <span>{loadError}</span>
                <button type="button" onClick={loadTrips} className="font-bold underline">Try again</button>
              </div>
            )}

            <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <label htmlFor="owner-trip-boat" className="text-sm font-bold text-slate-700">Select boat</label>
              <select
                id="owner-trip-boat"
                value={selectedBoatId}
                onChange={(event) => setSelectedBoatId(event.target.value)}
                disabled={boatsLoading || boats.length === 0}
                className="min-w-64 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100 disabled:bg-slate-100"
              >
                <option value="" disabled>{boatsLoading ? "Loading your boats..." : "Choose a boat"}</option>
                {boats.map((boat) => (
                  <option key={boat._id} value={boat._id}>
                    {boat.boatName} · {boat.registrationNumber}
                  </option>
                ))}
              </select>
            </section>

            {selectedBoat ? (
              <>
                <section aria-label="Selected boat overview" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-800">
                      <Anchor size={24} />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Selected Boat</p>
                      <h2 className="text-lg font-bold text-slate-900">{selectedBoat.boatName}</h2>
                      <p className="text-xs text-slate-500">Registration: {selectedBoat.registrationNumber}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Assigned Driver</p>
                        <p className="font-bold text-slate-800">{selectedBoat.driver?.name || "No driver assigned"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block h-2.5 w-2.5 rounded-full ${selectedBoat.boatStatus === "ACTIVE" ? "bg-emerald-500" : "bg-amber-500"}`} />
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Boat Status</p>
                        <p className="font-bold text-slate-800">{selectedBoat.boatStatus || "ACTIVE"}</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section aria-label="Selected boat trip summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <SummaryCard
                    icon={Route}
                    label="Total KM (Distance)"
                    value={`${(Number(summary.totalDistanceKm) || 0).toFixed(2)} km`}
                    subtitle="Accumulated fleet distance"
                  />
                  <SummaryCard
                    icon={Clock3}
                    label="Total duration"
                    value={formatDuration(totalDurationSeconds)}
                    subtitle="Total engine / trip time"
                  />
                  <SummaryCard
                    icon={Gauge}
                    label="Total trips"
                    value={trips.length}
                    subtitle="Trips recorded for boat"
                  />
                  <SummaryCard
                    icon={CalendarClock}
                    label="Latest trip start"
                    value={latestTrip ? formatDateTime(latestTrip.startedAt) : "No trips yet"}
                    subtitle={
                      latestTrip
                        ? latestTrip.endedAt
                          ? `Ended: ${formatDateTime(latestTrip.endedAt)}`
                          : "Status: In Progress"
                        : "Select a boat with trips"
                    }
                  />
                </section>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-slate-600">
                {boatsLoading ? "Loading your registered boats..." : "No registered boats were found for this owner account."}
              </div>
            )}

            <section aria-label="Boat trip history" className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100 text-[#005a8d]">
                      <CalendarClock size={18} />
                    </span>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        {selectedBoat ? `Trip History for ${selectedBoat.boatName}` : "Trip History"}
                      </h2>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Review trip start times, end times, distance (KM), and duration
                      </p>
                    </div>
                  </div>
                </div>
                {hasActiveTrips && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    Live trips refresh every 15 seconds
                  </span>
                )}
              </div>

              {loading ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center text-slate-600">Loading boat trips...</div>
              ) : trips.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
                  <CalendarClock className="mx-auto text-slate-400" size={32} />
                  <h3 className="mt-3 font-bold text-slate-800">No trips recorded for this boat yet</h3>
                  <p className="mt-1 text-sm text-slate-500">The boat and driver details are shown above. Trip start/end times and distances will appear here once recorded.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
                  <table className="w-full min-w-[650px] text-left text-sm">
                    <thead className="bg-[#f0f4f8] text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Driver</th>
                        <th className="px-4 py-3">Start Time</th>
                        <th className="px-4 py-3">End Time</th>
                        <th className="px-4 py-3">Distance (KM)</th>
                        <th className="px-4 py-3">Duration</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {trips.map((trip) => {
                        const active = !trip.endedAt;
                        const tripDuration = active
                          ? Math.floor((now - new Date(trip.startedAt).getTime()) / 1000)
                          : trip.durationSeconds || Math.floor((new Date(trip.endedAt) - new Date(trip.startedAt)) / 1000);
                        return (
                          <tr key={trip._id} className="transition-colors hover:bg-slate-50">
                            <td className="px-4 py-4 font-semibold text-slate-800">
                              {trip.driver?.name || "Driver"}
                              {trip.driver?.email && <span className="block text-xs font-normal text-slate-500">{trip.driver.email}</span>}
                            </td>
                            <td className="px-4 py-4 text-slate-700 font-medium">
                              <span className="inline-flex items-center gap-1.5">
                                <Clock size={14} className="text-slate-400" />
                                {formatDateTime(trip.startedAt)}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-slate-700 font-medium">
                              {active ? (
                                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600">
                                  <span className="h-2 w-2 animate-ping rounded-full bg-emerald-500" />
                                  In progress
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5">
                                  <CheckCircle2 size={14} className="text-emerald-500" />
                                  {formatDateTime(trip.endedAt)}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center gap-1 font-bold text-[#005a8d]">
                                <MapPin size={14} className="text-sky-600" />
                                {(Number(trip.distanceKm) || 0).toFixed(2)} km
                              </span>
                            </td>
                            <td className="px-4 py-4 font-mono text-xs text-slate-600">
                              {formatDuration(tripDuration)}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
                                {active ? "Live" : "Completed"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

const SummaryCard = ({ icon: Icon, label, value, subtitle }) => (
  <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-800">
      <Icon size={21} />
    </span>
    <div className="min-w-0">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 truncate text-lg font-black text-slate-900">{value}</p>
      {subtitle && <p className="mt-0.5 truncate text-[11px] text-slate-400">{subtitle}</p>}
    </div>
  </div>
);

export default OwnerTrips;

