const THEMES = {
  blue: "from-blue-950 via-blue-800 to-sky-700",
  cyan: "from-slate-900 via-cyan-900 to-cyan-700",
  emerald: "from-emerald-950 via-emerald-800 to-teal-700",
  violet: "from-violet-950 via-violet-800 to-indigo-700",
  amber: "from-amber-950 via-orange-800 to-amber-600",
  indigo: "from-indigo-950 via-indigo-800 to-blue-700",
  rose: "from-rose-950 via-rose-800 to-red-700",
  teal: "from-teal-950 via-teal-800 to-cyan-700",
  orange: "from-orange-950 via-orange-800 to-amber-700",
  green: "from-green-950 via-green-800 to-emerald-700",
};

function DashboardPageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  theme = "blue",
  action,
  className = "",
}) {
  return (
    <header
      className={`relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-br ${
        THEMES[theme] || THEMES.blue
      } p-5 text-white shadow-lg shadow-slate-900/10 sm:p-7 ${className}`}
    >
      <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -right-3 -top-7 h-40 w-40 rounded-full border border-white/10" />
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 160"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20 w-full opacity-25 sm:h-24"
      >
        <path
          fill="white"
          fillOpacity="0.22"
          d="M0 82c120 24 240 24 360 0s240-24 360 0 240 24 360 0 240-24 360 0v78H0z"
        />
        <path
          fill="white"
          fillOpacity="0.2"
          d="M0 112c120-24 240-24 360 0s240 24 360 0 240-24 360 0 240 24 360 0v48H0z"
        />
        <path
          fill="white"
          fillOpacity="0.16"
          d="M0 138c150-18 260-18 400 0s250 18 390 0 250-18 390 0 180 12 260 0v22H0z"
        />
      </svg>
      <div className="relative z-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-start gap-4">
          {Icon && (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white shadow-inner sm:h-14 sm:w-14">
              <Icon size={25} strokeWidth={1.8} />
            </span>
          )}
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70 sm:text-[11px]">
                {eyebrow}
              </p>
            )}
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
            {description && (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">{description}</p>
            )}
          </div>
        </div>
        {action && <div className="relative z-10 shrink-0">{action}</div>}
      </div>
    </header>
  );
}

export default DashboardPageHeader;
