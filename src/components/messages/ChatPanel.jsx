// One conversation: header (online, search, SOS), pinned bar, messages, composer.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { ArrowLeft, Loader2, Pin, Search, ShieldAlert, Siren, X } from "lucide-react";
import MessageBubble from "./MessageBubble";
import Composer from "./Composer";
import { discardPending, errorText, getMessageSocket, messagesApi, pendingFor } from "../../services/messagesApi";

const sameThread = (thread, m, myId) =>
  thread.type === "admin" ? !m.boat && String(m.recipient) === myId : String(m.boat?._id || m.boat) === thread.id;

const dayLabel = (d, t) => {
  const x = new Date(d);
  const today = new Date();
  const y = new Date(Date.now() - 86400000);
  if (x.toDateString() === today.toDateString()) return t("messages.today", "Today");
  if (x.toDateString() === y.toDateString()) return t("messages.yesterday", "Yesterday");
  return x.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
};

const lastSeenText = (c, t) => {
  if (!c) return "";
  if (c.online) return t("messages.online", "Online");
  if (!c.lastSeen) return t("messages.offline", "Offline");
  return `${t("messages.lastSeen", "Last seen")} ${new Date(c.lastSeen).toLocaleString([], { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}`;
};

export default function ChatPanel({ thread, role, me, onBack, onActivity }) {
  const { t, i18n } = useTranslation();
  const myId = String(me?.id || me?._id || "");
  const [items, setItems] = useState([]);
  const [pinned, setPinned] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [pending, setPending] = useState(() => pendingFor(thread.id));
  const [translations, setTranslations] = useState({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState({ q: "", date: "" });
  const [results, setResults] = useState(null);
  const [sosOpen, setSosOpen] = useState(false);
  const [sosBusy, setSosBusy] = useState(false);
  const [prices, setPrices] = useState([]);
  const listRef = useRef(null);
  const stick = useRef(true);
  const readOnly = thread.type === "admin";

  const scrollBottom = () => requestAnimationFrame(() => listRef.current && (listRef.current.scrollTop = listRef.current.scrollHeight));

  const markRead = useCallback(() => {
    messagesApi.read(thread.id).then(() => onActivity?.()).catch(() => {});
  }, [thread.id, onActivity]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await messagesApi.messages(thread.id);
      setItems(r.data);
      setPinned(r.pinned || []);
      setHasMore(r.hasMore);
      stick.current = true;
      scrollBottom();
      markRead();
    } catch (e) {
      toast.error(errorText(e, t("messages.loadFailed", "Couldn't load messages")));
    } finally {
      setLoading(false);
    }
  }, [thread.id, markRead, t]);

  useEffect(() => {
    load();
    setResults(null);
    setSearchOpen(false);
    setPending(pendingFor(thread.id));
  }, [load, thread.id]);

  useEffect(() => {
    messagesApi.fishPrices().then(setPrices).catch(() => {});
  }, []);

  // Outbox changes (queued / flushed)
  useEffect(() => {
    const onOutbox = () => setPending(pendingFor(thread.id));
    window.addEventListener("dw:outbox", onOutbox);
    return () => window.removeEventListener("dw:outbox", onOutbox);
  }, [thread.id]);

  // Live updates
  useEffect(() => {
    const socket = getMessageSocket();
    if (!socket) return undefined;
    const onNew = (m) => {
      if (!sameThread(thread, m, myId)) return;
      setItems((cur) => (cur.some((x) => x._id === m._id) ? cur : [...cur, m]));
      if (m.clientId) discardPending(m.clientId);
      const fromMe = String(m.sender?._id || "") === myId;
      if (!fromMe) {
        socket.emit("message:delivered", { ids: [m._id] });
        if (document.visibilityState === "visible") markRead();
      }
      if (m.pinned) setPinned((p) => [m, ...p.filter((x) => x._id !== m._id)]);
      if (stick.current || fromMe) scrollBottom();
      onActivity?.();
    };
    const onStatus = ({ ids, deliveredAt, readAt }) =>
      setItems((cur) => cur.map((m) => (ids.includes(m._id) ? { ...m, deliveredAt: m.deliveredAt || deliveredAt || null, readAt: m.readAt || readAt || null } : m)));
    const onUpdated = (m) => {
      if (!sameThread(thread, m, myId)) return;
      setItems((cur) => cur.map((x) => (x._id === m._id ? m : x)));
      setPinned((p) => (m.pinned ? [m, ...p.filter((x) => x._id !== m._id)] : p.filter((x) => x._id !== m._id)));
    };
    const onRefresh = ({ boatId }) => boatId === thread.id && load();
    socket.on("message:new", onNew);
    socket.on("message:status", onStatus);
    socket.on("message:updated", onUpdated);
    socket.on("message:refresh", onRefresh);
    return () => {
      socket.off("message:new", onNew);
      socket.off("message:status", onStatus);
      socket.off("message:updated", onUpdated);
      socket.off("message:refresh", onRefresh);
    };
  }, [thread, myId, markRead, load, onActivity]);

  const loadOlder = async () => {
    if (!items.length) return;
    setLoadingOlder(true);
    const el = listRef.current;
    const prevHeight = el?.scrollHeight || 0;
    try {
      const r = await messagesApi.messages(thread.id, { before: items[0].createdAt });
      setItems((cur) => [...r.data, ...cur]);
      setHasMore(r.hasMore);
      requestAnimationFrame(() => el && (el.scrollTop = el.scrollHeight - prevHeight));
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setLoadingOlder(false);
    }
  };

  const runSearch = async (e) => {
    e?.preventDefault();
    if (!search.q.trim() && !search.date) return setResults(null);
    try {
      const r = await messagesApi.messages(thread.id, { q: search.q.trim() || undefined, date: search.date || undefined, limit: 100 });
      setResults(r.data);
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  const onSent = ({ message }) => {
    if (message) {
      setItems((cur) => (cur.some((x) => x._id === message._id) ? cur : [...cur, message]));
      onActivity?.();
    }
    setPending(pendingFor(thread.id));
    stick.current = true;
    scrollBottom();
  };

  const act = async (fn, ok) => {
    try {
      const m = await fn();
      if (m?._id) setItems((cur) => cur.map((x) => (x._id === m._id ? m : x)));
      if (ok) toast.success(ok);
    } catch (e) {
      toast.error(errorText(e));
    }
  };

  const translate = async (m) => {
    const to = i18n.language?.startsWith("si") ? "si" : "en";
    try {
      const r = await messagesApi.translate(m._id, to === "si" && /[඀-෿]/.test(m.text || "") ? "en" : to);
      setTranslations((cur) => ({ ...cur, [m._id]: r.text }));
    } catch (e) {
      toast.error(errorText(e));
    }
  };

  const sendSos = async () => {
    setSosBusy(true);
    const position = await new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition((p) => resolve(p.coords), () => resolve(null), { enableHighAccuracy: true, timeout: 10000 });
    });
    try {
      const r = await messagesApi.sos({ emergencyType: "other", message: t("messages.sosFromChat", "SOS sent from messages"), latitude: position?.latitude, longitude: position?.longitude });
      toast.success(r.message || t("messages.sosSent", "SOS sent to the boat owner"));
      setSosOpen(false);
    } catch (e) {
      toast.error(errorText(e, t("messages.sosFailed", "SOS failed — call the owner directly")));
    } finally {
      setSosBusy(false);
    }
  };

  const shown = results || items;
  const pendingItems = useMemo(
    () => pending.map((p) => ({ _id: `pending-${p.body.clientId}`, ...p.body, senderRole: role, sender: { _id: myId }, createdAt: p.queuedAt, catch: p.body.kind === "catch" ? { fishName: p.body.fishName, quantityKg: p.body.quantityKg } : undefined, location: p.body.kind === "location" ? { latitude: p.body.latitude, longitude: p.body.longitude } : undefined })),
    [pending, role, myId]
  );
  const c = thread.counterpart;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        {onBack && (
          <button type="button" onClick={onBack} className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 md:hidden" aria-label={t("messages.back", "Back")}>
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="relative">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${readOnly ? "bg-indigo-500" : "bg-gradient-to-br from-blue-600 to-cyan-500"}`}>
            {readOnly ? <ShieldAlert size={18} /> : (c?.name || "?").slice(0, 1).toUpperCase()}
          </div>
          {!readOnly && <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${c?.online ? "bg-emerald-500" : "bg-slate-300"}`} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-800">{readOnly ? "Deewaraya Admin" : c?.name || t("messages.noDriver", "No driver assigned")}</p>
          <p className="truncate text-xs text-slate-500">{readOnly ? t("messages.adminInfo", "Messages from the system admin") : `${thread.boat?.boatName || ""} · ${lastSeenText(c, t)}`}</p>
        </div>
        <button type="button" onClick={() => { setSearchOpen((v) => !v); setResults(null); }} className={`rounded-full p-2 ${searchOpen ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-100"}`} aria-label={t("messages.search", "Search messages")}>
          <Search size={19} />
        </button>
        {role === "driver" && !readOnly && (
          <button type="button" onClick={() => setSosOpen(true)} className="flex items-center gap-1 rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-red-700" aria-label="SOS">
            <Siren size={15} /> SOS
          </button>
        )}
      </div>

      {searchOpen && (
        <form onSubmit={runSearch} className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
          <input value={search.q} onChange={(e) => setSearch({ ...search, q: e.target.value })} placeholder={t("messages.searchPlaceholder", "Search words, fish, places…")} className="min-w-40 flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm" aria-label={t("messages.search", "Search messages")} />
          <input type="date" value={search.date} onChange={(e) => setSearch({ ...search, date: e.target.value })} className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm" aria-label={t("messages.date", "Date")} />
          <button type="submit" className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white">{t("messages.find", "Find")}</button>
          {results && (
            <button type="button" onClick={() => { setResults(null); setSearch({ q: "", date: "" }); }} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
              <X size={14} /> {t("messages.clear", "Clear")} ({results.length})
            </button>
          )}
        </form>
      )}

      {/* Pinned */}
      {pinned.length > 0 && !results && (
        <div className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          <Pin size={15} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            {pinned.slice(0, 2).map((p) => (
              <p key={p._id} className="truncate">
                <span className="font-semibold">{p.kind === "sos" ? "🆘 SOS" : p.sender?.name || "Deewaraya"}:</span> {p.text || (p.kind === "catch" ? `${p.catch?.fishName} ${p.catch?.quantityKg} kg` : p.kind)}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        ref={listRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-8"
      >
        {loading ? (
          <div className="flex h-full items-center justify-center text-slate-400"><Loader2 className="animate-spin" /></div>
        ) : (
          <>
            {hasMore && !results && (
              <div className="mb-2 text-center">
                <button type="button" onClick={loadOlder} disabled={loadingOlder} className="rounded-full bg-white px-4 py-1 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-100">
                  {loadingOlder ? t("messages.loading", "Loading…") : t("messages.older", "Load older messages")}
                </button>
              </div>
            )}
            {!shown.length && !pendingItems.length && (
              <p className="mt-16 text-center text-sm text-slate-400">{results ? t("messages.noResults", "No messages found") : t("messages.empty", "No messages yet. Say hello 👋")}</p>
            )}
            {shown.map((m, i) => {
              const showDay = i === 0 || new Date(shown[i - 1].createdAt).toDateString() !== new Date(m.createdAt).toDateString();
              return (
                <div key={m._id}>
                  {showDay && <p className="my-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">{dayLabel(m.createdAt, t)}</p>}
                  <MessageBubble
                    m={m}
                    mine={String(m.sender?._id || "") === myId}
                    role={role}
                    prices={prices}
                    translation={translations[m._id]}
                    onPin={(x) => act(() => messagesApi.pin(x._id), x.pinned ? t("messages.unpinned", "Unpinned") : t("messages.pinned", "Pinned"))}
                    onDelete={(x) => act(() => messagesApi.remove(x._id))}
                    onTranslate={translate}
                    onFinance={(x, price) => act(() => messagesApi.toFinance(x._id, price), t("messages.addedToFinance", "Added to daily finance"))}
                  />
                </div>
              );
            })}
            {!results && pendingItems.map((m) => <MessageBubble key={m._id} m={m} mine pending role={role} onPin={() => {}} onDelete={() => {}} onTranslate={() => {}} onFinance={() => {}} />)}
          </>
        )}
      </div>

      {readOnly ? (
        <p className="border-t border-slate-200 bg-white px-4 py-3 text-center text-xs text-slate-500">{t("messages.adminReadOnly", "Replies to the admin aren't available here. Use Contact for support.")}</p>
      ) : thread.counterpart ? (
        <Composer threadId={thread.id} role={role} onSent={onSent} fishNames={prices.map((p) => String(p.name).split(" (")[0])} />
      ) : (
        <p className="border-t border-slate-200 bg-white px-4 py-3 text-center text-xs text-slate-500">{t("messages.assignDriverFirst", "Assign a driver to this boat to start chatting.")}</p>
      )}

      {/* SOS confirm */}
      {sosOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600"><Siren size={28} /></div>
            <h3 className="text-lg font-bold text-slate-800">{t("messages.sosTitle", "Send SOS?")}</h3>
            <p className="mt-1 text-sm text-slate-600">{t("messages.sosText", "Your owner gets an emergency alert with your location by WhatsApp and here in Messages.")}</p>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setSosOpen(false)} disabled={sosBusy} className="flex-1 rounded-xl bg-slate-100 py-2.5 font-semibold text-slate-700">{t("messages.cancel", "Cancel")}</button>
              <button type="button" onClick={sendSos} disabled={sosBusy} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 font-semibold text-white">
                {sosBusy && <Loader2 size={16} className="animate-spin" />} {t("messages.sendSos", "Send SOS")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
