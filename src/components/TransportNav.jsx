// src/components/TransportNav.jsx
// Transport & Return Manager top bar — same look as DashboardNav (boat owner),
// plus the manager's notification bell, dark-mode switch and account menu.

import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Anchor, Bell, LogOut, Menu, Moon, Sun, UserRound, X } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useAuth } from "../context/AuthContext";
import { useThemeContext } from "../context/ThemeContext";
import { apiUrl } from "../services/api";

const DesktopNavLink = ({ to, label, end }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) => `relative transition-colors duration-300 ${isActive ? "text-white" : "text-blue-200 hover:text-white"}`}
  >
    {({ isActive }) => (
      <span className="relative">
        {label}
        {isActive && <span className="absolute -bottom-2 left-0 h-[2px] w-full rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />}
      </span>
    )}
  </NavLink>
);

const MobileNavLink = ({ to, label, end, onNavigate }) => (
  <NavLink
    to={to}
    end={end}
    onClick={onNavigate}
    className={({ isActive }) =>
      `block rounded-lg px-4 py-3 text-sm font-medium transition-colors ${isActive ? "bg-white/15 text-white" : "text-blue-100 hover:bg-white/10 hover:text-white"}`
    }
  >
    {label}
  </NavLink>
);

const TransportNav = ({ unread = 0 }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useThemeContext();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  const navLinks = [
    { to: "/", label: t("nav.home", "Home"), end: true },
    { to: "/transport/overview", label: "Dashboard" },
    { to: "/transport/deliveries", label: "Deliveries" },
    { to: "/contact", label: t("nav.contact", "Contact") },
  ];

  // Close the account menu on outside click / Escape
  useEffect(() => {
    if (!accountOpen) return undefined;
    const onDown = (e) => accountRef.current && !accountRef.current.contains(e.target) && setAccountOpen(false);
    const onKey = (e) => e.key === "Escape" && setAccountOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);

  const openSidebar = () => window.__openTransportSidebar?.();
  const doLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-gradient-to-r from-blue-900 via-cyan-700 to-blue-950 shadow-md">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-10">
        {/* LEFT: sidebar hamburger (mobile/tablet) + logo */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            onClick={openSidebar}
            aria-label="Open sidebar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 lg:hidden"
          >
            <Menu size={20} />
          </button>
          <Anchor aria-hidden="true" className="h-6 w-6 shrink-0 text-cyan-200 sm:h-7 sm:w-7" />
        </div>

        {/* CENTER: desktop links */}
        <nav className="hidden items-center gap-6 text-[15px] font-medium md:flex lg:gap-8 lg:text-[17px]">
          {navLinks.map((link) => (
            <DesktopNavLink key={link.to} {...link} />
          ))}
        </nav>

        {/* RIGHT: language, bell, theme, mobile menu, avatar */}
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          <button
            type="button"
            onClick={() => navigate("/transport/notifications")}
            aria-label={`Notifications (${unread} unread)`}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10"
          >
            <Bell size={19} />
            {unread > 0 && (
              <span className="absolute right-0.5 top-0.5 min-w-4 rounded-full bg-red-500 px-1 text-[10px] font-bold leading-4 text-white ring-2 ring-blue-900">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="hidden h-9 w-9 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 sm:flex"
          >
            {mode === "dark" ? <Sun size={19} /> : <Moon size={19} />}
          </button>

          <button
            onClick={() => setIsMobileMenuOpen((o) => !o)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 md:hidden"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Avatar + account menu */}
          <div className="relative" ref={accountRef}>
            <button
              type="button"
              onClick={() => setAccountOpen((o) => !o)}
              aria-label="Account menu"
              aria-expanded={accountOpen}
              className="group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 p-[2px] shadow-md sm:h-10 sm:w-10 lg:h-11 lg:w-11"
            >
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-blue-900 bg-blue-950 text-white transition-transform duration-300 group-hover:scale-105">
                {user?.profilePicture ? (
                  <img src={apiUrl(user.profilePicture)} alt={`${user.name || "User"} profile`} className="h-full w-full object-cover" />
                ) : (
                  <UserRound size={19} aria-hidden="true" />
                )}
              </div>
            </button>
            {accountOpen && (
              <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <div className="bg-gradient-to-r from-blue-900 to-cyan-700 px-4 py-3 text-white">
                  <p className="truncate text-sm font-bold">{user?.name}</p>
                  <p className="truncate text-xs text-blue-100">{user?.email}</p>
                  <span className="mt-2 inline-block rounded-full border border-white/30 bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold">🚚 Transport Manager</span>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={toggleTheme}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 sm:hidden dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {mode === "dark" ? <Sun size={16} /> : <Moon size={16} />} {mode === "dark" ? "Light mode" : "Dark mode"}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={doLogout}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <LogOut size={16} /> Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE MENU (slides down) */}
      <div className={`overflow-hidden border-t border-white/10 bg-blue-950/95 backdrop-blur-sm transition-all duration-300 md:hidden ${isMobileMenuOpen ? "max-h-[400px]" : "max-h-0"}`}>
        <nav className="space-y-1 px-4 py-3">
          {navLinks.map((link) => (
            <MobileNavLink key={link.to} {...link} onNavigate={() => setIsMobileMenuOpen(false)} />
          ))}
          <div className="border-t border-white/10 pt-3 sm:hidden">
            <LanguageSwitcher />
          </div>
        </nav>
      </div>
    </header>
  );
};

export default TransportNav;
