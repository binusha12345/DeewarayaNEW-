import React, { useEffect, useState } from 'react';
import DriverSidebar from '../../../components/DriverSidebar';
import DashboardNav from '../../../components/DashboardNav';
import DashboardPageHeader from '../../../components/DashboardPageHeader';
import { useAuth } from '../../../context/AuthContext'; // ✅ ADD THIS
import useInternetStatus from '../../../hooks/useInternetStatus';
import api from '../../../services/api';
import { 
  Wind, 
  Thermometer, 
  Anchor, 
  Plus, 
  Minus, 
  Crosshair, 
  Info, 
  Droplet 
} from 'lucide-react';

const BoatDriverDashboard = () => {
  const { user } = useAuth(); // ADD THIS
  const [signalBoatId, setSignalBoatId] = useState(() => localStorage.getItem('signalBoatId:driver') || '');
  const connection = useInternetStatus({ boatId: signalBoatId, report: Boolean(signalBoatId) });
  const connectionLabel = {
    good: "System connected",
    medium: "Weak connection",
    poor: "Poor connection",
    offline: "Offline",
    checking: "Checking connection",
  }[connection.status] || "Checking connection";
  const connectionIndicator = {
    good: "bg-emerald-300",
    medium: "bg-amber-300",
    poor: "bg-orange-300",
    offline: "bg-red-300",
    checking: "bg-white/60 animate-pulse",
  }[connection.status] || "bg-white/60 animate-pulse";

  useEffect(() => {
    api.get('/boats/assigned').then(({ data }) => {
      const boats = Array.isArray(data) ? data : [];
      const savedId = localStorage.getItem('signalBoatId:driver');
      const selectedBoat = boats.find((boat) => boat._id === savedId) || boats[0];
      if (selectedBoat) {
        setSignalBoatId(selectedBoat._id);
        localStorage.setItem('signalBoatId:driver', selectedBoat._id);
      }
    }).catch(() => setSignalBoatId(''));
  }, []);

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans text-slate-800 overflow-hidden">
      
      <style>{driverDashboardStyles}</style> 

      {/* Sidebar */}
      <DriverSidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Navigation */}
        <DashboardNav />

        {/* Dashboard area */}
        <main className="flex-1 overflow-y-auto p-8">
          {(connection.status === 'poor' || connection.status === 'offline') && (
            <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
              <span>{connection.status === 'offline' ? 'Internet is offline. GPS updates will be queued until connection returns.' : 'Internet connection is poor. GPS updates may be delayed.'}</span>
              <a href="/signal-indicator" className="underline underline-offset-2">View signal status</a>
            </div>
          )}
          
          <DashboardPageHeader
            eyebrow="Driver dashboard"
            title={`Welcome, ${user?.name || 'Driver'}`}
            description="Your real-time vessel telemetry and navigation overview."
            icon={Anchor}
            theme="cyan"
            action={
              <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 p-3">
                <span className={`h-2.5 w-2.5 rounded-full ${connectionIndicator}`} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">Connection</p>
                  <p className="text-sm font-bold">{connectionLabel}</p>
                </div>
              </div>
            }
          />

          {/* Grid Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Left column (Map + Telemetry Cards) */}
            <div className="xl:col-span-2 space-y-6">
              
              {/* Map View */}
              <div className="relative h-[540px] overflow-hidden rounded-2xl bg-slate-200 shadow-lg ring-1 ring-slate-200">
                <img 
                  src="src/assets/bddashmap.png"
                  alt="Map Aerial View" 
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
                />
                <div className="absolute right-5 top-5 flex items-center gap-2 rounded-full border border-white/50 bg-white/90 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-700 shadow-md backdrop-blur">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Navigation view
                </div>
                
                {/* HUD Overlay */}
                <div className="absolute top-6 left-6 min-w-[200px] rounded-3xl border border-white/60 bg-white/90 p-5 shadow-xl backdrop-blur-md">
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                      Navigation HUD
                    </p>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  </div>
                  
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-slate-900">12.42</span>
                    <span className="text-xs font-bold text-slate-500 ml-1">KNOTS</span>
                  </div>
                  
                  <div className="flex gap-6 border-t border-slate-200 pt-3">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Heading</p>
                      <p className="text-sm font-bold text-slate-900">284° W</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Depth</p>
                      <p className="text-sm font-bold text-slate-900">42.5 m</p>
                    </div>
                  </div>
                </div>

                {/* Map Controls */}
                <div className="absolute bottom-6 right-6 flex gap-2">
                  <div className="flex overflow-hidden rounded-xl border border-white/70 bg-white/95 shadow-lg backdrop-blur">
                    <button aria-label="Zoom in" className="p-2.5 text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-800">
                      <Plus size={20} />
                    </button>
                    <div className="w-px bg-slate-200"></div>
                    <button aria-label="Zoom out" className="p-2.5 text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-800">
                      <Minus size={20} />
                    </button>
                  </div>
                  <button aria-label="Center map" className="rounded-xl bg-cyan-800 p-2.5 text-white shadow-lg transition hover:bg-cyan-900">
                    <Crosshair size={20} />
                  </button>
                </div>
              </div>

              {/* Bottom Cards (Wind & Temp) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Wind Card */}
                <div className="group relative overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-white via-white to-sky-50 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="absolute -right-5 -top-8 h-24 w-24 rounded-full bg-sky-100/70 transition-transform group-hover:scale-110" />
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Wind Velocity
                    </h3>
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700 ring-1 ring-sky-200">
                      <Wind size={20} />
                    </div>
                  </div>
                  <div className="relative mb-2">
                    <span className="text-5xl font-bold text-slate-900">24</span>
                    <span className="ml-1 text-lg font-bold text-slate-500">kph</span>
                  </div>
                  <p className="text-sm text-slate-500">Moderate breeze from North-East</p>
                  <div className="mt-5 flex items-center gap-1.5" aria-label="Moderate wind">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((bar) => (
                      <span key={bar} className={`h-1.5 flex-1 rounded-full ${bar < 6 ? "bg-sky-500" : "bg-sky-100"}`} />
                    ))}
                  </div>
                </div>

                {/* Temperature Card */}
                <div className="group relative overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-white via-white to-orange-50 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="absolute -right-5 -top-8 h-24 w-24 rounded-full bg-orange-100/70 transition-transform group-hover:scale-110" />
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Temperature
                    </h3>
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-700 ring-1 ring-orange-200">
                      <Thermometer size={20} />
                    </div>
                  </div>
                  <div className="relative mb-2">
                    <span className="text-5xl font-bold text-slate-900">25</span>
                    <span className="ml-1 text-2xl font-bold text-slate-500">°C</span>
                  </div>
                  <p className="text-sm text-slate-500">Ambient deck temperature</p>
                  <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-orange-100">
                    <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />
                  </div>
                </div>

              </div>
            </div>

            {/* Right Column (Sidebar Widgets) */}
            <div className="space-y-6">
              
              {/* Boat Details Card */}
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg">
                {/* Decorative blob top right */}
                <div className="absolute -right-10 -top-10 z-0 h-36 w-36 rounded-full bg-gradient-to-br from-cyan-100 to-sky-50"></div>
                
                <div className="flex items-center gap-2 mb-6 relative z-10">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-800 text-white shadow-sm">
                    <Info size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-700">Vessel profile</p>
                    <h3 className="text-lg font-bold text-slate-900">Boat Details</h3>
                  </div>
                </div>

                <div className="relative mb-5 h-40 overflow-hidden rounded-2xl bg-slate-100">
                  <img 
                    src="src/assets/bddash.png" 
                    alt="Fishing Boat" 
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <span className="absolute bottom-3 left-3 rounded-full border border-white/40 bg-slate-950/65 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
                    Assigned vessel
                  </span>
                </div>

                <div className="mb-5 grid grid-cols-2 gap-3">
                  <div className="col-span-2 rounded-xl bg-cyan-50/80 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Boat name</p>
                    <p className="mt-1 text-lg font-bold text-cyan-900">Boat A</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Registration</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">209934</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Capacity</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">2 Tons</p>
                  </div>
                  <div className="col-span-2 flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5">
                    <span className="text-xs font-semibold text-slate-500">Engine type</span>
                    <span className="text-sm font-bold text-slate-900">25</span>
                  </div>
                </div>

                {/* Fuel Level */}
                <div className="flex items-center gap-4 rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 to-cyan-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sky-700 shadow-sm">
                    <Droplet size={21} fill="currentColor" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Fuel level</span>
                      <span className="text-xs font-extrabold text-cyan-900">75%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-emerald-500"
                        style={{ width: '75%' }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-cyan-950 to-cyan-800 p-6 text-white shadow-lg shadow-cyan-950/15">
                <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full border border-white/10" />
                <div className="relative mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                    <Crosshair size={19} />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-200">At your fingertips</p>
                    <h3 className="text-sm font-bold">Quick Actions</h3>
                  </div>
                </div>
                
                <div className="relative space-y-3">
                  <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-cyan-400">
                    <Anchor size={18} />
                    Deploy Anchor
                  </button>
                  
                  <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/15">
                    <span className="rounded-md bg-red-500 px-2 py-1 text-[10px] font-black tracking-widest text-white">SOS</span>
                    Emergency Broadcast
                  </button>
                </div>
              </div>

            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

// ============================================================
// ✅ RESPONSIVE STYLES - Proper & Clean
// ============================================================

const driverDashboardStyles = `

  /* ==============================
     BASE - Dashboard foundation
     ============================== */
  .driver-page {
    min-height: 100vh;
  }


  /* ==============================
     LARGE DESKTOP (1280px+)
     - Everything stays original
     ============================== */


  /* ==============================
     LAPTOP (max-width: 1280px)
     ============================== */
  @media (max-width: 1280px) {

    /* Main padding */
    main {
      padding: 1.75rem !important;
    }

    /* Header */
    main h1 {
      font-size: 1.75rem !important;
    }

    /* Map height */
    main .relative.h-\\[540px\\] {
      height: 420px !important;
    }

    /* HUD overlay */
    main .absolute.top-6.left-6 {
      padding: 1rem !important;
      min-width: 170px !important;
    }

    main .absolute.top-6.left-6 span.text-4xl {
      font-size: 2.25rem !important;
    }

    /* Wind & Temp cards */
    main .text-5xl {
      font-size: 2.75rem !important;
    }

    /* Right column boat image */
    main .h-40 {
      height: 8rem !important;
    }
  }


  /* ==============================
     SMALL LAPTOP (max-width: 1024px)
     ============================== */
  @media (max-width: 1024px) {

    main {
      padding: 1.5rem !important;
    }

    main h1 {
      font-size: 1.625rem !important;
    }

    main p.text-slate-600 {
      font-size: 0.8125rem !important;
    }

    /* Map height */
    main .relative.h-\\[540px\\] {
      height: 380px !important;
    }

    /* HUD overlay */
    main .absolute.top-6.left-6 {
      padding: 0.875rem !important;
      min-width: 160px !important;
      border-radius: 1.25rem !important;
    }

    main .absolute.top-6.left-6 span.text-4xl {
      font-size: 2rem !important;
    }

    main .absolute.top-6.left-6 .text-sm {
      font-size: 0.75rem !important;
    }

    /* Grid - stack xl:col-span-2 earlier */
    main .grid.grid-cols-1.xl\\:grid-cols-3 {
      grid-template-columns: 1fr !important;
    }

    /* Wind & Temp number */
    main .text-5xl {
      font-size: 2.5rem !important;
    }

    /* Boat details card */
    main .rounded-3xl.p-6 {
      padding: 1.25rem !important;
    }

    main .h-40 {
      height: 7rem !important;
    }
  }


  /* ==============================
     TABLET (max-width: 768px)
     - Stack layout vertically
     - Compact map & cards
     ============================== */
  @media (max-width: 768px) {

    main {
      padding: 1.25rem !important;
    }

    /* Dashboard header */
    main > div:first-child {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 1rem !important;
      margin-bottom: 1.5rem !important;
    }

    main h1 {
      font-size: 1.5rem !important;
      margin-bottom: 0.25rem !important;
    }

    main p.text-slate-600 {
      font-size: 0.75rem !important;
    }

    /* Status badge */
    main > div:first-child > div:last-child {
      width: 100% !important;
      justify-content: flex-start !important;
    }

    /* Main grid - single column */
    main .grid.grid-cols-1.xl\\:grid-cols-3 {
      grid-template-columns: 1fr !important;
      gap: 1.25rem !important;
    }

    /* Map height */
    main .relative.h-\\[540px\\] {
      height: 320px !important;
      border-radius: 1rem !important;
    }

    /* HUD overlay */
    main .absolute.top-6.left-6 {
      top: 0.75rem !important;
      left: 0.75rem !important;
      padding: 0.75rem !important;
      min-width: 150px !important;
      border-radius: 1rem !important;
    }

    main .absolute.top-6.left-6 span.text-4xl {
      font-size: 1.75rem !important;
    }

    main .absolute.top-6.left-6 .text-xs {
      font-size: 0.6rem !important;
    }

    /* Map controls */
    main .absolute.bottom-6.right-6 {
      bottom: 0.75rem !important;
      right: 0.75rem !important;
    }

    /* Wind & Temp grid */
    main .grid.grid-cols-1.md\\:grid-cols-2 {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 1rem !important;
    }

    /* Wind & Temp numbers */
    main .text-5xl {
      font-size: 2.25rem !important;
    }

    main .text-lg.font-bold.text-slate-700 {
      font-size: 0.875rem !important;
    }

    main .text-2xl.font-bold.text-slate-900 {
      font-size: 1.25rem !important;
    }

    /* Right column cards */
    main .rounded-3xl {
      border-radius: 1.25rem !important;
    }

    main .rounded-3xl.p-6 {
      padding: 1.25rem !important;
    }

    main .h-40 {
      height: 9rem !important;
    }

    /* Quick actions */
    main .bg-\\[\\#e2e8f0\\].rounded-3xl.p-6 {
      padding: 1.25rem !important;
    }
  }


  /* ==============================
     MOBILE (max-width: 640px)
     ============================== */
  @media (max-width: 640px) {

    main {
      padding: 1rem !important;
    }

    main h1 {
      font-size: 1.375rem !important;
    }

    /* Map height */
    main .relative.h-\\[540px\\] {
      height: 280px !important;
      border-radius: 0.875rem !important;
    }

    /* HUD overlay */
    main .absolute.top-6.left-6 {
      top: 0.625rem !important;
      left: 0.625rem !important;
      padding: 0.625rem !important;
      min-width: 130px !important;
    }

    main .absolute.top-6.left-6 span.text-4xl {
      font-size: 1.5rem !important;
    }

    /* Wind & Temp grid - stack */
    main .grid.grid-cols-1.md\\:grid-cols-2 {
      grid-template-columns: 1fr !important;
      gap: 0.875rem !important;
    }

    /* Wind & Temp card */
    main .rounded-2xl.p-6 {
      padding: 1rem !important;
      border-radius: 1rem !important;
    }

    main .text-5xl {
      font-size: 2rem !important;
    }

    /* Boat details */
    main .rounded-3xl.p-6 {
      padding: 1rem !important;
    }

    main .h-40 {
      height: 8rem !important;
    }

    main .text-lg.font-bold.text-\\[\\#005a8d\\] {
      font-size: 1rem !important;
    }

    /* Fuel bar */
    main .bg-\\[\\#f0f4f8\\].rounded-xl.p-4 {
      padding: 0.75rem !important;
    }

    /* Quick actions buttons */
    main .space-y-3 button {
      padding-top: 0.625rem !important;
      padding-bottom: 0.625rem !important;
      font-size: 0.875rem !important;
    }

    /* Gap adjustments */
    main .space-y-6 > * + * {
      margin-top: 1rem !important;
    }
  }


  /* ==============================
     SMALL MOBILE (max-width: 480px)
     ============================== */
  @media (max-width: 480px) {

    main {
      padding: 0.875rem !important;
    }

    main h1 {
      font-size: 1.25rem !important;
    }

    main p.text-slate-600 {
      font-size: 0.7rem !important;
    }

    /* Map height */
    main .relative.h-\\[540px\\] {
      height: 240px !important;
      border-radius: 0.75rem !important;
    }

    /* HUD overlay */
    main .absolute.top-6.left-6 {
      top: 0.5rem !important;
      left: 0.5rem !important;
      padding: 0.5rem !important;
      min-width: 115px !important;
      border-radius: 0.875rem !important;
    }

    main .absolute.top-6.left-6 span.text-4xl {
      font-size: 1.375rem !important;
    }

    main .absolute.top-6.left-6 .mb-3 p {
      font-size: 0.55rem !important;
    }

    main .absolute.top-6.left-6 .flex.gap-6 {
      gap: 0.75rem !important;
    }

    /* Wind & Temp cards */
    main .text-5xl {
      font-size: 1.75rem !important;
    }

    main .text-sm.text-slate-500 {
      font-size: 0.7rem !important;
    }

    /* Boat details card */
    main .rounded-3xl.p-6 {
      padding: 0.875rem !important;
      border-radius: 1rem !important;
    }

    main .h-40 {
      height: 7rem !important;
    }

    main .text-lg.font-bold.text-slate-900 {
      font-size: 0.9375rem !important;
    }

    /* Space-y-4 in boat details */
    main .space-y-4 > * + * {
      margin-top: 0.75rem !important;
    }

    /* Quick actions */
    main .space-y-3 button {
      padding: 0.5rem 1rem !important;
      font-size: 0.8125rem !important;
      border-radius: 0.75rem !important;
    }
  }


  /* ==============================
     VERY SMALL (max-width: 360px)
     ============================== */
  @media (max-width: 360px) {

    main {
      padding: 0.625rem !important;
    }

    main h1 {
      font-size: 1.125rem !important;
    }

    /* Map */
    main .relative.h-\\[540px\\] {
      height: 200px !important;
    }

    /* HUD overlay */
    main .absolute.top-6.left-6 {
      min-width: 100px !important;
      padding: 0.375rem !important;
    }

    main .absolute.top-6.left-6 span.text-4xl {
      font-size: 1.25rem !important;
    }

    /* Cards */
    main .text-5xl {
      font-size: 1.5rem !important;
    }

    main .rounded-2xl.p-6 {
      padding: 0.875rem !important;
    }

    /* Boat details */
    main .h-40 {
      height: 6rem !important;
    }

    main .rounded-3xl.p-6 {
      padding: 0.75rem !important;
    }

    /* Quick actions */
    main .space-y-3 button {
      padding: 0.5rem 0.75rem !important;
      font-size: 0.75rem !important;
    }
  }


  /* ==============================
     ANIMATIONS
     ============================== */
  @keyframes dashFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0);   }
  }

  main {
    animation: dashFadeIn 0.3s ease forwards;
  }
`;

export default BoatDriverDashboard;