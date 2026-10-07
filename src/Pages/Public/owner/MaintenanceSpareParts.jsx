import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Info,
  Clock3,
  MapPin,
  Phone,
  Settings,
  Wrench,
  AlertCircle,
  History,
  Box,
} from "lucide-react";

import OwnerSidebar from "../../../components/OwnerSidebar";
import DashboardNav from "../../../components/DashboardNav";
import DashboardPageHeader from "../../../components/DashboardPageHeader";

// Local assets

import francisImg from "../../../assets/francis.webp";
import kandjImg from "../../../assets/k and j.webp";
import WINWAYImg from "../../../assets/WINWAY.webp";

const MaintenanceSpareParts = () => {
  const navigate = useNavigate();

  const spareProviders = [
    {
      id: 1,
      name: "Francis Enterprises (Pvt) Ltd",
      address: "362 Old Galle Rd, Panadur",
      phone: "0779985961",
      action: "Call Now",
      mapUrl: "https://www.google.com/maps/place/Francis+Enterprises+(Pvt)+Ltd/@6.9397118,79.8529603,17z/data=!3m1!4b1!4m6!3m5!1s0x3ae25949e3e77a5b:0x8f8bc48a2422224!8m2!3d6.9397118!4d79.8529603!16s%2Fg%2F11h06whw3f?entry=ttu&g_ep=EgoyMDI2MDYxNi4wIKXMDSoASAFQAw%3D%3D",
      image: francisImg,
    },
    {
      id: 2,
      name: "K and J Marine Traders",
      address: "no 13 4th cross St, Ambalangoda 80300",
      phone: "0912259627",
      action: "Call Now",
      mapUrl: "https://www.google.com/maps?vet=10CAAQoqAOahcKEwiI7fXs3JKVAxUAAAAAHQAAAAAQCA..i&sca_esv=c1fae25c624776a2&udm=1&pvq=CgwvZy8xaG00NzZqdGs&lqi=ChtmaXNoaW5nIGJvYXQgcmVwYWlyIG5lYXIgbWVIsYbNw8yPgIAIWikQABABEAIYARgDGAQiG2Zpc2hpbmcgYm9hdCByZXBhaXIgbmVhciBtZZIBDWZpc2hpbmdfc3RvcmU&fvr=1&cs=0&um=1&ie=UTF-8&fb=1&gl=lk&sa=X&ftid=0x3ae1818278bcb447:0xcbeac90801df40d8",
      image: kandjImg,
    },
    {
      id: 3,
      name: "WINWAY MARINE POWER (PVT) LTD.",
      address: "117/D , ASELA GARDENS, GANEARAMBA, Beruwala 12070",
      phone: "0715330330",
      action: "Call Now",
      mapUrl: "https://www.google.com/maps/place/WINWAY+MARINE+POWER+(PVT)+LTD./@6.4721947,79.9807552,17z/data=!3m1!4b1!4m6!3m5!1s0x3ae22fa5d9f5fbb5:0xb383897c4bf3e986!8m2!3d6.4721947!4d79.9807552!16s%2Fg%2F11h08j1_xc?entry=ttu&g_ep=EgoyMDI2MDYxNi4wIKXMDSoASAFQAw%3D%3D",
      image: WINWAYImg,
    },
  ];

const openGoogleMaps = (provider) => {
  window.open(provider.mapUrl, "_blank", "noopener,noreferrer");
};

  return (
    <div className="flex h-screen bg-[#f5f7fb] text-slate-800 ">

       <style>{sparePartsStyles}</style> 
      {/* Sidebar */}
      <OwnerSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col ">
        {/* Top Navbar */}
        <DashboardNav />

        <main className="flex-1 px-6 lg:px-10 py-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <DashboardPageHeader
              eyebrow="Maintenance console"
              title="Spare Parts"
              description="Find parts suppliers for repairs and keep essential components within reach."
              icon={Box}
              theme="orange"
            />

            {/* Provider Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {spareProviders.map((provider) => (
                <div
                  key={provider.id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  {/* Image */}
                  <div className="relative h-50 overflow-hidden">
                    <img
                      src={provider.image}
                      alt={provider.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />

                    <div className="absolute top-4 right-4 bg-teal-700 text-white text-[11px] font-bold px-3 py-1 rounded-full">
                      Open 24 hours
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-6">
                    <h3 className="text-[18px] font-semibold text-slate-900 leading-tight mb-5">
                      {provider.name}
                    </h3>

                    <div className="space-y-4 text-slate-700">
                      <div className="flex gap-3">
                        <MapPin className="text-blue-500" size={24} />
                        <p className="leading-relaxed text-[14px]">{provider.address}</p>
                      </div>

                      <div className="flex gap-3 font-bold">
                        <Phone className="text-blue-500 shrink-0 mt-0.5" size={24} />
                        <p className="text-[14px]">{provider.phone}</p>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
                      <button
                        onClick={() => openGoogleMaps(provider)}
                        className="flex-1 bg-blue-800 text-white font-semibold py-2 rounded-xl hover:bg-blue-900 transition cursor-pointer"
                      >
                        View Location
                      
                      </button>

                    </div>
                  </div>
                </div>
              ))}
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

