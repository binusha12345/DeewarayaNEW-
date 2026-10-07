import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Wrench,
  ArrowRight,
  Home,
  ShieldCheck,
  Boxes,
  Settings,
  LogOut,
} from "lucide-react";
import OwnerSidebar from "../../../components/OwnerSidebar";
import DashboardNav from "../../../components/DashboardNav";
import DashboardPageHeader from "../../../components/DashboardPageHeader";
import engine5 from "../../../assets/engine5.png";
import bodyparts5 from "../../../assets/bodyparts5.png";
import spareparts5 from "../../../assets/spareparts5.png";

const Maintenance = () => {
  const navigate = useNavigate();

  const maintenanceCards = [
    {
      title: "Engine",
      subtitle: "Monitor propulsion performance, fuel efficiency",
      //badge: "DIAGNOSTICS ACTIVE",
      image: engine5,     
      buttonText: "Inspect Module",
      route: "/maintenance/engine",
    },
    {
      title: "Body Parts",
      subtitle: "Manage hull maintenance, deck fittings",
      //badge: "STRUCTURAL INTEGRITY",
      image: bodyparts5,
      buttonText: "View Components",
      route: "/maintenance/body-parts",
    },
    {
      title: "Spare Parts",
      subtitle: "Real-time inventory tracking for gaskets, filters, pumps",
      //badge: "INVENTORY CONTROL",
      image: spareparts5, 
      buttonText: "Access Warehouse",
      route: "/maintenance/spare-parts",
    },
  ];

  return (
    <div data-tour="maintenance-page" className="flex h-screen bg-[#f8fafc] font-sans text-slate-800 overflow-hidden">

      <style>{maintenanceStyles}</style>
      {/* Sidebar */}
      <OwnerSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Nav */}
        <DashboardNav />

        {/* Page Body */}
        <main className="flex-1 min-h-0 overflow-y-auto px-2 lg:px-2 py-8">
          <div className="mx-auto max-w-6xl">
            <DashboardPageHeader
              eyebrow="Vessel care"
              title="Maintenance & Repair"
              description="Find the right maintenance area and keep your fleet ready for the water."
              icon={Wrench}
              theme="amber"
            />
          </div>

          {/* Top Cards */}
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {maintenanceCards.slice(0, 2).map((card, index) => (
              <div
                key={index}
                className="relative overflow-hidden rounded-2xl min-h-[420px] shadow-md group"
              >
                <img 
                  src={card.image}
                  alt={card.title}
                  className="absolute inset-0  object-fit transition-transform duration-500 group-hover:scale-105"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-950/85 via-blue-950/35 to-transparent"></div>

                <div className="relative z-10 h-full flex flex-col justify-end p-6 lg:p-8 text-white">
                  

                  <h2 className="text-3xl font-bold ">{card.title}</h2>

                  <p className="text-[16px] text-slate-100/90 max-w-md leading-relaxed mb-6">
                    {card.subtitle}
                  </p>

                  <button
                    onClick={() => navigate(card.route)}
                    className=" inline-flex items-center gap-2 w-fit 
                    px-6 py-2 rounded-xl 
                    bg-blue-700 text-white font-semibold 
                    shadow-lg shadow-blue-900/30
                    hover:bg-blue-800 hover:scale-105 
                    transition-all duration-300 cursor-pointer"
                  >
                    {card.buttonText}
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Spare Parts Wide Card */}
          <div className="max-w-4xl mx-auto mt-6">
            <div className="relative overflow-hidden rounded-2xl min-h-[280px] bg-white shadow-md flex flex-col lg:flex-row">
              {/* Text side */}
              <div className="lg:w-1/2 p-8 lg:p-10 flex flex-col justify-center bg-[#f7f9fc]">
                

                <h2 className="text-4xl font-bold text-slate-900 leading-tight max-w-md">
                  Spare Parts
                </h2>

                <p className="mt-4 text-slate-600 text-lg max-w-md leading-relaxed">
                  Real-time inventory tracking for gaskets, filters, pumps, and mission-critical hardware.
                </p>

                <button
                  onClick={() => navigate("/maintenance/spare-parts")}
                  className="mt-8 inline-flex items-center gap-2 w-fit 
                  px-6 py-2 rounded-xl 
                  bg-blue-700 text-white font-semibold 
                  shadow-lg shadow-blue-900/30
                  hover:bg-blue-800 hover:scale-105 
                  transition-all duration-300  cursor-pointer"
                >
                  Access Warehouse
                  <Home size={16} />
                </button>
              </div>

              {/* Image side */}
              <div className="lg:w-1/2 relative min-h-[240px]">
                <img
                  src={spareparts5}
                  alt="Spare Parts"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-white/20 via-transparent to-transparent"></div>
              </div>
            </div>
          </div>

          {/* Promo Banner */}

        </main>
      </div>
    </div>
  );
};


// ============================================================
// ✅ RESPONSIVE STYLES - Proper & Clean
// ============================================================

const maintenanceStyles = `

  /* ==============================
     BASE - Page foundation
     ============================== */


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
      padding-top: 1.75rem !important;
      padding-bottom: 1.75rem !important;
    }

    /* Page header */
    main h1 {
      font-size: 1.875rem !important;
    }

    /* Top cards grid gap */
    main .max-w-4xl.mx-auto.grid {
      gap: 1.25rem !important;
    }

    /* Top cards min-height */
    main .min-h-\\[420px\\] {
      min-height: 380px !important;
    }

    /* Card text */
    main .text-3xl.font-bold {
      font-size: 1.625rem !important;
    }

    main .text-\\[16px\\].text-slate-100\\/90 {
      font-size: 0.875rem !important;
    }

    /* Card button */
    main .bg-blue-700.text-white.font-semibold {
      padding: 0.5rem 1.25rem !important;
      font-size: 0.875rem !important;
    }

    /* Spare parts card */
    main .min-h-\\[280px\\] {
      min-height: 240px !important;
    }

    main .text-4xl.font-bold {
      font-size: 2rem !important;
    }

    main .text-lg {
      font-size: 0.9375rem !important;
    }

    /* Spare parts card padding */
    main .p-8.lg\\:p-10 {
      padding: 1.75rem !important;
    }
  }


  /* ==============================
     SMALL LAPTOP (max-width: 1024px)
     ============================== */
  @media (max-width: 1024px) {

    main {
      padding-top: 1.5rem !important;
      padding-bottom: 1.5rem !important;
      padding-left: 1rem !important;
      padding-right: 1rem !important;
    }

    /* Header */
    main .max-w-6xl.mx-auto.mb-8 {
      margin-bottom: 1.5rem !important;
    }

    main h1 {
      font-size: 1.75rem !important;
    }

    main .text-xs.tracking-\\[0\\.3em\\] {
      font-size: 0.5625rem !important;
    }

    /* Top cards */
    main .max-w-4xl.mx-auto.grid {
      max-width: 100% !important;
      gap: 1rem !important;
    }

    main .min-h-\\[420px\\] {
      min-height: 340px !important;
    }

    /* Card inner padding */
    main .p-6.lg\\:p-8 {
      padding: 1.25rem !important;
    }

    main .text-3xl.font-bold {
      font-size: 1.5rem !important;
    }

    main .text-\\[16px\\].text-slate-100\\/90 {
      font-size: 0.8125rem !important;
      margin-bottom: 1rem !important;
    }

    /* Spare parts card */
    main .max-w-4xl.mx-auto.mt-6 {
      max-width: 100% !important;
    }

    main .min-h-\\[280px\\] {
      min-height: 220px !important;
    }

    main .text-4xl.font-bold {
      font-size: 1.875rem !important;
    }

    main .text-lg {
      font-size: 0.875rem !important;
    }

    /* Spare parts text padding */
    main .p-8.lg\\:p-10 {
      padding: 1.5rem !important;
    }

    /* Spare parts button margin */
    main .mt-8.inline-flex {
      margin-top: 1.25rem !important;
    }
  }


  /* ==============================
     TABLET (max-width: 768px)
     - Stack layout
     - Compact cards
     ============================== */
  @media (max-width: 768px) {

    main {
      padding: 1.25rem 0.875rem !important;
    }

    /* Header */
    main .max-w-6xl.mx-auto.mb-8 {
      margin-bottom: 1.25rem !important;
      padding: 0 0.25rem !important;
    }

    main h1 {
      font-size: 1.5rem !important;
      line-height: 1.3 !important;
    }

    main .flex.items-center.gap-2.text-blue-900 {
      font-size: 0.5rem !important;
    }

    /* Top cards grid - 1 column */
    main .max-w-4xl.mx-auto.grid {
      grid-template-columns: 1fr !important;
      gap: 1rem !important;
    }

    /* Top card min-height */
    main .min-h-\\[420px\\] {
      min-height: 300px !important;
      border-radius: 1rem !important;
    }

    /* Card inner padding */
    main .p-6.lg\\:p-8 {
      padding: 1.125rem !important;
    }

    /* Card title */
    main .text-3xl.font-bold {
      font-size: 1.375rem !important;
    }

    /* Card subtitle */
    main .text-\\[16px\\].text-slate-100\\/90 {
      font-size: 0.75rem !important;
      margin-bottom: 0.875rem !important;
    }

    /* Card button */
    main .bg-blue-700.text-white.font-semibold {
      padding: 0.5rem 1rem !important;
      font-size: 0.8125rem !important;
      border-radius: 0.75rem !important;
    }

    /* Spare parts card */
    main .max-w-4xl.mx-auto.mt-6 {
      margin-top: 1rem !important;
    }

    main .min-h-\\[280px\\] {
      min-height: auto !important;
      border-radius: 1rem !important;
    }

    /* Spare parts - stack vertically */
    main .flex.flex-col.lg\\:flex-row {
      flex-direction: column !important;
    }

    /* Spare parts text side */
    main .lg\\:w-1\\/2.p-8.lg\\:p-10 {
      width: 100% !important;
      padding: 1.25rem !important;
    }

    /* Spare parts image side */
    main .lg\\:w-1\\/2.relative.min-h-\\[240px\\] {
      width: 100% !important;
      min-height: 180px !important;
    }

    main .text-4xl.font-bold {
      font-size: 1.625rem !important;
    }

    main .text-lg {
      font-size: 0.8125rem !important;
      margin-top: 0.5rem !important;
    }

    /* Spare parts button */
    main .mt-8.inline-flex {
      margin-top: 1rem !important;
      padding: 0.5rem 1rem !important;
      font-size: 0.8125rem !important;
    }
  }


  /* ==============================
     MOBILE (max-width: 640px)
     ============================== */
  @media (max-width: 640px) {

    main {
      padding: 1rem 0.75rem !important;
    }

    /* Header */
    main .max-w-6xl.mx-auto.mb-8 {
      margin-bottom: 1rem !important;
    }

    main h1 {
      font-size: 1.375rem !important;
    }

    /* Top cards */
    main .min-h-\\[420px\\] {
      min-height: 260px !important;
      border-radius: 0.875rem !important;
    }

    /* Card inner */
    main .p-6.lg\\:p-8 {
      padding: 1rem !important;
    }

    main .text-3xl.font-bold {
      font-size: 1.25rem !important;
    }

    main .text-\\[16px\\].text-slate-100\\/90 {
      font-size: 0.6875rem !important;
      margin-bottom: 0.75rem !important;
    }

    /* Card button */
    main .bg-blue-700.text-white.font-semibold {
      padding: 0.4375rem 0.875rem !important;
      font-size: 0.75rem !important;
      gap: 0.375rem !important;
    }

    /* Spare parts card */
    main .max-w-4xl.mx-auto.mt-6 {
      margin-top: 0.875rem !important;
    }

    /* Spare parts text */
    main .lg\\:w-1\\/2.p-8.lg\\:p-10 {
      padding: 1rem !important;
    }

    main .text-4xl.font-bold {
      font-size: 1.5rem !important;
    }

    main .text-lg {
      font-size: 0.75rem !important;
    }

    /* Spare parts image */
    main .lg\\:w-1\\/2.relative.min-h-\\[240px\\] {
      min-height: 160px !important;
    }

    /* Spare parts button */
    main .mt-8.inline-flex {
      margin-top: 0.875rem !important;
      padding: 0.4375rem 0.875rem !important;
      font-size: 0.75rem !important;
      border-radius: 0.75rem !important;
    }
  }


  /* ==============================
     SMALL MOBILE (max-width: 480px)
     ============================== */
  @media (max-width: 480px) {

    main {
      padding: 0.875rem 0.625rem !important;
    }

    main h1 {
      font-size: 1.25rem !important;
    }

    /* Top cards */
    main .min-h-\\[420px\\] {
      min-height: 240px !important;
      border-radius: 0.75rem !important;
    }

    main .p-6.lg\\:p-8 {
      padding: 0.875rem !important;
    }

    main .text-3xl.font-bold {
      font-size: 1.125rem !important;
    }

    main .text-\\[16px\\].text-slate-100\\/90 {
      font-size: 0.625rem !important;
      margin-bottom: 0.625rem !important;
    }

    /* Card button */
    main .bg-blue-700.text-white.font-semibold {
      padding: 0.375rem 0.75rem !important;
      font-size: 0.6875rem !important;
    }

    /* Spare parts */
    main .lg\\:w-1\\/2.p-8.lg\\:p-10 {
      padding: 0.875rem !important;
    }

    main .text-4xl.font-bold {
      font-size: 1.375rem !important;
    }

    main .text-lg {
      font-size: 0.6875rem !important;
    }

    /* Spare parts image */
    main .lg\\:w-1\\/2.relative.min-h-\\[240px\\] {
      min-height: 140px !important;
    }

    /* Spare parts button */
    main .mt-8.inline-flex {
      margin-top: 0.75rem !important;
      padding: 0.375rem 0.75rem !important;
      font-size: 0.6875rem !important;
    }

    /* Grid gap */
    main .max-w-4xl.mx-auto.grid {
      gap: 0.75rem !important;
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

    /* Header badge */
    main .flex.items-center.gap-2.text-blue-900 {
      font-size: 0.4375rem !important;
      gap: 0.25rem !important;
    }

    /* Top cards */
    main .min-h-\\[420px\\] {
      min-height: 200px !important;
    }

    main .p-6.lg\\:p-8 {
      padding: 0.75rem !important;
    }

    main .text-3xl.font-bold {
      font-size: 1rem !important;
    }

    main .text-\\[16px\\].text-slate-100\\/90 {
      font-size: 0.5625rem !important;
      margin-bottom: 0.5rem !important;
    }

    /* Card button */
    main .bg-blue-700.text-white.font-semibold {
      padding: 0.3125rem 0.625rem !important;
      font-size: 0.625rem !important;
      border-radius: 0.625rem !important;
    }

    /* Spare parts */
    main .text-4xl.font-bold {
      font-size: 1.25rem !important;
    }

    main .text-lg {
      font-size: 0.625rem !important;
    }

    main .lg\\:w-1\\/2.relative.min-h-\\[240px\\] {
      min-height: 120px !important;
    }

    main .mt-8.inline-flex {
      margin-top: 0.625rem !important;
      padding: 0.3125rem 0.625rem !important;
      font-size: 0.625rem !important;
    }

    main .max-w-4xl.mx-auto.grid {
      gap: 0.625rem !important;
    }

    main .max-w-4xl.mx-auto.mt-6 {
      margin-top: 0.625rem !important;
    }
  }


  /* ==============================
     ANIMATIONS
     ============================== */
  @keyframes maintenanceFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0);   }
  }

  @keyframes cardReveal {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0);    }
  }

  main {
    animation: maintenanceFadeIn 0.3s ease forwards;
  }

  /* Staggered card animations */
  main .grid > div:nth-child(1) {
    animation: cardReveal 0.35s ease 0.05s both;
  }

  main .grid > div:nth-child(2) {
    animation: cardReveal 0.35s ease 0.12s both;
  }

  main .max-w-4xl.mx-auto.mt-6 > div {
    animation: cardReveal 0.35s ease 0.18s both;
  }

  /* Card hover lift */
  main .min-h-\\[420px\\],
  main .min-h-\\[280px\\] {
    transition: transform 0.25s ease, box-shadow 0.25s ease;
  }

  main .min-h-\\[420px\\]:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 40px rgba(0,0,0,0.14) !important;
  }

  main .min-h-\\[280px\\]:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 32px rgba(0,0,0,0.10) !important;
  }
`;

export default Maintenance;