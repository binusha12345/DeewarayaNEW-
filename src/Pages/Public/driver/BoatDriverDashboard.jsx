import React, { useEffect, useState } from 'react';
import DriverSidebar from '../../../components/DriverSidebar';
import DashboardNav from '../../../components/DashboardNav';
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
          
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              {/* Show welcome message with user name */}
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Welcome, {user?.name || 'Driver'}! ⚓
              </h1>
              <p className="text-slate-600">
                Real-time vessel telemetry and navigation systems active.
              </p>
            </div>
            
            <div className="flex items-center bg-[#f0f4f8] rounded-xl p-2 pr-4 shadow-sm border border-slate-200">
              <div className="w-10 h-10 bg-cyan-300 rounded-lg flex items-center justify-center text-cyan-900 mr-3">
                <Wind size={20} />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</p>
                <p className="text-sm font-bold text-[#0f2a4a]">System Online</p>
              </div>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Left column (Map + Telemetry Cards) */}
            <div className="xl:col-span-2 space-y-6">
              
              {/* Map View */}
              <div className="relative h-[540px] bg-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <img 
                  src="src/assets/bddashmap.png"
                  alt="Map Aerial View" 
                  className="w-full h-full object-cover"
                />
                
                {/* HUD Overlay */}
                <div className="absolute top-6 left-6 bg-white/80 backdrop-blur-md p-5 rounded-3xl shadow-lg border border-white/20 min-w-[200px]">
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
                  <div className="flex bg-white/90 backdrop-blur rounded-lg shadow-md overflow-hidden">
                    <button className="p-2 hover:bg-slate-100 text-slate-700 transition">
                      <Plus size={20} />
                    </button>
                    <div className="w-px bg-slate-200"></div>
                    <button className="p-2 hover:bg-slate-100 text-slate-700 transition">
                      <Minus size={20} />
                    </button>
                  </div>
                  <button className="p-2 bg-[#005a8d] text-white rounded-lg shadow-md hover:bg-[#004a75] transition">
                    <Crosshair size={20} />
                  </button>
                </div>
              </div>

              {/* Bottom Cards (Wind & Temp) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Wind Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 border-b-4 border-b-[#326978]">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Wind Velocity
                    </h3>
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                      <Wind size={20} />
                    </div>
                  </div>
                  <div className="mb-2">
                    <span className="text-5xl font-bold text-slate-900">24</span>
                    <span className="text-lg font-bold text-slate-700 ml-1">kph</span>
                  </div>
                  <p className="text-sm text-slate-500">Moderate breeze from North-East</p>
                </div>

                {/* Temperature Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 border-b-4 border-b-[#326978]">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Temperature
                    </h3>
                    <div className="w-10 h-10 bg-cyan-200 text-cyan-800 rounded-lg flex items-center justify-center">
                      <Thermometer size={20} />
                    </div>
                  </div>
                  <div className="mb-2">
                    <span className="text-5xl font-bold text-slate-900">25</span>
                    <span className="text-2xl font-bold text-slate-900 ml-1">°C</span>
                  </div>
                  <p className="text-sm text-slate-500">Ambient deck temperature</p>
                </div>

              </div>
            </div>

            {/* Right Column (Sidebar Widgets) */}
            <div className="space-y-6">
              
              {/* Boat Details Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
                {/* Decorative blob top right */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#f0f4f8] rounded-full z-0"></div>
                
                <div className="flex items-center gap-2 mb-6 relative z-10">
                  <div className="w-6 h-6 bg-[#005a8d] text-white rounded-full flex items-center justify-center text-xs">
                    <Info size={14} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Boat Details</h3>
                </div>

                <div className="rounded-xl overflow-hidden mb-6 h-40">
                  <img 
                    src="src/assets/bddash.png" 
                    alt="Fishing Boat" 
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                      Boat Name
                    </p>
                    <p className="text-lg font-bold text-[#005a8d]">Boat A</p>
                  </div>
                  
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                      Boat Reg. No.
                    </p>
                    <p className="text-base font-bold text-slate-900">209934</p>
                  </div>

                  <div className="flex justify-between">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                        Capacity
                      </p>
                      <p className="text-base font-bold text-slate-900">2 Tons</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                        Engine Type
                      </p>
                      <p className="text-base font-bold text-slate-900">25</p>
                    </div>
                  </div>
                </div>

                {/* Fuel Level */}
                <div className="bg-[#f0f4f8] rounded-xl p-4 flex items-center gap-4">
                  <div className="text-orange-200">
                    <Droplet size={24} fill="currentColor" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-[#0f2a4a]">Fuel Level</span>
                      <span className="text-xs font-bold text-slate-900">75%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-[#005a8d] h-2 rounded-full" 
                        style={{ width: '75%' }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-[#e2e8f0] rounded-3xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Quick Actions</h3>
                
                <div className="space-y-3">
                  <button className="w-full bg-[#005a8d] text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#004a75] transition-colors shadow-sm">
                    <Anchor size={18} />
                    Deploy Anchor
                  </button>
                  
                  <button className="w-full bg-white text-slate-900 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-sm border border-slate-200">
                    <span className="text-red-600 font-bold text-xs tracking-widest">SOS</span>
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