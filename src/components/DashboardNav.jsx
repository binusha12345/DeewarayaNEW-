// src/components/DashboardNav.jsx

import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";

/* ─────────────────────────────────────────────
   NAV LINKS DATA
   ───────────────────────────────────────────── */
const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/signal-indicator", label: "Signal Indicator" },
  { to: "/contact", label: "Contact" },
];

/* ─────────────────────────────────────────────
   DESKTOP NAV LINK
   ───────────────────────────────────────────── */
const DesktopNavLink = ({ to, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `relative transition-colors duration-300 ${
        isActive ? "text-white" : "text-blue-200 hover:text-white"
      }`
    }
  >
    {({ isActive }) => (
      <span className="relative">
        {label}
        {isActive && (
          <span className="absolute -bottom-2 left-0 h-[2px] w-full rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
        )}
      </span>
    )}
  </NavLink>
);

/* ─────────────────────────────────────────────
   MOBILE NAV LINK (used inside mobile dropdown)
   ───────────────────────────────────────────── */
const MobileNavLink = ({ to, label, onNavigate }) => (
  <NavLink
    to={to}
    onClick={onNavigate}
    className={({ isActive }) =>
      `block rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
        isActive
          ? "bg-white/15 text-white"
          : "text-blue-100 hover:bg-white/10 hover:text-white"
      }`
    }
  >
    {label}
  </NavLink>
);

/* ─────────────────────────────────────────────
   MAIN NAVBAR
   ───────────────────────────────────────────── */
const DashboardNav = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const openMobileMenu = () => setIsMobileMenuOpen(true);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Close mobile menu on route change if user navigates
  useEffect(() => {
    return () => setIsMobileMenuOpen(false);
  }, []);

  // Trigger sidebar open (uses global exposed by OwnerSidebar)
const openSidebar = () => {
  if (typeof window === "undefined") return;

  if (window.__openOwnerSidebar) {
    window.__openOwnerSidebar();
  } else if (window.__openDriverSidebar) {
    window.__openDriverSidebar();
  }
};

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-gradient-to-r from-blue-900 via-cyan-700 to-blue-950 shadow-md">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-10">
        {/* ─────────── LEFT: hamburger (mobile) + logo ─────────── */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {/* Sidebar hamburger — visible only when sidebar is present (mobile/tablet) */}
          <button
            onClick={openSidebar}
            aria-label="Open sidebar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 lg:hidden"
          >
            <Menu size={20} />
          </button>

          {/* Logo */}
          <h2 className="truncate text-base font-bold tracking-wide text-white sm:text-lg md:text-xl lg:text-2xl">
            Maritime <span className="text-cyan-300">Precision</span>
          </h2>
        </div>

        {/* ─────────── CENTER: desktop nav ─────────── */}
        <nav className="hidden items-center gap-6 text-[15px] font-medium md:flex lg:gap-8 lg:text-[17px]">
          {NAV_LINKS.map((link) => (
            <DesktopNavLink key={link.to} {...link} />
          ))}
        </nav>

        {/* ─────────── RIGHT: language + menu toggle + avatar ─────────── */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
          {/* Language switcher */}
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          {/* Mobile menu toggle (for Home/About/Contact) - shown on small screens only */}
          <button
            onClick={() =>
              isMobileMenuOpen ? closeMobileMenu() : openMobileMenu()
            }
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 md:hidden"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Avatar */}
          <button
            aria-label="User profile"
            className="group relative h-9 w-9 shrink-0 cursor-pointer rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 p-[2px] shadow-md sm:h-10 sm:w-10 lg:h-11 lg:w-11"
          >
            <div className="h-full w-full overflow-hidden rounded-full border-2 border-blue-900">
              <img
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
                alt="User Profile"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
            </div>
          </button>
        </div>
      </div>

      {/* ─────────── MOBILE MENU (below navbar, slides down) ─────────── */}
      <div
        className={`overflow-hidden border-t border-white/10 bg-blue-950/95 backdrop-blur-sm transition-all duration-300 md:hidden ${
          isMobileMenuOpen ? "max-h-[400px]" : "max-h-0"
        }`}
      >
        <nav className="space-y-1 px-4 py-3">
          {NAV_LINKS.map((link) => (
            <MobileNavLink
              key={link.to}
              {...link}
              onNavigate={closeMobileMenu}
            />
          ))}

          {/* Language switcher inside menu on very small screens */}
          <div className="border-t border-white/10 pt-3 sm:hidden">
            <LanguageSwitcher />
          </div>
        </nav>
      </div>
    </header>
  );
};

export default DashboardNav;