// Transport & Return Manager dashboard — mounted at /transport/* for role "transport_manager".
import { useEffect, useMemo, useState } from "react";
import { NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import {
  AlertTriangle, BarChart3, Bell, ClipboardList, Fish, LayoutDashboard, LogOut, Menu, Moon, Receipt,
  Settings, Sun, Truck, Undo2, Users, Wallet, X, Route as RouteIcon,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useThemeContext } from "../../context/ThemeContext";
import { API_ORIGIN } from "../../services/api";
import transportApi from "../../services/transportApi";
import { Spinner } from "./ui";
import { TransportContext, cx } from "./hooks";

import Overview from "./pages/Overview";
import Orders from "./pages/Orders";
import Trucks from "./pages/Trucks";
import Drivers from "./pages/Drivers";
import Assignments from "./pages/Assignments";
import Deliveries from "./pages/Deliveries";
import DeliveryDetail from "./pages/DeliveryDetail";
import Damage from "./pages/Damage";
import Returns from "./pages/Returns";
import Expenses from "./pages/Expenses";
import Payments from "./pages/Payments";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/Settings";
import Notifications from "./pages/Notifications";

const NAV = [
  { to: "overview", label: "Overview", icon: LayoutDashboard },
  { to: "orders", label: "Orders", icon: ClipboardList },
  { to: "trucks", label: "Trucks", icon: Truck },
  { to: "drivers", label: "Drivers", icon: Users },
  { to: "assignments", label: "Assignments", icon: RouteIcon },
  { to: "deliveries", label: "Deliveries", icon: Fish },
  { to: "damage", label: "Damage Management", icon: AlertTriangle },
  { to: "returns", label: "Return Management", icon: Undo2 },
  { to: "expenses", label: "Expenses", icon: Receipt },
  { to: "payments", label: "Payments", icon: Wallet },
  { to: "reports", label: "Reports", icon: BarChart3 },
  { to: "settings", label: "Settings", icon: Settings },
];

const Sidebar = ({ onNavigate }) => (
  <div className="flex h-full flex-col bg-[#102A43] text-white">
    <div className="flex items-center gap-3 px-6 py-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1677FF]"><Truck size={20} /></span>
      <div>
        <p className="text-sm font-bold leading-tight">Deewaraya</p>
        <p className="text-[11px] text-blue-200/80">Transport &amp; Returns</p>
      </div>
    </div>
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4" aria-label="Transport navigation">
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={`/transport/${to}`}
          onClick={onNavigate}
          className={({ isActive }) =>
            cx("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition", isActive ? "bg-white text-[#102A43] shadow" : "text-blue-100/90 hover:bg-white/10 hover:text-white")
          }
        >
          <Icon size={18} /> {label}
        </NavLink>
      ))}
    </nav>
  </div>
);

const TransportApp = () => {
  const { user, token, logout } = useAuth();
  const { mode, toggleTheme } = useThemeContext();
  const navigate = useNavigate();
  const [meta, setMeta] = useState(null);
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    transportApi.meta().then((r) => setMeta(r.data)).catch(() => toast.error("Could not load transport settings"));
    transportApi.notifications({ unread: true, limit: 1 }).then((r) => setUnread(r.unread || 0)).catch(() => {});
  }, []);

  // One socket per login; pages use it to watch deliveries live.
  const socket = useMemo(() => (token ? io(API_ORIGIN, { auth: { token }, transports: ["websocket", "polling"], autoConnect: false }) : null), [token]);
  useEffect(() => {
    if (!socket) return undefined;
    const onNotification = (n) => {
      setUnread((u) => u + 1);
      toast(n.title, { icon: "🔔" });
    };
    socket.on("transport:notification", onNotification);
    socket.connect();
    return () => {
      socket.off("transport:notification", onNotification);
      socket.disconnect();
    };
  }, [socket]);

  const doLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <TransportContext.Provider value={{ meta, socket, setUnread }}>
      <div className="flex min-h-screen bg-[#F5F7FA] dark:bg-slate-950">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block"><Sidebar /></aside>
        {menuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMenuOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-64">
              <button type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} className="absolute right-3 top-5 z-10 rounded-lg p-1 text-white/80 hover:bg-white/10"><X size={18} /></button>
              <Sidebar onNavigate={() => setMenuOpen(false)} />
            </aside>
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 sm:px-6">
            <button type="button" aria-label="Open menu" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300" onClick={() => setMenuOpen(true)}><Menu size={20} /></button>
            <p className="flex-1 truncate text-sm font-semibold text-[#102A43] dark:text-white">Fish Transportation &amp; Delivery</p>
            <button type="button" onClick={() => navigate("/transport/notifications")} className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" aria-label={`Notifications (${unread} unread)`}>
              <Bell size={19} />
              {unread > 0 && <span className="absolute right-1 top-1 min-w-4 rounded-full bg-red-500 px-1 text-[10px] font-bold leading-4 text-white">{unread > 99 ? "99+" : unread}</span>}
            </button>
            <button type="button" onClick={toggleTheme} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" aria-label="Toggle dark mode">
              {mode === "dark" ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{user?.name}</p>
              <p className="text-[11px] text-slate-500">Transport Manager</p>
            </div>
            <button type="button" onClick={doLogout} className="rounded-lg p-2 text-slate-600 hover:bg-red-50 hover:text-red-600 dark:text-slate-300" aria-label="Log out"><LogOut size={19} /></button>
          </header>
          <main className="mx-auto w-full max-w-[1400px] flex-1 p-4 sm:p-6">
            {!meta ? (
              <Spinner />
            ) : (
              <Routes>
                <Route index element={<Navigate to="overview" replace />} />
                <Route path="overview" element={<Overview />} />
                <Route path="orders" element={<Orders />} />
                <Route path="trucks" element={<Trucks />} />
                <Route path="drivers" element={<Drivers />} />
                <Route path="assignments" element={<Assignments />} />
                <Route path="deliveries" element={<Deliveries />} />
                <Route path="deliveries/:id" element={<DeliveryDetail />} />
                <Route path="damage" element={<Damage />} />
                <Route path="returns" element={<Returns />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="payments" element={<Payments />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="*" element={<Navigate to="overview" replace />} />
              </Routes>
            )}
          </main>
        </div>
      </div>
    </TransportContext.Provider>
  );
};

export default TransportApp;
