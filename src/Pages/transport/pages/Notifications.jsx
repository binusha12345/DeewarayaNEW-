import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import DashboardPageHeader from "../../../components/DashboardPageHeader";
import transportApi, { dt } from "../../../services/transportApi";
import { Button, Card, EmptyState, ErrorBox, Spinner, Tabs } from "../ui";
import { cx, useServerList, useTransport } from "../hooks";

const Notifications = () => {
  const navigate = useNavigate();
  const { setUnread } = useTransport();
  const list = useServerList(transportApi.notifications, { initial: { limit: 30 } });
  const open = async (n) => {
    if (!n.readAt) {
      await transportApi.markRead(n._id).catch(() => {});
      setUnread((u) => Math.max(0, u - 1));
      list.reload();
    }
    if (n.data?.deliveryId) navigate(`/transport/deliveries/${n.data.deliveryId}`);
    else if (n.data?.orderId) navigate("/transport/orders");
    else if (n.data?.returnId) navigate("/transport/returns");
    else if (n.data?.expenseId) navigate("/transport/expenses");
  };
  const readAll = async () => {
    await transportApi.markAllRead();
    setUnread(0);
    list.reload();
  };
  return (
    <div className="space-y-6">
      <DashboardPageHeader eyebrow="Transport & Returns" title="Notifications" description="New orders, damage reports, delays, breakdowns, returns and payment events." icon={Bell} theme="blue" action={<Button variant="secondary" icon={CheckCheck} onClick={readAll}>Mark all read</Button>} />
      <Card padded={false}>
        <div className="border-b border-slate-100 px-5 py-3 dark:border-slate-800">
          <Tabs value={list.params.unread || ""} onChange={(unread) => list.set({ unread })} tabs={[{ value: "", label: "All" }, { value: "true", label: "Unread" }]} />
        </div>
        <ErrorBox error={list.error} onRetry={list.reload} />
        {list.loading ? <Spinner /> : !list.rows.length ? <EmptyState title="No notifications" /> : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {list.rows.map((n) => (
              <li key={n._id}>
                <button type="button" onClick={() => open(n)} className={cx("flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50", !n.readAt && "bg-[#EAF3FF]/50 dark:bg-blue-500/5")}>
                  <span className={cx("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.readAt ? "bg-transparent" : "bg-[#1677FF]")} />
                  <span className="flex-1">
                    <span className="block font-semibold text-[#102A43] dark:text-white">{n.title}</span>
                    <span className="block text-sm text-slate-600 dark:text-slate-300">{n.message}</span>
                    <span className="text-xs text-slate-400">{dt(n.createdAt)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {list.pagination?.pages > 1 && (
          <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3 dark:border-slate-800">
            <Button size="sm" variant="secondary" disabled={list.params.page <= 1} onClick={() => list.setPage(list.params.page - 1)}>Newer</Button>
            <Button size="sm" variant="secondary" disabled={list.params.page >= list.pagination.pages} onClick={() => list.setPage(list.params.page + 1)}>Older</Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Notifications;
