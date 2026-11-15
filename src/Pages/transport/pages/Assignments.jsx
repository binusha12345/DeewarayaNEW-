import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { AlertTriangle, Ban, CheckCircle2, Route as RouteIcon, Snowflake, Truck } from "lucide-react";
import DashboardPageHeader from "../../../components/DashboardPageHeader";
import transportApi, { dOnly, dt, errorMessage, kg, newIdempotencyKey, toLocalInput } from "../../../services/transportApi";
import { Button, Card, ConfirmDialog, DataTable, EmptyState, ErrorBox, Input, Modal, Select, Spinner, StatusBadge } from "../ui";
import { cx, useAsync, useServerList } from "../hooks";

const WAITING = "Approved,Preparing,Waiting for Truck Assignment";

const TruckOption = ({ rec, selected, onSelect }) => (
  <button type="button" disabled={!rec.eligible} onClick={onSelect}
    className={cx("w-full rounded-2xl border p-4 text-left transition", selected ? "border-[#1677FF] ring-2 ring-[#1677FF]/20" : "border-slate-200 dark:border-slate-700", rec.eligible ? "hover:border-[#1677FF]/60" : "cursor-not-allowed opacity-60")}>
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className={cx("flex h-10 w-10 items-center justify-center rounded-xl", rec.eligible ? "bg-[#EAF3FF] text-[#1677FF]" : "bg-slate-100 text-slate-400")}><Truck size={18} /></span>
        <div>
          <p className="font-bold text-[#102A43] dark:text-white">{rec.truck.registrationNumber}</p>
          <p className="text-xs text-slate-500">{rec.truck.model} · {kg(rec.truck.maxCapacityKg)} · {rec.truck.condition}{rec.truck.refrigerated && " · "}{rec.truck.refrigerated && <Snowflake size={11} className="inline" />}</p>
        </div>
      </div>
      <span className="text-right">
        <span className="block text-lg font-bold tabular-nums text-[#102A43] dark:text-white">{rec.score}</span>
        <span className="text-[10px] uppercase text-slate-400">score</span>
      </span>
    </div>
    <ul className="mt-3 space-y-1 text-xs">
      {rec.blockers.map((b) => <li key={b} className="flex gap-1.5 text-red-600"><Ban size={13} className="mt-0.5 shrink-0" />{b}</li>)}
      {rec.reasons.map((b) => <li key={b} className="flex gap-1.5 text-green-700 dark:text-green-400"><CheckCircle2 size={13} className="mt-0.5 shrink-0" />{b}</li>)}
      {rec.warnings.map((b) => <li key={b} className="flex gap-1.5 text-amber-700 dark:text-amber-400"><AlertTriangle size={13} className="mt-0.5 shrink-0" />{b}</li>)}
    </ul>
  </button>
);

