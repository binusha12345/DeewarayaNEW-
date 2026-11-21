import { useCallback, useEffect, useMemo, useState } from "react";
import { Circle, CircleMarker, MapContainer, ScaleControl, TileLayer, useMap } from "react-leaflet";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { Anchor, Crosshair, ExternalLink, MapPin, RefreshCw } from "lucide-react";
import DashboardNav from "../../../components/DashboardNav";
import DashboardPageHeader from "../../../components/DashboardPageHeader";
import DriverSidebar from "../../../components/DriverSidebar";
import OwnerSidebar from "../../../components/OwnerSidebar";
import { useAuth } from "../../../context/AuthContext";
import api, { API_ORIGIN } from "../../../services/api";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER = [7.8731, 80.7718];
const STALE_AFTER_MS = 60000;
const MAX_ACCURACY_RADIUS_METERS = 2000;

const MapCenter = ({ position, recenterKey }) => {
  const map = useMap();

  useEffect(() => {
    if (position) map.flyTo(position, Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [map, position, recenterKey]);

  return null;
};

const OwnerLiveTracking = () => {
  const { token, user } = useAuth();
  const [boats, setBoats] = useState([]);
  const [selectedBoatId, setSelectedBoatId] = useState("");
  const [location, setLocation] = useState(null);
  const [loadingBoats, setLoadingBoats] = useState(true);
  const [now, setNow] = useState(0);

  useEffect(() => {
    let active = true;
    api.get(user?.role === "driver" ? "/boats/assigned" : "/boats")
      .then(({ data }) => {
        if (!active) return;
        const ownerBoats = Array.isArray(data) ? data : [];
        setBoats(ownerBoats);
        setSelectedBoatId((current) => current
          || (user?.role === "driver" ? localStorage.getItem("signalBoatId:driver") : "")
          || ownerBoats[0]?._id
          || "");
      })
      .catch((requestError) => {
        if (active) toast.error(requestError.response?.data?.message || "Could not load your boats.");
      })
      .finally(() => {
        if (active) setLoadingBoats(false);
      });
    return () => { active = false; };
  }, [user?.role]);

  const loadLocation = useCallback(async () => {
    if (!selectedBoatId) {
      setLocation(null);
      return;
    }
    try {
      const { data } = await api.get(`/tracking/live/${selectedBoatId}`);
      setLocation(data.location ? {
        ...data.location,
        boatId: data.boatId,
        boatName: data.boatName,
        driverName: data.driverName,
      } : null);
      setNow(Date.now());
      if (data.location) {
        toast.dismiss(`boat-location-empty-${selectedBoatId}`);
      } else {
        toast(`Waiting for ${data.boatName} to send its first GPS position.`, {
          id: `boat-location-empty-${selectedBoatId}`,
          icon: "📍",
        });
      }
    } catch (requestError) {
      if (requestError.response?.status === 404) {
        setLocation(null);
        toast.dismiss(`boat-location-empty-${selectedBoatId}`);
        toast.error("This boat is no longer assigned to your account.", {
          id: `boat-location-error-${selectedBoatId}`,
        });
        return;
      }
      toast.error(requestError.response?.data?.message || "Could not load this boat’s location.", {
        id: `boat-location-error-${selectedBoatId}`,
      });
    }
  }, [selectedBoatId]);

  useEffect(() => {
    if (!selectedBoatId) return undefined;
    const refreshLocation = () => {
      api.get(`/tracking/live/${selectedBoatId}`)
        .then(({ data }) => {
          setLocation(data.location ? {
            ...data.location,
            boatId: data.boatId,
            boatName: data.boatName,
            driverName: data.driverName,
          } : null);
          setNow(Date.now());
          if (data.location) {
            toast.dismiss(`boat-location-empty-${selectedBoatId}`);
          } else {
            toast(`Waiting for ${data.boatName} to send its first GPS position.`, {
              id: `boat-location-empty-${selectedBoatId}`,
              icon: "📍",
            });
          }
        })
        .catch((requestError) => {
          if (requestError.response?.status === 404) {
            setLocation(null);
            toast.dismiss(`boat-location-empty-${selectedBoatId}`);
            toast.error("This boat is no longer assigned to your account.", {
              id: `boat-location-error-${selectedBoatId}`,
            });
            return;
          }
          toast.error(requestError.response?.data?.message || "Could not load this boat’s location.", {
            id: `boat-location-error-${selectedBoatId}`,
          });
        });
    };
    refreshLocation();

    const refresh = window.setInterval(refreshLocation, 30000);
    return () => window.clearInterval(refresh);
  }, [selectedBoatId]);

  useEffect(() => {
    if (!token) return undefined;
    const socket = io(API_ORIGIN, { auth: { token }, transports: ["websocket", "polling"] });
    socket.on("boat-location:update", (update) => {
      if (update.boatId !== selectedBoatId) return;
      setLocation({
        boatId: update.boatId,
        latitude: update.latitude,
        longitude: update.longitude,
        accuracy: update.accuracy,
        recordedAt: update.recordedAt,
        boatName: update.boatName,
        driverName: update.driverName,
      });
      setNow(Date.now());
      toast.dismiss(`boat-location-empty-${selectedBoatId}`);
      toast.dismiss(`boat-location-error-${selectedBoatId}`);
    });
    return () => socket.disconnect();
  }, [selectedBoatId, token]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 10000);
    return () => window.clearInterval(timer);
  }, []);

  const selectedLocation = location?.boatId === selectedBoatId ? location : null;
  const latitude = selectedLocation?.latitude;
  const longitude = selectedLocation?.longitude;
  const position = useMemo(
    () => latitude !== undefined && longitude !== undefined ? [latitude, longitude] : null,
    [latitude, longitude]
  );
  const ageMs = selectedLocation ? Math.max(0, now - new Date(selectedLocation.recordedAt).getTime()) : null;
  const isLive = ageMs !== null && ageMs <= STALE_AFTER_MS;
  const accuracyMeters = Number.isFinite(selectedLocation?.accuracy)
    ? Math.min(selectedLocation.accuracy, MAX_ACCURACY_RADIUS_METERS)
    : null;
  const [recenterKey, setRecenterKey] = useState(0);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 text-slate-900">
      {user?.role === "driver" ? <DriverSidebar /> : <OwnerSidebar />}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardNav />
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="mx-auto max-w-[1600px] space-y-5">
            <DashboardPageHeader
              eyebrow={user?.role === "driver" ? "Driver navigation" : "Live fleet tracking"}
              title={user?.role === "driver" ? "Live Navigation" : "Boat location"}
              description={user?.role === "driver"
                ? "See your phone’s current GPS position for the boat assigned to you."
                : "See the latest GPS position shared by your boat’s logged-in driver."}
              icon={MapPin}
              theme="cyan"
              action={user?.role === "owner" && (
                <button
                  type="button"
                  onClick={loadLocation}
                  disabled={!selectedBoatId}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20 disabled:opacity-60"
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
              )}
            />

            {(user?.role === "owner" || boats.length > 1) && (
              <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <label htmlFor="live-tracking-boat" className="text-sm font-bold text-slate-700">
                  {user?.role === "driver" ? "Select assigned boat" : "Select boat"}
                </label>
                <select
                  id="live-tracking-boat"
                  value={selectedBoatId}
                  onChange={(event) => {
                    const boatId = event.target.value;
                    setSelectedBoatId(boatId);
                    if (user?.role === "driver") {
                      localStorage.setItem("signalBoatId:driver", boatId);
                      window.dispatchEvent(new CustomEvent("driver-live-tracking-boat-change", { detail: boatId }));
                    }
                  }}
                  disabled={loadingBoats || boats.length === 0}
                  className="min-w-64 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100 disabled:bg-slate-100"
                >
                  <option value="">{loadingBoats ? "Loading your boats…" : "Choose a boat"}</option>
                  {boats.map((boat) => (
                    <option key={boat._id} value={boat._id}>{boat.boatName} · {boat.registrationNumber}</option>
                  ))}
                </select>
                {selectedLocation && (
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${isLive ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>
                    <span className={`h-2 w-2 rounded-full ${isLive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                    {isLive ? "Live" : "Last location is stale"} · {new Date(selectedLocation.recordedAt).toLocaleTimeString()}
                  </span>
                )}
              </section>
            )}

            {user?.role === "driver" && boats.length === 1 && (
              <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Navigating boat</p>
                  <p className="font-bold text-slate-900">{boats[0].boatName} · {boats[0].registrationNumber}</p>
                </div>
                {selectedLocation && (
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${isLive ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>
                    <span className={`h-2 w-2 rounded-full ${isLive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                    {isLive ? "Live" : "Last location is stale"}
                  </span>
                )}
              </section>
            )}

            <section
              aria-label="Live boat map"
              className={`relative ${user?.role === "owner" ? "h-[90vh] min-h-[800px]" : "h-[82vh] min-h-[700px]"} overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-lg`}
            >
              <MapContainer center={position || DEFAULT_CENTER} zoom={position ? 12 : 7} scrollWheelZoom className="h-full w-full">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ScaleControl position="bottomright" />
                <MapCenter position={position} recenterKey={recenterKey} />
                {position && (
                  <>
                    {accuracyMeters !== null && (
                      <Circle
                        center={position}
                        radius={accuracyMeters}
                        pathOptions={{ color: "#0284c7", fillColor: "#38bdf8", fillOpacity: 0.16, weight: 2 }}
                      />
                    )}
                    <CircleMarker
                      center={position}
                      radius={12}
                      pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#0369a1", fillOpacity: 1 }}
                    />
                  </>
                )}
              </MapContainer>
              <div className="absolute right-4 top-4 z-[500] flex flex-col gap-2">
                {position && (
                  <>
                    <button
                      type="button"
                      onClick={() => setRecenterKey((current) => current + 1)}
                      title="Center map on boat"
                      aria-label="Center map on boat"
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-800 shadow-lg transition hover:bg-sky-50"
                    >
                      <Crosshair size={20} />
                    </button>
                    <a
                      href={`https://www.google.com/maps?q=${selectedLocation.latitude},${selectedLocation.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      title="Open boat location in Google Maps"
                      aria-label="Open boat location in Google Maps"
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-800 shadow-lg transition hover:bg-sky-50"
                    >
                      <ExternalLink size={19} />
                    </a>
                  </>
                )}
              </div>
              {selectedLocation ? (
                <div className="absolute bottom-4 left-4 z-[500] max-w-[calc(100%-2rem)] rounded-xl bg-white/95 px-4 py-3 text-sm shadow-lg backdrop-blur sm:max-w-sm">
                  <p className="flex items-center gap-2 font-bold text-slate-900"><Anchor size={16} className="text-cyan-800" />{selectedLocation.boatName || "Selected boat"}</p>
                  <p className="mt-1 text-slate-600">Driver: {selectedLocation.driverName || "Assigned driver"}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    Position: {selectedLocation.latitude.toFixed(5)}, {selectedLocation.longitude.toFixed(5)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {accuracyMeters !== null
                      ? `GPS accuracy radius: about ${Math.round(selectedLocation.accuracy)} m${selectedLocation.accuracy > MAX_ACCURACY_RADIUS_METERS ? " (map circle capped)" : ""} · `
                      : ""}
                    Updated {new Date(selectedLocation.recordedAt).toLocaleTimeString()}
                  </p>
                </div>
              ) : (
                !loadingBoats && boats.length === 0 && (
                  <div className="absolute inset-0 z-[500] flex items-center justify-center bg-slate-900/10 p-4">
                    <p className="max-w-md rounded-xl bg-white/95 px-5 py-4 text-center text-sm font-medium text-slate-700 shadow-lg">
                      No boats are assigned to your account.
                    </p>
                  </div>
                )
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default OwnerLiveTracking;
