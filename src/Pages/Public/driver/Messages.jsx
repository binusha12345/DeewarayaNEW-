// Boat driver — Messages (chat with the boat owner).
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, MessageSquare } from "lucide-react";
import DriverSidebar from "../../../components/DriverSidebar";
import DashboardNav from "../../../components/DashboardNav";
import ChatPanel from "../../../components/messages/ChatPanel";
import { useAuth } from "../../../context/AuthContext";
import { errorText, messagesApi } from "../../../services/messagesApi";

export default function DriverMessages() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [threads, setThreads] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    messagesApi
      .threads()
      .then((list) => {
        setThreads(list);
        setActiveId((cur) => cur || list.find((x) => x.type === "boat")?.id || list[0]?.id || null);
      })
      .catch((e) => setError(errorText(e, t("messages.loadFailed", "Couldn't load messages"))));
  }, [t]);

  useEffect(() => {
    load();
    const id = setInterval(load, 60000); // refresh online status / unread
    return () => clearInterval(id);
  }, [load]);

  const active = threads?.find((x) => x.id === activeId);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] font-sans text-slate-800">
      <DriverSidebar />
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardNav />
        <main className="flex min-h-0 flex-1 flex-col p-3 sm:p-5 md:p-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h1 className="flex items-center gap-2 text-2xl font-bold text-blue-950">
              <MessageSquare className="text-blue-600" /> {t("messages.title", "Messages")}
            </h1>
            {threads && threads.length > 1 && (
              <div className="flex gap-1 rounded-xl bg-slate-200/70 p-1">
                {threads.map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => setActiveId(th.id)}
                    className={`relative rounded-lg px-3 py-1.5 text-sm font-semibold ${activeId === th.id ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`}
                  >
                    {th.type === "admin" ? t("messages.admin", "Admin") : th.boat?.boatName}
                    {th.unread > 0 && <span className="ml-1.5 rounded-full bg-red-500 px-1.5 text-[10px] text-white">{th.unread}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1">
            {error ? (
              <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
            ) : !threads ? (
              <div className="flex h-full items-center justify-center text-slate-400"><Loader2 className="animate-spin" /></div>
            ) : !active ? (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <MessageSquare size={40} className="mb-3 text-slate-300" />
                <p className="font-semibold text-slate-700">{t("messages.noBoatTitle", "No boat assigned yet")}</p>
                <p className="mt-1 max-w-sm text-sm text-slate-500">{t("messages.noBoatText", "When a boat owner assigns you to a boat, you can chat with them here.")}</p>
              </div>
            ) : (
              <ChatPanel key={active.id} thread={active} role="driver" me={user} onActivity={load} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
