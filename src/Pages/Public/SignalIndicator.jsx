import { useEffect, useState } from "react";
import { Activity, Radio, RefreshCw, Timer, Wifi } from "lucide-react";
import DashboardNav from "../../components/DashboardNav";
import DriverSidebar from "../../components/DriverSidebar";
import OwnerSidebar from "../../components/OwnerSidebar";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import useInternetStatus from "../../hooks/useInternetStatus";

const STATUS = {
  good: { label: "Good", icon: "🟢", color: "text-emerald-700", bg: "bg-emerald-50", hint: "Stable connection" },
  medium: { label: "Medium", icon: "🟡", color: "text-amber-700", bg: "bg-amber-50", hint: "Connection is slower than usual" },
  poor: { label: "Poor", icon: "🔴", color: "text-red-700", bg: "bg-red-50", hint: "Connection may interrupt updates" },
  offline: { label: "Offline", icon: "⚫", color: "text-slate-700", bg: "bg-slate-100", hint: "No internet connection" },
  checking: { label: "Checking", icon: "◌", color: "text-slate-600", bg: "bg-slate-100", hint: "Measuring internet connection" },
};

export default function SignalIndicator() {
  const { user } = useAuth();
  const isDriver = user?.role === "driver";
  const [boats, setBoats] = useState([]);
  const [boatId, setBoatId] = useState(localStorage.getItem("signalBoatId") || "");
  const connection = useInternetStatus({ boatId, report: isDriver });
  const details = STATUS[connection.status] || STATUS.checking;

  useEffect(() => {
    if (!isDriver) return;
    api.get("/boats/all").then(({ data }) => setBoats(Array.isArray(data) ? data : [])).catch(() => setBoats([]));
  }, [isDriver]);

  const selectBoat = (event) => {
    const value = event.target.value;
    setBoatId(value);
    localStorage.setItem("signalBoatId", value);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 text-slate-900">
      {isDriver ? <DriverSidebar /> : <OwnerSidebar />}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardNav />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-9">
          <div className="mx-auto max-w-4xl">
            <div className="mb-7 flex items-start gap-4">
              <div className="rounded-lg bg-cyan-900 p-3 text-white"><Radio size={22} /></div>
              <div>
                <p className="text-sm font-semibold uppercase text-cyan-800">Network health</p>
                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Signal Indicator</h1>
                <p className="mt-2 max-w-xl text-sm text-slate-600">Internet connection quality measured between this device and the Deewaraya service.</p>
              </div>
            </div>
            {isDriver && (
              <label className="mb-5 block max-w-lg text-sm font-semibold text-slate-700">
                Boat for connection alerts
                <select value={boatId} onChange={selectBoat} className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-3 font-normal outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100">
                  <option value="">Choose a boat</option>
                  {boats.map((boat) => <option key={boat._id} value={boat._id}>{boat.boatName} · {boat.registrationNumber}</option>)}
                </select>
              </label>
            )}
            <section aria-live="polite" className={`rounded-xl border border-slate-200 ${details.bg} p-5 shadow-sm sm:p-8`}>
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">Current internet status</p>
                  <div className={`mt-2 flex items-center gap-3 text-3xl font-bold ${details.color}`}><span aria-hidden="true" className="text-2xl">{details.icon}</span>{details.label}</div>
                  <p className="mt-2 text-sm text-slate-600">{details.hint}</p>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-white/70 bg-white/75 px-4 py-3">
                  <Activity size={20} className="text-cyan-900" />
                  <div><p className="text-xs font-semibold uppercase text-slate-500">Service latency</p><p className="text-xl font-bold">{connection.latency == null ? "--" : `${connection.latency} ms`}</p></div>
                </div>
              </div>
              <p className="mt-6 border-t border-slate-300/60 pt-4 text-xs text-slate-500">{connection.checkedAt ? `Last checked ${connection.checkedAt.toLocaleTimeString()}` : "Waiting for first measurement"} · Refreshes every 10 seconds</p>
            </section>
            <section aria-label="Recent connection performance" className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500">Average latency</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{connection.averageLatency == null ? "--" : `${connection.averageLatency} ms`}</p>
                  </div>
                  <span className="rounded-lg bg-cyan-50 p-3 text-cyan-900"><Timer size={21} /></span>
                </div>
                <p className="mt-3 text-xs text-slate-500">From {connection.latencySampleCount} successful checks in the recent window</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500">Connection stability</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{connection.stability == null ? "--" : `${connection.stability}%`}</p>
                  </div>
                  <span className="rounded-lg bg-emerald-50 p-3 text-emerald-800"><Wifi size={21} /></span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Connection stability" aria-valuemin={0} aria-valuemax={100} aria-valuenow={connection.stability ?? 0}>
                  <div className="h-full rounded-full bg-emerald-600 transition-[width] duration-500" style={{ width: `${connection.stability ?? 0}%` }} />
                </div>
                <p className="mt-3 text-xs text-slate-500">Successful checks across the latest {connection.sampleCount} attempts</p>
              </div>
            </section>
            {isDriver && !boatId && <p className="mt-4 text-sm text-amber-800">Choose the boat you are operating to send connection alerts to its owner.</p>}
            <button onClick={() => window.dispatchEvent(new Event("online"))} className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw size={16} /> Check now</button>
          </div>
        </main>
      </div>
    </div>
  );
}