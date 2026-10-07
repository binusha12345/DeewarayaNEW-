import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Star,
  MapPin,
  Phone,
  Clock3,
  Wrench,
  Settings,
  AlertCircle,
} from "lucide-react";

import OwnerSidebar from "../../../components/OwnerSidebar";
import DashboardNav from "../../../components/DashboardNav";
import DashboardPageHeader from "../../../components/DashboardPageHeader";
import ssjImg from "../../../assets/ssj.webp";
import diyakawaImg from "../../../assets/diyakawa.webp";
import dolphinImg from "../../../assets/dolphine.webp";

const MaintenanceEngine = () => {
  const navigate = useNavigate();

  const engineProviders = [
    {
      id: 1,
      name: "SSJ marine service (Pvt) Ltd",
      rating: 4.9,
      address: "320/2/1 kahawa road meetiyagoda, Ambalangoda 80300",
      phone: "077 276 1047",
      open: "Open 24 hours",
      mapUrl: "https://www.google.com/maps?vet=10CAAQoqAOahcKEwiQgY_U2ZKVAxUAAAAAHQAAAAAQXw..i&sca_esv=c1fae25c624776a2&udm=1&pvq=Cg0vZy8xMXl0dzV2Z2Y4&lqi=Ch1maXNoaW5nIGJvYXQgcmVwYWlyIFNyaSBMYW5rYUio8_Sy572AgAhaKRAAEAEQAhgAGAIiHWZpc2hpbmcgYm9hdCByZXBhaXIgc3JpIGxhbmthkgEfc2hpcGJ1aWxkaW5nX2FuZF9yZXBhaXJfY29tcGFueZoBRENpOURRVWxSUVVOdlpFTm9kSGxqUmpsdlQyMXdibUZJVlhsWmJUVTFXakJuTVZwR2JIcGxWM04wVFVVNE1XVnRZeEFC-gEECAAQMQ&fvr=1&cs=0&um=1&ie=UTF-8&fb=1&gl=lk&sa=X&ftid=0x3ae1831834f92e41:0xe16faa46c7d458d7",
      image: ssjImg
      
    },
    {
      id: 2,
      name: "Diyakawa Marine Boat Manufacturers",
      rating: 4.7,
      address: "No 5, Moratuwa",
      phone: "071 415 5674",
      open: "Open 24 hours",
      mapUrl: "https://www.google.com/maps/place/Diyakawa+Marine+Boat+Manufacturers/@6.749828,79.893412,17z/data=!3m1!4b1!4m6!3m5!1s0x3ae245c0ed9cbd73:0xc5fcb831c5ed88b7!8m2!3d6.749828!4d79.893412!16s%2Fg%2F1ptx9c4jd?entry=ttu&g_ep=EgoyMDI2MDYxNi4wIKXMDSoASAFQAw%3D%3D",
      image: diyakawaImg
    },
    {
      id: 3,
      name: "Dolphin Marine Lanka (Pvt) Ltd",
      rating: 4.8,
      address: "Industrial Estate, Wataraka, 182/8.",
      phone: "0112 830 831",
      open: "Open 24 hours",
      mapUrl: "https://www.google.com/maps?vet=10CAAQoqAOahcKEwj4__WA3JKVAxUAAAAAHQAAAAAQDw..i&pvq=Cg0vZy8xMWI2Y3EzZDU4IjAKKmZpc2hpbmcgYm9hdHMgYm9keSBwYXJ0cyBtYWludGVuYW5jZSBzaG9wcxACGAM&lqi=CjdmaXNoaW5nIGJvYXRzIGJvZHkgcGFydHMgbWFpbnRlbmFuY2Ugc2hvcHMgaW4gc3JpIGxhbmthSKjhhruZqoCACFpLEAAQARACEAMQBBAFGAAYARgIIjdmaXNoaW5nIGJvYXRzIGJvZHkgcGFydHMgbWFpbnRlbmFuY2Ugc2hvcHMgaW4gc3JpIGxhbmthkgEMYm9hdF9idWlsZGVy&fvr=1&cs=0&um=1&ie=UTF-8&fb=1&gl=lk&sa=X&ftid=0x3ae2531906742463:0xb162ca3456efb15f",
      image: dolphinImg
    },
  ];

const openGoogleMaps = (provider) => {
  window.open(provider.mapUrl, "_blank", "noopener,noreferrer");
};

  return (
    <div className="flex h-screen bg-[#f5f7fb] text-slate-800 overflow-hidden">

      <style>{engineStyles}</style>
      {/* Sidebar */}
      <OwnerSidebar />

      {/* Main Section */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <DashboardNav />

        {/* Content */}
        <main className="flex-1 px-6 lg:px-10 py-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <DashboardPageHeader
              eyebrow="Maintenance console"
              title="Engine Services"
              description="Connect with marine engine specialists and keep your vessel's propulsion system in top condition."
              icon={Settings}
              theme="indigo"
            />

            {/* Provider Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {engineProviders.map((provider) => (
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

                    <div className="absolute top-4 right-4 bg-blue-800 text-white text-[11px] font-bold px-3 py-1 rounded-md">
                      VERIFIED EXPERT
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-[18px] font-semibold text-slate-900 leading-tight">
                        {provider.name}
                      </h3>

                      <div className="flex items-center gap-1 text-orange-500 font-bold shrink-0">
                        <Star size={18} fill="currentColor" />
                        <span>{provider.rating}</span>
                      </div>
                    </div>

                    <div className="mt-5 space-y-4 text-slate-700">
                      <div className="flex gap-3">
                        <MapPin className="text-red-500" size={25} />
                        <p className="text-[14px]">{provider.address}</p>
                      </div>

                      <div className="flex gap-3">
                        <Phone className="text-blue-500" size={25} />
                        <p className="font-bold text-[14px]">{provider.phone}</p>
                      </div>

                      <div className="flex gap-3">
                        <Clock3 className="text-green-500" size={25} />
                        <p className="text-green-600 font-bold text-[14px]">{provider.open}</p>
                      </div>
                    </div>

                    <div className="mt-8 pt-6\ border-t border-slate-100 flex items-center justify-between gap-3">
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

const engineStyles = `

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

    /* Page header */
    main h1 {
      font-size: 1.875rem !important;
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
    main .mb-8 {
      margin-bottom: 1.5rem !important;
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
    main .w-20.h-1 {
      width: 4rem !important;
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

    main .text-xs.tracking-\\[0\\.28em\\] {
      font-size: 0.5625rem !important;
    }

    /* Section title */
    main h2.text-3xl.font-bold {
      font-size: 1.5rem !important;
    }

    main .mb-8 {
      margin-bottom: 1.25rem !important;
    }

    /* Section title icon */
    main .flex.items-center.gap-3 svg {
      width: 1.25rem !important;
      height: 1.25rem !important;
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
    }

    /* Rating */
    main .text-orange-500.font-bold {
      font-size: 0.875rem !important;
    }

    main .text-orange-500.font-bold svg {
      width: 1rem !important;
      height: 1rem !important;
    }

    /* Card details space */
    main .mt-5.space-y-4 {
      margin-top: 0.875rem !important;
      gap: 0.75rem !important;
    }

    /* Card detail icons */
    main .mt-5.space-y-4 svg {
      width: 1.125rem !important;
      height: 1.125rem !important;
    }

    /* Card details text */
    main .text-\\[14px\\] {
      font-size: 0.75rem !important;
    }

    /* Card footer */
    main .mt-8.pt-6\\  {
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
     - Stack header
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

    main .text-xs.tracking-\\[0\\.28em\\] {
      font-size: 0.5rem !important;
      margin-bottom: 0.5rem !important;
    }

    /* Blue accent bar */
    main .w-20.h-1 {
      margin-top: 0.5rem !important;
      width: 3rem !important;
    }

    /* Section title row */
    main .flex.items-center.justify-between.mb-8 {
      margin-bottom: 1rem !important;
    }

    main h2.text-3xl.font-bold {
      font-size: 1.375rem !important;
    }

    main .flex.items-center.gap-3 svg {
      width: 1.125rem !important;
      height: 1.125rem !important;
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
      border-radius: 0.375rem !important;
    }

    /* Card padding */
    main .p-6 {
      padding: 1rem !important;
    }

    /* Provider name + rating row */
    main .flex.items-start.justify-between.gap-4 {
      gap: 0.5rem !important;
    }

    /* Provider name */
    main h3.text-\\[18px\\] {
      font-size: 0.875rem !important;
    }

    /* Rating */
    main .text-orange-500.font-bold {
      font-size: 0.8125rem !important;
    }

    main .text-orange-500.font-bold svg {
      width: 0.9375rem !important;
      height: 0.9375rem !important;
    }

    /* Details */
    main .mt-5.space-y-4 {
      margin-top: 0.75rem !important;
      gap: 0.625rem !important;
    }

    main .mt-5.space-y-4 svg {
      width: 1rem !important;
      height: 1rem !important;
    }

    main .text-\\[14px\\] {
      font-size: 0.6875rem !important;
    }

    /* Card footer */
    main .mt-8.pt-6\\  {
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
    }

    /* Details */
    main .text-\\[14px\\] {
      font-size: 0.75rem !important;
    }

    main .mt-5.space-y-4 svg {
      width: 1.125rem !important;
      height: 1.125rem !important;
    }

    /* Card footer */
    main .mt-8.pt-6\\  {
      margin-top: 1rem !important;
      padding-top: 0.875rem !important;
    }

    /* View location button */
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

    /* Section title */
    main h2.text-3xl.font-bold {
      font-size: 1.25rem !important;
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
    }

    /* Details */
    main .text-\\[14px\\] {
      font-size: 0.6875rem !important;
    }

    main .mt-5.space-y-4 {
      gap: 0.5rem !important;
    }

    /* Card footer */
    main .mt-8.pt-6\\  {
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

    /* Blue accent bar */
    main .w-20.h-1 {
      width: 2.5rem !important;
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

    /* Section title */
    main h2.text-3xl.font-bold {
      font-size: 1.125rem !important;
    }

    main .flex.items-center.gap-3 svg {
      width: 1rem !important;
      height: 1rem !important;
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
    }

    /* Rating */
    main .text-orange-500.font-bold {
      font-size: 0.75rem !important;
    }

    /* Details */
    main .text-\\[14px\\] {
      font-size: 0.625rem !important;
    }

    main .mt-5.space-y-4 svg {
      width: 0.875rem !important;
      height: 0.875rem !important;
    }

    /* Card footer */
    main .mt-8.pt-6\\  {
      margin-top: 0.75rem !important;
      padding-top: 0.625rem !important;
    }

    /* View button */
    main .bg-blue-800.text-white.font-semibold {
      font-size: 0.6875rem !important;
      padding: 0.375rem !important;
    }

    /* Section mb */
    main .flex.items-center.justify-between.mb-8 {
      margin-bottom: 0.75rem !important;
    }

    main .mb-10 {
      margin-bottom: 0.875rem !important;
    }
  }


  /* ==============================
     ANIMATIONS
     ============================== */
  @keyframes engineFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0);   }
  }

  @keyframes cardSlideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0);    }
  }

  main {
    animation: engineFadeIn 0.3s ease forwards;
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

export default MaintenanceEngine;