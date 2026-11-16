// src/components/TransportSidebar.jsx
// Transport & Return Manager sidebar — same look as OwnerSidebar.

import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  Truck,
  Users,
  Route as RouteIcon,
  Fish,
  AlertTriangle,
  Undo2,
  Receipt,
  Wallet,
  BarChart3,
  Settings,
  X,
} from "lucide-react";

/* ─────────────────────────────────────────────
   NAV ITEMS
   ───────────────────────────────────────────── */
const navItems = [
  { to: "/transport/overview", icon: LayoutDashboard, label: "Overview", iconColor: "text-cyan-300" },
  { to: "/transport/orders", icon: ClipboardList, label: "Orders", iconColor: "text-emerald-300" },
  { to: "/transport/trucks", icon: Truck, label: "Trucks", iconColor: "text-yellow-300" },
  { to: "/transport/drivers", icon: Users, label: "Drivers", iconColor: "text-sky-300" },
  { to: "/transport/assignments", icon: RouteIcon, label: "Assignments", iconColor: "text-orange-300" },
  { to: "/transport/deliveries", icon: Fish, label: "Deliveries", iconColor: "text-teal-300" },
  { to: "/transport/damage", icon: AlertTriangle, label: "Damage Management", iconColor: "text-rose-300" },
  { to: "/transport/returns", icon: Undo2, label: "Return Management", iconColor: "text-amber-300" },
  { to: "/transport/expenses", icon: Receipt, label: "Expenses", iconColor: "text-lime-300" },
  { to: "/transport/payments", icon: Wallet, label: "Payments", iconColor: "text-green-300" },
  { to: "/transport/reports", icon: BarChart3, label: "Reports", iconColor: "text-purple-300" },
  { to: "/transport/settings", icon: Settings, label: "Settings", iconColor: "text-gray-300" },
];

/* ─────────────────────────────────────────────
   SIDEBAR LINK
   ───────────────────────────────────────────── */
const SidebarLink = ({ item, onNavigate }) => {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `relative flex items-center gap-4 rounded-lg px-6 py-3 transition-all duration-300 ${
          isActive ? "bg-white text-blue-900 shadow-md" : "text-blue-100 hover:bg-blue-800 hover:text-white"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute left-0 top-0 h-full w-1 rounded-r-md bg-cyan-400" />}
          <Icon size={20} className={`shrink-0 transition-transform duration-300 ${isActive ? "text-blue-900" : item.iconColor}`} />
          <span className="text-[15px] font-medium tracking-wide">{item.label}</span>
        </>
      )}
    </NavLink>
  );
};

/* ─────────────────────────────────────────────
   SIDEBAR CONTENT
   ───────────────────────────────────────────── */
const SidebarContent = ({ onNavigate }) => (
  <div className="flex h-full flex-col bg-gradient-to-b from-blue-800 to-cyan-700 text-white">
    {/* Logo */}
    <div className="border-b border-blue-700 px-8 py-8">
      <Link to="/transport/overview" onClick={onNavigate}>
        <h1 className="text-2xl font-bold tracking-wide text-white">DEEWARAYA</h1>
        <p className="mt-1 text-xs uppercase tracking-widest text-blue-300">Transport &amp; Returns</p>
      </Link>
    </div>

    {/* Navigation */}
    <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6" aria-label="Transport navigation">
      {navItems.map((item) => (
        <SidebarLink key={item.to} item={item} onNavigate={onNavigate} />
      ))}
    </nav>

    {/* Footer */}
    <div className="border-t border-blue-700 px-6 py-4 text-center">
      <p className="text-xs text-blue-300">Fish Transportation &amp; Delivery</p>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */
const TransportSidebar = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const closeMobile = () => setIsMobileOpen(false);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  // Let TransportNav's hamburger open the drawer (same pattern as OwnerSidebar)
  useEffect(() => {
    window.__openTransportSidebar = () => setIsMobileOpen(true);
    return () => {
      delete window.__openTransportSidebar;
    };
  }, []);

  return (
    <>
      {/* ═════════════ MOBILE + TABLET DRAWER ═════════════ */}
      <div
        onClick={closeMobile}
        className={`fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isMobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed left-0 top-0 z-[120] h-full w-72 shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!isMobileOpen}
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

export default TransportSidebar;
