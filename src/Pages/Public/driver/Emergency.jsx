import { useEffect, useRef, useState } from "react";
import {
  Anchor,
  CheckCircle2,
  Clock3,
  Compass,
  Flame,
  Fuel,
  HeartPulse,
  LifeBuoy,
  MapPin,
  Phone,
  X,
  ShieldCheck,
  Siren,
  Waves,
  Wind,
} from "lucide-react";
import toast from "react-hot-toast";
import DriverSidebar from "../../../components/DriverSidebar";
import DashboardNav from "../../../components/DashboardNav";
import api from "../../../services/api";

const EMERGENCY_TYPES = [
  { id: "medical", label: "Medical", icon: HeartPulse, color: "text-rose-600", active: "border-rose-400 bg-rose-50" },
  { id: "sinking", label: "Taking on water", icon: Waves, color: "text-blue-600", active: "border-blue-400 bg-blue-50" },
  { id: "fire", label: "Fire", icon: Flame, color: "text-orange-600", active: "border-orange-400 bg-orange-50" },
  { id: "engine_failure", label: "Engine failure", icon: Anchor, color: "text-slate-700", active: "border-slate-400 bg-slate-50" },
  { id: "fuel_finished", label: "Out of fuel", icon: Fuel, color: "text-amber-600", active: "border-amber-400 bg-amber-50" },
  { id: "bad_weather", label: "Bad weather", icon: Wind, color: "text-cyan-700", active: "border-cyan-400 bg-cyan-50" },
  { id: "lost_navigation", label: "Navigation", icon: Compass, color: "text-violet-600", active: "border-violet-400 bg-violet-50" },
  { id: "man_overboard", label: "Man overboard", icon: LifeBuoy, color: "text-pink-600", active: "border-pink-400 bg-pink-50" },
  { id: "other", label: "Other", icon: Siren, color: "text-slate-600", active: "border-slate-400 bg-slate-50" },
];

const EMERGENCY_CONTACTS = [
  { name: "Sri Lanka Coast Guard emergency hotline", number: "106", href: "tel:106", color: "border-cyan-200 bg-cyan-50 text-cyan-900" },
  { name: "Sri Lanka Navy", number: "0117190000", href: "tel:0117190000", color: "border-blue-200 bg-blue-50 text-blue-900" },
  { name: "Fisheries Department", number: "0112472176", href: "tel:0112472176", color: "border-emerald-200 bg-emerald-50 text-emerald-900" },
  { name: "Police Emergency", number: "119", href: "tel:119", color: "border-rose-200 bg-rose-50 text-rose-900" },
];

const getCurrentLocation = () => new Promise((resolve, reject) => {
  if (!navigator.geolocation) {
    reject(new Error("GPS is not available in this browser."));
    return;
  }

  navigator.geolocation.getCurrentPosition(
    ({ coords }) => resolve({
      lat: coords.latitude,
      lng: coords.longitude,
      place: "Sea / Coastal Area",
    }),
    () => reject(new Error("Could not get GPS location.")),
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 }
  );
});

const formatEmergencyType = (type) =>
  EMERGENCY_TYPES.find((item) => item.id === type)?.label || "Emergency";

