// Boat messages: API calls, one shared live socket, and an offline outbox for weak signal at sea.
import { io } from "socket.io-client";
import api, { API_ORIGIN } from "./api";

export const messagesApi = {
  threads: () => api.get("/messages/threads").then((r) => r.data.data),
  messages: (threadId, params = {}) => api.get(`/messages/threads/${threadId}/messages`, { params }).then((r) => r.data),
  send: (threadId, body) => api.post(`/messages/threads/${threadId}/messages`, body).then((r) => r.data.data),
  sendFile: (threadId, form) => api.post(`/messages/threads/${threadId}/messages`, form, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data.data),
  read: (threadId) => api.post(`/messages/threads/${threadId}/read`),
  pin: (id) => api.patch(`/messages/${id}/pin`).then((r) => r.data.data),
  remove: (id) => api.delete(`/messages/${id}`).then((r) => r.data.data),
  translate: (id, to) => api.post(`/messages/${id}/translate`, { to }).then((r) => r.data.data),
  translateBatch: (ids, to) => api.post("/messages/translate", { ids, to }).then((r) => r.data.data || {}),
  toFinance: (id, pricePerKg) => api.post(`/messages/${id}/finance`, { pricePerKg }).then((r) => r.data.data),
  broadcast: (text) => api.post("/messages/broadcast", { text }).then((r) => r.data),
  unreadCount: () => api.get("/messages/unread-count").then((r) => r.data.count),
  react: (id, emoji) => api.post(`/messages/${id}/react`, { emoji }).then((r) => r.data.data),
  exportThread: (threadId, params) => api.get(`/messages/threads/${threadId}/export`, { params }).then((r) => r.data),
  scheduled: (threadId) => api.get(`/messages/threads/${threadId}/scheduled`).then((r) => r.data.data),
  schedule: (threadId, body) => api.post(`/messages/threads/${threadId}/schedule`, body).then((r) => r.data.data),
  cancelScheduled: (id) => api.delete(`/messages/scheduled/${id}`).then((r) => r.data.data),
  files: (threadId) => api.get(`/messages/threads/${threadId}/files`).then((r) => r.data.data),
  uploadFile: (threadId, form) => api.post(`/messages/threads/${threadId}/files`, form, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data.data),
  deleteFile: (id) => api.delete(`/messages/files/${id}`),
  fishPrices: () => api.get("/fish-prices").then((r) => r.data?.data?.fish_prices || []),
  sos: (body) => api.post("/emergency/sos", body).then((r) => r.data),
};

export const REACTIONS = ["👍", "✅", "❤️", "😂", "😮", "🙏"];

export const errorText = (e, fallback = "Something went wrong") => e?.response?.data?.message || fallback;

// ---------- shared socket ----------
let socket = null;
let socketToken = null;
export function getMessageSocket() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  if (socket && socketToken === token) return socket;
  socket?.disconnect();
  socketToken = token;
  socket = io(API_ORIGIN, { auth: { token }, transports: ["websocket", "polling"] });
  return socket;
}

// ---------- quick replies ----------
export const QUICK_REPLIES = {
  driver: [
    { key: "leaving", en: "Leaving harbour now", si: "දැන් වරායෙන් පිටත් වෙනවා" },
    { key: "reached", en: "Reached the fishing ground", si: "මසුන් අල්ලන ස්ථානයට ළඟා වුණා" },
    { key: "returning", en: "Returning to harbour", si: "වරායට ආපසු එනවා" },
    { key: "low_fuel", en: "Low fuel", si: "ඉන්ධන අඩුයි" },
    { key: "engine", en: "Engine issue", si: "එන්ජිමේ ගැටලුවක්" },
    { key: "help", en: "Need help", si: "උදව් අවශ්‍යයි" },
  ],
  owner: [
    { key: "ok", en: "OK, noted", si: "හරි, තේරුණා" },
    { key: "come_back", en: "Come back now", si: "දැන්ම ආපසු එන්න" },
    { key: "call_me", en: "Call me", si: "මට කතා කරන්න" },
    { key: "stay_safe", en: "Stay safe", si: "ආරක්ෂිතව ඉන්න" },
  ],
};

// ---------- offline outbox ----------
// Text / quick / location / catch messages typed without signal are kept on this device and
// sent automatically when the connection returns. The server ignores duplicates (clientId).
const outboxKey = () => {
  try {
    return `dw_msg_outbox_${JSON.parse(localStorage.getItem("user") || "{}").id || "me"}`;
  } catch {
    return "dw_msg_outbox_me";
  }
};
const readOutbox = () => {
  try {
    return JSON.parse(localStorage.getItem(outboxKey()) || "[]");
  } catch {
    return [];
  }
};
const writeOutbox = (items) => {
  try {
    localStorage.setItem(outboxKey(), JSON.stringify(items));
  } catch {
    /* storage full or blocked */
  }
  window.dispatchEvent(new CustomEvent("dw:outbox"));
};

export const pendingFor = (threadId) => readOutbox().filter((i) => i.threadId === threadId);
export const newClientId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
const isNetworkError = (e) => !e?.response;

// Sends now if possible; otherwise queues. Returns { message } or { pending }.
export async function sendOrQueue(threadId, body) {
  const item = { ...body, clientId: body.clientId || newClientId() };
  if (!navigator.onLine) {
    writeOutbox([...readOutbox(), { threadId, body: item, queuedAt: new Date().toISOString() }]);
    return { pending: item };
  }
  try {
    return { message: await messagesApi.send(threadId, item) };
  } catch (e) {
    if (!isNetworkError(e)) throw e;
    writeOutbox([...readOutbox(), { threadId, body: item, queuedAt: new Date().toISOString() }]);
    return { pending: item };
  }
}

let flushing = false;
export async function flushOutbox() {
  if (flushing || !navigator.onLine) return;
  flushing = true;
  try {
    for (const item of readOutbox()) {
      try {
        await messagesApi.send(item.threadId, item.body);
        writeOutbox(readOutbox().filter((x) => x.body.clientId !== item.body.clientId));
      } catch (e) {
        if (isNetworkError(e)) break; // still offline — try later
        writeOutbox(readOutbox().filter((x) => x.body.clientId !== item.body.clientId)); // rejected — drop
      }
    }
  } finally {
    flushing = false;
  }
}

export const discardPending = (clientId) => writeOutbox(readOutbox().filter((x) => x.body.clientId !== clientId));

// Short notification tone without an audio file.
export function playMessageTone() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.setValueAtTime(1175, ctx.currentTime + 0.09);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.26);
    o.onended = () => ctx.close();
  } catch {
    /* audio not allowed yet */
  }
}
