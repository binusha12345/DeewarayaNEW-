import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Undo2 } from "lucide-react";
import DashboardPageHeader from "../../../components/DashboardPageHeader";
import { API_ORIGIN } from "../../../services/api";
import transportApi, { dt, errorMessage, kg, toLocalInput } from "../../../services/transportApi";
import { Button, Card, Checkbox, ConfirmDialog, DataTable, ErrorBox, FilterSelect, Input, KeyValues, Modal, Photos, Select, Spinner, StatusBadge, Textarea } from "../ui";
import { useAsync, useServerList, useTransport } from "../hooks";

const NEXT = {
  "Truck Assigned": ["Return in Progress"],
  "Return in Progress": ["Returned to Harbour", "Quality Inspection", "Disposed"],
  "Returned to Harbour": ["Quality Inspection", "Disposed"],
  "Quality Inspection": ["Returned to Harbour", "Disposed"],
  Approved: ["Quality Inspection", "Disposed"],
};
const COMPLETABLE = ["Approved", "Returned to Harbour", "Quality Inspection", "Disposed"];

const ReturnModal = ({ id, onClose, onChanged }) => {
  const { meta } = useTransport();
  const [r, setR] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState(null);
  const [busy, setBusy] = useState(false);
  const [decide, setDecide] = useState({ decision: "", decisionNote: "" });
  const [assign, setAssign] = useState({ sharedJourney: true, truckId: "", driverId: "", plannedDate: toLocalInput(new Date(Date.now() + 3600000)), durationHours: 4 });
  const [complete, setComplete] = useState({ returnedKg: "", disposedKg: "", recoveryValue: "", inspectionResult: "", notes: "", restockKg: "", restockPricePerKg: "" });
  const trucks = useAsync(() => (mode === "assign" ? transportApi.trucks({ limit: 100, availability: "available" }) : Promise.resolve(null)), [mode]);
  const drivers = useAsync(() => (mode === "assign" ? transportApi.drivers({ availability: "available" }) : Promise.resolve(null)), [mode]);

  const load = () => transportApi.returnById(id).then((x) => { setR(x.data); setDecide({ decision: x.data.decision, decisionNote: x.data.decisionNote }); }).catch(setError);
  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  const run = async (fn, msg) => {
    setBusy(true);
    try {
      await fn();
      toast.success(msg);
      setMode(null);
      onChanged();
      load();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  if (error) return <Modal open title="Return" onClose={onClose}><ErrorBox error={error} /></Modal>;
  if (!r) return <Modal open title="Return" onClose={onClose}><Spinner /></Modal>;
  const n = (v) => (v === "" ? undefined : Number(v));

  return (
    <Modal open wide title={`Return ${r.returnNumber}`} onClose={onClose}
      footer={
        <>
          {["Return Requested", "Awaiting Approval"].includes(r.status) && <Button variant="secondary" onClick={() => setMode("decide")}>Change decision</Button>}
          {["Return Requested", "Awaiting Approval"].includes(r.status) && <Button variant="danger" onClick={() => setMode("reject")}>Reject</Button>}
          {r.status === "Awaiting Approval" && <Button variant="success" loading={busy} onClick={() => run(() => transportApi.approveReturn(id), "Return approved")}>Approve</Button>}
          {r.status === "Approved" && <Button onClick={() => setMode("assign")}>Assign transport</Button>}
          {(NEXT[r.status] || []).map((s) => <Button key={s} variant="secondary" loading={busy} onClick={() => run(() => transportApi.returnStatus(id, s), `Marked ${s}`)}>{s}</Button>)}
          {COMPLETABLE.includes(r.status) && <Button variant="success" onClick={() => setMode("complete")}>Record outcome</Button>}
        </>
      }>
      <div className="space-y-5">
        <div className="flex items-center gap-2"><StatusBadge status={r.status} />{r.sharedJourney && <span className="text-xs text-slate-500">Shared journey — journey costs are not charged again</span>}</div>
        <KeyValues cols={3} items={[
          ["Delivery", <Link key="d" className="text-[#1677FF]" to={`/transport/deliveries/${r.delivery?._id}`}>{r.delivery?.deliveryNumber}</Link>],
          ["Fish", r.fishName], ["Return quantity", `${kg(r.returnKg)} of ${kg(r.damagedKg)} damaged`],
          ["Decision", r.decision.replace(/_/g, " ")], ["Destination", `${r.destination?.kind?.replace(/_/g, " ")}${r.destination?.address ? ` · ${r.destination.address}` : ""}`],
          ["Truck / driver", r.truck ? `${r.truck.registrationNumber} · ${r.driver?.name}` : "—"], ["Planned", dt(r.plannedDate)], ["Approved", dt(r.approvedAt)],
        ]} />
        <p className="text-sm text-slate-600 dark:text-slate-300">Reason: {r.reason}{r.decisionNote && ` · ${r.decisionNote}`}</p>
        <Photos paths={r.evidencePhotos} origin={API_ORIGIN} />
        {r.record && (
          <Card title="Outcome">
            <KeyValues cols={4} items={[["Returned", kg(r.record.returnedKg)], ["Disposed", kg(r.record.disposedKg)], ["Recovered", `LKR ${r.record.recoveryValue.toLocaleString()}`], ["Completed", dt(r.record.completedAt)]]} />
            {r.record.inspectionResult && <p className="mt-2 text-sm">Inspection: {r.record.inspectionResult}</p>}
          </Card>
        )}

        {mode === "decide" && (
          <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 dark:bg-slate-800/50">
            <Select label="Decision" value={decide.decision} onChange={(e) => setDecide({ ...decide, decision: e.target.value })} options={meta.returnDecisions} />
            <Input label="Note" required={decide.decision === "other"} value={decide.decisionNote} onChange={(e) => setDecide({ ...decide, decisionNote: e.target.value })} />
            <div className="sm:col-span-2"><Button loading={busy} onClick={() => run(() => transportApi.decideReturn(id, decide), "Decision saved")}>Save decision</Button></div>
          </div>
        )}
        {mode === "assign" && (
          <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 dark:bg-slate-800/50">
            <div className="sm:col-span-2"><Checkbox label="Carry on the original truck's return leg (shared journey)" checked={assign.sharedJourney} onChange={(e) => setAssign({ ...assign, sharedJourney: e.target.checked })} /></div>
            {!assign.sharedJourney && (trucks.loading || drivers.loading ? <Spinner /> : (
              <>
                <Select label="Truck" required value={assign.truckId} onChange={(e) => setAssign({ ...assign, truckId: e.target.value })} placeholder="Select truck" options={(trucks.data?.data || []).map((t) => ({ value: t._id, label: `${t.registrationNumber} (${kg(t.maxCapacityKg)})` }))} />
                <Select label="Driver" required value={assign.driverId} onChange={(e) => setAssign({ ...assign, driverId: e.target.value })} placeholder="Select driver" options={(drivers.data?.data || []).map((d) => ({ value: d.user._id, label: d.user.name }))} />
                <Input label="Planned departure" type="datetime-local" value={assign.plannedDate} onChange={(e) => setAssign({ ...assign, plannedDate: e.target.value })} />
                <Input label="Duration (hours)" type="number" min="0.5" step="0.5" value={assign.durationHours} onChange={(e) => setAssign({ ...assign, durationHours: e.target.value })} />
              </>
            ))}
            <div className="sm:col-span-2"><Button loading={busy} disabled={!assign.sharedJourney && (!assign.truckId || !assign.driverId)} onClick={() => run(() => transportApi.assignReturn(id, assign.sharedJourney ? { sharedJourney: true } : { truckId: assign.truckId, driverId: assign.driverId, plannedDate: new Date(assign.plannedDate).toISOString(), durationHours: Number(assign.durationHours) }), "Transport assigned")}>Assign</Button></div>
          </div>
        )}
        {mode === "complete" && (
          <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-3 dark:bg-slate-800/50">
            <Input label="Returned (kg)" type="number" min="0" max={r.returnKg} value={complete.returnedKg} onChange={(e) => setComplete({ ...complete, returnedKg: e.target.value })} />
            <Input label="Disposed (kg)" type="number" min="0" max={r.returnKg} value={complete.disposedKg} onChange={(e) => setComplete({ ...complete, disposedKg: e.target.value })} />
            <Input label="Value recovered (LKR)" type="number" min="0" value={complete.recoveryValue} onChange={(e) => setComplete({ ...complete, recoveryValue: e.target.value })} hint="Resale / salvage actually received" />
            <Input label="Put back in stock (kg)" type="number" min="0" value={complete.restockKg} onChange={(e) => setComplete({ ...complete, restockKg: e.target.value })} hint="Only fish that passed inspection" />
            {Number(complete.restockKg) > 0 && <Input label="Restock price / kg" type="number" min="0" required value={complete.restockPricePerKg} onChange={(e) => setComplete({ ...complete, restockPricePerKg: e.target.value })} />}
            <Textarea className="sm:col-span-3" label="Inspection result / notes" value={complete.inspectionResult} onChange={(e) => setComplete({ ...complete, inspectionResult: e.target.value })} />
            <div className="sm:col-span-3"><Button variant="success" loading={busy} onClick={() => run(() => transportApi.completeReturn(id, { returnedKg: n(complete.returnedKg), disposedKg: n(complete.disposedKg), recoveryValue: n(complete.recoveryValue), restockKg: n(complete.restockKg), restockPricePerKg: n(complete.restockPricePerKg), inspectionResult: complete.inspectionResult }), "Return completed")}>Complete return</Button></div>
          </div>
        )}
        <div>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">History</h4>
          <ol className="space-y-1 border-l-2 border-slate-200 pl-4 text-sm dark:border-slate-700">
            {r.statusHistory.slice().reverse().map((h, i) => <li key={i}><b>{h.status}</b> <span className="text-slate-500">· {dt(h.at)} · {h.by?.name || ""}{h.note && ` · ${h.note}`}</span></li>)}
          </ol>
        </div>
      </div>
      <ConfirmDialog open={mode === "reject"} title="Reject return" reasonLabel="Reason" reasonRequired variant="danger" confirmLabel="Reject"
        onClose={() => setMode(null)} onConfirm={async (reason) => { await transportApi.rejectReturn(id, reason); toast.success("Return rejected"); onChanged(); load(); }} />
    </Modal>
  );
};

const Returns = () => {
  const { meta } = useTransport();
  const list = useServerList(transportApi.returns);
  const [open, setOpen] = useState(null);
  return (
    <div className="space-y-6">
      <DashboardPageHeader eyebrow="Transport & Returns" title="Return Management" description="Decide, approve and track what happens to damaged fish. New decisions are made from a delivery's Returns tab." icon={Undo2} theme="orange" />
      <Card padded={false}>
        <DataTable list={list} onRowClick={(r) => setOpen(r._id)}
          toolbar={
            <>
              <FilterSelect value={list.params.status} onChange={(status) => list.set({ status })} options={meta.returnStatuses} placeholder="Any status" />
              <FilterSelect value={list.params.decision} onChange={(decision) => list.set({ decision })} options={meta.returnDecisions} placeholder="Any decision" />
            </>
          }
          columns={[
            { key: "returnNumber", label: "Return", sortKey: "createdAt", render: (r) => <span className="font-semibold text-[#1677FF]">{r.returnNumber}</span> },
            { key: "delivery", label: "Delivery", render: (r) => r.delivery?.deliveryNumber },
            { key: "fishName", label: "Fish" },
            { key: "returnKg", label: "Quantity", sortKey: "returnKg", render: (r) => kg(r.returnKg) },
            { key: "decision", label: "Decision", render: (r) => r.decision.replace(/_/g, " ") },
            { key: "dest", label: "Destination", render: (r) => r.destination?.harbour?.name || r.destination?.kind?.replace(/_/g, " ") },
            { key: "truck", label: "Transport", render: (r) => (r.sharedJourney ? "Shared journey" : r.truck?.registrationNumber || "—") },
            { key: "status", label: "Status", sortKey: "status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "created", label: "Created", render: (r) => dt(r.createdAt) },
          ]}
        />
      </Card>
      {open && <ReturnModal id={open} onClose={() => setOpen(null)} onChanged={list.reload} />}
    </div>
  );
};

export default Returns;