const Planner = ({ order, onAssigned }) => {
  const [form, setForm] = useState({
    scheduledStart: toLocalInput(new Date(Math.max(Date.now() + 3600000, new Date(order.deliveryDate).setHours(6, 0, 0, 0)))),
    durationHours: "",
    distanceKm: order.estimatedDistanceKm ?? "",
  });
  const [rec, setRec] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [truckId, setTruckId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [busy, setBusy] = useState(false);
  const [key] = useState(newIdempotencyKey);

  const find = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await transportApi.recommendations(order._id, {
        scheduledStart: new Date(form.scheduledStart).toISOString(),
        durationHours: form.durationHours || undefined,
        distanceKm: form.distanceKm === "" ? undefined : form.distanceKm,
      });
      setRec(r.data);
      const best = r.data.trucks.find((t) => t.eligible);
      setTruckId(best?.truck._id || "");
      setDriverId(best?.suggestedDriverId || "");
    } catch (e) {
      setError(e);
      setRec(null);
    } finally {
      setLoading(false);
    }
  };

  const assign = async () => {
    setBusy(true);
    try {
      const chosen = rec.trucks.find((t) => t.truck._id === truckId);
      await transportApi.assign({
        orderId: order._id,
        truckId,
        driverId,
        scheduledStart: new Date(form.scheduledStart).toISOString(),
        durationHours: form.durationHours ? Number(form.durationHours) : undefined,
        estimatedDistanceKm: form.distanceKm === "" ? undefined : Number(form.distanceKm),
        recommendation: chosen ? { score: chosen.score, reasons: chosen.reasons, warnings: chosen.warnings } : null,
      }, key);
      toast.success("Truck and driver assigned. Driver and buyer notified.");
      onAssigned();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const drivers = rec?.drivers || [];
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-4">
        <Input label="Departure" type="datetime-local" required value={form.scheduledStart} onChange={(e) => setForm({ ...form, scheduledStart: e.target.value })} />
        <Input label="Expected duration (hours)" type="number" min="0.5" step="0.5" value={form.durationHours} onChange={(e) => setForm({ ...form, durationHours: e.target.value })} hint="Needed unless average speed is set in Settings" />
        <Input label="Distance (km)" type="number" min="0" value={form.distanceKm} onChange={(e) => setForm({ ...form, distanceKm: e.target.value })} hint="Pre-filled with the straight-line estimate" />
        <div className="flex items-end"><Button className="w-full" onClick={find} loading={loading} icon={RouteIcon}>Find trucks</Button></div>
      </div>
      <ErrorBox error={error} />
      {rec && (
        <>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">Required: {kg(rec.requiredKg)}</span>
            {rec.isLongDistance && <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">Long distance — refrigerated trucks prioritised</span>}
            {rec.needsRefrigeration && <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">Fish requires refrigeration</span>}
          </div>
          {!rec.trucks.length ? <EmptyState title="No trucks registered" text="Add trucks on the Trucks page first." /> : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {rec.trucks.map((t) => <TruckOption key={t.truck._id} rec={t} selected={truckId === t.truck._id} onSelect={() => setTruckId(t.truck._id)} />)}
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Select label="Driver" required value={driverId} onChange={(e) => setDriverId(e.target.value)} placeholder="Select a driver"
              options={drivers.map((d) => ({ value: d.driverId, label: `${d.name}${d.eligible ? "" : ` — ${d.blockers.join(", ")}`}${d.warnings?.length ? ` (${d.warnings.join(", ")})` : ""}` }))} />
            <div className="flex items-end"><Button variant="success" disabled={!truckId || !driverId || !drivers.find((d) => d.driverId === driverId)?.eligible} loading={busy} onClick={assign} icon={CheckCircle2}>Assign</Button></div>
          </div>
        </>
      )}
    </div>
  );
};

const RescheduleModal = ({ delivery, onClose, onDone }) => {
  const trucks = useAsync(() => transportApi.trucks({ limit: 100 }), []);
  const drivers = useAsync(() => transportApi.drivers(), []);
  const [f, setF] = useState({ scheduledStart: toLocalInput(delivery.scheduledStart), scheduledEnd: toLocalInput(delivery.scheduledEnd), truckId: delivery.truck?._id, driverId: delivery.driver?._id, reason: "" });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      await transportApi.updateAssignment(delivery._id, { ...f, scheduledStart: new Date(f.scheduledStart).toISOString(), scheduledEnd: new Date(f.scheduledEnd).toISOString() });
      toast.success("Delivery updated; driver and buyer notified");
      onDone();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open title={`Change ${delivery.deliveryNumber}`} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Close</Button><Button onClick={save} loading={busy} disabled={!f.reason.trim()}>Save</Button></>}>
      {trucks.loading || drivers.loading ? <Spinner /> : (
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Departure" type="datetime-local" value={f.scheduledStart} onChange={(e) => setF({ ...f, scheduledStart: e.target.value })} />
          <Input label="Expected arrival" type="datetime-local" value={f.scheduledEnd} onChange={(e) => setF({ ...f, scheduledEnd: e.target.value })} />
          <Select label="Truck" value={f.truckId} onChange={(e) => setF({ ...f, truckId: e.target.value })} options={(trucks.data?.data || []).map((t) => ({ value: t._id, label: `${t.registrationNumber} (${kg(t.maxCapacityKg)}, ${t.condition})` }))} />
          <Select label="Driver" value={f.driverId} onChange={(e) => setF({ ...f, driverId: e.target.value })} options={(drivers.data?.data || []).map((d) => ({ value: d.user._id, label: `${d.user.name} (${d.availability})` }))} />
          <Input className="sm:col-span-2" label="Reason (sent to the driver)" required value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} />
        </div>
      )}
    </Modal>
  );
};

