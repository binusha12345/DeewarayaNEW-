import { useCallback, useEffect, useRef, useState } from "react";
import { Anchor, CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, Play, Square } from "lucide-react";
import toast from "react-hot-toast";
import DriverSidebar from "../../../components/DriverSidebar";
import DashboardNav from "../../../components/DashboardNav";
import DashboardPageHeader from "../../../components/DashboardPageHeader";
import api, { apiUrl } from "../../../services/api";

const formatDateTime = (value) => value
  ? new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
  : "Not recorded";

const formatDuration = (seconds) => {
  const total = Math.max(0, Math.floor(seconds || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainingSeconds = total % 60;
  return [hours, minutes, remainingSeconds].map((part) => String(part).padStart(2, "0")).join(":");
};

const getLocalDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getPosition = () => new Promise((resolve, reject) => {
  if (!navigator.geolocation) {
    reject(new Error("GPS is not available in this browser"));
    return;
  }

  navigator.geolocation.getCurrentPosition(
    ({ coords, timestamp }) => resolve({ latitude: coords.latitude, longitude: coords.longitude, recordedAt: new Date(timestamp).toISOString() }),
    () => reject(new Error("Could not get your location. Allow GPS access and try again.")),
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
  );
});

const DriverTrips = () => {
  const [boats, setBoats] = useState([]);
  const [trips, setTrips] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [selectedBoatId, setSelectedBoatId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateKey(new Date()));
  const lastPointAt = useRef(0);
  const sendingPoint = useRef(false);

  const loadData = useCallback(async () => {
    try {
      const [boatsResponse, tripsResponse] = await Promise.all([
        api.get("/boats/assigned"),
        api.get("/trips"),
      ]);
      const assignedBoats = Array.isArray(boatsResponse.data) ? boatsResponse.data : [];
      setBoats(assignedBoats);
      setTrips(tripsResponse.data.trips || []);
      setActiveTrip(tripsResponse.data.activeTrip || null);
      setSelectedBoatId((current) => current || assignedBoats[0]?._id || "");
    } catch {
      toast.error("Could not load your assigned boats and trips");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!activeTrip) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [activeTrip]);

  const activeTripId = activeTrip?._id;

  useEffect(() => {
    if (!activeTripId || !navigator.geolocation) return undefined;
    const watchId = navigator.geolocation.watchPosition(async ({ coords, timestamp }) => {
      if (sendingPoint.current || Date.now() - lastPointAt.current < 15000) return;
      sendingPoint.current = true;
      lastPointAt.current = Date.now();
      try {
        const { data } = await api.post(`/trips/${activeTripId}/points`, {
          latitude: coords.latitude,
          longitude: coords.longitude,
          recordedAt: new Date(timestamp).toISOString(),
        });
        setActiveTrip(data.trip);
      } catch {
        toast.error("GPS point could not be saved. Check your connection.");
      } finally {
        sendingPoint.current = false;
      }
    }, () => toast.error("GPS access was lost. Allow location access to record trip distance."), {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 20000,
    });
    return () => navigator.geolocation.clearWatch(watchId);
  }, [activeTripId]);

  const startTrip = async () => {
    if (!selectedBoatId) return;
    setBusy(true);
    try {
      const location = await getPosition();
      const { data } = await api.post("/trips/start", { boatId: selectedBoatId, ...location });
      setActiveTrip(data.trip);
      setTrips((current) => [data.trip, ...current]);
      lastPointAt.current = Date.now();
      toast.success("Trip started");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Could not start trip");
    } finally {
      setBusy(false);
    }
  };

  const finishTrip = async () => {
    if (!activeTrip) return;
    setBusy(true);
    try {
      let location = {};
      try { location = await getPosition(); } catch { /* Finish even when the final GPS fix is unavailable. */ }
      const { data } = await api.post(`/trips/${activeTrip._id}/end`, location);
      setTrips((current) => current.map((trip) => trip._id === data.trip._id ? data.trip : trip));
      setActiveTrip(null);
      toast.success("Trip ended and saved");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not end trip");
    } finally {
      setBusy(false);
    }
  };

  const elapsedSeconds = activeTrip ? Math.floor((now - new Date(activeTrip.startedAt).getTime()) / 1000) : 0;
  const visibleTrips = activeTrip
    ? [activeTrip, ...trips.filter((trip) => trip._id !== activeTrip._id)]
    : trips;
  const completedTrips = trips.filter((trip) => trip.endedAt);
  const tripsByDate = new Map();
  visibleTrips.forEach((trip) => {
    const dateKey = getLocalDateKey(new Date(trip.startedAt));
    tripsByDate.set(dateKey, [...(tripsByDate.get(dateKey) || []), trip]);
  });
  const selectedDayTrips = tripsByDate.get(selectedDate) || [];
  const calendarDays = Array.from({ length: 42 }, (_, index) => new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth(),
    1 - calendarMonth.getDay() + index
  ));

  const changeCalendarMonth = (offset) => {
    const nextMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + offset, 1);
    setCalendarMonth(nextMonth);
    setSelectedDate(getLocalDateKey(nextMonth));
  };

  const selectCalendarDate = (date) => {
    setSelectedDate(getLocalDateKey(date));
    setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] font-sans text-slate-800">
      <DriverSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardNav />
        <main className="flex-1 overflow-y-auto p-5 md:p-8">
          <div className="mx-auto w-full max-w-7xl space-y-7">
            <DashboardPageHeader
              eyebrow="Driver portal / journeys"
              title="My Trips"
              description={`Trip schedule and activity · ${new Date(now).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}`}
              icon={CalendarDays}
              theme="blue"
            />
            <div className="flex flex-wrap items-center justify-end gap-4">
              {activeTrip ? (
                <button onClick={finishTrip} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-5 py-3 font-bold text-white shadow-sm transition-colors hover:bg-red-800 disabled:opacity-50">
                  <Square size={17} /> {busy ? "Saving..." : "End trip"}
                </button>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <select aria-label="Assigned boat" value={selectedBoatId} onChange={(event) => setSelectedBoatId(event.target.value)} disabled={!boats.length} className="min-w-48 rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-medium text-slate-800 outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100">
                    {boats.length ? boats.map((boat) => <option key={boat._id} value={boat._id}>{boat.boatName} · {boat.registrationNumber}</option>) : <option value="">No assigned boats</option>}
                  </select>
                  <button onClick={startTrip} disabled={busy || !boats.length} className="inline-flex items-center gap-2 rounded-xl bg-[#005a8d] px-5 py-3 font-bold text-white shadow-sm transition-colors hover:bg-[#004a75] disabled:opacity-50">
                    <Play size={17} /> {busy ? "Getting GPS..." : "Start trip"}
                  </button>
                </div>
              )}
            </div>

            {activeTrip && (
              <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm" aria-live="polite">
                <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-[#0f2a4a] to-[#005a8d] px-5 py-4 text-white md:px-6">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" /><span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" /></span>
                    <div><p className="text-xs font-bold uppercase tracking-widest text-cyan-100">Trip in progress</p><h2 className="mt-1 text-xl font-bold">{activeTrip.boat?.boatName || "Assigned boat"}</h2></div>
                  </div>
                  <p className="text-sm text-cyan-100">Started {formatDateTime(activeTrip.startedAt)}</p>
                </div>
                <div className="grid gap-px bg-slate-200 sm:grid-cols-3">
                  <div className="bg-white px-5 py-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Elapsed time</p><p className="mt-1 font-mono text-2xl font-bold text-[#0f2a4a]">{formatDuration(elapsedSeconds)}</p></div>
                  <div className="bg-white px-5 py-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Distance travelled</p><p className="mt-1 text-2xl font-bold text-[#0f2a4a]">{Number(activeTrip.distanceKm || 0).toFixed(2)} <span className="text-sm">km</span></p></div>
                  <div className="bg-white px-5 py-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">GPS points recorded</p><p className="mt-1 text-2xl font-bold text-[#0f2a4a]">{activeTrip.points?.length || 0}</p></div>
                </div>
              </section>
            )}

            <div className="grid items-stretch gap-y-5 xl:grid-cols-2 xl:gap-x-0 xl:gap-y-0">
            <section className="flex h-full flex-col xl:col-span-1">
              {loading ? <p className="flex flex-1 items-center justify-center bg-white py-8 text-slate-600">Loading assigned boats...</p> : boats.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-sm text-slate-600 xl:rounded-r-none">No boat has been assigned to your account yet.</div>
              ) : (
                <div className="grid flex-1 auto-rows-fr gap-0">
                  {boats.map((boat) => (
                    <article key={boat._id} className={`flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm ${boats.length === 1 ? "xl:rounded-r-none" : ""}`}>
                      <div className="relative flex h-32 items-end overflow-hidden bg-gradient-to-r from-[#0f2a4a] to-[#005a8d] p-5 text-white">
                        {boat.imageUrl && <img src={apiUrl(boat.imageUrl)} alt={boat.boatName} className="absolute inset-0 h-full w-full object-cover opacity-60" />}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f2a4a]/90 via-[#0f2a4a]/25 to-transparent" />
                        <div className="relative z-10 flex w-full items-end justify-between gap-3">
                          <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-widest text-cyan-200">Assigned vessel · {boat.boatType}</p><h3 className="truncate text-2xl font-black">{boat.boatName}</h3><p className="mt-1 text-sm text-cyan-50">Registration {boat.registrationNumber}</p></div>
                          <span className={`shrink-0 rounded-md px-2.5 py-1 text-[9px] font-black tracking-widest ${boat.boatStatus === "ACTIVE" ? "bg-blue-100 text-blue-700" : boat.boatStatus === "MAINTENANCE" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>{boat.boatStatus}</span>
                        </div>
                      </div>
                      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 p-5 text-sm sm:grid-cols-3">
                        <div><dt className="text-xs text-slate-500">Model year</dt><dd className="mt-1 font-bold text-slate-800">{boat.modelYear || "—"}</dd></div>
                        <div><dt className="text-xs text-slate-500">Engine type</dt><dd className="mt-1 font-bold text-slate-800">{boat.engineType || "—"}</dd></div>
                        <div><dt className="text-xs text-slate-500">Horsepower</dt><dd className="mt-1 font-bold text-slate-800">{boat.horsepower ? `${boat.horsepower} HP` : "—"}</dd></div>
                        <div><dt className="text-xs text-slate-500">Fuel capacity</dt><dd className="mt-1 font-bold text-slate-800">{boat.fuelCapacity ? `${boat.fuelCapacity} L` : "—"}</dd></div>
                        <div><dt className="text-xs text-slate-500">Engine serial</dt><dd className="mt-1 font-bold text-slate-800">{boat.engineSerial || "—"}</dd></div>
                        <div><dt className="text-xs text-slate-500">Boat owner</dt><dd className="mt-1 font-bold text-slate-800">{boat.owner?.name || "—"}</dd></div>
                      </dl>
                      {!activeTrip && <div className="mt-auto border-t border-slate-100 px-5 py-3"><button onClick={() => setSelectedBoatId(boat._id)} className={`text-sm font-bold transition-colors ${selectedBoatId === boat._id ? "text-cyan-800" : "text-slate-500 hover:text-[#005a8d]"}`}>{selectedBoatId === boat._id ? "Selected for trip" : "Select this vessel"}</button></div>}
                    </article>
                  ))}
                </div>
              )}
            </section>

            <aside className="h-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm xl:col-span-1 xl:rounded-l-none" aria-label="Trip calendar">
              <div className="flex h-32 flex-col justify-between bg-gradient-to-r from-[#0f2a4a] to-[#005a8d] px-5 py-4 text-white">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15"><CalendarDays size={20} /></span>
                    <div><p className="text-[10px] font-bold uppercase tracking-widest text-cyan-200">Schedule</p><h2 className="text-lg font-bold">Trip calendar</h2></div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => changeCalendarMonth(-1)} aria-label="Previous month" className="flex h-9 w-9 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/15"><ChevronLeft size={19} /></button>
                    <button type="button" onClick={() => changeCalendarMonth(1)} aria-label="Next month" className="flex h-9 w-9 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/15"><ChevronRight size={19} /></button>
                  </div>
                </div>
                <p className="text-2xl font-black">{calendarMonth.toLocaleDateString([], { month: "long", year: "numeric" })}</p>
              </div>

              <div className="p-3 sm:p-4">
                <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day} className="py-1">{day}</span>)}
                </div>
                <div className="grid grid-cols-7">
                  {calendarDays.map((date) => {
                    const dateKey = getLocalDateKey(date);
                    const hasTrips = tripsByDate.has(dateKey);
                    const isSelected = dateKey === selectedDate;
                    const isToday = dateKey === getLocalDateKey(new Date(now));
                    const isCurrentMonth = date.getMonth() === calendarMonth.getMonth();
                    return (
                      <button
                        key={dateKey}
                        type="button"
                        onClick={() => selectCalendarDate(date)}
                        aria-label={`${date.toLocaleDateString([], { dateStyle: "full" })}${hasTrips ? `, ${tripsByDate.get(dateKey).length} trips` : ""}`}
                        aria-pressed={isSelected}
                        className={`relative mx-auto flex h-8 w-8 flex-col items-center justify-center rounded-lg text-sm font-semibold transition-colors ${isSelected ? "bg-[#005a8d] text-white shadow-md" : isToday ? "bg-cyan-50 text-[#005a8d] ring-1 ring-cyan-300" : isCurrentMonth ? "text-slate-700 hover:bg-slate-100" : "text-slate-300 hover:bg-slate-50"}`}
                      >
                        {date.getDate()}
                        {hasTrips && <span className={`absolute bottom-1 h-1 w-1 rounded-full ${isSelected ? "bg-cyan-200" : "bg-cyan-600"}`} />}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 border-t border-slate-100 pt-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{new Date(`${selectedDate}T00:00:00`).toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}</h3>
                    <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-bold text-[#005a8d]">{selectedDayTrips.length} {selectedDayTrips.length === 1 ? "trip" : "trips"}</span>
                  </div>
                  {selectedDayTrips.length ? (
                    <div className="space-y-2">
                      {selectedDayTrips.map((trip) => (
                        <div key={trip._id} className="flex items-center justify-between gap-3 rounded-xl bg-[#f0f4f8] px-3 py-2">
                          <div className="min-w-0"><p className="truncate text-sm font-bold text-[#0f2a4a]">{trip.boat?.boatName || "Boat trip"}</p><p className="text-xs text-slate-500">{new Date(trip.startedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}{trip.endedAt ? ` - ${new Date(trip.endedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : " · In progress"}</p></div>
                          <span className="shrink-0 text-xs font-bold text-[#005a8d]">{Number(trip.distanceKm || 0).toFixed(2)} km</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-500">No trips recorded for this day.</p>}
                </div>
              </div>
            </aside>
            </div>

            <section>
              <div className="mb-4 flex items-end justify-between gap-3">
                <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100 text-[#005a8d]"><CalendarDays size={18} /></span><div><h2 className="text-xl font-bold text-slate-900">Recent trips</h2><p className="mt-0.5 text-xs text-slate-500">Your latest completed journeys</p></div></div>
                <span className="text-xs font-bold text-slate-500">{completedTrips.length} recorded</span>
              </div>
              {completedTrips.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0f4f8] text-[#005a8d]"><MapPin size={22} /></span>
                  <p className="mt-3 font-bold text-slate-800">No completed trips yet</p>
                  <p className="mt-1 text-sm text-slate-500">Your trip times and distances will be listed here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="bg-[#f0f4f8] text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Boat</th><th className="px-4 py-3">Start</th><th className="px-4 py-3">End</th><th className="px-4 py-3">Duration</th><th className="px-4 py-3">Distance</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {completedTrips.map((trip) => (
                        <tr key={trip._id} className="transition-colors hover:bg-slate-50">
                          <td className="px-4 py-4 font-semibold">{trip.boat?.boatName || "Boat"}<span className="block text-xs font-normal text-slate-500">{trip.boat?.registrationNumber}</span></td>
                          <td className="px-4 py-4">{formatDateTime(trip.startedAt)}</td>
                          <td className="px-4 py-4">{formatDateTime(trip.endedAt)}</td>
                          <td className="px-4 py-4"><span className="inline-flex items-center gap-1"><Clock3 size={14} />{formatDuration(trip.durationSeconds)}</span></td>
                          <td className="px-4 py-4"><span className="inline-flex items-center gap-1"><MapPin size={14} />{Number(trip.distanceKm || 0).toFixed(2)} km</span></td>
                        </tr>
                      ))}
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

export default DriverTrips;