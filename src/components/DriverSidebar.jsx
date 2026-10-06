import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Navigation,
  Route,
  CloudRain,
  LifeBuoy,
  MessageSquare,
  QrCode,
  Settings,
  Menu,
  X,
} from "lucide-react";

/* ─────────────────────────────────────────────
   NAV ITEMS
   ───────────────────────────────────────────── */
const getNavItems = (t) => [
  {
    to: "/BoatDriverDashboard",
    icon: LayoutDashboard,
    label: t("driverSidebar.dashboard", "Dashboard"),
    iconColor: "text-cyan-300",
  },
  {
    to: "/driver/trips",
    icon: Route,
    label: t("driverSidebar.trips", "My Trips"),
    iconColor: "text-emerald-300",
  },
  {
    to: "/driver/navigation",
    icon: Navigation,
    label: t("driverSidebar.navigation", "Live Navigation"),
    iconColor: "text-yellow-300",
  },
  {
    to: "/weather",
    icon: CloudRain,
    label: t("driverSidebar.weather", "Weather"),
    iconColor: "text-sky-300",
  },
  {
    to: "/driver/emergency",
    icon: LifeBuoy,
    label: t("driverSidebar.emergency", "Emergency"),
    iconColor: "text-red-300",
  },
  {
    to: "/driver/messages",
    icon: MessageSquare,
    label: t("driverSidebar.messages", "Messages"),
    iconColor: "text-pink-300",
  },
  {
    to: "/driver/qr-code",
    icon: QrCode,
    label: t("driverSidebar.assignedBoatQr", "Assigned Boat QR"),
    iconColor: "text-emerald-300",
  },
  {
    to: "/driver/settings",
    icon: Settings,
    label: t("driverSidebar.settings", "Settings"),
    iconColor: "text-gray-300",
  },
];

/* ─────────────────────────────────────────────
   SIDEBAR LINK
   ───────────────────────────────────────────── */
const SidebarLink = ({ item, onNavigate }) => {
  const location = useLocation();
  const isActive = location.pathname === item.to;
  const Icon = item.icon;

  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className={`relative flex items-center gap-4 rounded-lg px-6 py-3 transition-all duration-300 ${
        isActive
          ? "bg-white text-blue-900 shadow-md"
          : "text-blue-100 hover:bg-blue-800 hover:text-white"
      }`}
    >
      {isActive && (
        <span className="absolute left-0 top-0 h-full w-1 rounded-r-md bg-cyan-400" />
      )}

      <Icon
        size={20}
        className={`shrink-0 transition-transform duration-300 ${
          isActive ? "text-blue-900" : item.iconColor
        }`}
      />

      <span className="text-[15px] font-medium tracking-wide">
        {item.label}
      </span>
    </Link>
  );
};

/* ─────────────────────────────────────────────
   SIDEBAR CONTENT
   ───────────────────────────────────────────── */
const SidebarContent = ({ onNavigate }) => {
  const { t } = useTranslation();
  const navItems = getNavItems(t);

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-blue-800 to-cyan-700 text-white">
      {/* Logo */}
      <div className="border-b border-blue-700 px-8 py-8">
        <Link to="/" onClick={onNavigate}>
          <h1 className="text-2xl font-bold tracking-wide text-white">
            DEEWARAYA
          </h1>
          <p className="mt-1 text-xs uppercase tracking-widest text-blue-300">
            {t("driverSidebar.driverPortal", "Driver Portal")}
          </p>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
        {navItems.map((item) => (
          <SidebarLink
            key={item.to}
            item={item}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-blue-700 px-6 py-4 text-center">
        <p className="text-xs text-blue-300">
          {t("driverSidebar.footer", "© 2026 Deewaraya")}
        </p>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN DRIVER SIDEBAR
   ───────────────────────────────────────────── */
const DriverSidebar = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const openMobile = () => setIsMobileOpen(true);
  const closeMobile = () => setIsMobileOpen(false);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  // Expose the open function globally so the navbar hamburger can trigger it
  useEffect(() => {
    window.__openDriverSidebar = openMobile;
    return () => {
      delete window.__openDriverSidebar;
    };
  }, []);

  return (
    <>
      {/* ═════════════ MOBILE + TABLET DRAWER ═════════════ */}
      {/* Backdrop */}
      <div
        onClick={closeMobile}
        className={`fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isMobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer */}
      <aside
        className={`fixed left-0 top-0 z-[120] h-full w-72 shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={closeMobile}
          aria-label="Close menu"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <X size={18} />
        </button>

        <SidebarContent onNavigate={closeMobile} />
      </aside>

      {/* ═════════════ DESKTOP SIDEBAR ═════════════ */}
      <aside className="hidden h-full w-72 shrink-0 shadow-xl lg:flex lg:flex-col">
        <SidebarContent />
      </aside>
    </>
  );
};

export default DriverSidebar;