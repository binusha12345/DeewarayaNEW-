import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Receipt } from "lucide-react";
import DashboardPageHeader from "../../../components/DashboardPageHeader";
import { API_ORIGIN } from "../../../services/api";
import transportApi, { dt, errorMessage, money } from "../../../services/transportApi";
import { Button, Card, ConfirmDialog, DataTable, FilterSelect, Photos, StatusBadge, Tabs } from "../ui";
import { useServerList, useTransport } from "../hooks";

const Expenses = () => {
  const { meta } = useTransport();
  const list = useServerList(transportApi.expenses, { initial: { status: "submitted" } });
  const [reject, setReject] = useState(null);
  const approve = (r) =>
    transportApi.reviewExpense(r._id, { status: "approved" }).then(() => { toast.success("Expense approved"); list.reload(); }).catch((e) => toast.error(errorMessage(e)));
  return (
    <div className="space-y-6">
      <DashboardPageHeader eyebrow="Transport & Returns" title="Expenses" description="Driver-submitted and manager-recorded transportation expenses. Only approved expenses count in costs and losses." icon={Receipt} theme="blue" />
      <Card padded={false}>
        <DataTable list={list}
          toolbar={
            <>
              <Tabs value={list.params.status || ""} onChange={(status) => list.set({ status })} tabs={[{ value: "submitted", label: "To review" }, { value: "approved", label: "Approved" }, { value: "rejected", label: "Rejected" }, { value: "", label: "All" }]} />
              <FilterSelect value={list.params.category} onChange={(category) => list.set({ category })} options={meta.expenseCategories} placeholder="Any category" />
              <FilterSelect value={list.params.scope} onChange={(scope) => list.set({ scope })} options={meta.expenseScopes} placeholder="Any scope" />
            </>
          }
          columns={[
            { key: "incurredAt", label: "Date", sortKey: "incurredAt", render: (r) => dt(r.incurredAt) },
            { key: "delivery", label: "Delivery", render: (r) => r.delivery && <Link className="font-semibold text-[#1677FF]" to={`/transport/deliveries/${r.delivery._id}?tab=costs`}>{r.delivery.deliveryNumber}</Link> },
            { key: "scope", label: "Applies to", render: (r) => <span className="capitalize">{r.scope}</span> },
            { key: "category", label: "Category", render: (r) => <span className="capitalize">{r.category.replace(/_/g, " ")}</span> },
            { key: "detail", label: "Detail", render: (r) => (r.category === "fuel" && r.fuel?.consumedL != null ? `${r.fuel.consumedL} L × ${money(r.fuel.pricePerLitre)}` : r.description || "—") },
            { key: "amount", label: "Amount", sortKey: "amount", render: (r) => money(r.amount) },
            { key: "by", label: "Recorded by", render: (r) => `${r.recordedBy?.name || "—"} (${r.recordedBy?.role?.replace(/_/g, " ") || ""})` },
            { key: "photos", label: "Receipts", render: (r) => (r.photos?.length ? <Photos paths={r.photos} origin={API_ORIGIN} /> : "—") },
            { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "act", label: "", render: (r) => r.status === "submitted" && (
              <div className="flex gap-1"><Button size="sm" variant="success" onClick={() => approve(r)}>Approve</Button><Button size="sm" variant="ghost" onClick={() => setReject(r)}>Reject</Button></div>
            ) },
          ]}
        />
      </Card>
      <ConfirmDialog open={!!reject} title="Reject expense" reasonLabel="Reason (sent to the driver)" reasonRequired variant="danger" confirmLabel="Reject"
        onClose={() => setReject(null)} onConfirm={async (note) => { await transportApi.reviewExpense(reject._id, { status: "rejected", note }); toast.success("Expense rejected"); list.reload(); }} />
    </div>
  );
};

export default Expenses;