const Assignments = () => {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const waiting = useServerList(transportApi.orders, { initial: { status: WAITING, limit: 50 }, defaultSort: "deliveryDate" });
  const scheduled = useServerList(transportApi.deliveries, { initial: { status: "Not Started" }, defaultSort: "scheduledStart" });
  const selectedId = params.get("order");
  const selected = useMemo(() => waiting.rows.find((o) => o._id === selectedId), [waiting.rows, selectedId]);
  const [resched, setResched] = useState(null);
  const [cancel, setCancel] = useState(null);

  useEffect(() => {
    if (!selectedId && waiting.rows.length) setParams({ order: waiting.rows[0]._id }, { replace: true });
  }, [waiting.rows, selectedId, setParams]);

  return (
    <div className="space-y-6">
      <DashboardPageHeader eyebrow="Transport & Returns" title="Delivery Assignments" description="Pick an approved order, compare recommended trucks, and assign a truck and driver." icon={RouteIcon} theme="blue" />
      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <Card title={`Waiting for a truck (${waiting.pagination?.total ?? 0})`} padded={false}>
          {waiting.loading ? <Spinner /> : !waiting.rows.length ? <EmptyState title="All caught up" text="No approved orders are waiting for a truck." /> : (
            <ul className="max-h-[640px] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
              {waiting.rows.map((o) => (
                <li key={o._id}>
                  <button type="button" onClick={() => setParams({ order: o._id })} className={cx("w-full px-5 py-3 text-left", o._id === selectedId ? "bg-[#EAF3FF] dark:bg-slate-800" : "hover:bg-slate-50 dark:hover:bg-slate-800/50")}>
                    <div className="flex items-center justify-between"><span className="font-semibold text-[#102A43] dark:text-white">{o.orderNumber}</span><span className="text-xs text-slate-500">{dOnly(o.deliveryDate)}</span></div>
                    <p className="text-xs text-slate-500">{o.buyer?.name} · {kg(o.totalQuantityKg)} · {o.destination.island || o.destination.address}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title={selected ? `Plan ${selected.orderNumber} — ${selected.items.map((i) => `${i.fishName} ${kg(i.quantityKg)}`).join(", ")}` : "Plan a delivery"}>
          {selected ? <Planner key={selected._id} order={selected} onAssigned={() => { waiting.reload(); scheduled.reload(); setParams({}); }} /> : <EmptyState title="Select an order" />}
        </Card>
      </div>

      <Card title="Scheduled (not started)" padded={false}>
        <DataTable list={scheduled} onRowClick={(r) => navigate(`/transport/deliveries/${r._id}`)} columns={[
          { key: "deliveryNumber", label: "Delivery", render: (r) => <span className="font-semibold text-[#1677FF]">{r.deliveryNumber}</span> },
          { key: "order", label: "Order", render: (r) => r.order?.orderNumber },
          { key: "truck", label: "Truck", render: (r) => r.truck?.registrationNumber },
          { key: "driver", label: "Driver", render: (r) => r.driver?.name },
          { key: "start", label: "Departure", sortKey: "scheduledStart", render: (r) => dt(r.scheduledStart) },
          { key: "end", label: "Expected arrival", render: (r) => dt(r.scheduledEnd) },
          { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
          { key: "act", label: "", render: (r) => (
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <Button size="sm" variant="secondary" onClick={() => setResched(r)}>Change</Button>
              <Button size="sm" variant="ghost" onClick={() => setCancel(r)}>Cancel</Button>
            </div>
          ) },
        ]} />
      </Card>
      {resched && <RescheduleModal delivery={resched} onClose={() => setResched(null)} onDone={() => { setResched(null); scheduled.reload(); }} />}
      <ConfirmDialog open={!!cancel} title={`Cancel ${cancel?.deliveryNumber}`} message="The order goes back to the assignment queue with its stock still reserved." reasonLabel="Reason" reasonRequired variant="danger" confirmLabel="Cancel delivery"
        onClose={() => setCancel(null)} onConfirm={async (reason) => { await transportApi.cancelDelivery(cancel._id, reason); toast.success("Delivery cancelled"); scheduled.reload(); waiting.reload(); }} />
    </div>
  );
};

export default Assignments;
