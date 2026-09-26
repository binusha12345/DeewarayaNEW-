// src/pages/features/Features.jsx

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Anchor,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Plus,
  Radio,
  MapPin,
  Bell,
  Users,
  Waves,
  Navigation,
  LifeBuoy,
  Signal,
  Cloud,
  BarChart3,
  Target,
  Eye,
  PlayCircle,
} from "lucide-react";

import HomeNavBar from "../../components/HomeNavBar";
import HomeFooter from "../../components/HomeFooter";

import featuresHeroImg from "../../assets/features_hero.png";
import featuresDashboardImg from "../../assets/features_dashboard.png";
import featuresSafetyImg from "../../assets/features_safety.png";

/* ─────────────────────────────────────────────
   FEATURE DATA
   ───────────────────────────────────────────── */

const getCoreFeatures = (t) => [
  {
    id: "tracking",
    icon: Navigation,
    title: t("features.core.tracking.title", "Real-time vessel tracking"),
    description: t("features.core.tracking.description", "Monitor the exact location, speed, and heading of every boat in your fleet, updated live from the sea."),
    image: featuresDashboardImg,
    points: [
      t("features.core.tracking.points.0", "GPS position refresh every 30 seconds"),
      t("features.core.tracking.points.1", "Historical route playback for the last 90 days"),
      t("features.core.tracking.points.2", "Speed, heading, and idle time analytics"),
      t("features.core.tracking.points.3", "Multi-vessel view on a single dashboard"),
    ],
  },
  {
    id: "coverage",
    icon: Signal,
    title: t("features.core.coverage.title", "Network coverage map"),
    description: t("features.core.coverage.description", "Plan every trip with confidence using our detailed offshore network coverage overlays."),
    points: [
      t("features.core.coverage.points.0", "Live cellular and satellite coverage layers"),
      t("features.core.coverage.points.1", "Signal strength indicators along common fishing routes"),
      t("features.core.coverage.points.2", "Offline-ready map tiles for low-connectivity zones"),
    ],
  },
  {
    id: "fleet",
    icon: Anchor,
    title: t("features.core.fleet.title", "Fleet management dashboard"),
    description: t("features.core.fleet.description", "Manage vessels, crew, and equipment records from a single unified interface."),
    points: [
      t("features.core.fleet.points.0", "Vessel registration and document management"),
      t("features.core.fleet.points.1", "Crew assignment and shift scheduling"),
      t("features.core.fleet.points.2", "Maintenance logs and service reminders"),
    ],
  },
  {
    id: "weather",
    icon: Cloud,
    title: t("features.core.weather.title", "Weather & sea conditions"),
    description: t("features.core.weather.description", "Access accurate marine forecasts and receive alerts before conditions change."),
    points: [
      t("features.core.weather.points.0", "Wind, wave, and swell forecasts up to 7 days ahead"),
      t("features.core.weather.points.1", "Storm and rough-sea advisories"),
      t("features.core.weather.points.2", "Sunrise, sunset, and tide information"),
    ],
  },
];

const getSpecialFeatures = (t) => [
  {
    id: "sms-alerts",
    icon: Bell,
    title: t("features.special.sms.title", "SMS safety alerts"),
    description: t("features.special.sms.description", "Critical danger warnings delivered by SMS — no internet required on the vessel."),
    points: [
      t("features.special.sms.points.0", "Wind, visibility, and wave-height warnings"),
      t("features.special.sms.points.1", "Storm and cyclone advisories"),
      t("features.special.sms.points.2", "Delivered even in offline coverage zones"),
    ],
    badge: t("features.special.sms.badge", "Life saving"),
  },
  {
    id: "navy-zones",
    icon: MapPin,
    title: t("features.special.navy.title", "Navy barrier zones"),
    description: t("features.special.navy.description", "Restricted maritime zones mapped clearly with proximity alerts before crossing."),
    points: [
      t("features.special.navy.points.0", "All official restricted zones pre-mapped"),
      t("features.special.navy.points.1", "Alert triggered 2 km before boundary"),
      t("features.special.navy.points.2", "SMS backup for offline devices"),
    ],
    badge: t("features.special.navy.badge", "Compliance"),
  },
  {
    id: "signal-lights",
    icon: Radio,
    title: t("features.special.signal.title", "Signal strength indicators"),
    description: t("features.special.signal.description", "A simple traffic-light system that shows network signal reliability at sea."),
    points: [
      t("features.special.signal.points.0", "Green, yellow, and red status indicators"),
      t("features.special.signal.points.1", "Historical signal patterns per route"),
      t("features.special.signal.points.2", "Helps plan check-in timing with shore"),
    ],
    badge: t("features.special.signal.badge", "Smart"),
  },
  {
    id: "anchor",
    icon: LifeBuoy,
    title: t("features.special.anchor.title", "Anchor detection"),
    description: t("features.special.anchor.description", "Automatically detect when a vessel drops anchor and notify the fleet owner."),
    points: [
      t("features.special.anchor.points.0", "Precise anchor location logged on the map"),
      t("features.special.anchor.points.1", "Distance-from-shore calculation"),
      t("features.special.anchor.points.2", "Drift alert if vessel moves unexpectedly"),
    ],
    badge: t("features.special.anchor.badge", "Tracking"),
  },
];

const getUpcomingFeatures = (t) => [
  {
    id: "analytics",
    icon: BarChart3,
    title: t("features.upcoming.analytics.title", "Advanced fleet analytics"),
    description: t("features.upcoming.analytics.description", "In-depth reports on fuel efficiency, catch performance, and vessel utilization."),
    eta: t("features.upcoming.analytics.eta", "Q2 2025"),
  },
  {
    id: "crew-app",
    icon: Users,
    title: t("features.upcoming.crew.title", "Dedicated crew mobile app"),
    description: t("features.upcoming.crew.description", "A companion app for crew members with schedules, check-ins, and emergency tools."),
    eta: t("features.upcoming.crew.eta", "Q3 2025"),
  },
  {
    id: "weather-ai",
    icon: Waves,
    title: t("features.upcoming.weatherAI.title", "AI weather predictions"),
    description: t("features.upcoming.weatherAI.description", "Machine-learning models trained on local sea conditions for hyperlocal forecasts."),
    eta: t("features.upcoming.weatherAI.eta", "Q4 2025"),
  },
];

/* ─────────────────────────────────────────────
   MAIN PAGE
   ───────────────────────────────────────────── */

const Features = () => {
  const { t } = useTranslation();
  
  const coreFeatures = getCoreFeatures(t);
  const specialFeatures = getSpecialFeatures(t);
  const upcomingFeatures = getUpcomingFeatures(t);

  const sections = [
    {
      href: "#core-features",
      icon: Anchor,
      label: t("features.sections.core", "Core features"),
      count: coreFeatures.length,
    },
    {
      href: "#safety-features",
      icon: ShieldCheck,
      label: t("features.sections.safety", "Safety features"),
      count: specialFeatures.length,
    },
    {
      href: "#upcoming-features",
      icon: Sparkles,
      label: t("features.sections.upcoming", "Coming soon"),
      count: upcomingFeatures.length,
    },
  ];

  
  return (
    <div className="min-h-screen bg-white text-slate-900">

      {/* ═════════════════ HERO WITH IMAGE ═════════════════ */}
      <section className="relative w-full h-[700px] md:h-[800px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={featuresHeroImg}
            alt="Fishing fleet at sea"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628]/90 via-[#0a1628]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628]/60 to-transparent" />
        </div>

        <div className="absolute top-0 left-0 w-full z-20">
          <HomeNavBar />
        </div>

        <div className="relative z-10 h-full flex flex-col justify-center px-6 sm:px-10 md:px-16 lg:px-24 max-w-7xl mx-auto ml-1 text-white">
          <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-cyan-400/30 bg-cyan-900/30 backdrop-blur-sm px-3 py-2 w-fit">
            <Anchor size={15} className="text-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-400">
              {t("features.hero.badge", "Deewaraya Platform")}
            </span>
          </div>

          <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight md:text-5xl lg:text-[52px] mb-6">
            {t("features.hero.title1", "Everything your fleet needs,")}
            <br />
            <span className="text-cyan-400"> {t("features.hero.title2", "in one platform.")}</span>
          </h1>

          <div className="w-16 h-1 bg-cyan-500 rounded mb-8" />

          <p className="mt-6 max-w-xl text-base leading-7 text-gray-300 md:text-lg mb-10">
            {t(
              "features.hero.tagline",
              "Real-time tracking, safety alerts, and fleet analytics — purpose-built for fishing operations."
            )}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#core-features"
              className="inline-flex items-center gap-2 rounded-md bg-blue-600/80 border border-cyan-800/80 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-cyan-500 hover:border-cyan-500 backdrop-blur-sm group"
            >
              {t("features.hero.exploreBtn", "Explore features")}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* ═════════════════ QUICK NAVIGATION ═════════════════ */}
      <section className="bg-slate-50 border-b border-slate-200">
        <div className="relative mx-auto max-w-6xl px-5 py-8 md:px-8">

          <div className="grid gap-3 sm:grid-cols-3">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <a
                  key={s.href}
                  href={s.href}
                  className="group flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-blue-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                      <Icon size={15} />
                    </div>
                    <span className="text-sm font-semibold text-slate-900">
                      {s.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      {s.count}
                    </span>
                    <ArrowRight
                      size={14}
                      className="text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-700"
                    />
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═════════════════ FEATURED IMAGE BAND ═════════════════ */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-8">
          <div className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
            <div className="relative order-2 overflow-hidden rounded-xl border border-slate-200 md:order-1">
              <img
                src={featuresDashboardImg}
                alt="Marine operations dashboard"
                className="h-[380px] w-full object-cover"
              />
            </div>

            <div className="order-1 md:order-2">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-px w-8 bg-blue-700" />
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                  {t("features.why.badge", "Why Deewaraya")}
                </span>
              </div>

              <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                {t("features.why.title", "Purpose-built for Sri Lankan fishing operations.")}
              </h2>

              <p className="mt-4 text-base leading-7 text-slate-600">
                {t("features.why.description", "Every feature is designed with input from fleet operators in Ambalangoda and beyond. From offline SMS alerts to navy zone warnings, we build what fishing communities actually need.")}
              </p>

              <div className="mt-6 space-y-3">
                {[
                  t("features.why.points.0", "Works offline with SMS fallback"),
                  t("features.why.points.1", "Available in Sinhala, Tamil, and English"),
                  t("features.why.points.2", "Designed for daily use at sea"),
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100">
                      <div className="h-2 w-2 rounded-full bg-blue-700" />
                    </div>
                    <span className="text-sm text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════ SECTION 01: CORE ═════════════════ */}
      <section id="core-features" className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-5xl px-5 py-20 md:px-8">
          <SectionHeader
            number="01"
            icon={Anchor}
            eyebrow={t("features.coreSection.eyebrow", "Core features")}
            title={t("features.coreSection.title", "Built for daily fleet operations.")}
            description={t("features.coreSection.description", "Every capability designed around the workflows fishing operators use every day — from tracking vessels at sea to managing crews on shore.")}
            t={t}
          />

          <div className="mt-14 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="divide-y divide-slate-200">
              {coreFeatures.map((feature, index) => (
                <FeatureRow
                  key={feature.id}
                  number={index + 1}
                  feature={feature}
                  variant="framed"
                  t={t}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════ SECTION 02: SAFETY ═════════════════ */}
      <section id="safety-features" className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            {/* Sticky header with image */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <SectionHeader
                number="02"
                icon={ShieldCheck}
                eyebrow={t("features.safetySection.eyebrow", "Safety features")}
                title={t("features.safetySection.title", "Keep every crew member safe.")}
                description={t("features.safetySection.description", "Dedicated safety capabilities to help operators monitor conditions, respond to emergencies, and stay compliant.")}
                t={t}
              />

              <div className="mt-8 overflow-hidden rounded-xl border border-slate-200">
                <img
                  src={featuresSafetyImg}
                  alt="Fishing boat with safety equipment"
                  className="h-[280px] w-full object-cover"
                />
              </div>
            </div>

            {/* Feature list */}
            <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
              {specialFeatures.map((feature, index) => (
                <FeatureRow
                  key={feature.id}
                  number={index + 1}
                  feature={feature}
                  variant="framed"
                  t={t}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════ MISSION & VISION ═════════════════ */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-5xl px-5 py-20 md:px-8">
          <div className="mb-10 max-w-2xl">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-px w-8 bg-blue-700" />
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                {t("features.mission.badge", "Our purpose")}
              </span>
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              {t("features.mission.mainTitle", "Building for the future of fishing.")}
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <MissionCard
              icon={Target}
              eyebrow={t("features.mission.missionEyebrow", "Our mission")}
              title={t("features.mission.missionTitle", "Empower fishing communities with reliable technology.")}
              description={t("features.mission.missionDesc", "We build tools that improve safety, efficiency, and daily decision-making for fishing operators across Sri Lanka.")}
            />
            <MissionCard
              icon={Eye}
              eyebrow={t("features.mission.visionEyebrow", "Our vision")}
              title={t("features.mission.visionTitle", "Set the standard for marine fleet operations.")}
              description={t("features.mission.visionDesc", "To become the trusted platform that fishing fleets rely on — from small operators to large commercial fleets.")}
            />
          </div>
        </div>
      </section>

      {/* ═════════════════ SECTION 03: UPCOMING ═════════════════ */}
      <section id="upcoming-features" className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-5 py-20 md:px-8">
          <SectionHeader
            number="03"
            icon={Sparkles}
            eyebrow={t("features.upcomingSection.eyebrow", "Coming soon")}
            title={t("features.upcomingSection.title", "What we're building next.")}
            description={t("features.upcomingSection.description", "A preview of features currently in development, prioritized based on feedback from active fleet operators.")}
            t={t}
          />

          <div className="mt-14 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="divide-y divide-slate-200">
              {upcomingFeatures.map((feature, index) => (
                <FeatureRow
                  key={feature.id}
                  number={index + 1}
                  feature={feature}
                  variant="framed"
                  comingSoon
                  t={t}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════ CTA WITH IMAGE ═════════════════ */}
      <section id="cta" className="relative overflow-hidden bg-blue-900">
        <div className="absolute inset-0">
          <img
            src={featuresSafetyImg}
            alt=""
            className="h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-blue-900/95 to-blue-900/70" />
        </div>
      </section>

      <HomeFooter />
    </div>
  );
};

/* ─────────────────────────────────────────────
   STAT ITEM (used in hero overlay)
   ───────────────────────────────────────────── */

const StatItem = ({ value, label }) => (
  <div className="text-center">
    <div className="text-lg font-bold text-slate-900">{value}</div>
    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
      {label}
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   SECTION HEADER
   ───────────────────────────────────────────── */

const SectionHeader = ({ number, icon: Icon, eyebrow, title, description, t }) => {
  return (
    <div>
      {number && (
        <div className="mb-6 flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400">
            {t ? t("features.common.section", "SECTION") : "SECTION"} {number}
          </span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
      )}

      <div className="max-w-2xl">
        <div className="mb-3 flex items-center gap-2">
          <Icon size={15} className="text-blue-700" />
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
            {eyebrow}
          </span>
        </div>

        <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          {title}
        </h2>

        {description && (
          <p className="mt-4 text-base leading-7 text-slate-600">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   FEATURE ROW (expandable)
   ───────────────────────────────────────────── */

const FeatureRow = ({
  number,
  feature,
  comingSoon = false,
  variant = "default",
  t
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = feature.icon;

  const hasExpandableContent =
    (feature.points && feature.points.length > 0) || feature.eta;

  const containerPadding = variant === "framed" ? "px-6" : "";

  return (
    <div className={`transition-colors hover:bg-slate-50/60 ${containerPadding}`}>
      <button
        onClick={() => hasExpandableContent && setIsOpen(!isOpen)}
        disabled={!hasExpandableContent}
        className="w-full text-left"
      >
        <div className="grid grid-cols-[auto_1fr_auto] items-start gap-4 py-7 md:gap-6 md:py-8">
          {/* Number */}
          <div className="pt-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-sm font-bold text-blue-700">
              {String(number).padStart(2, "0")}
            </div>
          </div>

          {/* Content */}
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                <Icon size={17} />
              </div>

              <h3 className="text-base font-semibold tracking-tight text-slate-900 md:text-lg">
                {feature.title}
              </h3>

              {feature.badge && !comingSoon && (
                <span className="inline-flex rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                  {feature.badge}
                </span>
              )}

              {comingSoon && (
                <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700">
                  <Sparkles size={10} />
                  {t ? t("features.common.comingSoon", "Coming soon") : "Coming soon"}
                </span>
              )}
            </div>

            <p className="pl-12 text-sm leading-6 text-slate-600 md:text-[15px]">
              {feature.description}
            </p>
          </div>

          {/* Expand icon */}
          {hasExpandableContent && (
            <div className="pt-1.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-md border transition-all ${
                  isOpen
                    ? "rotate-45 border-blue-300 bg-blue-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <Plus
                  size={14}
                  className={isOpen ? "text-blue-700" : "text-slate-500"}
                />
              </div>
            </div>
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isOpen && hasExpandableContent && (
        <div className="pb-8 pl-[3.5rem] pr-4 md:pl-[4rem]">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            {feature.image && (
              <div className="mb-4 overflow-hidden rounded-md border border-slate-200">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="h-40 w-full object-cover md:h-48"
                />
              </div>
            )}

            {feature.points && feature.points.length > 0 && (
              <>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {t ? t("features.common.keyCapabilities", "Key capabilities") : "Key capabilities"}
                </p>
                <ul className="space-y-2.5">
                  {feature.points.map((point, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm leading-6 text-slate-700"
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {feature.eta && (
              <div
                className={`${
                  feature.points ? "mt-4 border-t border-slate-200 pt-4" : ""
                } flex items-center gap-2 text-xs`}
              >
                <span className="font-semibold uppercase tracking-wider text-slate-500">
                  {t ? t("features.common.expectedRelease", "Expected release") : "Expected release"}
                </span>
                <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 font-semibold text-blue-800">
                  {feature.eta}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   MISSION CARD
   ───────────────────────────────────────────── */

const MissionCard = ({ icon: Icon, eyebrow, title, description }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 transition-all hover:border-blue-300 hover:shadow-sm">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
        <Icon size={20} />
      </div>

      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
        {eyebrow}
      </div>

      <h3 className="mb-3 text-xl font-semibold tracking-tight text-slate-900">
        {title}
      </h3>

      <p className="text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
};

export default Features;