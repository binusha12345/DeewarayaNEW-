import { useEffect, useState } from "react";
import { Bell, Check, Radio } from "lucide-react";
import { io } from "socket.io-client";
import DashboardNav from "../../../components/DashboardNav";
import OwnerSidebar from "../../../components/OwnerSidebar";
import api from "../../../services/api";

const SOCKET_ORIGIN = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    let active = true;
    api.get("/notifications").then(({ data }) => {
      if (active) setNotifications(Array.isArray(data) ? data : []);
    }).catch(() => {});

    const socket = io(SOCKET_ORIGIN, { auth: { token }, transports: ["websocket", "polling"] });
    socket.on("notification:new", (notification) => {
      setNotifications((current) => [notification, ...current.filter((item) => item._id !== notification._id)]);
    });
    return () => {
      active = false;
      socket.disconnect();
    };
  }, [token]);

  const markRead = async (id) => {
    try {
      const { data } = await api.patch(`/notifications/${id}/read`);
      setNotifications((current) => current.map((item) => item._id === id ? data : item));
    } catch {
      // Keep the item unread if the server could not confirm the update.
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 text-slate-900">
      <OwnerSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardNav />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-9">
          <div className="mx-auto max-w-4xl">
            <div className="mb-7 flex items-center gap-3">
              <div className="rounded-lg bg-cyan-900 p-3 text-white"><Bell size={21} /></div>
              <div><p className="text-sm font-semibold uppercase text-cyan-800">Fleet alerts</p><h1 className="text-2xl font-bold sm:text-3xl">Notifications</h1></div>
            </div>
            <div className="divide-y divide-slate-200 border-y border-slate-200 bg-white">
              {notifications.length === 0 ? (
                <p className="px-5 py-12 text-center text-sm text-slate-500">No notifications yet.</p>
              ) : notifications.map((item) => (
                <article key={item._id} className={`flex items-start gap-4 px-4 py-5 sm:px-6 ${item.readAt ? "bg-white" : "bg-cyan-50/60"}`}>
                  <div className={`mt-0.5 rounded-lg p-2 ${item.type === "connection_warning" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}><Radio size={18} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{item.message}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.boat?.registrationNumber || "Boat"}{item.latency != null ? ` · ${item.latency} ms` : ""} · {new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                  {!item.readAt && <button onClick={() => markRead(item._id)} aria-label="Mark notification as read" title="Mark as read" className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><Check size={18} /></button>}
                </article>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}