const Emergency = () => {
  const [selectedType, setSelectedType] = useState("");
  const [location, setLocation] = useState({ lat: null, lng: null, place: "" });
  const [locationLoading, setLocationLoading] = useState(true);
  const [contacts, setContacts] = useState({ owner: null, boat: null });
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [markingSafe, setMarkingSafe] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [history, setHistory] = useState([]);
  const [countdown, setCountdown] = useState(0);
  const [checklist, setChecklist] = useState({
    lifeJackets: false,
    radioWorking: false,
    fuelOk: false,
    crewConfirmed: false,
  });
  const [callMenuHovered, setCallMenuHovered] = useState(false);
  const [callMenuPinned, setCallMenuPinned] = useState(false);
  const countdownTimer = useRef(null);

  const loadEmergencyData = async () => {
    setLoading(true);
    const [activeResult, historyResult, contactsResult] = await Promise.allSettled([
      api.get("/emergency/active"),
      api.get("/emergency/history"),
      api.get("/emergency/contacts"),
    ]);

    if (activeResult.status === "fulfilled") {
      setActiveEmergency(activeResult.value.data.data || null);
    } else {
      toast.error(activeResult.reason.response?.data?.message || "Could not load active emergency status.");
    }
    if (historyResult.status === "fulfilled") {
      setHistory(historyResult.value.data.data || []);
    } else {
      toast.error(historyResult.reason.response?.data?.message || "Could not load emergency history.");
    }
    if (contactsResult.status === "fulfilled") {
      setContacts(contactsResult.value.data.data || { owner: null, boat: null });
    } else {
      toast.error(contactsResult.reason.response?.data?.message || "Could not load your assigned boat and owner contact.");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadEmergencyData();
    getCurrentLocation()
      .then(setLocation)
      .catch(() => setLocation({ lat: null, lng: null, place: "" }))
      .finally(() => setLocationLoading(false));
    return () => window.clearInterval(countdownTimer.current);
  }, []);

  const sendSOS = async () => {
    setSending(true);
    let currentLocation = location;
    try {
      currentLocation = await getCurrentLocation();
      setLocation(currentLocation);
    } catch {
      // Continue with the latest known location; SOS should not depend on GPS.
    }

    try {
      const { data } = await api.post("/emergency/sos", {
        emergencyType: selectedType,
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        placeName: currentLocation.place,
        message: note.trim(),
        checklist,
      });
      setActiveEmergency(data.data);
      setHistory((current) => [data.data, ...current.filter((item) => item._id !== data.data._id)]);
      setSelectedType("");
      setNote("");
      if (data.whatsappSent) {
        toast.success(data.message);
      } else {
        toast(data.message, { icon: "⚠️", duration: 6000 });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "SOS could not be sent. Please call an emergency contact directly.");
    } finally {
      setSending(false);
    }
  };

  const startSOSCountdown = () => {
    if (!selectedType || countdownTimer.current || sending) return;
    toast.loading("Sending SOS in 3 seconds…", { id: "emergency-sos-countdown" });
    setCountdown(3);
    let remaining = 3;
    countdownTimer.current = window.setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        window.clearInterval(countdownTimer.current);
        countdownTimer.current = null;
        toast.dismiss("emergency-sos-countdown");
        sendSOS();
      }
    }, 1000);
  };

  const cancelSOS = () => {
    window.clearInterval(countdownTimer.current);
    countdownTimer.current = null;
    setCountdown(0);
    toast.dismiss("emergency-sos-countdown");
    toast("SOS cancelled.", { icon: "↩️" });
  };

  const markSafe = async () => {
    if (!activeEmergency || markingSafe) return;
    setMarkingSafe(true);
    try {
      const { data } = await api.put(`/emergency/safe/${activeEmergency._id}`);
      setActiveEmergency(null);
      setHistory((current) => current.map((item) => item._id === activeEmergency._id ? data.data : item));
      if (data.whatsappSent) {
        toast.success(data.message);
      } else {
        toast(data.message, { icon: "⚠️", duration: 6000 });
      }
      await loadEmergencyData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update your emergency status.");
    } finally {
      setMarkingSafe(false);
    }
  };

  const hasLocation = Number.isFinite(location.lat) && Number.isFinite(location.lng);
  const selectedEmergency = EMERGENCY_TYPES.find((type) => type.id === selectedType);
  const callMenuOpen = callMenuHovered || callMenuPinned;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] font-sans text-slate-800">
      <DriverSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardNav />
        <main className="flex-1 overflow-y-auto p-5 md:p-8">
          <div className="mx-auto w-full max-w-7xl space-y-7">
            <header className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Driver Portal / <span className="text-blue-600">Emergency</span>
                </p>
                <h1 className="mt-1 text-3xl font-black leading-tight text-slate-900">Emergency</h1>
                <p className="mt-2 text-sm text-slate-600">Safety tools and emergency contacts for your trip.</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {activeEmergency ? "Emergency active" : "Safety center"}
              </div>
            </header>

            {activeEmergency && (
              <section className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm shadow-red-200">
                    <Siren size={22} />
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-wide text-red-800">Emergency active</p>
                    <p className="mt-1 text-sm text-red-700">
                      {formatEmergencyType(activeEmergency.emergencyType)} · {new Date(activeEmergency.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={markSafe}
                  disabled={markingSafe}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
                >
                  <CheckCircle2 size={17} /> {markingSafe ? "Notifying owner…" : "I'm safe now"}
                </button>
              </section>
            )}

            <div className="grid items-start gap-6 xl:grid-cols-3">
              <div className="space-y-6 xl:col-span-2">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900">What is the emergency?</h2>
                      <p className="mt-1 text-sm text-slate-500">Choose the closest match to help responders understand the situation.</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">STEP 1 · SELECT</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {EMERGENCY_TYPES.map(({ id, label, icon: Icon, color, active }) => (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={selectedType === id}
                        onClick={() => setSelectedType(id)}
                        className={`relative flex min-h-24 items-center gap-3 rounded-xl border p-3 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                          selectedType === id ? `${active} border-2 shadow-sm` : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                        }`}
                      >
                        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ${color}`}><Icon size={21} /></span>
                        <span className="text-sm font-bold leading-snug text-slate-800">{label}</span>
                        {selectedType === id && <CheckCircle2 size={16} className="absolute right-2 top-2 text-emerald-700" />}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <label htmlFor="emergency-note" className="text-xl font-bold text-slate-900">
                      Additional details <span className="font-normal text-slate-500">(optional)</span>
                    </label>
                    <span className="text-xs font-medium text-slate-400">{note.length}/500</span>
                  </div>
                  <textarea
                    id="emergency-note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="What happened? What kind of help do you need?"
                    className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:bg-white focus:ring-2 focus:ring-cyan-100"
                  />
                </section>

              </div>

              <aside className="space-y-6">
                <section className="overflow-hidden rounded-2xl bg-[#10243a] text-white shadow-lg shadow-slate-300/50">
                  <div className="border-b border-white/10 px-5 py-4">
                    <div className="flex items-center gap-2 text-red-300">
                      <Siren size={18} />
                      <h2 className="text-lg font-extrabold uppercase tracking-wider">Emergency alert</h2>
                    </div>
                    <p className="mt-2 text-sm text-slate-300">
                      {selectedEmergency ? `${selectedEmergency.label} selected` : "Select an emergency type to continue"}
                    </p>
                  </div>
                  <div className="p-5">
                    {countdown > 0 ? (
                      <div className="text-center">
                        <p className="text-7xl font-black leading-none text-red-300">{countdown}</p>
                        <p className="mt-3 text-sm text-slate-300">Sending SOS shortly…</p>
                        <button onClick={cancelSOS} className="mt-5 w-full rounded-xl border border-white/20 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10">
                          Cancel SOS
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={startSOSCountdown}
                        disabled={sending || Boolean(activeEmergency) || !selectedType}
                        className="flex w-full items-center justify-center gap-3 rounded-xl bg-red-600 px-5 py-4 text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:shadow-none"
                      >
                        <Siren size={22} />
                        <span className="text-lg font-black tracking-wide">{sending ? "SENDING ALERT…" : activeEmergency ? "SOS ALREADY ACTIVE" : "SEND SOS ALERT"}</span>
                      </button>
                    )}
                    <p className="mt-4 text-center text-xs leading-relaxed text-slate-400">
                      A 3-second countdown gives you time to cancel. Your owner receives an in-app and WhatsApp alert.
                    </p>
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <MapPin size={18} className="text-red-600" />
                      <h2 className="text-xl font-extrabold text-slate-900">Your location</h2>
                    </div>
                    <span className={`h-2.5 w-2.5 rounded-full ${locationLoading ? "animate-pulse bg-amber-400" : hasLocation ? "bg-emerald-500" : "bg-amber-500"}`} />
                  </div>
                  {locationLoading ? (
                    <p className="text-sm text-slate-500">Getting GPS location…</p>
                  ) : hasLocation ? (
                    <>
                      <p className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-sm text-slate-700">{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</p>
                      <a
                        href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-cyan-800 hover:underline"
                      >
                        Open map <Compass size={15} />
                      </a>
                    </>
                  ) : (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">GPS unavailable. SOS can still be sent without location.</p>
                  )}
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <ShieldCheck size={19} className="text-cyan-800" />
                    <h2 className="text-xl font-extrabold text-slate-900">Safety checklist</h2>
                  </div>
                  <div className="space-y-2">
                    {[
                      { key: "lifeJackets", label: "Life jackets are on" },
                      { key: "radioWorking", label: "Radio is working" },
                      { key: "fuelOk", label: "Fuel status checked" },
                      { key: "crewConfirmed", label: "Crew count confirmed" },
                    ].map((item) => (
                      <label key={item.key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-100 px-3 py-3 text-sm text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50/50">
                        <input
                          type="checkbox"
                          checked={checklist[item.key]}
                          onChange={(event) => setChecklist((current) => ({ ...current, [item.key]: event.target.checked }))}
                          className="h-4 w-4 accent-cyan-800"
                        />
                        {item.label}
                      </label>
                    ))}
                  </div>
                </section>
              </aside>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Clock3 size={20} /></span>
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">Recent emergencies</h2>
                    <p className="mt-1 text-sm text-slate-500">A record of your latest emergency alerts.</p>
                  </div>
                </div>
                <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 sm:inline-flex">LAST 5 RECORDS</span>
              </div>
              {loading ? (
                <p className="py-6 text-center text-sm text-slate-500">Loading history…</p>
              ) : history.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                  <p className="text-sm font-semibold text-slate-600">No emergency logs yet</p>
                  <p className="mt-1 text-xs text-slate-500">Any SOS alerts you send will appear here.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {history.slice(0, 5).map((item) => (
                    <div key={item._id} className="flex min-h-24 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="min-w-0">
                        <p className="truncate text-base font-bold text-slate-800">{formatEmergencyType(item.emergencyType)}</p>
                        <p className="mt-2 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${item.status === "active" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
      {callMenuOpen && (
        <button
          type="button"
          aria-label="Close emergency contacts"
          onClick={() => {
            setCallMenuPinned(false);
            setCallMenuHovered(false);
          }}
          className={`fixed inset-0 z-40 bg-slate-950/15 backdrop-blur-sm ${callMenuPinned ? "pointer-events-auto" : "pointer-events-none"}`}
        />
      )}
      <div
        className="fixed bottom-5 right-5 z-50 flex flex-col items-end sm:bottom-7 sm:right-7"
        onPointerEnter={() => setCallMenuHovered(true)}
        onPointerLeave={() => setCallMenuHovered(false)}
        onFocus={() => setCallMenuHovered(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setCallMenuHovered(false);
        }}
      >
        {callMenuOpen && (
          <section
            id="emergency-call-menu"
            aria-label="Emergency call contacts"
            className="mb-4 w-[min(22rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-white/70 bg-white/80 text-slate-900 shadow-2xl shadow-slate-950/20 backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/60 bg-white/50 px-4 py-3">
              <div>
                <h2 className="text-base font-extrabold">Call for help</h2>
                <p className="text-xs text-slate-600">Tap a contact to call</p>
              </div>
              <button
                type="button"
                onClick={() => setCallMenuPinned(false)}
                aria-label="Close contacts panel"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-white/80 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[min(60vh,28rem)] space-y-2 overflow-y-auto p-3">
              {contacts.owner?.phone && (
                <p className="px-2 pt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Your boat</p>
              )}
              {contacts.owner?.phone && (
                <a
                  href={`tel:${contacts.owner.phone}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-blue-200/80 bg-blue-50/80 px-3 py-3 text-sm text-blue-950 transition hover:bg-blue-100/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <span><span className="block font-bold">Assigned boat owner</span><span className="text-xs">{contacts.owner.name}</span></span>
                  <span className="flex shrink-0 items-center gap-2 font-semibold"><span>{contacts.owner.phone}</span><Phone size={16} /></span>
                </a>
              )}
              <p className="px-2 pt-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Emergency services</p>
              {EMERGENCY_CONTACTS.map((contact) => (
                <a
                  key={contact.name}
                  href={contact.href}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 text-sm transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${contact.color}`}
                >
                  <span className="font-bold">{contact.name}</span>
                  <span className="flex shrink-0 items-center gap-2 font-semibold">{contact.number}<Phone size={16} /></span>
                </a>
              ))}
              {!loading && !contacts.owner?.phone && (
                <p className="rounded-lg bg-amber-50/90 px-3 py-2 text-xs text-amber-800">Your assigned owner has no phone number on file.</p>
              )}
            </div>
          </section>
        )}
        <button
          type="button"
          aria-label={callMenuOpen ? "Close emergency contacts" : "Open emergency contacts"}
          aria-expanded={callMenuOpen}
          aria-controls="emergency-call-menu"
          onClick={() => setCallMenuPinned((current) => !current)}
          className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-emerald-700 text-white shadow-xl shadow-emerald-950/30 transition hover:scale-105 hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
        >
          {callMenuOpen ? <X size={23} /> : <Phone size={23} />}
        </button>
      </div>
    </div>
  );
};

export default Emergency;
