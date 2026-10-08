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
                  <h2 className="text-xl font-bold text-slate-900">Recent trips</h2>
                  <p className="mt-1 text-sm text-slate-500">Showing up to the 100 most recent trips across your fleet.</p>
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
                <div className="space-y-3">
                  {trips.map((trip) => {
                    const active = !trip.endedAt;
                    const durationSeconds = getTripDurationSeconds(trip, now);
                    return (
                      <article key={trip._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-800">
                              <Anchor size={21} />
                            </span>
                            <div className="min-w-0">
                              <h3 className="truncate font-bold text-slate-900">{trip.boat?.boatName || "Boat"}</h3>
                              <p className="truncate text-sm text-slate-500">{trip.boat?.registrationNumber || "Registration unavailable"} · {trip.driver?.name || "Driver unavailable"}</p>
                            </div>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${active ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
                            {active ? "In progress" : "Completed"}
                          </span>
                        </div>
                        <dl className="grid gap-4 px-5 py-4 sm:grid-cols-2 xl:grid-cols-4">
                          <TripDetail icon={Route} label="Total distance" value={`${(Number(trip.distanceKm) || 0).toFixed(2)} km`} />
                          <TripDetail icon={Clock3} label={active ? "Time elapsed" : "Time spent"} value={formatDuration(durationSeconds)} />
                          <TripDetail icon={CalendarClock} label="Start time" value={formatDateTime(trip.startedAt)} />
                          <TripDetail icon={CalendarClock} label="End time" value={active ? "Still underway" : formatDateTime(trip.endedAt)} />
                        </dl>
                      </article>
                    );
                  })}
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

const TripDetail = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <Icon className="mt-0.5 shrink-0 text-slate-400" size={17} />
    <div className="min-w-0">
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-bold text-slate-800">{value}</dd>
    </div>
  </div>
);

export default OwnerTrips;
