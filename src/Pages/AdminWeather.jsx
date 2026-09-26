import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../services/api";
import {
  Loader2,
  MapPin,
  Thermometer,
  Droplets,
  Wind,
  Eye,
  AlertTriangle,
  RefreshCw,
  User,
  Ship,
  Activity,
  Cloud,
  Waves,
  Clock,
  TrendingUp,
} from "lucide-react";

// Define API URL properly
const AdminWeather = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);

      const adminToken = localStorage.getItem("adminToken");

      if (!adminToken) {
        setError("Admin not logged in. Please login again.");
        setLoading(false);
        return;
      }

      const res = await axios.get(`${API_BASE}/admin/weather/logs`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      setLogs(res.data.logs || []);
      setLastUpdated(new Date());
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch weather logs"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs();
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hr ago`;
    return date.toLocaleString();
  };

  // Calculate stats
  const ownerChecks = logs.filter((l) => l.checkedByRole === "owner").length;
  const driverChecks = logs.filter((l) => l.checkedByRole === "driver").length;
  const alertsCount = logs.reduce(
    (acc, l) => acc + (l.alerts?.length || 0),
    0
  );

  // Get weather icon
  const getWeatherIcon = (description) => {
    if (!description) return "🌤️";
    const desc = description.toLowerCase();
    if (desc.includes("rain")) return "🌧️";
    if (desc.includes("cloud")) return "☁️";
    if (desc.includes("clear") || desc.includes("sun")) return "☀️";
    if (desc.includes("snow")) return "❄️";
    if (desc.includes("thunder") || desc.includes("storm")) return "⛈️";
    if (desc.includes("mist") || desc.includes("fog")) return "🌫️";
    return "🌤️";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#254b7a] via-[#2f5a91] to-[#254b7a] p-6 relative overflow-hidden">
      
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">

        
        {/* HERO HEADER SECTION */}
        <div className="mb-6 bg-gradient-to-br from-[#0f2444]/80 to-[#1a2f5c]/80 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Cloud className="text-white" size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
                    Fleet Management
                  </span>
                  <span className="w-1 h-1 bg-cyan-400 rounded-full"></span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
                    Weather Monitoring
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-white mb-1">
                  Live Weather{" "}
                  <span className="bg-gradient-to-r from-cyan-300 to-sky-400 bg-clip-text text-transparent">
                    Monitoring
                  </span>
                </h1>
                <p className="text-blue-200/70 text-sm">
                  Real-time weather checks by boat owners & drivers
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm font-medium text-blue-100 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4 accent-cyan-500"
                />
                Auto-refresh (10s)
              </label>

              <button
                onClick={fetchLogs}
                disabled={loading}
                className="group relative flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all disabled:opacity-60 overflow-hidden"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                <span className="relative">Refresh</span>
              </button>
            </div>
          </div>
        </div>

        
        {/* STATS BAR */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          
          {/* Live Status */}
          <div className="bg-gradient-to-br from-emerald-200/50 to-emerald-200/5 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                Status
              </span>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-2xl font-black text-white">LIVE</p>
            <p className="text-[10px] text-emerald-300/70 mt-1">
              {lastUpdated
                ? `Updated ${lastUpdated.toLocaleTimeString()}`
                : "Waiting..."}
            </p>
          </div>

          {/* Total Checks */}
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-200/50 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
                Total Checks
              </span>
              <Activity size={14} className="text-cyan-400" />
            </div>
            <p className="text-2xl font-black text-white">{logs.length}</p>
            <p className="text-[10px] text-cyan-300/70 mt-1">Weather queries</p>
          </div>

          {/* Owner Checks */}
          <div className="bg-gradient-to-br from-blue-500/60 to-indigo-600/5 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
                By Owners
              </span>
              <User size={14} className="text-blue-400" />
            </div>
            <p className="text-2xl font-black text-white">{ownerChecks}</p>
            <p className="text-[10px] text-blue-300/70 mt-1">Owner requests</p>
          </div>

          {/* Alerts */}
          <div className="bg-gradient-to-br from-amber-400/30 to-orange-200/50 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                Active Alerts
              </span>
              <AlertTriangle size={14} className="text-amber-400" />
            </div>
            <p className="text-2xl font-black text-white">{alertsCount}</p>
            <p className="text-[10px] text-amber-300/70 mt-1">Safety warnings</p>
          </div>
        </div>

     
        {/* ERROR */}
        {error && (
          <div className="mb-6 bg-red-500/10 backdrop-blur-xl border border-red-500/30 rounded-2xl px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-400" />
            </div>
            <p className="text-red-200 text-sm font-medium">{error}</p>
          </div>
        )}


        {/* LOADING */}
        {loading && logs.length === 0 && (
          <div className="text-center py-20 bg-gradient-to-br from-[#0f2444]/50 to-[#1a2f5c]/50 backdrop-blur-xl border border-cyan-500/20 rounded-2xl">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl mb-4">
              <Loader2 className="animate-spin text-white" size={32} />
            </div>
            <p className="text-cyan-300 font-semibold">
              Loading weather logs...
            </p>
          </div>
        )}

       
        {/* EMPTY STATE */}
        {!loading && logs.length === 0 && !error && (
          <div className="text-center py-20 bg-gradient-to-br from-[#0f2444]/50 to-[#1a2f5c]/50 backdrop-blur-xl border border-cyan-500/20 rounded-2xl">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-2xl mb-4">
              <Cloud size={40} className="text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              No Weather Checks Yet
            </h3>
            <p className="text-blue-200/70 text-sm">
              When boat owners or drivers check weather, it will appear here.
            </p>
          </div>
        )}


        {/* LOGS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {logs.map((log) => (
            <div
              key={log._id}
              className="group relative bg-gradient-to-br from-blue-800/80 to-gray-400/30 backdrop-blur-xl border border-white/20 rounded-2xl p-5 hover:border-cyan-400/50 hover:shadow-2xl hover:shadow-cyan-500/20 hover:from-white/15 hover:to-white/10 transition-all duration-300 overflow-hidden"
            >
              {/* Gradient accent on hover */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="relative">

                {/* Boat Header */}
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-cyan-500/10">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30 shrink-0">
                      <Ship size={18} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-black text-white text-lg leading-tight">
                        {log.boatName}
                      </h3>
                      <p className="text-[11px] text-cyan-300/70 mt-0.5 font-mono">
                        📋 {log.registrationNumber}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 rounded-full">
                    <Clock size={10} />
                    {formatTime(log.createdAt)}
                  </div>
                </div>

                {/* User Info */}
                <div className="flex items-center gap-2 mb-4 text-xs">
                  <div className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
                    <User size={14} className="text-blue-300" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">
                      {log.checkedByName || "User"}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                      log.checkedByRole === "driver"
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    }`}
                  >
                    {log.checkedByRole === "driver" ? "🧑‍✈️" : "👑"}{" "}
                    {log.checkedByRole}
                  </span>
                </div>

                {/* Location */}
                <div className="flex items-start gap-2 mb-4 bg-white/5 border border-white/10 rounded-xl p-3">
                  <MapPin size={14} className="text-red-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-xs truncate">
                      {log.location?.placeName || "Unknown Location"}
                    </p>
                    <p className="text-[10px] text-blue-300/50 font-mono mt-0.5">
                      {log.location?.latitude?.toFixed(4)},{" "}
                      {log.location?.longitude?.toFixed(4)}
                    </p>
                  </div>
                </div>

                {/* Weather Description with Icon */}
                <div className="flex items-center justify-between mb-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold">
                      Current Condition
                    </p>
                    <p className="text-sm text-white capitalize font-semibold mt-0.5">
                      {log.weather?.description || "N/A"}
                    </p>
                  </div>
                  <div className="text-4xl">
                    {getWeatherIcon(log.weather?.description)}
                  </div>
                </div>

                {/* Weather Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {/* Temperature */}
                  <div className="bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/20 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Thermometer size={12} className="text-orange-400" />
                      <span className="text-[9px] font-bold text-orange-400 uppercase tracking-wider">
                        Temp
                      </span>
                    </div>
                    <p className="text-xl font-black text-white">
                      {log.weather?.temperature}
                      <span className="text-sm font-bold text-orange-300 ml-0.5">
                        °C
                      </span>
                    </p>
                  </div>

                  {/* Humidity */}
                  <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Droplets size={12} className="text-cyan-400" />
                      <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider">
                        Humidity
                      </span>
                    </div>
                    <p className="text-xl font-black text-white">
                      {log.weather?.humidity}
                      <span className="text-sm font-bold text-cyan-300 ml-0.5">
                        %
                      </span>
                    </p>
                  </div>

                  {/* Wind */}
                  <div className="bg-gradient-to-br from-teal-500/10 to-emerald-500/5 border border-teal-500/20 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Wind size={12} className="text-teal-400" />
                      <span className="text-[9px] font-bold text-teal-400 uppercase tracking-wider">
                        Wind
                      </span>
                    </div>
                    <p className="text-xl font-black text-white">
                      {log.weather?.windSpeedKts}
                      <span className="text-sm font-bold text-teal-300 ml-0.5">
                        kts
                      </span>
                    </p>
                  </div>

                  {/* Visibility */}
                  <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Eye size={12} className="text-indigo-400" />
                      <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">
                        Visibility
                      </span>
                    </div>
                    <p className="text-xl font-black text-white">
                      {log.weather?.visibilityKm}
                      <span className="text-sm font-bold text-indigo-300 ml-0.5">
                        km
                      </span>
                    </p>
                  </div>
                </div>

                {/* Alerts */}
                {log.alerts && log.alerts.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-cyan-500/10">
                    <div className="flex items-center gap-1.5 mb-2">
                      <AlertTriangle size={12} className="text-amber-400" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                        {log.alerts.length} Alert
                        {log.alerts.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    {log.alerts.map((alert, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-[11px] bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 mt-1"
                      >
                        <AlertTriangle
                          size={12}
                          className="text-amber-400 shrink-0 mt-0.5"
                        />
                        <span className="font-semibold text-amber-200">
                          {alert.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminWeather;