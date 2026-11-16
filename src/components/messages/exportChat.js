// Builds a printable page of a conversation; the browser's "Save as PDF" keeps Sinhala text intact.
import { apiUrl } from "../../services/api";
import { displayText } from "./messageText";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function openPrintableChat({ data, title, exportedBy, exportedAt, truncated, from, to }, { t, lang }) {
  const w = window.open("", "_blank");
  if (!w) return false;
  const rows = data
    .map((m) => {
      const when = new Date(m.createdAt).toLocaleString();
      const who = m.senderRole === "system" ? "Deewaraya" : m.senderRole === "admin" ? "Deewaraya Admin" : m.sender?.name || m.senderRole;
      if (m.deletedAt) return `<tr><td>${esc(when)}</td><td>${esc(who)}</td><td><i>${esc(t("messages.deleted"))}</i></td></tr>`;
      const text = displayText(m, { t, lang, showOriginal: true }).text;
      const parts = [];
      if (m.kind === "sos") parts.push("<b style='color:#b91c1c'>SOS</b>");
      if (m.kind === "broadcast") parts.push(`<b>${esc(t("messages.toAllDrivers"))}:</b>`);
      if (m.kind === "catch") parts.push(`🐟 <b>${esc(m.catch?.fishName)}</b> — ${esc(m.catch?.quantityKg)} kg`);
      if (m.location?.latitude != null) parts.push(`📍 ${esc(m.location.placeName || "")} ${m.location.latitude.toFixed(5)}, ${m.location.longitude.toFixed(5)}`);
      if (m.kind === "photo" && m.attachment?.url) parts.push(`<img src="${esc(apiUrl(m.attachment.url))}" alt="photo">`);
      if (m.kind === "voice") parts.push(`🎤 ${esc(t("messages.voice"))}${m.attachment?.durationSec ? ` (${m.attachment.durationSec}s)` : ""}`);
      if (text) parts.push(esc(text).replace(/\n/g, "<br>"));
      if (m.reactions?.length) parts.push(`<span class="r">${m.reactions.map((r) => esc(r.emoji)).join(" ")}</span>`);
      return `<tr class="${m.senderRole}"><td>${esc(when)}</td><td>${esc(who)}</td><td>${parts.join("<br>")}</td></tr>`;
    })
    .join("");
  const range = from || to ? `${from || "…"} → ${to || "…"}` : t("messages.allTime", "All messages");
  w.document.write(`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  body{font-family:"Noto Sans Sinhala","Iskoola Pota","Nirmala UI",Inter,Arial,sans-serif;color:#0f172a;margin:24px}
  h1{font-size:18px;margin:0 0 4px} .meta{color:#64748b;font-size:12px;margin-bottom:16px}
  table{width:100%;border-collapse:collapse;font-size:12px} th{background:#eaf3ff;text-align:left;padding:6px}
  td{border-bottom:1px solid #e2e8f0;padding:6px;vertical-align:top} td:first-child{white-space:nowrap;color:#64748b;width:120px}
  td:nth-child(2){font-weight:600;width:130px} tr.system td{color:#92400e;background:#fffbeb}
  img{max-width:220px;max-height:160px;border-radius:6px;margin-top:4px} .r{font-size:14px}
  @media print{button{display:none}}
</style></head><body>
<button onclick="window.print()" style="float:right;padding:8px 14px;background:#2563eb;color:#fff;border:0;border-radius:8px;cursor:pointer">${esc(t("messages.printSave", "Print / Save as PDF"))}</button>
<h1>${esc(title)}</h1>
<div class="meta">${esc(range)} · ${data.length} ${esc(t("messages.messagesCount", "messages"))} · ${esc(t("messages.exportedBy", "Exported by"))} ${esc(exportedBy)} · ${esc(new Date(exportedAt).toLocaleString())}${truncated ? " · (first 5000)" : ""}</div>
<table><thead><tr><th>${esc(t("messages.date", "Date"))}</th><th>${esc(t("messages.from", "From"))}</th><th>${esc(t("messages.message", "Message"))}</th></tr></thead><tbody>${rows}</tbody></table>
<script>window.onload=function(){setTimeout(function(){window.print()},400)}</script>
</body></html>`);
  w.document.close();
  return true;
}
