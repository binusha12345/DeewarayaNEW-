import "leaflet/dist/leaflet.css";
import React, { useEffect, useState, useRef } from "react";
import api from "../../services/api";
import {
  Loader2,
  MapPin,
  Thermometer,
  Droplets,
  Wind,
  Eye,
  AlertTriangle,
  Search,
  CheckCircle2,
  X,
  RefreshCw,
  Waves,
  Sunrise,
  Sunset,
  CloudRain,
  Cloud,
  Sun,
  CloudFog,
  CloudSun,
  Navigation,
} from "lucide-react";
import OwnerSidebar from "../../components/OwnerSidebar";
import DashboardNav from "../../components/DashboardNav";
import DriverSidebar from "../../components/DriverSidebar";
import DashboardPageHeader from "../../components/DashboardPageHeader";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";

// OpenWeather API key
const OPENWEATHER_KEY = import.meta.env.VITE_OPENWEATHER_KEY || "";



// Ship icon
const shipIcon = L.divIcon({
  html: `
    <div style="
      font-size: 46px;
      line-height: 1;
      transform: translate(-50%, -50%);
      filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));
    ">🚢</div>
  `,
  className: "",
  iconSize: [46, 46],
  iconAnchor: [23, 23],
});

// Fix Leaflet render/resize issue
const MapResizeFix = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize(true);
      map.setView(center, map.getZoom(), { animate: false });
    }, 250);
    return () => clearTimeout(timer);
  }, [map, center]);
  return null;
};

const WeatherDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const userRole = user?.role;

  const [boats, setBoats] = useState([]);
  const [selectedBoatId, setSelectedBoatId] = useState("");
  const [selectedBoat, setSelectedBoat] = useState(null);
  const [data, setData] = useState(null);
  const [loadingBoats, setLoadingBoats] = useState(false);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [error, setError] = useState("");
  const [weatherLayer, setWeatherLayer] = useState("temp_new");
  const [placeName, setPlaceName] = useState("Current Location");

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredBoats, setFilteredBoats] = useState([]);
  const searchRef = useRef(null);
  const [mapStyle, setMapStyle] = useState("street");

  // Refresh controls
  const [autoRefreshOn, setAutoRefreshOn] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [secondsAgo, setSecondsAgo] = useState(0);


  //  Fetch ALL boats (works for both owner & driver) 
  useEffect(() => {
    const fetchBoats = async () => {
      try {
        setLoadingBoats(true);
        setError("");

        // Use /boats/all endpoint - returns ALL boats regardless of role
        // Owner sees only his boats, Driver sees all boats
        const endpoint = userRole === "driver" ? "/boats/all" : "/boats";
        const res = await api.get(endpoint);
        const allBoats = Array.isArray(res.data) ? res.data : [];

        setBoats(allBoats);
        setFilteredBoats(allBoats);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load boats");
      } finally {
        setLoadingBoats(false);
      }
    };

    fetchBoats();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search Handler 
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setShowDropdown(true);
    setSelectedBoat(null);
    setSelectedBoatId("");
    setError("");

    if (query.trim() === "") {
      setFilteredBoats(boats);
    } else {
      const filtered = boats.filter(
        (boat) =>
          boat.boatName?.toLowerCase().includes(query.toLowerCase()) ||
          boat.registrationNumber?.toLowerCase().includes(query.toLowerCase()) ||
          boat.boatType?.toLowerCase().includes(query.toLowerCase()) ||
          boat.boatStatus?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredBoats(filtered);
    }
  };

  // Select Boat directly (No DB verification) 
  const handleSelectBoat = (boat) => {
    setShowDropdown(false);
    setSearchQuery(`${boat.boatName} - ${boat.registrationNumber}`);
    setSelectedBoatId(boat._id);
    setSelectedBoat(boat);
    setError("");
  };

  // Clear Search 
  const handleClearSearch = () => {
    setSearchQuery("");
    setSelectedBoat(null);
    setSelectedBoatId("");
    setFilteredBoats(boats);
    setError("");
  };

  //  Fetch Place Name 
//  Fetch Place Name (with multiple fallbacks) 
      const fetchPlaceName = async (lat, lon) => {
        // Try 1: OpenStreetMap Nominatim (FREE, no API key, very reliable)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=14&addressdetails=1`,
            {
              headers: {
                "Accept-Language": "en",
              },
            }
          );
          const data = await res.json();

          if (data && data.address) {
            const addr = data.address;
            const parts = [
              addr.village ||
                addr.town ||
                addr.city ||
                addr.suburb ||
                addr.hamlet ||
                addr.county,
              addr.state_district || addr.state,
              addr.country,
            ].filter(Boolean);

            if (parts.length > 0) {
              return parts.join(", ");
            }
          }

          // Fallback to display_name
          if (data && data.display_name) {
            return data.display_name.split(",").slice(0, 3).join(",").trim();
          }
        } catch (err) {
          console.log("Nominatim failed, trying OpenWeather...");
        }

        // Try 2: OpenWeather reverse geocoding
        if (OPENWEATHER_KEY) {
          try {
            const res = await fetch(
              `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${OPENWEATHER_KEY}`
            );
            const places = await res.json();

            if (Array.isArray(places) && places.length > 0) {
              const p = places[0];
              const parts = [p.name, p.state, p.country].filter(Boolean);
              if (parts.length > 0) return parts.join(", ");
            }
          } catch (err) {
            console.log("OpenWeather geocoding failed");
          }
        }

        // Try 3: BigDataCloud (FREE, no API key)
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
          );
          const data = await res.json();

          if (data) {
            const parts = [
              data.locality || data.city,
              data.principalSubdivision,
              data.countryName,
            ].filter(Boolean);

            if (parts.length > 0) return parts.join(", ");
          }
        } catch (err) {
          console.log("BigDataCloud failed");
        }

        // Final fallback: show coordinates
        return `Location (${Number(lat).toFixed(3)}, ${Number(lon).toFixed(3)})`;
      };
  // OWNER: pull whatever the driver last shared — no GPS permission needed at all
  const fetchOwnerLatestWeather = async () => {
    if (!selectedBoatId) return;
    setLoadingWeather(true);
    setError("");
    try {
      const res = await api.get(`/weather/latest/${selectedBoatId}`);
      if (res.data.status === "none") {
        setData(null);
        setError(
          "The driver hasn't shared this boat's location yet. Ask the driver to open Weather Dashboard, select this boat, and click 'See Weather' — this page updates automatically once they do."
        );
      } else {
        setData(res.data);
        setPlaceName(res.data.location?.placeName || "Shared by driver");
        setLastUpdated(new Date());
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load boat weather");
    } finally {
      setLoadingWeather(false);
    }
  };

  // OWNER: keep the map/weather fresh with the driver's latest share (auto, toggleable)
  useEffect(() => {
    if (userRole !== "owner" || !selectedBoatId) return;

    fetchOwnerLatestWeather(); // load immediately on selecting the boat

    if (!autoRefreshOn) return;
    const interval = setInterval(fetchOwnerLatestWeather, 10000); // every 10s
    return () => clearInterval(interval);
  }, [selectedBoatId, userRole, autoRefreshOn]);

  // DRIVER: periodically re-capture GPS + weather so the boat keeps sharing
  // a fresh position automatically (in addition to the manual button/tick)
  useEffect(() => {
    if (userRole !== "driver" || !selectedBoatId || !autoRefreshOn) return;

    const interval = setInterval(() => {
      if (!loadingWeather) handleSeeWeather();
    }, 30000); // every 30s — GPS calls are heavier, so a longer interval
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBoatId, userRole, autoRefreshOn]);

  // "Updated Xs ago" ticker
  useEffect(() => {
    if (!lastUpdated) return;
    const tick = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, [lastUpdated]);

  //  See Weather 
  const handleSeeWeather = () => {
    if (!selectedBoatId) {
      setError("Please search and select a boat first.");
      return;
    }

    // OWNER: no geolocation at all — just read the driver's shared data
    if (userRole === "owner") {
      fetchOwnerLatestWeather();
      return;
    }

    // DRIVER: uses their own GPS — this call IS the "share" action
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    setLoadingWeather(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const resolvedPlace = await fetchPlaceName(lat, lon);
          setPlaceName(resolvedPlace);

          // ✅ Pass placeName so admin can see the location name in logs
          const res = await api.get("/weather/current", {
            params: {
              boatId: selectedBoatId,
              lat,
              lon,
              placeName: resolvedPlace,
            },
          });
          setData(res.data);
          setLastUpdated(new Date());
        } catch (err) {
          setError(err.response?.data?.message || "Weather data fetch failed");
        } finally {
          setLoadingWeather(false);
        }
      },
      (gpsError) => {
        setLoadingWeather(false);
        if (gpsError.code === 1) {
          setError("Location permission denied. Please allow location access.");
        } else if (gpsError.code === 2) {
          setError("Location unavailable.");
        } else if (gpsError.code === 3) {
          setError("Location request timed out.");
        } else {
          setError("Could not get current location.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // MANUAL REFRESH — works for both owner (re-pull latest driver share)
  // and driver (re-capture GPS + weather, which re-shares it)
  const handleRefresh = () => {
    if (!selectedBoatId) return;
    if (userRole === "owner") {
      fetchOwnerLatestWeather();
    } else {
      handleSeeWeather();
    }
  };

  const mapCenter = data
    ? [Number(data.location.latitude), Number(data.location.longitude)]
    : [6.9271, 79.8612];

  const mapKey = data
    ? `${data.location.latitude}-${data.location.longitude}-${selectedBoatId}-${mapStyle}`
    : "default-map";

  // --- New weather-detail derivations (all optional-chained for backward
  //     compatibility with older WeatherLog entries that lack these fields) ---
  const conditionIcon = (condition) => {
    switch (condition) {
      case "Sunny":
        return <Sun size={36} className="text-yellow-500" />;
      case "Rainy":
        return <CloudRain size={36} className="text-blue-500" />;
      case "Cloudy":
        return <Cloud size={36} className="text-slate-500" />;
      case "Foggy":
        return <CloudFog size={36} className="text-slate-400" />;
      default:
        return <Cloud size={36} className="text-slate-400" />;
    }
  };

  const hourlyForecast = data?.weather?.hourlyForecast || [];
  const dailyForecast = data?.weather?.dailyForecast || [];

  // Temperature Graph geometry (plain SVG — no extra chart library needed)
  const graphWidth = 640;
  const graphHeight = 160;
  const graphPad = 28;
  const tempValues = hourlyForecast.map((h) => h.temp);
  const graphMax = tempValues.length ? Math.max(...tempValues) : 0;
  const graphMin = tempValues.length ? Math.min(...tempValues) : 0;
  const graphRange = graphMax - graphMin || 1;

  const graphPoints = hourlyForecast.map((h, i) => {
    const x =
      hourlyForecast.length > 1
        ? graphPad + (i * (graphWidth - graphPad * 2)) / (hourlyForecast.length - 1)
        : graphWidth / 2;
    const y =
      graphPad +
      (1 - (h.temp - graphMin) / graphRange) * (graphHeight - graphPad * 2);
    return { x, y, temp: h.temp, time: h.time };
  });

  const polylinePoints = graphPoints.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPoints =
    graphPoints.length > 0
      ? `${graphPad},${graphHeight - graphPad} ${polylinePoints} ${
          graphPoints[graphPoints.length - 1].x
        },${graphHeight - graphPad}`
      : "";

  return (
    <div data-tour="weather-page" className="flex h-screen bg-[#f8fafc] font-sans text-slate-800 overflow-hidden">

      <style>{weatherDashboardStyles}</style> 
      {userRole === "owner" ? <OwnerSidebar /> : <DriverSidebar />}

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <DashboardNav />

        <main className="flex-1 min-h-0 overflow-y-auto px-6 lg:px-10 py-8">
          <div className="max-w-6xl mx-auto">

            <DashboardPageHeader
              eyebrow="Fleet / weather & safety"
              title="Weather and Safety Alerts"
              description="Search for a boat, use your location, and view current weather conditions."
              icon={CloudSun}
              theme="teal"
            />

            {/* Search & Select Boat */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-4">

              <div className="flex items-center justify-between mb-4">
                <label className="text-[18px] font-bold text-slate-800">
                  Search & Select Boat
                </label>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${
                    userRole === "driver"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {userRole === "driver" ? "🧑‍✈️ Driver" : "👑 Owner"}
                  {boats.length > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                        userRole === "driver"
                          ? "bg-purple-200 text-purple-800"
                          : "bg-blue-200 text-blue-800"
                      }`}
                    >
                      {boats.length} boat{boats.length !== 1 ? "s" : ""} available
                    </span>
                  )}
                </span>
              </div>

              {loadingBoats ? (
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 className="animate-spin" size={18} />
                  Loading boats...
                </div>
              ) : boats.length === 0 ? (
                <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-yellow-700 text-sm">
                  <AlertTriangle size={16} />
                  No boats found in database. Please add boats first.
                </div>
              ) : (
                <div className="relative max-w-lg" ref={searchRef}>

                  {/* Search Input */}
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400"
                      size={18}
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onFocus={() => {
                        setShowDropdown(true);
                        setFilteredBoats(
                          searchQuery.trim() === "" ? boats : filteredBoats
                        );
                      }}
                      placeholder="Search by boat name, registration, type..."
                      className={`w-full border rounded-xl pl-10 pr-10 py-2.5 outline-none focus:ring-2 bg-white transition text-sm
                        ${
                          selectedBoat
                            ? "border-green-400 focus:ring-green-300"
                            : "border-blue-300 focus:ring-blue-500"
                        }`}
                    />

                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {selectedBoat ? (
                        <CheckCircle2 className="text-green-500" size={18} />
                      ) : searchQuery ? (
                        <button onClick={handleClearSearch}>
                          <X
                            className="text-slate-400 hover:text-red-400 transition"
                            size={16}
                          />
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* Selected Boat Info */}
                  {selectedBoat && !showDropdown && (
                    <div className="mt-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2
                          className="text-green-500 shrink-0"
                          size={16}
                        />
                        <p className="text-sm font-bold text-green-800">
                          Boat selected
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs text-green-700">
                        <p>
                          <span className="font-semibold">🚢 Name:</span>{" "}
                          {selectedBoat.boatName}
                        </p>
                        <p>
                          <span className="font-semibold">📋 Reg:</span>{" "}
                          {selectedBoat.registrationNumber}
                        </p>
                        {selectedBoat.boatType && (
                          <p>
                            <span className="font-semibold">🔹 Type:</span>{" "}
                            {selectedBoat.boatType}
                          </p>
                        )}
                        {selectedBoat.boatStatus && (
                          <p>
                            <span className="font-semibold">● Status:</span>{" "}
                            <span
                              className={
                                selectedBoat.boatStatus === "ACTIVE"
                                  ? "text-green-600 font-bold"
                                  : "text-red-500 font-bold"
                              }
                            >
                              {selectedBoat.boatStatus}
                            </span>
                          </p>
                        )}
                        {selectedBoat.modelYear && (
                          <p>
                            <span className="font-semibold">📅 Year:</span>{" "}
                            {selectedBoat.modelYear}
                          </p>
                        )}
                        {selectedBoat.horsepower && (
                          <p>
                            <span className="font-semibold">⚡ HP:</span>{" "}
                            {selectedBoat.horsepower}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dropdown */}
                  {showDropdown && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-blue-200 rounded-xl shadow-xl max-h-72 overflow-y-auto">

                      <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 rounded-t-xl sticky top-0">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                          {filteredBoats.length} boat
                          {filteredBoats.length !== 1 ? "s" : ""} found
                        </p>
                      </div>

                      {filteredBoats.length > 0 ? (
                        filteredBoats.map((boat) => (
                          <div
                            key={boat._id}
                            onClick={() => handleSelectBoat(boat)}
                            className="flex flex-col px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-none transition group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-800 text-sm group-hover:text-blue-700 transition">
                                🚢 {boat.boatName}
                              </span>
                              {boat.boatStatus && (
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    boat.boatStatus === "ACTIVE"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-600"
                                  }`}
                                >
                                  {boat.boatStatus}
                                </span>
                              )}
                            </div>

                            <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5">
                              <span className="text-xs text-slate-500">
                                📋 {boat.registrationNumber}
                              </span>
                              {boat.boatType && (
                                <span className="text-xs text-slate-400">
                                  🔹 {boat.boatType}
                                </span>
                              )}
                              {boat.modelYear && (
                                <span className="text-xs text-slate-400">
                                  📅 {boat.modelYear}
                                </span>
                              )}
                              {boat.horsepower && (
                                <span className="text-xs text-slate-400">
                                  ⚡ {boat.horsepower} HP
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-6 text-center">
                          <p className="text-slate-400 text-sm">
                            ❌ No boats found matching
                          </p>
                          <p className="font-semibold text-slate-600 text-sm mt-1">
                            "{searchQuery}"
                          </p>
                          <p className="text-xs text-slate-400 mt-2">
                            Try searching by name, registration or type
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSeeWeather}
                  disabled={loadingWeather || !selectedBoat}
                  className="px-10 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loadingWeather ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      {userRole === "owner" ? "Loading..." : "Getting GPS & Weather..."}
                    </>
                  ) : (
                    "See Weather"
                  )}
                </button>

                {/* Manual refresh tick — re-pulls driver's location (owner)
                    or re-captures & re-shares GPS (driver) */}
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={loadingWeather || !selectedBoat}
                  title="Refresh location & weather"
                  className="p-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw
                    size={18}
                    className={loadingWeather ? "animate-spin" : ""}
                  />
                </button>

                {/* Auto-refresh toggle */}
                <button
                  type="button"
                  onClick={() => setAutoRefreshOn((v) => !v)}
                  title={
                    autoRefreshOn ? "Turn auto-refresh off" : "Turn auto-refresh on"
                  }
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition ${
                    autoRefreshOn
                      ? "bg-green-50 border-green-300 text-green-700"
                      : "bg-slate-100 border-slate-300 text-slate-500"
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      autoRefreshOn ? "bg-green-500 animate-pulse" : "bg-slate-400"
                    }`}
                  />
                  Auto-Refresh {autoRefreshOn ? "ON" : "OFF"}
                  <span className="text-[10px] font-normal text-slate-400">
                    ({userRole === "owner" ? "10s" : "30s"})
                  </span>
                </button>

                {/* Last updated indicator */}
                {lastUpdated && (
                  <span className="text-xs text-slate-400 font-medium">
                    Updated {secondsAgo < 5 ? "just now" : `${secondsAgo}s ago`}
                  </span>
                )}
              </div>
            </div>
            {/* ═══════════════════════════════════════════════════ */}

            {/* Error */}
            {error && (
              <div className="mb-6 rounded-xl bg-red-100 text-red-700 px-4 py-3 font-medium flex items-center gap-2">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            {/* Result */}
            {data && (
              <>
                {/* Distance from Beach / Harbour — safe zone check */}
                {/* Simple informational note — no calculation, just a fixed message */}
                <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 flex items-center gap-3 text-blue-700">
                  <Waves size={22} className="shrink-0" />
                  <p className="text-sm font-semibold">
                    ℹ️ Boats can check weather while operating within{" "}
                    <span className="font-bold">20 km – 30 km</span> from the
                    beach/harbour location.
                  </p>
                </div>

                {/* Boat + Location */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">
                      {data.boat ? data.boat.boatName : "Selected Boat"}
                    </h2>
                    {data.boat && (
                      <>
                        <p className="text-slate-600">
                          Registration: {data.boat.registrationNumber}
                        </p>
                        <p className="text-slate-600 mt-2">
                          Status: {data.boat.boatStatus}
                        </p>
                      </>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold">
                      <MapPin size={18} />
                      Current GPS Location
                    </div>
                    <p className="text-sm text-slate-500 mb-3">
                      Exact place detected from your device
                    </p>
                    <div className="space-y-2 text-slate-700">
                      <p>
                        <span className="font-semibold">Place:</span> {placeName}
                      </p>
                      <p>
                        <span className="font-semibold">Latitude:</span>{" "}
                        {data.location.latitude}
                      </p>
                      <p>
                        <span className="font-semibold">Longitude:</span>{" "}
                        {data.location.longitude}
                      </p>
                      <p>
                        <span className="font-semibold">Source:</span>{" "}
                        {data.location.source}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Weather Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                      <Thermometer size={18} />
                      <span className="font-semibold">Temperature</span>
                    </div>
                    <p className="text-3xl font-extrabold">
                      {data.weather.temperature}°C
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                      <Droplets size={18} />
                      <span className="font-semibold">Humidity</span>
                    </div>
                    <p className="text-3xl font-extrabold">
                      {data.weather.humidity}%
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                      <Wind size={18} />
                      <span className="font-semibold">Wind</span>
                    </div>
                    <p className="text-3xl font-extrabold">
                      {data.weather.windSpeedKmh ?? data.weather.windSpeedKts}{" "}
                      km/h
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                      <Eye size={18} />
                      <span className="font-semibold">Visibility</span>
                    </div>
                    <p className="text-3xl font-extrabold">
                      {data.weather.visibilityKm} km
                    </p>
                  </div>
                </div>

                {/* Current Condition */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
                  <h3 className="text-xl font-bold mb-2">Current Condition</h3>
                  <p className="capitalize text-slate-600">
                    {data.weather.description}
                  </p>
                  <p className="mt-2 text-slate-600">
                    Estimated Wave Height: {data.weather.estimatedWaveHeight} m
                  </p>
                </div>

                {/* Weather Condition + Sunrise + Sunset */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-100 shadow-sm p-6 flex items-center gap-4">
                    {conditionIcon(data.weather.weatherCondition)}
                    <div>
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                        Weather Condition
                      </p>
                      <p className="text-2xl font-extrabold text-slate-800">
                        {data.weather.weatherCondition || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl border border-orange-100 shadow-sm p-6 flex items-center gap-4">
                    <Sunrise size={36} className="text-orange-500" />
                    <div>
                      <p className="text-xs font-bold text-orange-600 uppercase tracking-wide">
                        Sunrise
                      </p>
                      <p className="text-2xl font-extrabold text-slate-800">
                        {data.weather.sunrise || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl border border-purple-100 shadow-sm p-6 flex items-center gap-4">
                    <Sunset size={36} className="text-purple-500" />
                    <div>
                      <p className="text-xs font-bold text-purple-600 uppercase tracking-wide">
                        Sunset
                      </p>
                      <p className="text-2xl font-extrabold text-slate-800">
                        {data.weather.sunset || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Wind Compass + Rain/Precipitation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Wind Compass */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 text-blue-600 mb-4 font-bold">
                      <Wind size={18} />
                      Wind Speed & Direction
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="relative w-28 h-28 shrink-0 rounded-full border-4 border-slate-100 bg-slate-50 flex items-center justify-center">
                        <span className="absolute top-1 text-[10px] font-bold text-slate-400">N</span>
                        <span className="absolute bottom-1 text-[10px] font-bold text-slate-400">S</span>
                        <span className="absolute left-1 text-[10px] font-bold text-slate-400">W</span>
                        <span className="absolute right-1 text-[10px] font-bold text-slate-400">E</span>
                        <Navigation
                          size={40}
                          className="text-blue-600 transition-transform duration-500"
                          style={{
                            transform: `rotate(${data.weather.windDeg ?? 0}deg)`,
                          }}
                        />
                      </div>
                      <div>
                        <p className="text-3xl font-extrabold text-slate-800">
                          {data.weather.windSpeedKmh ?? "N/A"}{" "}
                          <span className="text-lg font-semibold text-slate-500">
                            km/h
                          </span>
                        </p>
                        <p className="text-sm font-bold text-blue-600 mt-1">
                          Direction: {data.weather.windDirection || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Rain / Precipitation */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 text-blue-600 mb-4 font-bold">
                      <CloudRain size={18} />
                      Rain & Precipitation
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 font-semibold">
                          Precipitation Probability
                        </p>
                        <p className="text-2xl font-extrabold text-slate-800">
                          {data.weather.precipitationProbability ?? 0}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-semibold">
                          Rain (last 1h)
                        </p>
                        <p className="text-2xl font-extrabold text-slate-800">
                          {data.weather.rainLastHourMm ?? 0} mm
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-semibold">
                          Rain (last 3h)
                        </p>
                        <p className="text-2xl font-extrabold text-slate-800">
                          {data.weather.rainLast3HoursMm ?? 0} mm
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-semibold">
                          Wave Height
                        </p>
                        <p className="text-2xl font-extrabold text-slate-800">
                          {data.weather.estimatedWaveHeight} m
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Temperature Graph (next ~24h, 3h steps) */}
                {graphPoints.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
                    <div className="flex items-center gap-2 text-blue-600 mb-4 font-bold">
                      <Thermometer size={18} />
                      Temperature Graph (Next 24h)
                    </div>
                    <svg
                      viewBox={`0 0 ${graphWidth} ${graphHeight}`}
                      className="w-full h-40"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <polygon points={areaPoints} fill="url(#tempFill)" />
                      <polyline
                        points={polylinePoints}
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {graphPoints.map((p, i) => (
                        <g key={i}>
                          <circle cx={p.x} cy={p.y} r="4" fill="#2563eb" />
                          <text
                            x={p.x}
                            y={p.y - 10}
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="bold"
                            fill="#1e293b"
                          >
                            {p.temp}°
                          </text>
                          <text
                            x={p.x}
                            y={graphHeight - 6}
                            textAnchor="middle"
                            fontSize="10"
                            fill="#64748b"
                          >
                            {p.time}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                )}

                {/* Rain Probability Per Day */}
                {dailyForecast.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
                    <div className="flex items-center gap-2 text-blue-600 mb-4 font-bold">
                      <Droplets size={18} />
                      Rain Probability — Next {dailyForecast.length} Days
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      {dailyForecast.map((d, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center"
                        >
                          <p className="text-xs font-bold text-slate-500 mb-1">
                            {new Date(d.date).toLocaleDateString(undefined, {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-lg font-extrabold text-blue-600">
                            {d.rainProbability}%
                          </p>
                          <p className="text-xs text-slate-500">
                            {d.maxTemp}° / {d.minTemp}°
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Safety Alerts */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
                  <div className="flex items-center gap-2 mb-4 text-slate-900 font-bold">
                    <AlertTriangle size={18} />
                    Safety Alerts
                  </div>
                  {data.alerts && data.alerts.length > 0 ? (
                    <div className="space-y-3">
                      {data.alerts.map((alert, index) => (
                        <div
                          key={index}
                          className="rounded-xl border border-yellow-200 bg-yellow-50 p-4"
                        >
                          <p className="font-bold text-slate-900">
                            {alert.title}
                          </p>
                          <p className="text-sm text-slate-600 mt-1">
                            {alert.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500">No alerts right now.</p>
                  )}
                </div>

                {/* Weather Map */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-slate-800 font-bold">
                      <MapPin size={20} className="text-blue-600" />
                      <span className="text-lg">Live Location & Weather Map</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-blue-100 text-blue-700 font-bold px-3 py-1.5 rounded-full">
                        📍 {placeName}
                      </span>
                      <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={loadingWeather}
                        title="Refresh"
                        className="p-1.5 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition disabled:opacity-50"
                      >
                        <RefreshCw
                          size={14}
                          className={loadingWeather ? "animate-spin" : ""}
                        />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-slate-500 mb-4">
                    Your exact GPS location with real-time weather overlay
                  </p>

                  {/* Layer selector */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4 bg-slate-50 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700">
                        Weather Overlay:
                      </span>
                      <select
                        value={weatherLayer}
                        onChange={(e) => setWeatherLayer(e.target.value)}
                        className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                      >
                        <option value="temp_new">🌡️ Temperature</option>
                        <option value="precipitation_new">🌧️ Precipitation</option>
                        <option value="clouds_new">☁️ Clouds</option>
                        <option value="wind_new">💨 Wind</option>
                        <option value="pressure_new">📊 Pressure</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600">Map Style:</span>
                      <select
                        value={mapStyle}
                        onChange={(e) => setMapStyle(e.target.value)}
                        className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                      >
                        <option value="street">🗺️ Street</option>
                        <option value="satellite">🛰️ Satellite</option>
                        <option value="terrain">⛰️ Terrain</option>
                        <option value="light">🌤️ Light</option>
                      </select>
                    </div>
                  </div>

                  <div className="relative w-full h-[75vh] rounded-xl overflow-hidden border-2 border-slate-200 shadow-inner">
                    <MapContainer
                      key={mapKey}
                      center={mapCenter}
                      zoom={14}
                      scrollWheelZoom={true}
                      className="absolute inset-0 w-full h-full z-0"
                      style={{ width: "100%", height: "100%" }}
                    >
                      <MapResizeFix center={mapCenter} />

                      {/* Base map with style selection */}
                      {mapStyle === "street" && (
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                      )}
                      {mapStyle === "satellite" && (
                        <TileLayer
                          attribution="&copy; Esri"
                          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        />
                      )}
                      {mapStyle === "terrain" && (
                        <TileLayer
                          attribution="&copy; OpenTopoMap"
                          url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                        />
                      )}
                      {mapStyle === "light" && (
                        <TileLayer
                          attribution="&copy; CARTO"
                          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        />
                      )}

                      {/* Weather overlay from OpenWeather */}
                      {OPENWEATHER_KEY && (
                        <TileLayer
                          attribution="&copy; OpenWeatherMap"
                          url={`https://tile.openweathermap.org/map/${weatherLayer}/{z}/{x}/{y}.png?appid=${OPENWEATHER_KEY}`}
                          opacity={0.6}
                        />
                      )}

                      {/* Accuracy circle */}
                      <Circle
                        center={mapCenter}
                        radius={200}
                        pathOptions={{
                          color: "#2563eb",
                          fillColor: "#3b82f6",
                          fillOpacity: 0.15,
                          weight: 2,
                        }}
                      />

                      {/* Outer pulse circle */}
                      <Circle
                        center={mapCenter}
                        radius={500}
                        pathOptions={{
                          color: "#60a5fa",
                          fillColor: "#93c5fd",
                          fillOpacity: 0.08,
                          weight: 1,
                          dashArray: "5, 10",
                        }}
                      />

                      {/* Ship marker */}
                      <Marker position={mapCenter} icon={shipIcon}>
                        <Popup maxWidth={280}>
                          <div className="p-1">
                            <div className="border-b border-slate-200 pb-2 mb-2">
                              <strong className="text-blue-700 text-base">
                                📍 {placeName}
                              </strong>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Current Location
                              </p>
                            </div>

                            <div className="space-y-1.5 text-xs">
                              <p>
                                <span className="font-semibold text-slate-700">🚢 Boat:</span>{" "}
                                {data.boat?.boatName || "N/A"}
                              </p>
                              <p>
                                <span className="font-semibold text-slate-700">📋 Reg:</span>{" "}
                                {data.boat?.registrationNumber || "N/A"}
                              </p>
                              <p>
                                <span className="font-semibold text-slate-700">🌡️ Temp:</span>{" "}
                                {data.weather.temperature}°C
                              </p>
                              <p>
                                <span className="font-semibold text-slate-700">💧 Humidity:</span>{" "}
                                {data.weather.humidity}%
                              </p>
                              <p>
                                <span className="font-semibold text-slate-700">💨 Wind:</span>{" "}
                                {data.weather.windSpeedKts} kts
                              </p>
                              <p>
                                <span className="font-semibold text-slate-700">☁️ Sky:</span>{" "}
                                <span className="capitalize">{data.weather.description}</span>
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1 pt-1 border-t border-slate-100">
                                📌 {data.location.latitude.toFixed(4)},{" "}
                                {data.location.longitude.toFixed(4)}
                              </p>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    </MapContainer>

                    {/* Top-Left: Live Weather Panel */}
                    <div className="absolute top-4 left-4 z-[1000] bg-white/95 text-slate-900 rounded-2xl p-4 w-[290px] shadow-2xl backdrop-blur-md border border-white">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.2em] text-blue-600 font-bold">
                            Live Weather
                          </div>
                          <p className="font-bold text-slate-800 text-sm truncate max-w-[200px]">
                            📍 {placeName}
                          </p>
                        </div>
                        <div className="text-3xl">
                          {data.weather.description?.includes("cloud")
                            ? "☁️"
                            : data.weather.description?.includes("rain")
                            ? "🌧️"
                            : data.weather.description?.includes("clear")
                            ? "☀️"
                            : data.weather.description?.includes("snow")
                            ? "❄️"
                            : "🌤️"}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-blue-50 rounded-lg p-2">
                          <p className="text-blue-600 font-bold text-[10px] uppercase">Temp</p>
                          <p className="text-slate-900 font-black text-lg">
                            {data.weather.temperature}°C
                          </p>
                        </div>
                        <div className="bg-cyan-50 rounded-lg p-2">
                          <p className="text-cyan-600 font-bold text-[10px] uppercase">
                            Humidity
                          </p>
                          <p className="text-slate-900 font-black text-lg">
                            {data.weather.humidity}%
                          </p>
                        </div>
                        <div className="bg-teal-50 rounded-lg p-2">
                          <p className="text-teal-600 font-bold text-[10px] uppercase">Wind</p>
                          <p className="text-slate-900 font-black text-lg">
                            {data.weather.windSpeedKts}{" "}
                            <span className="text-xs">kts</span>
                          </p>
                        </div>
                        <div className="bg-indigo-50 rounded-lg p-2">
                          <p className="text-indigo-600 font-bold text-[10px] uppercase">
                            Visibility
                          </p>
                          <p className="text-slate-900 font-black text-lg">
                            {data.weather.visibilityKm}{" "}
                            <span className="text-xs">km</span>
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200">
                        <p className="text-[11px] text-slate-500">
                          <span className="font-semibold">Condition:</span>{" "}
                          <span className="capitalize text-slate-700">
                            {data.weather.description}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Bottom-Right: Coordinates Panel */}
                    <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 text-slate-900 rounded-xl px-4 py-2.5 shadow-lg backdrop-blur-md border border-white">
                      <div className="flex items-center gap-3 text-xs">
                        <MapPin size={14} className="text-blue-600" />
                        <div>
                          <p className="font-semibold text-slate-500 text-[10px] uppercase">
                            Coordinates
                          </p>
                          <p className="font-mono font-bold text-slate-800">
                            {Number(data.location.latitude).toFixed(5)},{" "}
                            {Number(data.location.longitude).toFixed(5)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Top-Right: Zoom to My Location */}
                    <button
                      onClick={() => {
                        if (data) {
                          const map = document.querySelector(".leaflet-container");
                          if (map) map.scrollIntoView({ behavior: "smooth", block: "center" });
                        }
                      }}
                      className="absolute top-4 right-4 z-[1000] bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-transform hover:scale-110"
                      title="Center on My Location"
                    >
                      <MapPin size={18} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};


