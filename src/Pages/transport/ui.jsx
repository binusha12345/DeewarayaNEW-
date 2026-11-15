// Shared UI building blocks for the Transport Manager dashboard.
import { useEffect, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Inbox, Loader2, Search, X } from "lucide-react";
import { errorMessage } from "../../services/transportApi";
import { cx } from "./hooks";


// ---------- Buttons ----------
const BTN = {
  primary: "bg-[#1677FF] text-white hover:bg-[#0f63d8] shadow-sm shadow-blue-600/20",
  secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-700",
  danger: "bg-red-500 text-white hover:bg-red-600",
  success: "bg-green-600 text-white hover:bg-green-700",
  ghost: "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
};
export const Button = ({ variant = "primary", size = "md", loading, icon: Icon, children, className, ...props }) => (
  <button
    type="button"
    {...props}
    disabled={loading || props.disabled}
    className={cx(
      "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF]/50 disabled:cursor-not-allowed disabled:opacity-50",
      size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
      BTN[variant],
      className
    )}
  >
    {loading ? <Loader2 size={16} className="animate-spin" /> : Icon ? <Icon size={16} /> : null}
    {children}
  </button>
);

// ---------- Layout ----------
export const Card = ({ title, action, children, className, padded = true }) => (
  <section className={cx("rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900", className)}>
    {(title || action) && (
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <h2 className="text-sm font-bold text-[#102A43] dark:text-slate-100">{title}</h2>
        {action}
      </div>
    )}
    <div className={padded ? "p-5" : ""}>{children}</div>
  </section>
);

