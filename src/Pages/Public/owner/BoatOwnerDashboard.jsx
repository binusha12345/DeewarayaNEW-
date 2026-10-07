import React from 'react';
import { 
  Ship, 
  Wrench, 
  Plus, 
  Download, 
  TrendingUp, 
  TrendingDown,
  Minus, 
  Crosshair, 
  Cloud
} from 'lucide-react';
import OwnerSidebar from '../../../components/OwnerSidebar';
import DashboardNav from '../../../components/DashboardNav';
import DashboardPageHeader from '../../../components/DashboardPageHeader';
import { useAuth } from '../../../context/AuthContext';
import { useTranslation } from 'react-i18next';

const BoatOwnerDashboard = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const handleLanguageToggle = () => {
    const newLang = i18n.language === "en" ? "si" : "en";
    i18n.changeLanguage(newLang);
  };

  return (
    <div data-tour="dashboard-overview" className="flex h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
      
      <style>{ownerDashboardStyles}</style> 
      {/* Sidebar */}
      <OwnerSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header Bar */}
        <DashboardNav />

        {/* Dashboard Main Area */}
        <main className="flex-1 overflow-y-auto p-8">

          {/* Language Toggle Button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={handleLanguageToggle}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold rounded-full shadow-md transition-all"
            >
              {i18n.language === "en" ? "🇱🇰 සිංහල" : "🇬🇧 English"}
            </button>
          </div>
          
          <DashboardPageHeader
            eyebrow={t("ownerDashboard.overview")}
            title={t("ownerDashboard.welcome", { name: user?.name || "Owner" })}
            description={t("ownerDashboard.manageFleet")}
            icon={Ship}
            theme="blue"
            action={
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-[16px] font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition cursor-pointer">
                <Download size={16} /> {t("ownerDashboard.downloadReport")}
              </button>
            }
          />

          {/* Key Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <StatCard 
              title={t("ownerDashboard.stats.totalBoats")} 
              value="24" 
              sub={t("ownerDashboard.stats.vessels")} 
            />
            <StatCard 
              title={t("ownerDashboard.stats.activeBoats")} 
              value="5" 
              sub={t("ownerDashboard.stats.live")} 
              indicator="bg-green-500" 
            />
            <StatCard 
              title={t("ownerDashboard.stats.monthlyIncome")} 
              value="$12.4k" 
              sub={<TrendingUp size={14} className="text-green-500 inline ml-1" />} 
            />
            <StatCard 
              title={t("ownerDashboard.stats.monthlyExpenses")} 
              value="$4.2k" 
              sub={<TrendingDown size={14} className="text-red-500 inline ml-1" />} 
            />
            
            {/* Net Profit Card */}
            <div className="bg-gradient-to-br from-blue-900 to-cyan-600 p-5 rounded-xl text-white shadow-lg flex flex-col justify-between">
              <p className="text-[10px] font-bold uppercase text-white/60">
                {t("ownerDashboard.stats.netProfit")}
              </p>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-sm font-medium text-white/60">$</span>
                <span className="text-2xl font-black">8,200</span>
              </div>
            </div>
          </div>

          {/* Map and Side Widgets Row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Map Section */}
            <div className="xl:col-span-2 relative h-[500px] rounded-2xl overflow-hidden shadow-sm">
              <img 
                src="src/assets/bddashmap.png" 
                alt="Ocean Map" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-blue-900/10 mix-blend-multiply"></div>
              
              {/* Floating Info */}
              <div className="absolute top-6 left-6 flex bg-white/90 backdrop-blur rounded-xl shadow-md border border-white/40">
                <div className="p-3 border-r border-slate-200">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                    {t("ownerDashboard.map.currentLocation")}
                  </p>
                  <p className="text-xs font-bold text-slate-900">Andaman Sea, TH</p>
                </div>
                <div className="p-3">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                    {t("ownerDashboard.map.windSpeed")}
                  </p>
                  <p className="text-xs font-bold text-slate-900">12 knots NW</p>
                </div>
              </div>

              {/* Boat Marker */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group">
                <div className="bg-[#0f172a] text-white p-2 rounded-full shadow-xl border-2 border-white">
                  <Ship size={16} />
                </div>
                <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-md shadow-lg mt-2 border border-white/50">
                  <p className="text-[10px] font-bold text-slate-900 whitespace-nowrap">
                    Blue Horizon II
                  </p>
                </div>
              </div>

              {/* Map Controls */}
              <div className="absolute bottom-6 right-6 flex flex-col gap-2">
                <div className="flex flex-col bg-white/90 backdrop-blur rounded-lg shadow-md overflow-hidden">
                  <button className="p-2 hover:bg-slate-100 text-slate-700 transition">
                    <Plus size={18} />
                  </button>
                  <div className="h-px bg-slate-200 mx-1"></div>
                  <button className="p-2 hover:bg-slate-100 text-slate-700 transition">
                    <Minus size={18} />
                  </button>
                </div>
                <button className="p-2 bg-[#0f172a] text-white rounded-lg shadow-md hover:bg-slate-800 transition">
                  <Crosshair size={18} />
                </button>
              </div>
            </div>

            {/* Right Side Widgets */}
            <div className="space-y-6">
              
              {/* Maintenance Required Card */}
              <div className="bg-[#f8fafc] rounded-3xl p-6 border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold text-slate-900">
                    {t("ownerDashboard.maintenance.title")}
                  </h3>
                  <button className="text-[10px] font-bold text-blue-600 uppercase hover:underline">
                    {t("ownerDashboard.maintenance.seeAll")}
                  </button>
                </div>

                <div className="space-y-3">
                  <MaintenanceItem 
                    title="Ocean Queen" 
                    desc={t("ownerDashboard.maintenance.engineOverdue")}
                    tag={t("ownerDashboard.maintenance.urgent")}
                    tagColor="bg-red-50 text-red-600"
                    iconColor="bg-red-100 text-red-600"
                    border="border-l-4 border-l-red-500"
                  />
                  <MaintenanceItem 
                    title="The Mariner" 
                    desc={t("ownerDashboard.maintenance.hullCleaning")}
                    tag={t("ownerDashboard.maintenance.twoDays")}
                    tagColor="bg-slate-100 text-slate-600"
                    iconColor="bg-blue-100 text-blue-600"
                    border="border-l-4 border-l-blue-900"
                    isWrench={false}
                  />
                </div>
              </div>

              {/* Weather Forecast Card */}
              <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-900 rounded-3xl p-6 text-white shadow-4xl">
                <p className="text-[10px] font-bold uppercase text-white/60 tracking-widest mb-1">
                  {t("ownerDashboard.weather.title")}
                </p>

                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold">
                    {t("ownerDashboard.weather.condition")}
                  </h3>
                  <Cloud className="text-white/70" size={32} />
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <span className="text-5xl font-black">28°C</span>
                  <div className="text-[10px] text-white/60 space-y-0.5">
                    <p>{t("ownerDashboard.weather.humidity", { value: 65 })}</p>
                    <p>{t("ownerDashboard.weather.uvIndex")}</p>
                  </div>
                </div>

                <div className="flex justify-between border-t border-white/20 pt-4">
                  <DayForecast day={t("ownerDashboard.weather.days.mon")} temp="31°" />
                  <DayForecast day={t("ownerDashboard.weather.days.tue")} temp="29°" />
                  <DayForecast day={t("ownerDashboard.weather.days.wed")} temp="24°" />
                  <DayForecast day={t("ownerDashboard.weather.days.thu")} temp="32°" />
                </div>
              </div>

            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

// ===============================================
// ✅ Reusable Components (unchanged)
// ===============================================

const StatCard = ({ title, value, sub, indicator }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-tight">
      {title}
    </p>
    <div className="mt-2 flex items-baseline gap-2">
      <h3 className="text-2xl font-black text-slate-900">{value}</h3>
      <div className="flex items-center gap-1">
        {indicator && <div className={`w-1.5 h-1.5 rounded-full ${indicator}`}></div>}
        <span className="text-[10px] font-bold text-slate-500">{sub}</span>
      </div>
    </div>
  </div>
);

const MaintenanceItem = ({ title, desc, tag, tagColor, iconColor, border, isWrench = true }) => (
  <div className={`bg-white p-3 rounded-xl shadow-sm border border-slate-100 ${border} flex items-center justify-between`}>
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColor}`}>
        {isWrench ? (
          <Wrench size={18} /> 
        ) : (
          <div className="p-1 border-2 border-current rounded-md">
            <div className="w-2 h-2 bg-current rounded-sm"></div>
          </div>
        )}
      </div>
      <div>
        <h4 className="text-xs font-bold text-slate-900">{title}</h4>
        <p className="text-[10px] text-slate-400 leading-tight">{desc}</p>
      </div>
    </div>
    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter ${tagColor}`}>
      {tag}
    </span>
  </div>
);

