import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import HomeNavBar from "../../components/HomeNavBar";
import HomeFooter from '../../components/HomeFooter';

const AboutPage = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState({});
  const sectionRefs = useRef({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const setRef = (id) => (el) => {
    sectionRefs.current[id] = el;
  };

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* ==================== HERO SECTION ==================== */}
      <section className="relative w-full h-[700px] md:h-[800px] overflow-hidden">
        {/* Background Image */}
        <HomeNavBar />
        <div className="absolute inset-0">
          <img
            src="src/assets/About1.png"
            alt="Sri Lankan fishing boat"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628]/90 via-[#0a1628]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628]/60 to-transparent" />
        </div>

        {/* Hero Content */}
        <div
          id="hero"
          ref={setRef('hero')}
          className="relative z-10 h-full flex flex-col justify-center px-6 sm:px-10 md:px-16 lg:px-24 max-w-7xl mx-auto ml-1"
        >
          <p
            className={`text-cyan-400 font-semibold tracking-[3px] text-sm mb-4 transition-all duration-700 mt-[-200px] ${
              isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            {t("about.hero.badge", "ABOUT US")}
          </p>

          <h1
            className={`text-2xl sm:text-xl md:text-6xl lg:text-6xl font-[550] text-white leading-tight mb-6 transition-all duration-700 delay-200 ${
              isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {t("about.hero.title1", "Empowering Smarter")}
            <br />
            {t("about.hero.title2", "Safer")} <span className="text-cyan-400">{t("about.hero.title3", "Fishing")}</span>
          </h1>

          {/* Blue underline */}
          <div
            className={`w-16 h-1 bg-cyan-500 rounded mb-8 transition-all duration-700 delay-300 ${
              isVisible.hero ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
            } origin-left`}
          />

          <p
            className={`text-gray-300 text-base sm:text-[16px] max-w-xl leading-relaxed mb-10 transition-all duration-700 delay-400 ${
              isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            {t("about.hero.desc", "DEEWARAYA delivers an advanced Fishing Boat Management System designed to modernize maritime operations through intelligent automation, real-time monitoring, and comprehensive fleet oversight.")}
          </p>

          <div
            className={`transition-all duration-700 delay-500 ${
              isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <button className="group flex items-center gap-3 bg-blue-600/80 border border-cyan-800/80 text-white px-6 py-2 rounded-lg hover:bg-cyan-500 hover:border-cyan-500 transition-all duration-300 backdrop-blur-sm mt-[-20px]">
              <span className="font-medium">{t("about.hero.btn", "Learn More")}</span>
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Bottom Feature Cards */}
          <div
            id="hero-cards"
            ref={setRef('hero-cards')}
            className="absolute bottom-0 left-0 right-0 z-20"
          >
            <div className="max-w-[1350px] mx-auto px-6 sm:px-10 md:px-16 lg:px-1 mt-[-196px]">
              <div
                className={`bg-white rounded-2xl shadow-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 overflow-hidden transition-all duration-700 delay-600 ${
                  isVisible['hero-cards'] ? 'opacity-100 translate-y-0' : 'opacity-100 translate-y-12'
                }`}
              >
                {/* Real-time Tracking */}
                <div className="py-5 px-5 flex items-center gap-3 border-b sm:border-b lg:border-b-0 lg:border-r border-gray-100 group hover:bg-gray-50 transition-colors duration-300">
                  <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-[16px]">{t("about.cards.tracking.title", "Real-time Tracking")}</h3>
                    <p className="text-gray-500 text-[13px] mt-0.5 leading-relaxed">
                      {t("about.cards.tracking.desc", "Monitor your fleet in real-time with accurate location data.")}
                    </p>
                  </div>
                </div>

                {/* Smart Alerts */}
                <div className="py-3 px-5 flex items-center gap-3 border-b sm:border-b lg:border-b-0 lg:border-r border-gray-100 group hover:bg-gray-50 transition-colors duration-300">
                  <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-[16px]">{t("about.cards.alerts.title", "Smart Alerts")}</h3>
                    <p className="text-gray-500 text-[13px] mt-0.5 leading-relaxed">
                      {t("about.cards.alerts.desc", "Get instant alerts for safety, zones, and critical updates.")}
                    </p>
                  </div>
                </div>

                {/* Fleet Management */}
                <div className="py-3 px-5 flex items-center gap-3 border-b sm:border-b-0 lg:border-r border-gray-100 group hover:bg-gray-50 transition-colors duration-300">
                  <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-[16px]">{t("about.cards.fleet.title", "Fleet Management")}</h3>
                    <p className="text-gray-500 text-[13px] mt-0.5 leading-relaxed">
                      {t("about.cards.fleet.desc", "Manage vessels, crew, and operations from one platform.")}
                    </p>
                  </div>
                </div>

                {/* Live Tracking Widget */}
                <div className="py-3 px-5 bg-gradient-to-br from-blue-600 to-blue-800 flex items-center gap-4 group">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                    <span className="text-white/80 text-[11px] font-semibold tracking-wider">{t("about.cards.live.badge", "LIVE")}</span>
                  </div>
                  <div className="flex items-center justify-between flex-1">
                    <div>
                      <p className="text-lg font-bold text-white leading-tight">24.5 {t("about.cards.live.knots", "KNOTS")}</p>
                      <p className="text-white/70 text-[11px]">
                        {t("about.cards.live.speed", "Speed:")} <span className="text-green-400 font-medium">{t("about.cards.live.good", "Good")}</span>
                      </p>
                    </div>
                    <svg className="w-12 h-8 text-white/30" viewBox="0 0 80 40" fill="none" stroke="currentColor">
                      <path d="M5 35 Q20 35 25 25 Q30 15 40 20 Q50 25 55 15 Q60 5 75 5" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

              </div>
            </div>
        </div>
      </section>

      {/* ==================== CAPABILITIES / OPERATIONAL EXCELLENCE SECTION ==================== */}
      <section className="bg-gradient-to-b from-gray-50 to-white pb-20">
        {/* Capabilities Hero Banner */}
        <div className="relative w-full h-[350px] md:h-[420px] overflow-hidden mb-16">
          <img
            src="src/assets/About2.jpeg"
            alt="Fishing vessel at sea"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628]/85 via-[#0a1628]/50 to-transparent" />
          <div
            id="capabilities-hero"
            ref={setRef('capabilities-hero')}
            className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 md:px-16 lg:px-24 max-w-7xl mx-auto ml-[-1px]"
          >
            <p
              className={`text-cyan-400 font-semibold tracking-[3px] text-sm mb-3 transition-all duration-700 ${
                isVisible['capabilities-hero'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              {t("about.capabilities.badge", "OUR CAPABILITIES")}
            </p>
            <h2
              className={`text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-[550] text-white leading-tight mb-4 transition-all duration-700 delay-200 ${
                isVisible['capabilities-hero'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              {t("about.capabilities.title", "Operational Excellence")}
            </h2>
            <div
              className={`w-16 h-1 bg-cyan-500 rounded mb-6 transition-all duration-700 delay-300 ${
                isVisible['capabilities-hero'] ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
              } origin-left`}
            />
            <p
              className={`text-gray-300 text-base sm:text-lg max-w-lg leading-relaxed transition-all duration-700 delay-400 ${
                isVisible['capabilities-hero'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              {t("about.capabilities.desc", "Smart tools and real-time insights to help you operate safer, smarter, and more efficiently.")}
            </p>
          </div>
        </div>

       {/* Feature Cards Row */}
        <div
          id="feature-cards"
          ref={setRef('feature-cards')}
          className="max-w-[1750px] mx-auto px-6 sm:px-10 md:px-16 lg:px-24 "
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Track Locations Card */}
            <div
              className={`bg-gradient-to-br from-blue-200 to-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group ${
                isVisible['feature-cards'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}
              style={{ transitionDelay: '200ms' }}
            >
              <div className="p-5 flex gap-4 min-h-[280px]">
                {/* Left Content */}
                <div className="flex-1 flex flex-col">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 mb-1.5">{t("about.featureCards.track.title", "Track Locations")}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed mb-4">
                    {t("about.featureCards.track.desc", "Real-time GPS tracking and route history to help you stay on course and ensure compliance in every fishing zone.")}
                  </p>

                  <button className="mt-auto flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-medium hover:bg-blue-700 transition-colors group/btn w-fit">
                    {t("about.featureCards.track.btn", "View Live Map")}
                    <svg className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </div>

                {/* Right Image */}
                <div className="w-24 sm:w-28 rounded-xl overflow-hidden flex-shrink-0">
                  <img
                    src="src/assets/About3.jpeg"
                    alt="Map tracking"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
              </div>
            </div>

            {/* Monitor Vessels Card */}
            <div
              className={`bg-gradient-to-br from-blue-100 to-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group ${
                isVisible['feature-cards'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}
              style={{ transitionDelay: '400ms' }}
            >
              <div className="p-5 flex gap-4">
                {/* Left Content */}
                <div className="flex-1 flex flex-col">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 mb-1.5">{t("about.featureCards.monitor.title", "Monitor Vessels")}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed mb-4">
                    {t("about.featureCards.monitor.desc", "Live engine data, performance alerts, and system diagnostics from a single command center.")}
                  </p>

                  <button className="mt-auto flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-medium hover:bg-blue-700 transition-colors group/btn w-fit">
                    {t("about.featureCards.monitor.btn", "Open Monitor")}
                    <svg className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </div>

                {/* Right Mini Dashboard */}
                <div className="w-28 sm:w-32 bg-white rounded-xl p-2.5 border border-gray-200 flex-shrink-0">
                  <div className="mb-2">
                    <p className="text-[9px] text-gray-500">{t("about.featureCards.monitor.stats.engineStatus", "Engine Status")}</p>
                    <p className="text-[11px] font-bold text-green-500">{t("about.featureCards.monitor.stats.online", "Online")}</p>
                  </div>
                  <div className="mb-2">
                    <p className="text-[9px] text-gray-500">{t("about.featureCards.monitor.stats.fuelEfficiency", "Fuel Efficiency")}</p>
                    <p className="text-[11px] font-bold text-gray-900">87%</p>
                  </div>
                  <div className="mb-2">
                    <p className="text-[9px] text-gray-500">{t("about.featureCards.monitor.stats.engineLoad", "Engine Load")}</p>
                    <p className="text-[11px] font-bold text-gray-900">72%</p>
                  </div>
                  <svg className="w-full h-6 text-blue-400" viewBox="0 0 80 20" fill="none" stroke="currentColor">
                    <path d="M2 15 Q15 12 20 8 Q30 4 40 10 Q50 14 60 6 Q70 2 78 5" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Manage Crew Card */}
            <div
              className={`bg-gradient-to-br from-teal-50 to-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group ${
                isVisible['feature-cards'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}
              style={{ transitionDelay: '600ms' }}
            >
              <div className="p-5 flex gap-4">
                {/* Left Content */}
                <div className="flex-1 flex flex-col">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center mb-3 group-hover:bg-teal-200 transition-colors">
                    <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 mb-1.5">{t("about.featureCards.crew.title", "Manage Crew")}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed mb-4">
                    {t("about.featureCards.crew.desc", "Shift planning, certifications, and onboard communication tools to keep your crew connected and productive.")}
                  </p>

                  <button className="mt-auto flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-full text-xs font-medium hover:bg-teal-700 transition-colors group/btn w-fit">
                    {t("about.featureCards.crew.btn", "Manage Crew")}
                    <svg className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </div>

                {/* Right Crew List */}
                <div className="w-32 sm:w-36 bg-white rounded-xl p-2.5 border border-gray-200 flex-shrink-0">
                  <p className="text-[10px] font-bold text-gray-700 mb-2">{t("about.featureCards.crew.activeCrew", "Active Crew")}</p>
                  <div className="space-y-2">
                    {[
                      { name: 'A. Rahman', role: t("about.featureCards.crew.roles.deckhand", "Deckhand"), status: t("about.featureCards.crew.status.onDuty", "On Duty"), color: 'text-green-500' },
                      { name: 'M. Hasan', role: t("about.featureCards.crew.roles.engineer", "Engineer"), status: t("about.featureCards.crew.status.onDuty", "On Duty"), color: 'text-green-500' },
                      { name: 'S. Karim', role: t("about.featureCards.crew.roles.navigator", "Navigator"), status: t("about.featureCards.crew.status.resting", "Resting"), color: 'text-yellow-500' },
                    ].map((crew, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center text-[8px] font-bold text-blue-700 flex-shrink-0">
                          {crew.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] font-semibold text-gray-900 truncate">{crew.name}</p>
                          <p className="text-[8px] text-gray-400 truncate">{crew.role}</p>
                        </div>
                        <span className={`text-[8px] font-medium ${crew.color} flex-shrink-0`}>{crew.status}</span>
                      </div>
                    ))}
                  </div>
                  <button className="mt-2 text-[9px] text-blue-600 font-medium flex items-center gap-0.5 hover:text-blue-700">
                    {t("about.featureCards.crew.viewAll", "View All Crew")}
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
          </div>
        </div>
        </div>

        {/* Stats Bar 
        <div
          id="stats-bar"
          ref={setRef('stats-bar')}
          className="max-w-7xl mx-auto px-6 sm:px-10 md:px-16 lg:px-24 mt-16"
        >
          <div
            className={`bg-gradient-to-r from-[#0a1628] to-[#1a2d4a] rounded-2xl p-8 grid grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-700 ${
              isVisible['stats-bar'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
          >
            {[
              {
                value: '24',
                label: 'Active Vessels',
                sub: 'Currently at sea',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                ),
              },
              {
                value: '1,245 NM',
                label: 'Distance Traveled',
                sub: 'This month',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ),
              },
              {
                value: '328 MT',
                label: 'Total Catch',
                sub: 'This month',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ),
              },
              {
                value: '100%',
                label: 'Safety Compliance',
                sub: 'Current status',
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
            ].map((stat, i) => (
              <div
                key={i}
                className={`flex items-center gap-4 ${i < 3 ? 'lg:border-r lg:border-white/10' : ''} ${i < 2 ? 'border-b lg:border-b-0 border-white/10 pb-6 lg:pb-0' : ''}`}
              >
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-cyan-400 flex-shrink-0">
                  {stat.icon}
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-white/70 text-sm">{stat.label}</p>
                  <p className="text-white/40 text-xs">{stat.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>*/}
      </section>

      {/* ==================== MODERNIZING THE HIGH SEAS SECTION ==================== */}
      <section className="bg-gray-50 py-20 lg:py-20">
        <div
          id="modernizing"
          ref={setRef('modernizing')}
          className="max-w-7xl mx-auto px-6 sm:px-10 md:px-16 lg:px-24 "
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            {/* Left Content */}
            <div>
              <div
                className={`flex items-center gap-3 mb-6 transition-all duration-700 ${
                  isVisible.modernizing ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
              >
                <div className="w-10 h-[2px] bg-gray-300" />
                <p className="text-cyan-700 font-semibold tracking-[3px] text-sm">{t("about.modernizing.badge", "ABOUT OUR SYSTEM")}</p>
              </div>

              <h2
                className={`text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-8 transition-all duration-700 delay-200 ${
                  isVisible.modernizing ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                {t("about.modernizing.title1", "Modernizing")}
                <br />
                {t("about.modernizing.title2", "the")} <span className="text-blue-500">{t("about.modernizing.title3", "High Seas")}</span>
              </h2>

              <p
                className={`text-gray-500 text-base leading-relaxed mb-10 max-w-lg transition-all duration-700 delay-300 ${
                  isVisible.modernizing ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
              >
                {t("about.modernizing.desc", "We bridge the gap between legacy operations and future-proof digital infrastructure—providing actionable intelligence that reduces costs and maximizes yield.")}
              </p>

              <div
                className={`w-full h-[1px] bg-gray-200 mb-10 transition-all duration-700 delay-400 ${
                  isVisible.modernizing ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                } origin-left`}
              />

              {/* Feature Items */}
              <div className="space-y-8">
                {[
                  {
                    title: t("about.modernizing.features.ai.title", "AI-Powered Predictive Maintenance"),
                    desc: t("about.modernizing.features.ai.desc", "Monitor engine and system health to prevent failures."),
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    ),
                    delay: 500,
                  },
                  {
                    title: t("about.modernizing.features.dashboard.title", "Unified Fleet Dashboard"),
                    desc: t("about.modernizing.features.dashboard.desc", "Real-time visibility across all vessels for smarter decisions."),
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    ),
                    delay: 600,
                  },
                  {
                    title: t("about.modernizing.features.gps.title", "Secure GPS Communication"),
                    desc: t("about.modernizing.features.gps.desc", "Encrypted, tamper-proof communication that keeps data safe."),
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    ),
                    delay: 700,
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-4 transition-all duration-700 ${
                      isVisible.modernizing ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
                    }`}
                    style={{ transitionDelay: `${item.delay}ms` }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content */}
            <div className="space-y-6">
              <div
                className={`rounded-2xl overflow-hidden shadow-lg transition-all duration-700 delay-300 ${
                  isVisible.modernizing ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'
                }`}
              >
                <img
                  src="https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=800&q=80"
                  alt="Fishing vessel"
                  className="w-full h-[300px] sm:h-[380px] object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>

              {/* 98% Efficiency Card */}
              <div
                className={`bg-white rounded-2xl border border-gray-200 p-6 flex flex-col sm:flex-row items-center gap-6 shadow-sm transition-all duration-700 delay-500 ${
                  isVisible.modernizing ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                }`}
              >
                <div className="flex items-center gap-4 sm:border-r sm:border-gray-200 sm:pr-6">
                  <svg className="w-10 h-10 text-blue-500" viewBox="0 0 40 40" fill="none">
                    <path d="M5 25 Q10 20 15 25 Q20 30 25 25 Q30 20 35 25" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                    <path d="M5 20 Q10 15 15 20 Q20 25 25 20 Q30 15 35 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.5" />
                    <path d="M5 15 Q10 10 15 15 Q20 20 25 15 Q30 10 35 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.25" />
                  </svg>
                  <div>
                    <p className="text-4xl font-bold text-blue-500">98%</p>
                    <p className="text-gray-500 text-sm">{t("about.modernizing.efficiency.title", "Efficiency Gained")}</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-700 font-medium">{t("about.modernizing.efficiency.desc1", "Smarter operations.")}</p>
                  <p className="text-gray-700 font-medium">{t("about.modernizing.efficiency.desc2", "Lower costs. Higher yield.")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <HomeFooter />
    </div>
  );
};

export default AboutPage;