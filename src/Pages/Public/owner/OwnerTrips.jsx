import { useCallback, useEffect, useState } from "react";
import { Activity, Anchor, CalendarClock, Clock3, History, RefreshCw, Route } from "lucide-react";
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

const getTripDurationSeconds = (trip, now) => {
  if (trip.durationSeconds !== null && trip.durationSeconds !== undefined) {
    return trip.durationSeconds;
  }
  const endTime = trip.endedAt ? new Date(trip.endedAt).getTime() : now;
  return Math.max(0, Math.floor((endTime - new Date(trip.startedAt).getTime()) / 1000));
};

const OwnerTrips = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [now, setNow] = useState(Date.now());

  const loadTrips = useCallback(async () => {
    try {
      const { data } = await api.get("/trips/owner");
      if (!Array.isArray(data.trips)) {
        throw new Error("Trip history response was invalid.");
      }
      setTrips(data.trips);
      setLoadError("");
    } catch (error) {
      setLoadError(error.response?.data?.message || error.message || "Could not load trip history. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const hasActiveTrips = trips.some((trip) => !trip.endedAt);

  useEffect(() => {
    if (!hasActiveTrips) return undefined;

    const clock = window.setInterval(() => setNow(Date.now()), 1000);
    const refresh = window.setInterval(loadTrips, 15000);
    return () => {
      window.clearInterval(clock);
      window.clearInterval(refresh);
    };
  }, [hasActiveTrips, loadTrips]);

  const completedTrips = trips.filter((trip) => trip.endedAt);
  const totalDistanceKm = trips.reduce((total, trip) => total + (Number(trip.distanceKm) || 0), 0);

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

            <section aria-label="Trip summary" className="grid gap-4 sm:grid-cols-3">
              <SummaryCard icon={Anchor} label="Trips shown" value={trips.length} />
              <SummaryCard icon={Activity} label="Active trips" value={trips.length - completedTrips.length} />
              <SummaryCard icon={Route} label="Distance recorded" value={`${totalDistanceKm.toFixed(2)} km`} />
            </section>

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
                  <h3 className="mt-3 font-bold text-slate-800">No trips recorded yet</h3>
                  <p className="mt-1 text-sm text-slate-500">Trips will appear here when a driver starts recording a boat trip.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
                  <table className="w-full min-w-[850px] text-left text-sm">
                    <thead className="bg-[#f0f4f8] text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Boat</th>
                        <th className="px-4 py-3">Driver</th>
                        <th className="px-4 py-3">Start</th>
                        <th className="px-4 py-3">End</th>
                        <th className="px-4 py-3">Duration</th>
                        <th className="px-4 py-3">Distance</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {trips.map((trip) => {
                        const active = !trip.endedAt;
                        return (
                          <tr key={trip._id} className="transition-colors hover:bg-slate-50">
                            <td className="px-4 py-4 font-semibold text-slate-900">
                              {trip.boat?.boatName || "Boat"}
                              <span className="block text-xs font-normal text-slate-500">{trip.boat?.registrationNumber || "Registration unavailable"}</span>
                            </td>
                            <td className="px-4 py-4">{trip.driver?.name || "Driver unavailable"}</td>
                            <td className="px-4 py-4">{formatDateTime(trip.startedAt)}</td>
                            <td className="px-4 py-4">{active ? "Still underway" : formatDateTime(trip.endedAt)}</td>
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center gap-1"><Clock3 size={14} />{formatDuration(getTripDurationSeconds(trip, now))}</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center gap-1"><Route size={14} />{(Number(trip.distanceKm) || 0).toFixed(2)} km</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`rounded-full px-3 py-1 text-xs font-bold ${active ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
                                {active ? "In progress" : "Completed"}
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
