// Shared boat documents (licences, permits, insurance, boat papers) for one boat chat.
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { AlertTriangle, ArrowLeft, Download, FileText, Image as ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { apiUrl } from "../../services/api";
import { errorText, messagesApi } from "../../services/messagesApi";

const CATEGORIES = ["licence", "permit", "insurance", "boat_document", "other"];
const size = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export default function FilesPanel({ threadId, myId, isOwner, onClose }) {
  const { t } = useTranslation();
  const [files, setFiles] = useState(null);
  const [form, setForm] = useState({ name: "", category: "licence", expiresAt: "", file: null });
  const [busy, setBusy] = useState(false);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    messagesApi.files(threadId).then(setFiles).catch((e) => {
      toast.error(errorText(e));
      setFiles([]);
    });
  }, [threadId]);

  const upload = async (e) => {
    e.preventDefault();
    if (!form.file) return;
    const fd = new FormData();
    fd.append("name", form.name || form.file.name);
    fd.append("category", form.category);
    if (form.expiresAt) fd.append("expiresAt", form.expiresAt);
    fd.append("file", form.file);
    setBusy(true);
    try {
      const f = await messagesApi.uploadFile(threadId, fd);
      setFiles((cur) => [f, ...(cur || [])]);
      setForm({ name: "", category: "licence", expiresAt: "", file: null });
      e.target.reset();
      toast.success(t("messages.fileUploaded", "File added"));
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (f) => {
    if (!window.confirm(t("messages.deleteFileConfirm", "Delete this file?"))) return;
    try {
      await messagesApi.deleteFile(f._id);
      setFiles((cur) => cur.filter((x) => x._id !== f._id));
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
        <button type="button" onClick={onClose} className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100" aria-label={t("messages.backToChat", "Back to chat")}>
          <ArrowLeft size={18} />
        </button>
        <p className="font-semibold text-slate-800">{t("messages.files", "Files")}</p>
        <span className="text-xs text-slate-400">{t("messages.filesHint", "Licences, permits and boat documents")}</span>
      </div>

      <form onSubmit={upload} className="grid gap-2 border-b border-slate-200 bg-white px-4 py-3 sm:grid-cols-[1fr_140px_140px_auto]">
        <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null, name: form.name || e.target.files?.[0]?.name?.replace(/\.[^.]+$/, "") || "" })} className="text-sm sm:col-span-4" aria-label={t("messages.chooseFile", "Choose file")} />
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("messages.fileName", "Name")} maxLength={120} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm" />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm" aria-label={t("messages.fileType", "Type")}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{t(`messages.fileCat.${c}`, c)}</option>)}
        </select>
        <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm" title={t("messages.expires", "Expires")} aria-label={t("messages.expires", "Expires")} />
        <button type="submit" disabled={busy || !form.file} className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} {t("messages.upload", "Upload")}
        </button>
      </form>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {!files ? (
          <div className="flex justify-center p-8 text-slate-400"><Loader2 className="animate-spin" /></div>
        ) : !files.length ? (
          <p className="mt-10 text-center text-sm text-slate-400">{t("messages.noFiles", "No files yet. Upload the boat's licence or permits so both of you always have them.")}</p>
        ) : (
          <ul className="space-y-2">
            {files.map((f) => {
              const expired = f.expiresAt && new Date(f.expiresAt).getTime() < now;
              const soon = f.expiresAt && !expired && new Date(f.expiresAt).getTime() - now < 30 * 86400000;
              const Icon = f.mimeType === "application/pdf" ? FileText : ImageIcon;
              return (
                <li key={f._id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Icon size={20} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-800">{f.name}</p>
                    <p className="text-xs text-slate-500">
                      {t(`messages.fileCat.${f.category}`, f.category)} · {size(f.size)} · {f.uploadedBy?.name}
                      {f.expiresAt && ` · ${t("messages.expires", "Expires")} ${new Date(f.expiresAt).toLocaleDateString()}`}
                    </p>
                    {(expired || soon) && (
                      <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${expired ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>
                        <AlertTriangle size={11} /> {expired ? t("messages.expired", "Expired") : t("messages.expiresSoon", "Expires soon")}
                      </span>
                    )}
                  </div>
                  <a href={apiUrl(f.url)} target="_blank" rel="noreferrer" download className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label={t("messages.download", "Download")}><Download size={18} /></a>
                  {(String(f.uploadedBy?._id) === myId || isOwner) && (
                    <button type="button" onClick={() => remove(f)} className="rounded-full p-2 text-red-500 hover:bg-red-50" aria-label={t("messages.delete", "Delete")}><Trash2 size={18} /></button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
