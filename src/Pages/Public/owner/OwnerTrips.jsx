import { useCallback, useEffect, useState } from "react";
import { Anchor, CalendarClock, Clock3, History, RefreshCw, Route } from "lucide-react";
import OwnerSidebar from "../../../components/OwnerSidebar";
import DashboardNav from "../../../components/DashboardNav";
import DashboardPageHeader from "../../../components/DashboardPageHeader";
import api from "../../../services/api";

const formatDateTime = (value) => value
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
  const [summary, setSummary] = useState({ totalDistanceKm: 0, totalDurationSeconds: 0 });
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
      setSummary({ totalDistanceKm: 0, totalDurationSeconds: 0 });
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
      setSummary({ totalDistanceKm: 0, totalDurationSeconds: 0 });
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
              description="Review trip distance, duration, start and end times for your boats."
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
                className="min-w-56 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100 disabled:bg-slate-100"
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
                <section aria-label="Selected boat" className="flex flex-wrap items-center gap-x-8 gap-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-800"><Anchor size={21} /></span>
                    <div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Boat</p><p className="mt-1 font-bold text-slate-900">{selectedBoat.boatName}</p><p className="text-xs text-slate-500">{selectedBoat.registrationNumber}</p></div>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Driver</p>
                    <p className="mt-1 font-bold text-slate-900">{selectedBoat.driver?.name || "No driver assigned"}</p>
                  </div>
                </section>

                <section aria-label="Selected boat trip totals" className="grid gap-4 sm:grid-cols-2">
                  <SummaryCard icon={Route} label="Total distance" value={`${(Number(summary.totalDistanceKm) || 0).toFixed(2)} km`} />
                  <SummaryCard icon={Clock3} label="Total duration" value={formatDuration(totalDurationSeconds)} />
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
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100 text-[#005a8d]"><CalendarClock size={18} /></span>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Recent trips</h2>
                      <p className="mt-0.5 text-xs text-slate-500">Recent journey details across your fleet</p>
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
                  <p className="mt-1 text-sm text-slate-500">The boat and driver are shown above. Trip times will appear here after a driver records a trip.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
                  <table className="w-full min-w-[420px] text-left text-sm">
                    <thead className="bg-[#f0f4f8] text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Trip start time</th>
                        <th className="px-4 py-3">Trip end time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {trips.map((trip) => {
                        const active = !trip.endedAt;
                        return (
                          <tr key={trip._id} className="transition-colors hover:bg-slate-50">
                            <td className="px-4 py-4">{formatDateTime(trip.startedAt)}</td>
                            <td className="px-4 py-4">{active ? "In progress" : formatDateTime(trip.endedAt)}</td>
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

const SummaryCard = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-800"><Icon size={21} /></span>
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-900">{value}</p>
    </div>
  </div>
);

export default OwnerTrips;