const sparePartsStyles = `

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
      padding-left: 1.5rem !important;
      padding-right: 1.5rem !important;
      padding-top: 1.75rem !important;
      padding-bottom: 1.75rem !important;
    }

    /* Page heading */
    main h1 {
      font-size: 1.875rem !important;
    }

    main p.text-slate-700 {
      font-size: 0.9375rem !important;
    }

    /* Header margin */
    main .mb-10 {
      margin-bottom: 2rem !important;
    }

    /* Section title */
    main h2.text-3xl.font-bold {
      font-size: 1.75rem !important;
    }

    /* Section title margin */
    main .mb-6 {
      margin-bottom: 1.25rem !important;
    }

    /* Cards grid gap */
    main .grid.grid-cols-1.md\\:grid-cols-2.xl\\:grid-cols-3 {
      gap: 1.5rem !important;
    }

    /* Card provider name */
    main h3.text-\\[18px\\] {
      font-size: 1rem !important;
    }

    /* Card details text */
    main .text-\\[14px\\] {
      font-size: 0.8125rem !important;
    }

    /* Card padding */
    main .p-6 {
      padding: 1.25rem !important;
    }

    /* View location button */
    main .bg-blue-800.text-white.font-semibold {
      padding: 0.5rem !important;
      font-size: 0.875rem !important;
    }

    /* Blue accent bar */
    main .w-2.h-10 {
      height: 2.25rem !important;
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

    /* Header */
    main .mb-10 {
      margin-bottom: 1.5rem !important;
    }

    main h1 {
      font-size: 1.75rem !important;
    }

    main p.text-slate-700 {
      font-size: 0.875rem !important;
      margin-top: 0.5rem !important;
    }

    main .text-xs.tracking-\\[0\\.28em\\] {
      font-size: 0.5625rem !important;
    }

    /* Section title */
    main h2.text-3xl.font-bold {
      font-size: 1.5rem !important;
    }

    /* Blue accent bar */
    main .w-2.h-10 {
      height: 2rem !important;
      width: 0.375rem !important;
    }

    /* Cards grid - 2 cols */
    main .grid.grid-cols-1.md\\:grid-cols-2.xl\\:grid-cols-3 {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 1.25rem !important;
    }

    /* Card image */
    main .relative.h-50 {
      height: 10rem !important;
    }

    /* Card badge */
    main .absolute.top-4.right-4 {
      font-size: 0.5625rem !important;
      padding: 0.25rem 0.625rem !important;
      top: 0.5rem !important;
      right: 0.5rem !important;
    }

    /* Card padding */
    main .p-6 {
      padding: 1.125rem !important;
    }

    /* Card provider name */
    main h3.text-\\[18px\\] {
      font-size: 0.9375rem !important;
      margin-bottom: 0.75rem !important;
    }

    /* Card detail icons */
    main .space-y-4 svg {
      width: 1.125rem !important;
      height: 1.125rem !important;
    }

    /* Card detail space */
    main .space-y-4 {
      gap: 0.75rem !important;
    }

    /* Card details text */
    main .text-\\[14px\\] {
      font-size: 0.75rem !important;
    }

    /* Card footer */
    main .mt-8.pt-6 {
      margin-top: 1rem !important;
      padding-top: 0.875rem !important;
    }

    /* View location button */
    main .bg-blue-800.text-white.font-semibold {
      padding: 0.4375rem !important;
      font-size: 0.8125rem !important;
      border-radius: 0.75rem !important;
    }
  }


  /* ==============================
     TABLET (max-width: 768px)
     - 2 column cards
     - Compact details
     ============================== */
  @media (max-width: 768px) {

    main {
      padding: 1.25rem 1rem !important;
    }

    /* Header */
    main .mb-10 {
      margin-bottom: 1.25rem !important;
    }

    main h1 {
      font-size: 1.5rem !important;
      line-height: 1.3 !important;
    }

    main p.text-slate-700 {
      font-size: 0.75rem !important;
      margin-top: 0.375rem !important;
    }

    main .text-xs.tracking-\\[0\\.28em\\] {
      font-size: 0.5rem !important;
      margin-bottom: 0.5rem !important;
    }

    /* Section title row */
    main .flex.items-center.gap-3.mb-6 {
      margin-bottom: 1rem !important;
      gap: 0.5rem !important;
    }

    main h2.text-3xl.font-bold {
      font-size: 1.375rem !important;
    }

    /* Blue accent bar */
    main .w-2.h-10 {
      width: 0.3rem !important;
      height: 1.75rem !important;
      border-radius: 9999px !important;
    }

    /* Cards grid - 2 cols */
    main .grid.grid-cols-1.md\\:grid-cols-2.xl\\:grid-cols-3 {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 1rem !important;
    }

    /* Card rounded */
    main .rounded-2xl {
      border-radius: 1rem !important;
    }

    /* Card image */
    main .relative.h-50 {
      height: 9rem !important;
    }

    /* Card badge */
    main .absolute.top-4.right-4 {
      top: 0.5rem !important;
      right: 0.5rem !important;
      font-size: 0.5rem !important;
      padding: 0.2rem 0.5rem !important;
    }

    /* Card padding */
    main .p-6 {
      padding: 1rem !important;
    }

    /* Provider name */
    main h3.text-\\[18px\\] {
      font-size: 0.875rem !important;
      margin-bottom: 0.625rem !important;
    }

    /* Details */
    main .space-y-4 {
      gap: 0.625rem !important;
    }

    main .space-y-4 svg {
      width: 1rem !important;
      height: 1rem !important;
    }

    main .text-\\[14px\\] {
      font-size: 0.6875rem !important;
    }

    /* Card footer */
    main .mt-8.pt-6 {
      margin-top: 0.875rem !important;
      padding-top: 0.75rem !important;
    }

    /* View location button */
    main .bg-blue-800.text-white.font-semibold {
      padding: 0.4375rem !important;
      font-size: 0.75rem !important;
      border-radius: 0.75rem !important;
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

    main p.text-slate-700 {
      font-size: 0.6875rem !important;
    }

    /* Cards grid - 1 col */
    main .grid.grid-cols-1.md\\:grid-cols-2.xl\\:grid-cols-3 {
      grid-template-columns: 1fr !important;
      gap: 0.875rem !important;
    }

    /* Card image */
    main .relative.h-50 {
      height: 11rem !important;
    }

    /* Card badge */
    main .absolute.top-4.right-4 {
      font-size: 0.5625rem !important;
      padding: 0.25rem 0.625rem !important;
    }

    /* Card padding */
    main .p-6 {
      padding: 1.125rem !important;
    }

    /* Provider name */
    main h3.text-\\[18px\\] {
      font-size: 1rem !important;
      margin-bottom: 0.875rem !important;
    }

    /* Details */
    main .space-y-4 svg {
      width: 1.125rem !important;
      height: 1.125rem !important;
    }

    main .text-\\[14px\\] {
      font-size: 0.75rem !important;
    }

    /* Card footer */
    main .mt-8.pt-6 {
      margin-top: 1rem !important;
      padding-top: 0.875rem !important;
    }

    /* View button */
    main .bg-blue-800.text-white.font-semibold {
      padding: 0.5rem !important;
      font-size: 0.8125rem !important;
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

    main p.text-slate-700 {
      font-size: 0.625rem !important;
    }

    /* Section title */
    main h2.text-3xl.font-bold {
      font-size: 1.25rem !important;
    }

    /* Blue accent bar */
    main .w-2.h-10 {
      width: 0.25rem !important;
      height: 1.5rem !important;
    }

    /* Cards gap */
    main .grid.grid-cols-1.md\\:grid-cols-2.xl\\:grid-cols-3 {
      gap: 0.75rem !important;
    }

    /* Card image */
    main .relative.h-50 {
      height: 10rem !important;
    }

    /* Card padding */
    main .p-6 {
      padding: 1rem !important;
    }

    /* Provider name */
    main h3.text-\\[18px\\] {
      font-size: 0.9375rem !important;
      margin-bottom: 0.75rem !important;
    }

    /* Details */
    main .text-\\[14px\\] {
      font-size: 0.6875rem !important;
    }

    main .space-y-4 {
      gap: 0.5rem !important;
    }

    /* Card footer */
    main .mt-8.pt-6 {
      margin-top: 0.875rem !important;
      padding-top: 0.75rem !important;
    }

    /* View button */
    main .bg-blue-800.text-white.font-semibold {
      font-size: 0.75rem !important;
      padding: 0.4375rem !important;
      border-radius: 0.625rem !important;
    }

    /* Header mb */
    main .mb-10 {
      margin-bottom: 1rem !important;
    }

    /* Section mb */
    main .flex.items-center.gap-3.mb-6 {
      margin-bottom: 0.875rem !important;
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

    main p.text-slate-700 {
      font-size: 0.5625rem !important;
    }

    /* Section title */
    main h2.text-3xl.font-bold {
      font-size: 1.125rem !important;
    }

    /* Blue accent bar */
    main .w-2.h-10 {
      width: 0.25rem !important;
      height: 1.25rem !important;
    }

    /* Card image */
    main .relative.h-50 {
      height: 9rem !important;
    }

    /* Card badge */
    main .absolute.top-4.right-4 {
      font-size: 0.4375rem !important;
      padding: 0.15rem 0.4rem !important;
      top: 0.375rem !important;
      right: 0.375rem !important;
    }

    /* Card padding */
    main .p-6 {
      padding: 0.875rem !important;
    }

    /* Provider name */
    main h3.text-\\[18px\\] {
      font-size: 0.875rem !important;
      margin-bottom: 0.5rem !important;
    }

    /* Details */
    main .text-\\[14px\\] {
      font-size: 0.625rem !important;
    }

    main .space-y-4 svg {
      width: 0.875rem !important;
      height: 0.875rem !important;
    }

    /* Card footer */
    main .mt-8.pt-6 {
      margin-top: 0.75rem !important;
      padding-top: 0.625rem !important;
    }

    /* View button */
    main .bg-blue-800.text-white.font-semibold {
      font-size: 0.6875rem !important;
      padding: 0.375rem !important;
    }

    /* Header mb */
    main .mb-10 {
      margin-bottom: 0.875rem !important;
    }

    /* Section mb */
    main .flex.items-center.gap-3.mb-6 {
      margin-bottom: 0.75rem !important;
    }

    /* Cards gap */
    main .grid.grid-cols-1.md\\:grid-cols-2.xl\\:grid-cols-3 {
      gap: 0.625rem !important;
    }
  }


  /* ==============================
     ANIMATIONS
     ============================== */
  @keyframes sparePartsFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0);   }
  }

  @keyframes cardSlideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0);    }
  }

  main {
    animation: sparePartsFadeIn 0.3s ease forwards;
  }

  /* Staggered card animations */
  main .grid > div:nth-child(1) {
    animation: cardSlideUp 0.35s ease 0.05s both;
  }

  main .grid > div:nth-child(2) {
    animation: cardSlideUp 0.35s ease 0.12s both;
  }

  main .grid > div:nth-child(3) {
    animation: cardSlideUp 0.35s ease 0.18s both;
  }

  /* Card hover lift */
  main .rounded-2xl {
    transition: transform 0.25s ease, box-shadow 0.25s ease;
  }

  main .rounded-2xl:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 40px rgba(0,0,0,0.10) !important;
  }
`;

export default MaintenanceSpareParts;