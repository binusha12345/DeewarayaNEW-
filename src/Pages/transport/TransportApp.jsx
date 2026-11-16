// Transport & Return Manager dashboard — mounted at /transport/* for role "transport_manager".
import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { API_ORIGIN } from "../../services/api";
import transportApi from "../../services/transportApi";
import TransportNav from "../../components/TransportNav";
import TransportSidebar from "../../components/TransportSidebar";
import { Spinner } from "./ui";
import { TransportContext } from "./hooks";

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

const TransportApp = () => {
  const { token } = useAuth();
  const [meta, setMeta] = useState(null);
  const [unread, setUnread] = useState(0);

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

  return (
    <TransportContext.Provider value={{ meta, socket, setUnread }}>
      {/* Same layout as the boat owner dashboard: sidebar + top navbar + scrolling content */}
      <div className="flex h-screen overflow-hidden bg-slate-100 font-sans text-slate-800 dark:bg-slate-950 dark:text-slate-100">
        <TransportSidebar />
        <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
          <TransportNav unread={unread} />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
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
            </div>
          </main>
        </div>
      </div>
    </TransportContext.Provider>
  );
};

export default TransportApp;