const DayForecast = ({ day, temp }) => (
  <div className="flex flex-col items-center gap-1">
    <span className="text-[8px] font-bold text-slate-500 uppercase">{day}</span>
    <div className="text-slate-300 my-1">
      <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
    </div>
    <span className="text-[10px] font-bold">{temp}</span>
  </div>
);

// ============================================================
// ✅ RESPONSIVE STYLES - Unchanged
// ============================================================

const ownerDashboardStyles = `

  /* ==============================
     BASE - Dashboard foundation
     ============================== */
  .owner-page {
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

    /* Welcome heading */
    main h1 {
      font-size: 1.875rem !important;
    }

    /* Map height */
    main .h-\\[500px\\] {
      height: 400px !important;
    }

    /* Stat cards value */
    main .text-2xl.font-black {
      font-size: 1.5rem !important;
    }

    /* Weather temp */
    main .text-5xl.font-black {
      font-size: 2.75rem !important;
    }

    /* Weather card */
    main .text-lg.font-bold {
      font-size: 1rem !important;
    }

    /* Right widgets */
    main .rounded-3xl.p-6 {
      padding: 1.25rem !important;
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
      font-size: 1.75rem !important;
    }

    main p.text-sm.text-slate-500 {
      font-size: 0.75rem !important;
    }

    /* Map height */
    main .h-\\[500px\\] {
      height: 360px !important;
    }

    /* Map floating info */
    main .absolute.top-6.left-6 {
      top: 0.75rem !important;
      left: 0.75rem !important;
    }

    /* Map controls */
    main .absolute.bottom-6.right-6 {
      bottom: 0.75rem !important;
      right: 0.75rem !important;
    }

    /* Stack xl:grid-cols-3 earlier */
    main .grid.grid-cols-1.xl\\:grid-cols-3 {
      grid-template-columns: 1fr !important;
    }

    /* Stat cards grid */
    main .grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-5 {
      grid-template-columns: repeat(3, 1fr) !important;
    }

    /* Stat card value */
    main .text-2xl.font-black {
      font-size: 1.375rem !important;
    }

    /* Weather temp */
    main .text-5xl.font-black {
      font-size: 2.5rem !important;
    }

    /* Maintenance card */
    main .rounded-3xl.p-6 {
      padding: 1.25rem !important;
    }

    /* Download report button */
    main button.bg-blue-600 {
      font-size: 0.875rem !important;
      padding: 0.5rem 1rem !important;
    }
  }


  /* ==============================
     TABLET (max-width: 768px)
     - Stack layout vertically
     - Compact all sections
     ============================== */
  @media (max-width: 768px) {

    main {
      padding: 1.25rem !important;
    }

    /* Section header */
    main > div:first-child {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 0.875rem !important;
      margin-bottom: 1.5rem !important;
    }

    main h1 {
      font-size: 1.5rem !important;
    }

    main p.text-sm.text-slate-500 {
      font-size: 0.7rem !important;
    }

    /* Download button */
    main button.bg-blue-600 {
      font-size: 0.8125rem !important;
      padding: 0.5rem 0.875rem !important;
    }

    /* Stat cards - 2 columns */
    main .grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-5 {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 0.75rem !important;
      margin-bottom: 1.5rem !important;
    }

    /* Stat card padding */
    main .bg-white.p-5.rounded-xl {
      padding: 1rem !important;
    }

    /* Stat card value */
    main .text-2xl.font-black {
      font-size: 1.375rem !important;
    }

    /* Net profit card */
    main .bg-gradient-to-br.from-blue-900.to-cyan-600.p-5 {
      padding: 1rem !important;
    }

    /* Main grid - single column */
    main .grid.grid-cols-1.xl\\:grid-cols-3 {
      grid-template-columns: 1fr !important;
      gap: 1.25rem !important;
    }

    /* Map height */
    main .h-\\[500px\\] {
      height: 300px !important;
      border-radius: 1rem !important;
    }

    /* Map floating info */
    main .absolute.top-6.left-6 {
      top: 0.625rem !important;
      left: 0.625rem !important;
    }

    main .absolute.top-6.left-6 p.text-\\[10px\\] {
      font-size: 0.55rem !important;
    }

    main .absolute.top-6.left-6 p.text-xs {
      font-size: 0.6875rem !important;
    }

    /* Map controls */
    main .absolute.bottom-6.right-6 {
      bottom: 0.625rem !important;
      right: 0.625rem !important;
    }

    /* Maintenance card */
    main .rounded-3xl.p-6 {
      padding: 1.25rem !important;
      border-radius: 1.25rem !important;
    }

    /* Weather temp */
    main .text-5xl.font-black {
      font-size: 2.25rem !important;
    }

    /* Weather card */
    main .text-lg.font-bold {
      font-size: 0.9375rem !important;
    }

    /* Day forecast text */
    main .text-\\[8px\\] {
      font-size: 0.5625rem !important;
    }

    main .text-\\[10px\\].font-bold {
      font-size: 0.625rem !important;
    }

    /* Space-y-6 */
    main .space-y-6 > * + * {
      margin-top: 1rem !important;
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

    /* Stat cards - 2 cols */
    main .grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-5 {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 0.625rem !important;
    }

    /* Stat card */
    main .bg-white.p-5.rounded-xl {
      padding: 0.875rem !important;
    }

    main .text-2xl.font-black {
      font-size: 1.25rem !important;
    }

    /* Map */
    main .h-\\[500px\\] {
      height: 260px !important;
      border-radius: 0.875rem !important;
    }

    /* Map floating info padding */
    main .absolute.top-6.left-6 .p-3 {
      padding: 0.5rem !important;
    }

    /* Maintenance item */
    main .bg-white.p-3.rounded-xl {
      padding: 0.625rem !important;
    }

    /* Maintenance icon */
    main .w-10.h-10.rounded-lg {
      width: 2rem !important;
      height: 2rem !important;
    }

    /* Weather card padding */
    main .rounded-3xl.p-6 {
      padding: 1rem !important;
    }

    /* Weather temp */
    main .text-5xl.font-black {
      font-size: 2rem !important;
    }

    /* Quick actions sections below */
    main .mt-8 {
      margin-top: 1.25rem !important;
    }

    /* Quick action buttons grid */
    main .mt-8.grid.grid-cols-2.sm\\:grid-cols-4 {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 0.75rem !important;
    }

    /* Fleet table font */
    main table th {
      font-size: 0.55rem !important;
      padding: 0.5rem !important;
    }

    main table td {
      font-size: 0.6875rem !important;
      padding: 0.625rem 0.5rem !important;
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

    /* Stat cards - stack to 1 col */
    main .grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-5 {
      grid-template-columns: 1fr 1fr !important;
      gap: 0.5rem !important;
    }

    /* Stat card */
    main .bg-white.p-5.rounded-xl {
      padding: 0.75rem !important;
      border-radius: 0.75rem !important;
    }

    main .text-2xl.font-black {
      font-size: 1.125rem !important;
    }

    /* Map */
    main .h-\\[500px\\] {
      height: 220px !important;
    }

    /* Map floating info */
    main .absolute.top-6.left-6 {
      top: 0.375rem !important;
      left: 0.375rem !important;
    }

    main .absolute.top-6.left-6 .p-3 {
      padding: 0.375rem !important;
    }

    /* Weather temp */
    main .text-5xl.font-black {
      font-size: 1.75rem !important;
    }

    /* Weather card padding */
    main .rounded-3xl.p-6 {
      padding: 0.875rem !important;
      border-radius: 1rem !important;
    }

    /* Maintenance card */
    main .text-sm.font-bold.text-slate-900 {
      font-size: 0.75rem !important;
    }

    /* Fleet table - hide some columns */
    main table th:nth-child(3),
    main table td:nth-child(3) {
      display: none !important;
    }

    /* Activity feed */
    main .divide-y > div {
      padding: 0.75rem 1rem !important;
    }

    /* Top performing bars */
    main .w-20 {
      width: 3rem !important;
    }

    /* Space-y-6 */
    main .space-y-6 > * + * {
      margin-top: 0.875rem !important;
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

    /* Stat cards */
    main .bg-white.p-5.rounded-xl {
      padding: 0.625rem !important;
    }

    main .text-2xl.font-black {
      font-size: 1rem !important;
    }

    /* Map */
    main .h-\\[500px\\] {
      height: 190px !important;
    }

    /* Weather temp */
    main .text-5xl.font-black {
      font-size: 1.5rem !important;
    }

    /* Weather card */
    main .rounded-3xl.p-6 {
      padding: 0.75rem !important;
    }

    /* Fleet table - hide more columns */
    main table th:nth-child(4),
    main table td:nth-child(4) {
      display: none !important;
    }

    /* Quick action buttons */
    main .mt-8.grid.grid-cols-2.sm\\:grid-cols-4 {
      grid-template-columns: 1fr 1fr !important;
      gap: 0.5rem !important;
    }

    /* Activity feed items */
    main .divide-y > div {
      padding: 0.625rem 0.75rem !important;
      gap: 0.625rem !important;
    }

    /* Space adjustments */
    main .space-y-6 > * + * {
      margin-top: 0.75rem !important;
    }

    main .mt-8 {
      margin-top: 1rem !important;
    }
  }


  /* ==============================
     ANIMATIONS
     ============================== */
  @keyframes ownerDashFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0);   }
  }

  main {
    animation: ownerDashFadeIn 0.3s ease forwards;
  }
`;

export default BoatOwnerDashboard;