const TONES = {
  blue: "bg-[#EAF3FF] text-[#1677FF] dark:bg-blue-500/10",
  green: "bg-green-50 text-green-600 dark:bg-green-500/10",
  orange: "bg-amber-50 text-amber-600 dark:bg-amber-500/10",
  red: "bg-red-50 text-red-600 dark:bg-red-500/10",
  navy: "bg-slate-100 text-[#102A43] dark:bg-slate-800 dark:text-slate-200",
};
export const StatCard = ({ label, value, icon: Icon, tone = "blue", hint }) => (
  <div className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    {Icon && (
      <span className={cx("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", TONES[tone])}>
        <Icon size={20} />
      </span>
    )}
    <div className="min-w-0">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-0.5 truncate text-xl font-bold tabular-nums text-[#102A43] dark:text-white">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
    </div>
  </div>
);

// ---------- Status badge ----------
const STATUS_TONE = {
  green: ["Completed", "Paid", "approved", "verified", "Approved", "available", "Excellent", "Good", "Delivered", "finalized", "Arrived", "Returned to Harbour"],
  orange: ["Pending", "Preparing", "Waiting for Truck Assignment", "Awaiting Buyer Verification", "Partially Paid", "submitted", "pending", "Needs Maintenance", "Awaiting Approval", "Return Requested", "pending_approval", "awaiting_buyer_verification", "awaiting_driver_report", "Partially Accepted", "Quality Inspection", "draft", "off_duty", "Not Started"],
  red: ["Rejected", "Cancelled", "Overdue", "rejected", "disputed", "Under Repair", "Unavailable", "unavailable", "Delayed", "flagged_for_review", "Disposed", "maintenance"],
  blue: ["Truck Assigned", "Loading", "In Transit", "Started", "Arrived at Destination", "in_use", "on_delivery", "Return in Progress", "Truck Assigned", "Refunded"],
};
const BADGE = {
  green: "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400",
  orange: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400",
  red: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400",
  blue: "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-300",
  grey: "bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300",
};
const pretty = (s) => String(s).replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
export const StatusBadge = ({ status }) => {
  if (!status) return null;
  const tone = Object.keys(STATUS_TONE).find((k) => STATUS_TONE[k].includes(status)) || "grey";
  return <span className={cx("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", BADGE[tone])}>{pretty(status)}</span>;
};

// ---------- Feedback ----------
export const Spinner = ({ label = "Loading…" }) => (
  <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500" role="status">
    <Loader2 size={18} className="animate-spin text-[#1677FF]" /> {label}
  </div>
);
export const EmptyState = ({ title = "Nothing here yet", text, action }) => (
  <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800"><Inbox size={22} /></span>
    <p className="font-semibold text-slate-700 dark:text-slate-200">{title}</p>
    {text && <p className="max-w-sm text-sm text-slate-500">{text}</p>}
    {action}
  </div>
);
export const ErrorBox = ({ error, onRetry }) =>
  error ? (
    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300" role="alert">
      <AlertTriangle size={18} className="mt-0.5 shrink-0" />
      <div className="flex-1">{typeof error === "string" ? error : errorMessage(error)}</div>
      {onRetry && <Button size="sm" variant="secondary" onClick={onRetry}>Retry</Button>}
    </div>
  ) : null;

// ---------- Form fields ----------
const INPUT = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#1677FF] focus:outline-none focus:ring-2 focus:ring-[#1677FF]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";
export const Field = ({ label, hint, required, children, className }) => (
  <label className={cx("block", className)}>
    <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
      {label} {required && <span className="text-red-500">*</span>}
    </span>
    {children}
    {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
  </label>
);
export const Input = ({ label, hint, required, className, ...props }) => (
  <Field label={label} hint={hint} required={required} className={className}>
    <input {...props} required={required} className={INPUT} />
  </Field>
);
export const Select = ({ label, hint, required, options = [], placeholder, className, ...props }) => (
  <Field label={label} hint={hint} required={required} className={className}>
    <select {...props} required={required} className={INPUT}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (typeof o === "string" ? <option key={o} value={o}>{pretty(o)}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
    </select>
  </Field>
);
export const Textarea = ({ label, hint, required, className, ...props }) => (
  <Field label={label} hint={hint} required={required} className={className}>
    <textarea rows={3} {...props} required={required} className={INPUT} />
  </Field>
);
export const Checkbox = ({ label, ...props }) => (
  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
    <input type="checkbox" {...props} className="h-4 w-4 rounded border-slate-300 text-[#1677FF]" /> {label}
  </label>
);

// ---------- Modal & confirm ----------
export const Modal = ({ open, title, onClose, children, footer, wide }) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={cx("flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-2xl", wide ? "sm:max-w-4xl" : "sm:max-w-lg")}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h3 className="font-bold text-[#102A43] dark:text-white">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-3 dark:border-slate-800">{footer}</div>}
      </div>
    </div>
  );
};

// Confirmation dialog with optional required reason. onConfirm(reason) may return a promise.
export const ConfirmDialog = ({ open, title, message, confirmLabel = "Confirm", variant = "primary", reasonLabel, reasonRequired, onConfirm, onClose }) => {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (open) {
      setReason("");
      setError(null);
    }
  }, [open]);
  const go = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm(reason);
      onClose();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open={open}
      title={title}
      onClose={busy ? undefined : onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant={variant} onClick={go} loading={busy} disabled={reasonRequired && !reason.trim()}>{confirmLabel}</Button>
        </>
      }
    >
      <div className="space-y-4">
        {message && <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>}
        {reasonLabel && <Textarea label={reasonLabel} required={reasonRequired} value={reason} onChange={(e) => setReason(e.target.value)} />}
        <ErrorBox error={error} />
      </div>
    </Modal>
  );
};

// ---------- Table ----------
export const SearchBox = ({ value, onChange, placeholder = "Search…" }) => {
  const [v, setV] = useState(value || "");
  useEffect(() => {
    const id = setTimeout(() => v !== (value || "") && onChange(v), 350);
    return () => clearTimeout(id);
  }, [v]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="relative">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} aria-label={placeholder} className={cx(INPUT, "w-56 pl-9")} />
    </div>
  );
};

