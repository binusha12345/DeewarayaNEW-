// Unread message count for the sidebar badge + a toast and tone when a message arrives
// while the user is on another page. Also flushes the offline outbox when back online.
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { flushOutbox, getMessageSocket, messagesApi, playMessageTone } from "../services/messagesApi";

const preview = (m) => {
  if (m.deletedAt) return "";
  switch (m.kind) {
    case "photo": return "📷 Photo";
    case "voice": return "🎤 Voice note";
    case "location": return "📍 Location";
    case "catch": return `🐟 ${m.catch?.fishName} ${m.catch?.quantityKg} kg`;
    case "sos": return `🆘 SOS ${m.text || ""}`;
    default: return m.text || "";
  }
};

export default function useMessageBadge(user) {
  const [count, setCount] = useState(0);
  const location = useLocation();
  const onMessagesPage = /\/messages$/.test(location.pathname);
  const enabled = !!user && ["owner", "driver"].includes(user.role);

  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    const refresh = () => messagesApi.unreadCount().then((c) => alive && setCount(c)).catch(() => {});
    refresh();
    const socket = getMessageSocket();
    const myId = String(user.id || user._id);
    const onNew = (m) => {
      const fromMe = String(m.sender?._id || m.sender || "") === myId;
      if (fromMe) return;
      refresh();
      if (!onMessagesPage) {
        playMessageTone();
        const who = m.sender?.name || (m.senderRole === "admin" ? "Admin" : "Deewaraya");
        toast(`${who}: ${preview(m).slice(0, 80)}`, { icon: m.kind === "sos" ? "🆘" : "💬" });
      }
    };
    socket?.on("message:new", onNew);
    socket?.on("message:unread-changed", refresh);
    socket?.on("connect", flushOutbox);
    window.addEventListener("online", flushOutbox);
    const t = setInterval(flushOutbox, 20000);
    flushOutbox();
    return () => {
      alive = false;
      socket?.off("message:new", onNew);
      socket?.off("message:unread-changed", refresh);
      socket?.off("connect", flushOutbox);
      window.removeEventListener("online", flushOutbox);
      clearInterval(t);
    };
  }, [enabled, user, onMessagesPage]);

  return enabled ? count : 0;
}
