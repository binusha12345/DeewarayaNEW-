// One chat message. Kept visually simple: blue bubbles for me, white for them, grey pills for system.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, CheckCheck, Clock, Fish, Languages, Megaphone, MapPin, MoreVertical, Pin, PinOff, ShieldAlert, Siren, Trash2 } from "lucide-react";
import { apiUrl } from "../../services/api";

const time = (d) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const DELETE_WINDOW_MS = 5 * 60 * 1000;

function Ticks({ m, pending }) {
  if (pending) return <Clock size={13} className="text-blue-100" aria-label="Waiting for signal" />;
  if (m.readAt) return <CheckCheck size={15} className="text-cyan-200" aria-label="Read" />;
  if (m.deliveredAt) return <CheckCheck size={15} className="text-blue-100" aria-label="Delivered" />;
  return <Check size={15} className="text-blue-100" aria-label="Sent" />;
}

export default function MessageBubble({ m, mine, pending, role, onPin, onDelete, onTranslate, onFinance, translation, prices }) {
  const { t } = useTranslation();
  const [menuAt, setMenuAt] = useState(null); // time the actions menu was opened
  const menu = menuAt !== null;
  const setMenu = (open) => setMenuAt(open ? Date.now() : null);
  const [price, setPrice] = useState("");
  const deleted = !!m.deletedAt;

  // System, weather, trip and safe messages
  if (m.senderRole === "system") {
    return (
      <div className="my-2 flex justify-center">
        <span className={`max-w-[85%] rounded-full px-4 py-1.5 text-center text-xs font-medium ${m.important ? "bg-amber-100 text-amber-800" : "bg-slate-200/70 text-slate-600"}`}>
          {m.text} · {time(m.createdAt)}
        </span>
      </div>
    );
  }

  const canDelete = mine && !pending && !deleted && menuAt !== null && menuAt - new Date(m.createdAt).getTime() < DELETE_WINDOW_MS;
  const isSos = m.kind === "sos";
  const bubble = isSos
    ? "bg-red-600 text-white"
    : mine
      ? "bg-blue-600 text-white"
      : "border border-slate-200 bg-white text-slate-800";
  const sub = mine || isSos ? "text-blue-100" : "text-slate-400";
  const suggestedPrice = m.kind === "catch" ? prices?.find((p) => p.name?.toLowerCase().startsWith(String(m.catch?.fishName || "").toLowerCase().split(" (")[0]))?.price_lkr : null;

  return (
    <div className={`group my-1.5 flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`relative max-w-[82%] rounded-2xl px-3.5 py-2 shadow-sm sm:max-w-[70%] ${bubble} ${mine ? "rounded-br-md" : "rounded-bl-md"} ${pending ? "opacity-80" : ""}`}>
        {/* labels */}
        {m.kind === "broadcast" && (
          <p className={`mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide ${mine ? "text-blue-100" : "text-blue-600"}`}>
            <Megaphone size={12} /> {t("messages.toAllDrivers", "To all drivers")}
          </p>
        )}
        {m.kind === "admin" && (
          <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
            <ShieldAlert size={12} /> Deewaraya Admin
          </p>
        )}
        {isSos && (
          <p className="mb-1 flex items-center gap-1 text-xs font-bold uppercase tracking-wide">
            <Siren size={14} /> SOS
          </p>
        )}
        {m.pinned && !deleted && <Pin size={12} className={`absolute -top-1.5 ${mine ? "-left-1.5" : "-right-1.5"} rotate-45 text-amber-500`} aria-label="Pinned" />}

        {/* content */}
        {deleted ? (
          <p className={`text-sm italic ${sub}`}>{t("messages.deleted", "This message was deleted")}</p>
        ) : (
          <>
            {m.kind === "photo" && m.attachment?.url && (
              <a href={apiUrl(m.attachment.url)} target="_blank" rel="noreferrer">
                <img src={apiUrl(m.attachment.url)} alt={t("messages.photo", "Photo")} loading="lazy" className="mb-1 max-h-64 w-full rounded-lg object-cover" />
              </a>
            )}
            {m.kind === "voice" && m.attachment?.url && (
              <audio controls preload="none" src={apiUrl(m.attachment.url)} className="h-10 w-60 max-w-full" aria-label={t("messages.voice", "Voice note")} />
            )}
            {(m.kind === "location" || (isSos && m.location?.latitude != null)) && m.location?.latitude != null && (
              <a
                href={`https://www.google.com/maps?q=${m.location.latitude},${m.location.longitude}`}
                target="_blank"
                rel="noreferrer"
                className={`mb-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${mine || isSos ? "bg-white/15" : "bg-blue-50 text-blue-700"}`}
              >
                <MapPin size={18} />
                <span>
                  <span className="block font-semibold">{m.location.placeName || t("messages.sharedLocation", "Shared location")}</span>
                  <span className="block text-xs opacity-80">{m.location.latitude.toFixed(5)}, {m.location.longitude.toFixed(5)} · {t("messages.openMap", "Open map")}</span>
                </span>
              </a>
            )}
            {m.kind === "catch" && (
              <div className={`mb-1 rounded-lg px-3 py-2 ${mine ? "bg-white/15" : "bg-emerald-50 text-emerald-800"}`}>
                <p className="flex items-center gap-1.5 text-sm font-semibold"><Fish size={16} /> {t("messages.catchReport", "Catch report")}</p>
                <p className="text-lg font-bold">{m.catch?.fishName} · {m.catch?.quantityKg} kg</p>
                {m.catch?.financeRecord ? (
                  <p className="text-xs opacity-80">✓ {t("messages.addedToFinance", "Added to daily finance")}</p>
                ) : role === "owner" ? (
                  <form
                    className="mt-1.5 flex items-center gap-1.5"
                    onSubmit={(e) => {
                      e.preventDefault();
                      onFinance(m, Number(price || suggestedPrice));
                    }}
                  >
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder={suggestedPrice ? `${suggestedPrice}` : t("messages.pricePerKg", "Price / kg")}
                      aria-label={t("messages.pricePerKg", "Price / kg")}
                      className="w-24 rounded-md border border-emerald-200 bg-white px-2 py-1 text-sm text-slate-800"
                    />
                    <button type="submit" disabled={!price && !suggestedPrice} className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50">
                      {t("messages.addToFinance", "Add to finance")}
                    </button>
                  </form>
                ) : null}
              </div>
            )}
            {m.text && m.kind !== "catch" && <p className="whitespace-pre-wrap break-words text-[15px] leading-snug">{m.text}</p>}
            {translation && <p className={`mt-1 border-t pt-1 text-sm italic ${mine || isSos ? "border-white/20" : "border-slate-100 text-slate-600"}`}>{translation}</p>}
          </>
        )}

        {/* meta */}
        <div className={`mt-0.5 flex items-center justify-end gap-1 text-[11px] ${sub}`}>
          {m.sentViaWhatsApp && <span title={t("messages.viaWhatsApp", "Also sent by WhatsApp")}>WhatsApp ·</span>}
          {time(m.createdAt)}
          {mine && <Ticks m={m} pending={pending} />}
        </div>

        {/* actions */}
        {!pending && !deleted && m.boat && (
          <div className={`absolute top-1 ${mine ? "-left-8" : "-right-8"}`}>
            <button
              type="button"
              onClick={() => setMenu(!menu)}
              aria-label={t("messages.actions", "Message actions")}
              className="rounded-full p-1 text-slate-400 opacity-60 transition hover:bg-slate-200 hover:text-slate-700 focus:opacity-100 group-hover:opacity-100"
            >
              <MoreVertical size={16} />
            </button>
            {menu && (
              <div className={`absolute z-20 mt-1 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white text-sm text-slate-700 shadow-lg ${mine ? "right-0" : "left-0"}`} onMouseLeave={() => setMenu(false)}>
                <button type="button" className="flex w-full items-center gap-2 px-3 py-2 hover:bg-slate-50" onClick={() => { setMenu(false); onPin(m); }}>
                  {m.pinned ? <PinOff size={14} /> : <Pin size={14} />} {m.pinned ? t("messages.unpin", "Unpin") : t("messages.pin", "Pin")}
                </button>
                {(m.text || m.kind === "catch") && (
                  <button type="button" className="flex w-full items-center gap-2 px-3 py-2 hover:bg-slate-50" onClick={() => { setMenu(false); onTranslate(m); }}>
                    <Languages size={14} /> {t("messages.translate", "Translate")}
                  </button>
                )}
                {canDelete && (
                  <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50" onClick={() => { setMenu(false); onDelete(m); }}>
                    <Trash2 size={14} /> {t("messages.delete", "Delete")}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
