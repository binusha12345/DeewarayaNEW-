import React from "react";
import { FaCheckCircle, FaEnvelope, FaTimes, FaWhatsapp } from "react-icons/fa";

const SuccessNotice = ({ type, title, message, label, onClose }) => {
  const isWhatsApp = type === "whatsapp";
  const isDaily = type === "daily";
  const Icon = isWhatsApp ? FaWhatsapp : isDaily ? FaCheckCircle : FaEnvelope;
  const theme = isWhatsApp
    ? {
        border: "border-emerald-200",
        circle: "bg-emerald-100 text-emerald-600",
        accent: "text-emerald-600",
        check: "bg-emerald-500",
        pill: "bg-emerald-50 text-emerald-700",
      }
    : isDaily
      ? {
          border: "border-cyan-200",
          circle: "bg-cyan-100 text-cyan-600",
          accent: "text-cyan-600",
          check: "bg-cyan-500",
          pill: "bg-cyan-50 text-cyan-700",
        }
      : {
          border: "border-blue-200",
          circle: "bg-blue-100 text-blue-600",
          accent: "text-blue-600",
          check: "bg-blue-600",
          pill: "bg-blue-50 text-blue-700",
        };

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-md"
      role="status"
      aria-live="polite"
    >
      <div
        className={`relative w-full max-w-sm overflow-hidden rounded-3xl border bg-white/95 p-7 text-center shadow-2xl backdrop-blur-xl animate-[popIn_0.35s_ease-out] ${theme.border}`}
        style={{ fontFamily: "Calibri, Carlito, Arial, sans-serif" }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close success message"
        >
          <FaTimes />
        </button>

        <div
          className={`relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full ${theme.circle}`}
        >
          <Icon className="text-4xl" />
          <FaCheckCircle
            className={`absolute ml-12 mt-12 rounded-full border-4 border-white text-2xl ${theme.check} text-white`}
          />
        </div>

        <p
          className={`mb-2 text-xs font-bold uppercase tracking-[0.2em] ${theme.accent}`}
        >
          {label}
        </p>
        <h3 className="text-2xl font-bold text-slate-800">{title}</h3>
        <p className="mt-3 text-sm font-bold leading-6 text-slate-500">{message}</p>

        <div
          className={`mt-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${theme.pill}`}
        >
          <Icon />
          {isWhatsApp ? "WhatsApp delivery" : isDaily ? "Finance entry saved" : "Email delivery"}
        </div>
      </div>
    </div>
  );
};

export default SuccessNotice;