const weatherDashboardStyles = `

  /* ==============================
     BASE - Page foundation
     ============================== */

  /* Fix full page layout */
  .flex.h-screen.bg-\\[\\#f8fafc\\] {
    height: 100vh !important;
    overflow: hidden !important;
  }

  /* Main scrollable area */
  main {
    flex: 1 !important;
    min-height: 0 !important;
    overflow-y: auto !important;
  }

  /* Leaflet z-index fixes */
  .leaflet-container {
    z-index: 0 !important;
  }
  .leaflet-control-container {
    z-index: 10 !important;
  }
  .leaflet-pane {
    z-index: 1 !important;
  }


  /* ==============================
     LARGE DESKTOP (1280px+)
     - Everything stays original
     ============================== */


  /* ==============================
     LAPTOP (max-width: 1280px)
     ============================== */
  @media (max-width: 1280px) {

    main {
      padding-left: 1.5rem !important;
      padding-right: 1.5rem !important;
      padding-top: 1.75rem !important;
      padding-bottom: 1.75rem !important;
    }

    main h1 {
      font-size: 1.875rem !important;
    }

    main .mb-8 {
      margin-bottom: 1.75rem !important;
    }

    /* Map height reduce */
    main .h-\\[75vh\\] {
      height: 62vh !important;
    }

    /* Map overlay panel */
    main .absolute.top-4.left-4.z-\\[1000\\] {
      width: 250px !important;
    }

    /* Weather cards gap */
    main .grid.grid-cols-1.md\\:grid-cols-2.xl\\:grid-cols-4 {
      gap: 1rem !important;
    }
  }


  /* ==============================
     SMALL LAPTOP (max-width: 1024px)
     ============================== */
  @media (max-width: 1024px) {

    main {
      padding-left: 1.25rem !important;
      padding-right: 1.25rem !important;
      padding-top: 1.5rem !important;
      padding-bottom: 1.5rem !important;
    }

    main h1 {
      font-size: 1.75rem !important;
    }

    main .mb-8 {
      margin-bottom: 1.5rem !important;
    }

    /* Search section */
    main .bg-white.rounded-2xl.border.border-slate-200.shadow-sm.p-6.mb-4 {
      padding: 1.125rem !important;
    }

    main label.text-\\[18px\\] {
      font-size: 0.9375rem !important;
    }

    /* Boat + Location - stack */
    main .grid.grid-cols-1.lg\\:grid-cols-2.gap-6.mb-6 {
      grid-template-columns: 1fr !important;
      gap: 0.875rem !important;
      margin-bottom: 0.875rem !important;
    }

    /* Weather cards - 2x2 */
    main .grid.grid-cols-1.md\\:grid-cols-2.xl\\:grid-cols-4 {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 0.875rem !important;
      margin-bottom: 0.875rem !important;
    }

    main .text-3xl.font-extrabold {
      font-size: 1.625rem !important;
    }

    /* Map height */
    main .h-\\[75vh\\] {
      height: 58vh !important;
    }

    /* Map overlay panel */
    main .absolute.top-4.left-4.z-\\[1000\\] {
      width: 220px !important;
      padding: 0.875rem !important;
    }

    /* See weather button */
    main button.mt-5.px-10 {
      padding-left: 1.5rem !important;
      padding-right: 1.5rem !important;
      font-size: 0.875rem !important;
    }
  }


  /* ==============================
     TABLET (max-width: 768px)
     ============================== */
  @media (max-width: 768px) {

    main {
      padding: 1.25rem 1rem !important;
    }

    /* Header */
    main .mb-8 {
      margin-bottom: 1.25rem !important;
    }

    main h1 {
      font-size: 1.5rem !important;
      line-height: 1.3 !important;
    }

    main .mt-3.text-slate-600 {
      font-size: 0.8125rem !important;
      margin-top: 0.375rem !important;
    }

    /* Search card */
    main .bg-white.rounded-2xl.border.border-slate-200.shadow-sm.p-6.mb-4 {
      padding: 1rem !important;
      margin-bottom: 0.875rem !important;
    }

    /* Search label + badge - stack */
    main .flex.items-center.justify-between.mb-4 {
      flex-wrap: wrap !important;
      gap: 0.5rem !important;
      margin-bottom: 0.875rem !important;
    }

    main label.text-\\[18px\\] {
      font-size: 0.875rem !important;
    }

    /* Max width for search input */
    main .relative.max-w-lg {
      max-width: 100% !important;
    }

    /* See weather button - full width */
    main button.mt-5.px-10 {
      width: 100% !important;
      justify-content: center !important;
      margin-top: 0.875rem !important;
      padding: 0.625rem 1rem !important;
      font-size: 0.8125rem !important;
    }

    /* Boat + Location - single col */
    main .grid.grid-cols-1.lg\\:grid-cols-2.gap-6.mb-6 {
      grid-template-columns: 1fr !important;
      gap: 0.875rem !important;
      margin-bottom: 0.875rem !important;
    }

    main .bg-white.rounded-2xl.border.border-slate-200.shadow-sm.p-6 {
      padding: 1rem !important;
    }

    main h2.text-2xl.font-bold {
      font-size: 1.25rem !important;
    }

    /* Weather cards - 2 cols */
    main .grid.grid-cols-1.md\\:grid-cols-2.xl\\:grid-cols-4 {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 0.75rem !important;
      margin-bottom: 0.875rem !important;
    }

    main .text-3xl.font-extrabold {
      font-size: 1.375rem !important;
    }

    /* Weather card padding */
    main .grid.grid-cols-1.md\\:grid-cols-2.xl\\:grid-cols-4 > div {
      padding: 0.875rem !important;
    }

    /* Current condition + alerts cards */
    main .bg-white.rounded-2xl.border.border-slate-200.shadow-sm.p-6.mb-6 {
      padding: 1rem !important;
      margin-bottom: 0.875rem !important;
    }

    main h3.text-xl.font-bold {
      font-size: 1rem !important;
    }

    /* Map section */
    main .bg-white.rounded-2xl.border.border-slate-200.shadow-sm.p-6.mb-6:last-child {
      padding: 0.875rem !important;
    }

    /* Map layer selector - stack */
    main .flex.flex-col.md\\:flex-row.md\\:items-center.md\\:justify-between {
      flex-direction: column !important;
      gap: 0.625rem !important;
    }

    /* Map height */
    main .h-\\[75vh\\] {
      height: 52vh !important;
      border-radius: 0.75rem !important;
    }

    /* Map overlay panel - compact */
    main .absolute.top-4.left-4.z-\\[1000\\] {
      width: 195px !important;
      padding: 0.75rem !important;
      top: 0.5rem !important;
      left: 0.5rem !important;
    }

    main .absolute.top-4.left-4.z-\\[1000\\] .text-3xl {
      font-size: 1.5rem !important;
    }

    main .absolute.top-4.left-4.z-\\[1000\\] p.font-bold.text-sm {
      font-size: 0.625rem !important;
      max-width: 140px !important;
    }

    main .absolute.top-4.left-4.z-\\[1000\\] p.font-black.text-lg {
      font-size: 1rem !important;
    }

    /* Coordinates panel */
    main .absolute.bottom-4.right-4.z-\\[1000\\] {
      bottom: 0.5rem !important;
      right: 0.5rem !important;
      padding: 0.5rem 0.75rem !important;
    }

    main .absolute.bottom-4.right-4.z-\\[1000\\] p.font-mono {
      font-size: 0.5625rem !important;
    }

    /* Center button */
    main .absolute.top-4.right-4.z-\\[1000\\] {
      top: 0.5rem !important;
      right: 0.5rem !important;
      padding: 0.5rem !important;
    }

    main .absolute.top-4.right-4.z-\\[1000\\] svg {
      width: 1rem !important;
      height: 1rem !important;
    }

    /* Place name badge in map header */
    main .text-xs.bg-blue-100.text-blue-700 {
      font-size: 0.5625rem !important;
      padding: 0.25rem 0.5rem !important;
      max-width: 140px !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
    }

    /* Alert items */
    main .rounded-xl.border.border-yellow-200.bg-yellow-50.p-4 {
      padding: 0.75rem !important;
    }
  }


  /* ==============================
     MOBILE (max-width: 640px)
     ============================== */
  @media (max-width: 640px) {

    main {
      padding: 1rem 0.875rem !important;
    }

    main h1 {
      font-size: 1.375rem !important;
    }

    /* Weather cards */
    main .grid.grid-cols-1.md\\:grid-cols-2.xl\\:grid-cols-4 {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 0.625rem !important;
    }

    main .text-3xl.font-extrabold {
      font-size: 1.25rem !important;
    }

    /* Map height */
    main .h-\\[75vh\\] {
      height: 48vh !important;
    }

    /* Map overlay - shrink more */
    main .absolute.top-4.left-4.z-\\[1000\\] {
      width: 175px !important;
      padding: 0.625rem !important;
      top: 0.375rem !important;
      left: 0.375rem !important;
    }

    main .absolute.top-4.left-4.z-\\[1000\\] .grid.grid-cols-2 > div {
      padding: 0.375rem !important;
    }

    main .absolute.top-4.left-4.z-\\[1000\\] p.font-black.text-lg {
      font-size: 0.9375rem !important;
    }

    /* Center button */
    main .absolute.top-4.right-4.z-\\[1000\\] {
      top: 0.375rem !important;
      right: 0.375rem !important;
      padding: 0.4375rem !important;
    }

    /* Bottom coordinates */
    main .absolute.bottom-4.right-4.z-\\[1000\\] {
      bottom: 0.375rem !important;
      right: 0.375rem !important;
    }

    /* Layer select */
    main select {
      font-size: 0.6875rem !important;
      padding: 0.3125rem 0.5rem !important;
    }

    /* map section card */
    main .bg-white.rounded-2xl.border.border-slate-200.shadow-sm.p-6.mb-6 {
      padding: 0.875rem !important;
    }

    /* Selected boat info grid - single col on mobile */
    main .grid.grid-cols-2.gap-x-4.gap-y-1.mt-2 {
      grid-template-columns: 1fr 1fr !important;
    }
  }


  /* ==============================
     SMALL MOBILE (max-width: 480px)
     ============================== */
  @media (max-width: 480px) {

    main {
      padding: 0.875rem 0.75rem !important;
    }

    main h1 {
      font-size: 1.25rem !important;
    }

    main .mb-8 {
      margin-bottom: 1rem !important;
    }

    /* Search card */
    main .bg-white.rounded-2xl.border.border-slate-200.shadow-sm.p-6.mb-4 {
      padding: 0.875rem !important;
    }

    /* Search input text */
    main input[type="text"] {
      font-size: 0.6875rem !important;
    }

    /* Weather cards */
    main .grid.grid-cols-1.md\\:grid-cols-2.xl\\:grid-cols-4 > div {
      padding: 0.75rem !important;
    }

    main .text-3xl.font-extrabold {
      font-size: 1.125rem !important;
    }

    main .flex.items-center.gap-2.text-blue-600 svg {
      width: 1rem !important;
      height: 1rem !important;
    }

    main .flex.items-center.gap-2.text-blue-600 span {
      font-size: 0.6875rem !important;
    }

    /* Map height */
    main .h-\\[75vh\\] {
      height: 44vh !important;
    }

    /* Map overlay panel */
    main .absolute.top-4.left-4.z-\\[1000\\] {
      width: 158px !important;
    }

    /* map section heading */
    main .flex.items-center.gap-2.text-slate-800.font-bold span.text-lg {
      font-size: 0.875rem !important;
    }

    main h2.text-2xl.font-bold {
      font-size: 1.125rem !important;
    }

    main h3.text-xl.font-bold {
      font-size: 0.9375rem !important;
    }

    /* Alert cards */
    main .rounded-xl.border.border-yellow-200.bg-yellow-50.p-4 {
      padding: 0.625rem !important;
    }
  }


  /* ==============================
     VERY SMALL (max-width: 360px)
     ============================== */
  @media (max-width: 360px) {

    main {
      padding: 0.625rem 0.5rem !important;
    }

    main h1 {
      font-size: 1.125rem !important;
    }

    /* Search card */
    main .bg-white.rounded-2xl.border.border-slate-200.shadow-sm.p-6.mb-4 {
      padding: 0.75rem !important;
    }

    /* Search input */
    main input[type="text"] {
      font-size: 0.625rem !important;
    }

    /* Weather cards - still 2 col */
    main .grid.grid-cols-1.md\\:grid-cols-2.xl\\:grid-cols-4 {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 0.375rem !important;
    }

    main .grid.grid-cols-1.md\\:grid-cols-2.xl\\:grid-cols-4 > div {
      padding: 0.625rem !important;
    }

    main .text-3xl.font-extrabold {
      font-size: 1rem !important;
    }

    /* Map height */
    main .h-\\[75vh\\] {
      height: 40vh !important;
    }

    /* Hide map overlay panel - too small */
    main .absolute.top-4.left-4.z-\\[1000\\] {
      display: none !important;
    }

    /* Coordinates panel - compact */
    main .absolute.bottom-4.right-4.z-\\[1000\\] {
      bottom: 0.25rem !important;
      right: 0.25rem !important;
      padding: 0.375rem 0.5rem !important;
    }

    main .absolute.bottom-4.right-4.z-\\[1000\\] p.font-mono {
      font-size: 0.4375rem !important;
    }

    /* Center button */
    main .absolute.top-4.right-4.z-\\[1000\\] {
      top: 0.25rem !important;
      right: 0.25rem !important;
      padding: 0.375rem !important;
    }

    /* Layer selects */
    main select {
      font-size: 0.5625rem !important;
      padding: 0.25rem 0.375rem !important;
    }

    main .bg-slate-50.rounded-xl.p-3 {
      padding: 0.5rem !important;
      gap: 0.375rem !important;
    }

    /* See weather button */
    main button.mt-5.px-10 {
      font-size: 0.6875rem !important;
      padding: 0.5rem 0.75rem !important;
    }

    main h2.text-2xl.font-bold {
      font-size: 1rem !important;
    }

    main h3.text-xl.font-bold {
      font-size: 0.875rem !important;
    }

    main .space-y-2.text-slate-700 p {
      font-size: 0.625rem !important;
    }

    main .mb-8 {
      margin-bottom: 0.875rem !important;
    }

    /* Place name badge */
    main .text-xs.bg-blue-100.text-blue-700 {
      max-width: 100px !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
      font-size: 0.5rem !important;
    }
  }


  /* ==============================
     ANIMATIONS
     ============================== */
  @keyframes weatherFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0);   }
  }

  @keyframes cardReveal {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0);    }
  }

  main {
    animation: weatherFadeIn 0.3s ease forwards;
  }

  /* Weather metric cards stagger */
  main .grid.grid-cols-1.md\\:grid-cols-2.xl\\:grid-cols-4 > div:nth-child(1) {
    animation: cardReveal 0.3s ease 0.05s both;
  }
  main .grid.grid-cols-1.md\\:grid-cols-2.xl\\:grid-cols-4 > div:nth-child(2) {
    animation: cardReveal 0.3s ease 0.10s both;
  }
  main .grid.grid-cols-1.md\\:grid-cols-2.xl\\:grid-cols-4 > div:nth-child(3) {
    animation: cardReveal 0.3s ease 0.15s both;
  }
  main .grid.grid-cols-1.md\\:grid-cols-2.xl\\:grid-cols-4 > div:nth-child(4) {
    animation: cardReveal 0.3s ease 0.20s both;
  }

  /* Dropdown */
  main .absolute.z-50.mt-1 {
    animation: cardReveal 0.18s ease forwards;
  }

  /* Card hover */
  main .grid.grid-cols-1.md\\:grid-cols-2.xl\\:grid-cols-4 > div {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  main .grid.grid-cols-1.md\\:grid-cols-2.xl\\:grid-cols-4 > div:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important;
  }
`;


export default WeatherDashboard;