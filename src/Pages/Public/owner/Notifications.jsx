import { useEffect, useState } from "react";
import { Bell, Check, MapPin, QrCode, Radio, Share2, Siren } from "lucide-react";
import { io } from "socket.io-client";
import DashboardNav from "../../../components/DashboardNav";
import OwnerSidebar from "../../../components/OwnerSidebar";
import api, { API_ORIGIN } from "../../../services/api";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [sharingRequestId, setSharingRequestId] = useState("");
  const [actionError, setActionError] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    let active = true;
    api.get("/notifications").then(({ data }) => {
      if (active) setNotifications(Array.isArray(data) ? data : []);
    }).catch(() => {});

    const socket = io(API_ORIGIN, { auth: { token }, transports: ["websocket", "polling"] });
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

  const shareQrCode = async (id) => {
    setSharingRequestId(id);
    setActionError("");
    try {
      const { data } = await api.post(`/notifications/${id}/share-qr`);
      setNotifications((current) => current.map((item) => item._id === id ? data : item));
    } catch (error) {
      setActionError(error.response?.data?.message || "Could not share this boat QR code.");
    } finally {
      setSharingRequestId("");
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
            {actionError && <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{actionError}</p>}
            <div className="divide-y divide-slate-200 border-y border-slate-200 bg-white">
              {notifications.length === 0 ? (
                <p className="px-5 py-12 text-center text-sm text-slate-500">No notifications yet.</p>
              ) : notifications.map((item) => {
                const isQrRequest = item.type === "qr_request";
                const isSafeUpdate = item.type === "emergency_safe";
                return (
                  <article key={item._id} className={`flex items-start gap-4 px-4 py-5 sm:px-6 ${item.readAt ? "bg-white" : "bg-cyan-50/60"}`}>
                    <div className={`mt-0.5 rounded-lg p-2 ${item.type === "emergency_sos" || item.type === "connection_warning" ? "bg-red-100 text-red-700" : isSafeUpdate ? "bg-emerald-100 text-emerald-700" : isQrRequest ? "bg-blue-100 text-blue-900" : "bg-emerald-100 text-emerald-700"}`}>
                      {item.type === "emergency_sos" ? <Siren size={18} /> : isSafeUpdate ? <Check size={18} /> : isQrRequest ? <QrCode size={18} /> : <Radio size={18} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{item.message}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.boat?.boatName || "Boat"} · {item.boat?.registrationNumber || "Registration unavailable"}
                        {item.latency != null ? ` · ${item.latency} ms` : ""} · {new Date(item.createdAt).toLocaleString()}
                      </p>
                      {item.type === "emergency_sos" && item.latitude != null && item.longitude != null && (
                        <a
                          href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-red-700 hover:underline"
                        >
                          <MapPin size={15} /> Open emergency location
                        </a>
                      )}
                      {isQrRequest && (
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          {item.requestStatus === "shared" ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800"><Check size={15} /> QR code shared with {item.requester?.name || "driver"}</span>
                          ) : (
                            <>
                              <span className="text-xs font-semibold text-slate-600">Requested by {item.requester?.name || "assigned driver"}</span>
                              <button
                                onClick={() => shareQrCode(item._id)}
                                disabled={sharingRequestId === item._id}
                                className="inline-flex items-center gap-2 rounded-md bg-blue-950 px-3 py-2 text-xs font-bold text-white transition hover:bg-cyan-800 disabled:cursor-wait disabled:opacity-60"
                              >
                                <Share2 size={14} />
                                {sharingRequestId === item._id ? "Sharing…" : "Share QR code"}
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    {!isQrRequest && !item.readAt && <button onClick={() => markRead(item._id)} aria-label="Mark notification as read" title="Mark as read" className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><Check size={18} /></button>}
                  </article>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}