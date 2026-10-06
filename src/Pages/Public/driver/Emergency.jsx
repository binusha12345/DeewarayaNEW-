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
              <section className="flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 via-white to-orange-50 p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-red-100 p-2.5 text-red-700"><Siren size={20} /></div>
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
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
                >
                  <CheckCircle2 size={17} /> {markingSafe ? "Notifying owner…" : "I'm safe now"}
                </button>
              </section>
            )}

            <div className="columns-1 gap-5 md:columns-2 xl:columns-3">
                <section className="mb-5 break-inside-avoid rounded-3xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm md:p-6">
                  <div className="mb-5">
                    <h2 className="text-base font-bold text-slate-900">What is the emergency?</h2>
                    <p className="mt-1 text-sm text-slate-500">Choose the closest match before sending an SOS.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {EMERGENCY_TYPES.map(({ id, label, icon: Icon, color, active }) => (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={selectedType === id}
                        onClick={() => setSelectedType(id)}
                        className={`flex min-h-24 items-center gap-3 rounded-2xl border-2 p-3 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                          selectedType === id ? active : "border-slate-100 bg-white hover:border-slate-300"
                        }`}
                      >
                        <span className={`rounded-lg bg-white p-2.5 shadow-sm ${color}`}><Icon size={20} /></span>
                        <span className="text-sm font-bold text-slate-800">{label}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="mb-5 break-inside-avoid rounded-3xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <ShieldCheck size={19} className="text-cyan-800" />
                    <h2 className="text-base font-bold text-slate-900">Safety checklist</h2>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { key: "lifeJackets", label: "Life jackets are on" },
                      { key: "radioWorking", label: "Radio is working" },
                      { key: "fuelOk", label: "Fuel status checked" },
                      { key: "crewConfirmed", label: "Crew count confirmed" },
                    ].map((item) => (
                      <label key={item.key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50/50">
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

                <section className="mb-5 break-inside-avoid rounded-3xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
                  <label htmlFor="emergency-note" className="mb-2 block text-sm font-bold text-slate-900">
                    Additional details <span className="font-normal text-slate-500">(optional)</span>
                  </label>
                  <textarea
                    id="emergency-note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Tell the owner what happened or what help is needed."
                    className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition focus:border-cyan-700 focus:bg-white focus:ring-2 focus:ring-cyan-100"
                  />
                  <p className="mt-1 text-right text-xs text-slate-400">{note.length}/500</p>
                </section>
                <section className="relative mb-5 break-inside-avoid overflow-hidden rounded-3xl border border-red-200 bg-gradient-to-br from-white via-red-50 to-orange-50 p-5 text-center shadow-lg shadow-red-100/70 md:p-6">
                  <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-red-100/70 blur-2xl" />
                  <div className="relative">
                  <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-700"><Siren size={22} /></div>
                  <p className="text-sm font-black text-slate-900">Emergency alert</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedEmergency ? `${selectedEmergency.label} selected` : "Select an emergency type first"}
                  </p>
                  {countdown > 0 ? (
                    <div className="py-5">
                      <p className="text-6xl font-black text-red-700">{countdown}</p>
                      <p className="mt-2 text-sm text-slate-600">Sending SOS shortly…</p>
                      <button onClick={cancelSOS} className="mt-4 rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-900">
                        Cancel SOS
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={startSOSCountdown}
                      disabled={sending || Boolean(activeEmergency) || !selectedType}
                      className="mx-auto mt-5 flex h-32 w-32 flex-col items-center justify-center rounded-full border-[6px] border-red-100 bg-gradient-to-br from-red-600 to-red-800 text-white shadow-xl shadow-red-300/70 transition duration-200 hover:scale-105 hover:shadow-2xl hover:shadow-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Siren size={31} />
                      <span className="mt-1 text-xl font-black">{sending ? "SENDING" : "SOS"}</span>
                    </button>
                  )}
                  <p className="mt-4 text-xs leading-relaxed text-slate-500">
                    Sends an in-app alert and WhatsApp message to your assigned boat owner.
                  </p>
                  </div>
                </section>

                <section className="mb-5 break-inside-avoid rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <MapPin size={18} className="text-red-600" />
                    <h2 className="text-base font-bold text-slate-900">Your location</h2>
                  </div>
                  {locationLoading ? (
                    <p className="text-sm text-slate-500">Getting GPS location…</p>
                  ) : hasLocation ? (
                    <>
                      <p className="font-mono text-sm text-slate-700">{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</p>
                      <a
                        href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-cyan-800 hover:underline"
                      >
                        Open map <Compass size={14} />
                      </a>
                    </>
                  ) : (
                    <p className="text-sm text-amber-700">GPS unavailable. SOS can still be sent without location.</p>
                  )}
                </section>

                <section className="mb-5 break-inside-avoid rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <Phone size={18} className="text-emerald-700" />
                    <h2 className="text-base font-bold text-slate-900">Call for help</h2>
                  </div>
                  <div className="space-y-2">
                    {contacts.owner?.phone && (
                      <a href={`tel:${contacts.owner.phone}`} className="flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-3 text-sm text-blue-950 transition hover:bg-blue-100">
                        <span className="min-w-0"><span className="block font-bold">Assigned boat owner</span><span className="text-xs">{contacts.owner.name} · {contacts.owner.phone}</span></span>
                        <Phone size={17} className="shrink-0" />
                      </a>
                    )}
                    {EMERGENCY_CONTACTS.map((contact) => (
                      <a key={contact.name} href={contact.href} className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-3 text-sm transition hover:brightness-95 ${contact.color}`}>
                        <span><span className="block font-bold">{contact.name}</span><span className="text-xs">{contact.number}</span></span>
                        <Phone size={17} />
                      </a>
                    ))}
                  </div>
                  {!loading && !contacts.owner?.phone && (
                    <p className="mt-3 text-xs text-amber-700">Your assigned owner has no phone number on file.</p>
                  )}
                </section>

                <section className="mb-5 break-inside-avoid rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <Clock3 size={18} className="text-slate-600" />
                    <h2 className="text-base font-bold text-slate-900">Recent emergencies</h2>
                  </div>
                  {loading ? (
                    <p className="text-sm text-slate-500">Loading history…</p>
                  ) : history.length === 0 ? (
                    <p className="text-sm text-slate-500">No emergency logs yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {history.slice(0, 5).map((item) => (
                        <div key={item._id} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                          <div>
                            <p className="text-sm font-bold text-slate-800">{formatEmergencyType(item.emergencyType)}</p>
                            <p className="mt-1 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
                          </div>
                          <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${item.status === "active" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Emergency;
