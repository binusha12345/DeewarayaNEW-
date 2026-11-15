import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { CheckCircle2, ClipboardList, Pencil, Route as RouteIcon, XCircle } from "lucide-react";
import DashboardPageHeader from "../../../components/DashboardPageHeader";
import transportApi, { dOnly, dt, errorMessage, kg, money } from "../../../services/transportApi";
import { Button, Card, ConfirmDialog, DataTable, ErrorBox, FilterSelect, Input, KeyValues, Modal, SearchBox, Spinner, StatusBadge } from "../ui";
import { useServerList, useTransport } from "../hooks";

const EDITABLE = ["Pending", "Approved", "Preparing", "Waiting for Truck Assignment"];
const ASSIGNABLE = ["Approved", "Preparing", "Waiting for Truck Assignment"];

const OrderModal = ({ id, onClose, onChanged }) => {
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [prices, setPrices] = useState({});
  const [confirm, setConfirm] = useState(null);
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState({});
  const [busy, setBusy] = useState(false);

  const load = () =>
    transportApi.order(id).then((r) => {
      setOrder(r.data);
      setPrices(Object.fromEntries(r.data.items.map((i) => [i._id, i.approvedPricePerKg ?? i.expectedPricePerKg])));
      setEdit({
        items: Object.fromEntries(r.data.items.map((i) => [i._id, i.quantityKg])),
        deliveryDate: r.data.deliveryDate?.slice(0, 10),
        instructions: r.data.instructions,
        estimatedDistanceKm: r.data.estimatedDistanceKm ?? "",
      });
    }).catch(setError);
  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const done = (msg) => {
    toast.success(msg);
    onChanged();
    load();
  };

  const approve = async () => {
    setBusy(true);
    try {
      await transportApi.approveOrder(id, { items: order.items.map((i) => ({ itemId: i._id, approvedPricePerKg: Number(prices[i._id]) })) });
      done("Order approved and stock reserved");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async (reason) => {
    await transportApi.updateOrder(id, {
      reason,
      items: order.items.map((i) => ({ fishType: i.fishType._id, quantityKg: Number(edit.items[i._id]), expectedPricePerKg: i.expectedPricePerKg, approvedPricePerKg: order.status === "Pending" ? undefined : Number(prices[i._id]) })),
      deliveryDate: edit.deliveryDate,
      instructions: edit.instructions,
      estimatedDistanceKm: edit.estimatedDistanceKm === "" ? undefined : Number(edit.estimatedDistanceKm),
    });
    setEditing(false);
    done("Order updated");
  };

  if (error) return <Modal open title="Order" onClose={onClose}><ErrorBox error={error} /></Modal>;
  if (!order) return <Modal open title="Order" onClose={onClose}><Spinner /></Modal>;
  const pending = order.status === "Pending";

  return (
    <Modal
      open
      wide
      title={`Order ${order.orderNumber}`}
      onClose={onClose}
      footer={
        <>
          {EDITABLE.includes(order.status) && !editing && <Button variant="secondary" icon={Pencil} onClick={() => setEditing(true)}>Modify</Button>}
          {editing && <Button variant="secondary" onClick={() => setEditing(false)}>Discard changes</Button>}
          {editing && <Button onClick={() => setConfirm("edit")}>Save changes</Button>}
          {!editing && EDITABLE.concat("Truck Assigned").includes(order.status) && <Button variant="danger" onClick={() => setConfirm("cancel")}>Cancel order</Button>}
          {!editing && pending && <Button variant="danger" icon={XCircle} onClick={() => setConfirm("reject")}>Reject</Button>}
          {!editing && pending && <Button variant="success" icon={CheckCircle2} loading={busy} onClick={approve}>Approve</Button>}
          {!editing && order.status === "Approved" && <Button variant="secondary" onClick={() => transportApi.setOrderStatus(id, "Preparing").then(() => done("Marked as preparing")).catch((e) => toast.error(errorMessage(e)))}>Mark preparing</Button>}
          {!editing && ["Approved", "Preparing"].includes(order.status) && <Button variant="secondary" onClick={() => transportApi.setOrderStatus(id, "Waiting for Truck Assignment").then(() => done("Ready for truck assignment")).catch((e) => toast.error(errorMessage(e)))}>Ready for truck</Button>}
          {!editing && ASSIGNABLE.includes(order.status) && <Button icon={RouteIcon} onClick={() => navigate(`/transport/assignments?order=${id}`)}>Assign truck</Button>}
          {order.delivery && <Button variant="secondary" onClick={() => navigate(`/transport/deliveries/${order.delivery._id}`)}>Open delivery</Button>}
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-2"><StatusBadge status={order.status} />{order.rejectionReason && <span className="text-sm text-red-600">{order.rejectionReason}</span>}</div>
        <KeyValues cols={3} items={[
          ["Buyer", `${order.buyer?.name} · ${order.buyer?.phone}`],
          ["Harbour", order.harbour?.name],
          ["Delivery date", dOnly(order.deliveryDate)],
          ["Destination", `${order.destination.address}${order.destination.island ? ` (${order.destination.island})` : ""}`],
          ["Estimated distance", order.estimatedDistanceKm != null ? `${order.estimatedDistanceKm} km (straight line)` : "Not available"],
          ["Total", `${kg(order.totalQuantityKg)} · ${money(order.totalValue)}`],
        ]} />
        {order.instructions && <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">“{order.instructions}”</p>}

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500 dark:bg-slate-800"><tr><th className="px-3 py-2">Fish</th><th className="px-3 py-2">Quantity</th><th className="px-3 py-2">Buyer expected / kg</th><th className="px-3 py-2">Approved / kg</th><th className="px-3 py-2">Line value</th></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {order.items.map((i) => (
                <tr key={i._id}>
                  <td className="px-3 py-2 font-medium">{i.fishName}</td>
                  <td className="px-3 py-2">{editing ? <input type="number" min="0.01" step="0.01" className="w-24 rounded-lg border border-slate-200 px-2 py-1 dark:border-slate-700 dark:bg-slate-800" value={edit.items[i._id]} onChange={(e) => setEdit({ ...edit, items: { ...edit.items, [i._id]: e.target.value } })} aria-label={`${i.fishName} quantity`} /> : kg(i.quantityKg)}</td>
                  <td className="px-3 py-2">{money(i.expectedPricePerKg)}</td>
                  <td className="px-3 py-2">
                    {pending || (editing && !pending)
                      ? <input type="number" min="0" step="0.01" className="w-28 rounded-lg border border-slate-200 px-2 py-1 dark:border-slate-700 dark:bg-slate-800" value={prices[i._id]} onChange={(e) => setPrices({ ...prices, [i._id]: e.target.value })} aria-label={`${i.fishName} approved price`} />
                      : money(i.approvedPricePerKg)}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{money(i.lineValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {editing && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Input label="Delivery date" type="date" value={edit.deliveryDate} onChange={(e) => setEdit({ ...edit, deliveryDate: e.target.value })} />
            <Input label="Road distance (km)" type="number" min="0" value={edit.estimatedDistanceKm} onChange={(e) => setEdit({ ...edit, estimatedDistanceKm: e.target.value })} hint="Overrides the straight-line estimate" />
            <Input label="Instructions" value={edit.instructions} onChange={(e) => setEdit({ ...edit, instructions: e.target.value })} />
          </div>
        )}

        {order.delivery && (
          <Card title="Delivery">
            <KeyValues cols={3} items={[["Delivery", order.delivery.deliveryNumber], ["Truck", order.delivery.truck?.registrationNumber], ["Driver", order.delivery.driver?.name], ["Status", <StatusBadge key="s" status={order.delivery.status} />]]} />
          </Card>
        )}

        <div>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">History</h4>
          <ol className="space-y-2 border-l-2 border-slate-200 pl-4 dark:border-slate-700">
            {order.statusHistory.slice().reverse().map((h, i) => (
              <li key={i} className="text-sm"><span className="font-semibold">{h.status}</span> <span className="text-slate-500">· {dt(h.at)} · {h.by?.name || "system"}</span>{h.note && <div className="text-slate-500">{h.note}</div>}</li>
            ))}
          </ol>
        </div>
      </div>

      <ConfirmDialog open={confirm === "reject"} title="Reject order" reasonLabel="Reason (sent to the buyer)" reasonRequired variant="danger" confirmLabel="Reject order"
        onClose={() => setConfirm(null)} onConfirm={async (reason) => { await transportApi.rejectOrder(id, reason); done("Order rejected"); }} />
      <ConfirmDialog open={confirm === "cancel"} title="Cancel order" message="Reserved stock will be released and any unstarted delivery cancelled." reasonLabel="Reason" reasonRequired variant="danger" confirmLabel="Cancel order"
        onClose={() => setConfirm(null)} onConfirm={async (reason) => { await transportApi.cancelOrder(id, reason); done("Order cancelled"); }} />
      <ConfirmDialog open={confirm === "edit"} title="Save order changes" message="The buyer will be notified. Changes are recorded in the audit log." reasonLabel="Reason for change" reasonRequired confirmLabel="Save"
        onClose={() => setConfirm(null)} onConfirm={saveEdit} />
    </Modal>
  );
};

const Orders = () => {
  const { meta } = useTransport();
  const list = useServerList(transportApi.orders);
  const [openId, setOpenId] = useState(null);

  return (
    <div className="space-y-6">
      <DashboardPageHeader eyebrow="Transport & Returns" title="Orders" description="Approve, modify or reject buyer fish orders. Approval reserves harbour stock." icon={ClipboardList} theme="blue" />
      <Card padded={false}>
        <DataTable
          list={list}
          onRowClick={(r) => setOpenId(r._id)}
          toolbar={
            <>
              <SearchBox value={list.params.search} onChange={(search) => list.set({ search })} placeholder="Search order number" />
              <FilterSelect value={list.params.status} onChange={(status) => list.set({ status })} options={meta.orderStatuses} placeholder="All statuses" />
              <input type="date" aria-label="From date" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" value={list.params.from || ""} onChange={(e) => list.set({ from: e.target.value })} />
              <input type="date" aria-label="To date" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" value={list.params.to || ""} onChange={(e) => list.set({ to: e.target.value })} />
            </>
          }
          columns={[
            { key: "orderNumber", label: "Order", sortKey: "createdAt", render: (r) => <span className="font-semibold text-[#1677FF]">{r.orderNumber}</span> },
            { key: "buyer", label: "Buyer", render: (r) => r.buyer?.name },
            { key: "items", label: "Fish", render: (r) => r.items.map((i) => i.fishName).join(", ") },
            { key: "qty", label: "Quantity", sortKey: "totalQuantityKg", render: (r) => kg(r.totalQuantityKg) },
            { key: "value", label: "Value", sortKey: "totalValue", render: (r) => money(r.totalValue) },
            { key: "dest", label: "Destination", render: (r) => r.destination.island || r.destination.address },
            { key: "date", label: "Delivery date", sortKey: "deliveryDate", render: (r) => dOnly(r.deliveryDate) },
            { key: "status", label: "Status", sortKey: "status", render: (r) => <StatusBadge status={r.status} /> },
          ]}
        />
      </Card>
      {openId && <OrderModal id={openId} onClose={() => setOpenId(null)} onChanged={list.reload} />}
    </div>
  );
};

export default Orders;
