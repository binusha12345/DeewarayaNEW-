// One conversation: header (online, search, SOS), pinned bar, messages, composer.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { ArrowLeft, Clock, FileDown, FolderOpen, Loader2, MoreVertical, Pin, Search, ShieldAlert, Siren, Users, X } from "lucide-react";
import MessageBubble from "./MessageBubble";
import Composer from "./Composer";
import { discardPending, errorText, getMessageSocket, messagesApi, pendingFor } from "../../services/messagesApi";
import { needsTranslation, previewText, uiLang } from "./messageText";
import FilesPanel from "./FilesPanel";
import { openPrintableChat } from "./exportChat";

const sameThread = (thread, m, myId) => {
  if (thread.type === "admin") return !m.boat && !m.group && String(m.recipient) === myId;
  if (thread.type === "group") return `group:${m.group?._id || m.group}` === thread.id;
  return String(m.boat?._id || m.boat) === thread.id;
};

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
  const lang = uiLang(i18n);
  const [auto, setAuto] = useState({}); // id -> machine translation in the current language
  const [original, setOriginal] = useState(() => new Set()); // ids the user switched back to original
  const requested = useRef(new Set());
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState({ q: "", date: "" });
  const [results, setResults] = useState(null);
  const [sosOpen, setSosOpen] = useState(false);
  const [sosBusy, setSosBusy] = useState(false);
  const [prices, setPrices] = useState([]);
  const listRef = useRef(null);
  const stick = useRef(true);
  const readOnly = thread.type === "admin";
  const isGroup = thread.type === "group";
  const [headerMenu, setHeaderMenu] = useState(false);
  const [filesOpen, setFilesOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportRange, setExportRange] = useState({ from: "", to: "" });
  const [exporting, setExporting] = useState(false);
  const [scheduled, setScheduled] = useState([]);
  const [showScheduled, setShowScheduled] = useState(false);
  const [groupInfo, setGroupInfo] = useState(null);

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
      setGroupInfo(r.info || null);
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

  const loadScheduled = useCallback(() => {
    if (thread.type === "admin") return;
    messagesApi.scheduled(thread.id).then(setScheduled).catch(() => {});
  }, [thread.id, thread.type]);
  useEffect(() => {
    loadScheduled();
    setFilesOpen(false);
  }, [loadScheduled]);

  // Language changed -> forget translations made for the other language.
  useEffect(() => {
    requested.current = new Set();
    setAuto({});
  }, [lang]);

  // Show typed messages in the site's language (English / Sinhala) automatically.
  useEffect(() => {
    const ids = [...items, ...(results || [])]
      .filter((m) => needsTranslation(m, lang) && !m.translations?.[lang] && !requested.current.has(m._id))
      .map((m) => m._id)
      .slice(-40);
    if (!ids.length) return;
    ids.forEach((id) => requested.current.add(id));
    messagesApi
      .translateBatch(ids, lang)
      .then((map) => setAuto((cur) => ({ ...cur, ...map })))
      .catch(() => ids.forEach((id) => requested.current.delete(id)));
  }, [items, results, lang]);

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
      if (String(m.clientId || "").startsWith("sched-")) loadScheduled();
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
  }, [thread, myId, markRead, load, onActivity, loadScheduled]);

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

  const react = (m, emoji) => act(() => messagesApi.react(m._id, emoji));

  const runExport = async () => {
    setExporting(true);
    try {
      const r = await messagesApi.exportThread(thread.id, { from: exportRange.from || undefined, to: exportRange.to || undefined });
      if (!openPrintableChat({ ...r, from: exportRange.from, to: exportRange.to }, { t, lang })) toast.error(t("messages.allowPopups", "Allow pop-ups for this site to export"));
      else setExportOpen(false);
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setExporting(false);
    }
  };

  const toggleOriginal = (m) =>
    setOriginal((cur) => {
      const next = new Set(cur);
      if (next.has(m._id)) next.delete(m._id);
      else next.add(m._id);
      return next;
    });

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
          <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${readOnly ? "bg-indigo-500" : isGroup ? "bg-gradient-to-br from-emerald-500 to-teal-600" : "bg-gradient-to-br from-blue-600 to-cyan-500"}`}>
            {readOnly ? <ShieldAlert size={18} /> : isGroup ? <Users size={18} /> : (c?.name || "?").slice(0, 1).toUpperCase()}
          </div>
          {!readOnly && !isGroup && <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${c?.online ? "bg-emerald-500" : "bg-slate-300"}`} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-800">
            {readOnly ? "Deewaraya Admin" : isGroup ? (role === "owner" ? t("messages.groupAll", "All drivers") : t("messages.groupOf", "{{name}}'s group", { name: c?.ownerName || "" })) : c?.name || t("messages.noDriver", "No driver assigned")}
          </p>
          <p className="truncate text-xs text-slate-500">
            {readOnly
              ? t("messages.adminInfo", "Messages from the system admin")
              : isGroup
                ? groupInfo
                  ? [groupInfo.owner?.name, ...(groupInfo.drivers || []).map((d) => d.name)].filter(Boolean).join(", ")
                  : t("messages.groupHint", "Owner and all drivers")
                : `${thread.boat?.boatName || ""} · ${lastSeenText(c, t)}`}
          </p>
        </div>
        <div className="relative">
          <button type="button" onClick={() => setHeaderMenu((v) => !v)} className={`rounded-full p-2 ${headerMenu ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-100"}`} aria-label={t("messages.more", "More")} aria-expanded={headerMenu}>
            <MoreVertical size={19} />
          </button>
          {headerMenu && (
            <div className="absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-sm text-slate-700 shadow-xl" onMouseLeave={() => setHeaderMenu(false)}>
              <button type="button" onClick={() => { setHeaderMenu(false); setSearchOpen((v) => !v); setResults(null); setFilesOpen(false); }} className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-slate-50"><Search size={16} className="text-blue-600" /> {t("messages.search", "Search messages")}</button>
              {thread.type === "boat" && (
                <button type="button" onClick={() => { setHeaderMenu(false); setFilesOpen(true); setSearchOpen(false); }} className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-slate-50"><FolderOpen size={16} className="text-amber-600" /> {t("messages.files", "Files")}</button>
              )}
              <button type="button" onClick={() => { setHeaderMenu(false); setExportOpen(true); }} className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-slate-50"><FileDown size={16} className="text-emerald-600" /> {t("messages.exportPdf", "Export as PDF")}</button>
            </div>
          )}
        </div>
        {role === "driver" && thread.type === "boat" && (
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

      {/* Scheduled (only mine) */}
      {scheduled.length > 0 && !filesOpen && (
        <div className="border-b border-violet-200 bg-violet-50 px-4 py-2 text-sm text-violet-900">
          <button type="button" onClick={() => setShowScheduled((v) => !v)} className="flex w-full items-center gap-2 font-medium">
            <Clock size={15} /> {t("messages.scheduledCount", "{{count}} scheduled message(s)", { count: scheduled.length })}
            <span className="ml-auto text-xs underline">{showScheduled ? t("messages.hide", "Hide") : t("messages.show", "Show")}</span>
          </button>
          {showScheduled && (
            <ul className="mt-2 space-y-1">
              {scheduled.map((s) => (
                <li key={s._id} className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5">
                  <span className="shrink-0 text-xs font-semibold text-violet-700">{new Date(s.scheduledFor).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  <span className="min-w-0 flex-1 truncate">{s.text}</span>
                  <button
                    type="button"
                    onClick={() => messagesApi.cancelScheduled(s._id).then(loadScheduled).catch((e) => toast.error(errorText(e)))}
                    className="rounded-full p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    aria-label={t("messages.cancel", "Cancel")}
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Pinned */}
      {pinned.length > 0 && !results && !filesOpen && (
        <div className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          <Pin size={15} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            {pinned.slice(0, 2).map((p) => (
              <p key={p._id} className="truncate">
                <span className="font-semibold">{p.sender?.name || "Deewaraya"}:</span> {auto[p._id] && !original.has(p._id) ? auto[p._id] : previewText(p, t, lang)}
              </p>
            ))}
          </div>
        </div>
      )}

      {filesOpen && <FilesPanel threadId={thread.id} myId={myId} isOwner={role === "owner"} onClose={() => setFilesOpen(false)} />}

      {/* Messages */}
      <div
        hidden={filesOpen}
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
                    translated={auto[m._id]}
                    showOriginal={original.has(m._id)}
                    onPin={(x) => act(() => messagesApi.pin(x._id), x.pinned ? t("messages.unpinned", "Unpinned") : t("messages.pinned", "Pinned"))}
                    onDelete={(x) => act(() => messagesApi.remove(x._id))}
                    onToggleOriginal={toggleOriginal}
                    onFinance={(x, price) => act(() => messagesApi.toFinance(x._id, price), t("messages.addedToFinance", "Added to daily finance"))}
                    onReact={react}
                    showSender={isGroup}
                    myId={myId}
                  />
                </div>
              );
            })}
            {!results && pendingItems.map((m) => <MessageBubble key={m._id} m={m} mine pending role={role} onPin={() => {}} onDelete={() => {}} onToggleOriginal={() => {}} onFinance={() => {}} />)}
          </>
        )}
      </div>

      {filesOpen ? null : readOnly ? (
        <p className="border-t border-slate-200 bg-white px-4 py-3 text-center text-xs text-slate-500">{t("messages.adminReadOnly", "Replies to the admin aren't available here. Use Contact for support.")}</p>
      ) : thread.counterpart ? (
        <Composer threadId={thread.id} role={role} onSent={onSent} onScheduled={loadScheduled} allowCatch={thread.type === "boat"} fishNames={prices.map((p) => String(p.name).split(" (")[0])} />
      ) : (
        <p className="border-t border-slate-200 bg-white px-4 py-3 text-center text-xs text-slate-500">{t("messages.assignDriverFirst", "Assign a driver to this boat to start chatting.")}</p>
      )}

      {/* Export */}
      {exportOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800"><FileDown size={20} className="text-emerald-600" /> {t("messages.exportPdf", "Export as PDF")}</h3>
            <p className="mt-1 text-sm text-slate-600">{t("messages.exportHint", "Choose dates, or leave empty for the whole chat. In the print window pick “Save as PDF”.")}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <label className="text-xs font-semibold text-slate-600">{t("messages.fromDate", "From")}<input type="date" value={exportRange.from} onChange={(e) => setExportRange({ ...exportRange, from: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm" /></label>
              <label className="text-xs font-semibold text-slate-600">{t("messages.toDate", "To")}<input type="date" value={exportRange.to} onChange={(e) => setExportRange({ ...exportRange, to: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm" /></label>
            </div>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setExportOpen(false)} className="flex-1 rounded-xl bg-slate-100 py-2.5 font-semibold text-slate-700">{t("messages.cancel", "Cancel")}</button>
              <button type="button" onClick={runExport} disabled={exporting} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 font-semibold text-white disabled:opacity-60">
                {exporting && <Loader2 size={16} className="animate-spin" />} {t("messages.export", "Export")}
              </button>
            </div>
          </div>
        </div>
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
