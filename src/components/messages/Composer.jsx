// Message input: text, quick replies, and a "+" menu for photo, location, voice note and catch report.
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Camera, Fish, Loader2, MapPin, Mic, Plus, Send, Square, X, Zap } from "lucide-react";
import { QUICK_REPLIES, errorText, messagesApi, newClientId, sendOrQueue } from "../../services/messagesApi";

const pickMime = () => {
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
  return types.find((t) => window.MediaRecorder?.isTypeSupported?.(t)) || "";
};

export default function Composer({ threadId, role, onSent, fishNames = [] }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith("si") ? "si" : "en";
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [showQuick, setShowQuick] = useState(false);
  const [menu, setMenu] = useState(false);
  const [catchOpen, setCatchOpen] = useState(false);
  const [catchForm, setCatchForm] = useState({ fishName: "", quantityKg: "" });
  const [recording, setRecording] = useState(null); // { recorder, startedAt }
  const [seconds, setSeconds] = useState(0);
  const fileRef = useRef(null);
  const chunks = useRef([]);
  const cancelRec = useRef(false);

  useEffect(() => {
    if (!recording) return undefined;
    const id = setInterval(() => setSeconds(Math.round((Date.now() - recording.startedAt) / 1000)), 500);
    return () => clearInterval(id);
  }, [recording]);

  const send = async (body) => {
    setBusy(true);
    try {
      const r = await sendOrQueue(threadId, { clientId: newClientId(), ...body });
      onSent(r);
      if (r.pending) toast(t("messages.queued", "No signal — will send automatically when you're back online"), { icon: "🕒" });
      return true;
    } catch (e) {
      toast.error(errorText(e, t("messages.sendFailed", "Couldn't send the message")));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const sendText = async () => {
    const value = text.trim();
    if (!value || busy) return;
    if (await send({ kind: "text", text: value })) setText("");
  };

  const sendFile = async (kind, file, extra = {}) => {
    if (!navigator.onLine) return toast.error(t("messages.needsSignal", "Photos and voice notes need a connection"));
    const form = new FormData();
    form.append("kind", kind);
    form.append("clientId", newClientId());
    Object.entries(extra).forEach(([k, v]) => form.append(k, v));
    form.append("file", file);
    setBusy(true);
    try {
      onSent({ message: await messagesApi.sendFile(threadId, form) });
    } catch (e) {
      toast.error(errorText(e, t("messages.sendFailed", "Couldn't send the message")));
    } finally {
      setBusy(false);
    }
  };

  const shareLocation = () => {
    setMenu(false);
    if (!navigator.geolocation) return toast.error(t("messages.noGps", "Location isn't available on this device"));
    const id = toast.loading(t("messages.gettingLocation", "Getting your location…"));
    navigator.geolocation.getCurrentPosition(
      (p) => {
        toast.dismiss(id);
        send({ kind: "location", latitude: p.coords.latitude, longitude: p.coords.longitude });
      },
      () => {
        toast.dismiss(id);
        toast.error(t("messages.gpsDenied", "Allow location access to share your position"));
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const startVoice = async () => {
    setMenu(false);
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return toast.error(t("messages.noMic", "Voice notes aren't supported in this browser"));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMime();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunks.current = [];
      cancelRec.current = false;
      recorder.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const duration = Math.round((Date.now() - startedAt) / 1000);
        setRecording(null);
        if (cancelRec.current || !chunks.current.length) return;
        const type = (recorder.mimeType || "audio/webm").split(";")[0];
        const ext = type.includes("ogg") ? "ogg" : type.includes("mp4") ? "m4a" : "webm";
        sendFile("voice", new File(chunks.current, `voice.${ext}`, { type }), { durationSec: duration });
      };
      const startedAt = Date.now();
      recorder.start();
      setSeconds(0);
      setRecording({ recorder, startedAt });
      setTimeout(() => recorder.state === "recording" && recorder.stop(), 3 * 60 * 1000); // 3 min max
    } catch {
      toast.error(t("messages.micDenied", "Allow microphone access to record a voice note"));
    }
  };

  const stopVoice = (cancel = false) => {
    cancelRec.current = cancel;
    if (recording?.recorder.state === "recording") recording.recorder.stop();
  };

  const submitCatch = async (e) => {
    e.preventDefault();
    const qty = Number(catchForm.quantityKg);
    if (!catchForm.fishName.trim() || !(qty > 0)) return;
    if (await send({ kind: "catch", fishName: catchForm.fishName.trim(), quantityKg: qty })) {
      setCatchOpen(false);
      setCatchForm({ fishName: "", quantityKg: "" });
    }
  };

  const quick = QUICK_REPLIES[role] || [];

  if (recording) {
    return (
      <div className="flex items-center gap-3 border-t border-slate-200 bg-white px-4 py-3">
        <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
        <span className="flex-1 text-sm font-medium text-slate-700">{t("messages.recording", "Recording")} · {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</span>
        <button type="button" onClick={() => stopVoice(true)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label={t("messages.cancel", "Cancel")}><X size={20} /></button>
        <button type="button" onClick={() => stopVoice(false)} className="flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"><Square size={14} /> {t("messages.send", "Send")}</button>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-200 bg-white">
      {showQuick && (
        <div className="flex gap-2 overflow-x-auto px-3 pt-3 pb-1">
          {quick.map((q) => (
            <button
              key={q.key}
              type="button"
              disabled={busy}
              onClick={() => send({ kind: "quick", quickKey: q.key, text: q[lang] })}
              className="shrink-0 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
            >
              {q[lang]}
            </button>
          ))}
        </div>
      )}

      {catchOpen && (
        <form onSubmit={submitCatch} className="flex flex-wrap items-end gap-2 border-b border-slate-100 bg-emerald-50/60 px-3 py-3">
          <label className="flex-1 text-xs font-semibold text-emerald-800">
            {t("messages.fishType", "Fish")}
            <input list="dw-fish-names" value={catchForm.fishName} onChange={(e) => setCatchForm({ ...catchForm, fishName: e.target.value })} className="mt-1 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-800" placeholder={t("messages.fishPlaceholder", "e.g. Yellowfin Tuna")} required />
            <datalist id="dw-fish-names">{fishNames.map((n) => <option key={n} value={n} />)}</datalist>
          </label>
          <label className="w-28 text-xs font-semibold text-emerald-800">
            kg
            <input type="number" min="0.1" step="0.1" value={catchForm.quantityKg} onChange={(e) => setCatchForm({ ...catchForm, quantityKg: e.target.value })} className="mt-1 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-800" required />
          </label>
          <button type="submit" disabled={busy} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">{t("messages.sendCatch", "Send report")}</button>
          <button type="button" onClick={() => setCatchOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-white" aria-label={t("messages.cancel", "Cancel")}><X size={18} /></button>
        </form>
      )}

      <div className="relative flex items-end gap-2 px-3 py-3">
        <div className="relative">
          <button type="button" onClick={() => setMenu((v) => !v)} aria-label={t("messages.attach", "Attach")} className={`flex h-10 w-10 items-center justify-center rounded-full transition ${menu ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            <Plus size={20} className={`transition-transform ${menu ? "rotate-45" : ""}`} />
          </button>
          {menu && (
            <div className="absolute bottom-12 left-0 z-20 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-sm text-slate-700 shadow-xl">
              <button type="button" onClick={() => { setMenu(false); fileRef.current?.click(); }} className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-slate-50"><Camera size={17} className="text-blue-600" /> {t("messages.photo", "Photo")}</button>
              <button type="button" onClick={shareLocation} className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-slate-50"><MapPin size={17} className="text-emerald-600" /> {t("messages.location", "My location")}</button>
              <button type="button" onClick={startVoice} className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-slate-50"><Mic size={17} className="text-pink-600" /> {t("messages.voice", "Voice note")}</button>
              {role === "driver" && (
                <button type="button" onClick={() => { setMenu(false); setCatchOpen(true); }} className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-slate-50"><Fish size={17} className="text-cyan-600" /> {t("messages.catchReport", "Catch report")}</button>
              )}
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) sendFile("photo", f);
            }}
          />
        </div>
        <button type="button" onClick={() => setShowQuick((v) => !v)} aria-label={t("messages.quickReplies", "Quick replies")} aria-pressed={showQuick} className={`flex h-10 w-10 items-center justify-center rounded-full transition ${showQuick ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
          <Zap size={18} />
        </button>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendText();
            }
          }}
          rows={1}
          maxLength={2000}
          placeholder={t("messages.typeMessage", "Type a message…")}
          aria-label={t("messages.typeMessage", "Type a message…")}
          className="max-h-32 min-h-10 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[15px] text-slate-800 outline-none focus:border-blue-400 focus:bg-white"
        />
        <button type="button" onClick={sendText} disabled={!text.trim() || busy} aria-label={t("messages.send", "Send")} className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow transition hover:bg-blue-700 disabled:opacity-40">
          {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
}
