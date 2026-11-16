// Boat owner — Messages: one chat per boat/driver, plus "message all drivers" and admin inbox.
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Loader2, Megaphone, MessageSquare, Search, ShieldAlert, X } from "lucide-react";
import OwnerSidebar from "../../../components/OwnerSidebar";
import DashboardNav from "../../../components/DashboardNav";
import ChatPanel from "../../../components/messages/ChatPanel";
import { useAuth } from "../../../context/AuthContext";
import { errorText, messagesApi } from "../../../services/messagesApi";
import { previewText, uiLang } from "../../../components/messages/messageText";

const shortTime = (d) => {
  if (!d) return "";
  const x = new Date(d);
  return x.toDateString() === new Date().toDateString() ? x.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : x.toLocaleDateString([], { day: "numeric", month: "short" });
};

export default function OwnerMessages() {
  const { t, i18n } = useTranslation();
  const lang = uiLang(i18n);
  const { user } = useAuth();
  const [threads, setThreads] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [filter, setFilter] = useState("");
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastText, setBroadcastText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    messagesApi
      .threads()
      .then(setThreads)
      .catch((e) => setError(errorText(e, t("messages.loadFailed", "Couldn't load messages"))));
  }, [t]);

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [load]);

  const sendBroadcast = async () => {
    if (!broadcastText.trim()) return;
    setBusy(true);
    try {
      const r = await messagesApi.broadcast(broadcastText.trim());
      toast.success(t("messages.broadcastSent", "Sent to {{count}} driver(s)", { count: r.count }));
      setBroadcastText("");
      setBroadcastOpen(false);
      load();
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const list = (threads || []).filter((th) => {
    const q = filter.trim().toLowerCase();
    return !q || [th.boat?.boatName, th.counterpart?.name, th.boat?.registrationNumber].some((v) => String(v || "").toLowerCase().includes(q));
  });
  const active = threads?.find((x) => x.id === activeId);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans text-slate-800">
      <OwnerSidebar />
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardNav />
        <main className="flex min-h-0 flex-1 flex-col p-3 sm:p-5 md:p-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h1 className="flex items-center gap-2 text-2xl font-bold text-blue-950">
              <MessageSquare className="text-blue-600" /> {t("messages.title", "Messages")}
            </h1>
            <button type="button" onClick={() => setBroadcastOpen(true)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700">
              <Megaphone size={16} /> {t("messages.messageAll", "Message all drivers")}
            </button>
          </div>

          {error && <p className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <div className="flex min-h-0 flex-1 gap-4">
            {/* Conversation list */}
            <aside className={`min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:flex md:w-80 ${active ? "hidden" : "flex"}`}>
              <div className="border-b border-slate-100 p-3">
                <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2">
                  <Search size={16} className="text-slate-400" />
                  <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={t("messages.findBoat", "Find boat or driver")} className="w-full bg-transparent text-sm outline-none" aria-label={t("messages.findBoat", "Find boat or driver")} />
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {!threads ? (
                  <div className="flex justify-center p-8 text-slate-400"><Loader2 className="animate-spin" /></div>
                ) : !list.length ? (
                  <p className="p-6 text-center text-sm text-slate-500">{threads.length ? t("messages.noMatch", "No matches") : t("messages.noBoats", "Add a boat and assign a driver to start chatting.")}</p>
                ) : (
                  list.map((th) => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => setActiveId(th.id)}
                      className={`flex w-full items-center gap-3 border-b border-slate-50 px-4 py-3 text-left transition ${activeId === th.id ? "bg-blue-50" : "hover:bg-slate-50"}`}
                    >
                      <div className="relative shrink-0">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-full font-bold text-white ${th.type === "admin" ? "bg-indigo-500" : "bg-gradient-to-br from-blue-600 to-cyan-500"}`}>
                          {th.type === "admin" ? <ShieldAlert size={18} /> : (th.counterpart?.name || th.boat?.boatName || "?").slice(0, 1).toUpperCase()}
                        </div>
                        {th.type === "boat" && th.counterpart && <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${th.counterpart.online ? "bg-emerald-500" : "bg-slate-300"}`} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate font-semibold text-slate-800">{th.type === "admin" ? "Deewaraya Admin" : th.boat?.boatName}</p>
                          <span className="shrink-0 text-[11px] text-slate-400">{shortTime(th.lastMessage?.createdAt)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm text-slate-500">
                            {th.type === "boat" && !th.counterpart ? t("messages.noDriver", "No driver assigned") : (th.lastMessage ? previewText(th.lastMessage, t, lang) : th.counterpart?.name)}
                          </p>
                          {th.unread > 0 && <span className="shrink-0 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{th.unread}</span>}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </aside>

            {/* Chat */}
            <section className={`min-h-0 flex-1 ${active ? "block" : "hidden md:block"}`}>
              {active ? (
                <ChatPanel key={active.id} thread={active} role="owner" me={user} onBack={() => setActiveId(null)} onActivity={load} />
              ) : (
                <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                  <MessageSquare size={40} className="mb-3 text-slate-300" />
                  <p className="font-semibold text-slate-700">{t("messages.pickChat", "Choose a boat to open the chat")}</p>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      {broadcastOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800"><Megaphone size={20} className="text-blue-600" /> {t("messages.messageAll", "Message all drivers")}</h3>
              <button type="button" onClick={() => setBroadcastOpen(false)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100" aria-label={t("messages.cancel", "Cancel")}><X size={18} /></button>
            </div>
            <textarea value={broadcastText} onChange={(e) => setBroadcastText(e.target.value)} rows={4} maxLength={2000} placeholder={t("messages.broadcastPlaceholder", "e.g. No trips tomorrow — storm warning.")} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400" />
            <p className="mt-1 text-xs text-slate-500">{t("messages.broadcastHint", "Goes to every boat that has a driver. Drivers who are offline also get it by WhatsApp.")}</p>
            <button type="button" onClick={sendBroadcast} disabled={busy || !broadcastText.trim()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 font-semibold text-white disabled:opacity-50">
              {busy && <Loader2 size={16} className="animate-spin" />} {t("messages.send", "Send")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