export const FilterSelect = ({ value, onChange, options, placeholder }) => (
  <select value={value || ""} onChange={(e) => onChange(e.target.value)} aria-label={placeholder} className={cx(INPUT, "w-auto")}>
    <option value="">{placeholder}</option>
    {options.map((o) => (typeof o === "string" ? <option key={o} value={o}>{pretty(o)}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
  </select>
);

/**
 * columns: [{ key, label, sortKey?, render?(row), className? }]
 * list: result of useServerList (server sort/pagination) — or pass rows directly.
 */
export const DataTable = ({ columns, list, rows: plainRows, loading: loadingProp, onRowClick, empty, toolbar }) => {
  const rows = list ? list.rows : plainRows || [];
  const loading = list ? list.loading : loadingProp;
  const sort = list?.params.sort || "";
  const toggleSort = (key) => list?.set({ sort: sort === key ? `-${key}` : key });
  const p = list?.pagination;
  return (
    <div>
      {toolbar && <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3 dark:border-slate-800">{toolbar}</div>}
      {list?.error && <div className="p-4"><ErrorBox error={list.error} onRetry={list.reload} /></div>}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              {columns.map((c) => (
                <th key={c.key} className={cx("whitespace-nowrap px-4 py-3", c.className)}>
                  {c.sortKey && list ? (
                    <button type="button" className="inline-flex items-center gap-1 uppercase" onClick={() => toggleSort(c.sortKey)}>
                      {c.label}
                      {sort === c.sortKey ? <ChevronUp size={14} /> : sort === `-${c.sortKey}` ? <ChevronDown size={14} /> : null}
                    </button>
                  ) : c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {!loading && rows.map((r, i) => (
              <tr key={r._id || r.id || i} onClick={onRowClick ? () => onRowClick(r) : undefined} className={cx("text-slate-700 dark:text-slate-200", onRowClick && "cursor-pointer hover:bg-[#EAF3FF]/60 dark:hover:bg-slate-800/60")}>
                {columns.map((c) => <td key={c.key} className={cx("whitespace-nowrap px-4 py-3", c.className)}>{c.render ? c.render(r) : r[c.key] ?? "—"}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <Spinner />}
        {!loading && !rows.length && !list?.error && (empty || <EmptyState />)}
      </div>
      {p && p.pages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500 dark:border-slate-800">
          <span>Page {p.page} of {p.pages} · {p.total} records</span>
          <div className="flex gap-1">
            <Button size="sm" variant="secondary" icon={ChevronLeft} disabled={p.page <= 1} onClick={() => list.setPage(p.page - 1)} aria-label="Previous page" />
            <Button size="sm" variant="secondary" icon={ChevronRight} disabled={p.page >= p.pages} onClick={() => list.setPage(p.page + 1)} aria-label="Next page" />
          </div>
        </div>
      )}
    </div>
  );
};

export const KeyValues = ({ items, cols = 2 }) => (
  <dl className={cx("grid gap-x-6 gap-y-3 text-sm", cols === 3 ? "sm:grid-cols-3" : cols === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2")}>
    {items.filter(Boolean).map(([k, v]) => (
      <div key={k} className="min-w-0">
        <dt className="text-xs text-slate-500 dark:text-slate-400">{k}</dt>
        <dd className="mt-0.5 break-words font-medium text-slate-800 dark:text-slate-100">{v ?? "—"}</dd>
      </div>
    ))}
  </dl>
);

export const Tabs = ({ tabs, value, onChange }) => (
  <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-800" role="tablist">
    {tabs.map((t) => (
      <button key={t.value} role="tab" aria-selected={value === t.value} type="button" onClick={() => onChange(t.value)}
        className={cx("whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition", value === t.value ? "bg-white text-[#102A43] shadow-sm dark:bg-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400")}>
        {t.label}
      </button>
    ))}
  </div>
);

// Photo thumbnails for evidence images stored by the API under /uploads/transport.
export const Photos = ({ paths = [], origin = "" }) =>
  paths.length ? (
    <div className="flex flex-wrap gap-2">
      {paths.map((p) => (
        <a key={p} href={origin + p} target="_blank" rel="noreferrer" className="block h-20 w-20 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
          <img src={origin + p} alt="Evidence" loading="lazy" className="h-full w-full object-cover" />
        </a>
      ))}
    </div>
  ) : (
    <p className="text-xs text-slate-400">No photographs</p>
  );
