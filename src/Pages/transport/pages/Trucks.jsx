import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Fuel, Plus, Snowflake, Truck, Wrench } from "lucide-react";
import DashboardPageHeader from "../../../components/DashboardPageHeader";
import transportApi, { dOnly, dt, errorMessage, kg, money, toLocalInput } from "../../../services/transportApi";
import { Button, Card, Checkbox, DataTable, ErrorBox, FilterSelect, Input, KeyValues, Modal, SearchBox, Select, Spinner, StatusBadge, Tabs, Textarea } from "../ui";
import { useAsync, useServerList, useTransport } from "../hooks";

const EMPTY = { registrationNumber: "", model: "", truckType: "", maxCapacityKg: "", refrigerated: false, condition: "Good", fuelType: "auto_diesel", fuelTankCapacityL: "", currentFuelL: "", fuelEfficiencyKmPerL: "", odometerKm: "", lastMaintenanceDate: "", nextMaintenanceDate: "", availability: "available", homeHarbour: "", notes: "" };
const NUMS = ["maxCapacityKg", "fuelTankCapacityL", "currentFuelL", "fuelEfficiencyKmPerL", "odometerKm"];

export const TruckForm = ({ truck, onClose, onDone }) => {
  const { meta } = useTransport();
  const harbours = useAsync(() => transportApi.harbours(), []);
  const [f, setF] = useState(() => (truck ? { ...EMPTY, ...truck, homeHarbour: truck.homeHarbour?._id || truck.homeHarbour || "", lastMaintenanceDate: truck.lastMaintenanceDate?.slice(0, 10) || "", nextMaintenanceDate: truck.nextMaintenanceDate?.slice(0, 10) || "" } : EMPTY));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const body = Object.fromEntries(Object.entries(f).filter(([k]) => k in EMPTY).map(([k, v]) => [k, NUMS.includes(k) ? (v === "" || v == null ? undefined : Number(v)) : v === "" ? undefined : v]));
    try {
      if (truck) await transportApi.updateTruck(truck._id, body);
      else await transportApi.createTruck(body);
      toast.success(truck ? "Truck updated" : "Truck added");
      onDone();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open wide title={truck ? `Edit ${truck.registrationNumber}` : "Add truck"} onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="truck-form" loading={busy}>Save</Button></>}>
      <form id="truck-form" onSubmit={save} className="grid gap-3 sm:grid-cols-3">
        <Input label="Registration number" required value={f.registrationNumber} onChange={set("registrationNumber")} />
        <Input label="Model" required value={f.model} onChange={set("model")} />
        <Input label="Truck type" required value={f.truckType} onChange={set("truckType")} placeholder="e.g. Insulated box" />
        <Input label="Max capacity (kg)" type="number" min="1" required value={f.maxCapacityKg} onChange={set("maxCapacityKg")} />
        <Select label="Condition" value={f.condition} onChange={set("condition")} options={meta.truckConditions} />
        <Select label="Availability" value={f.availability} onChange={set("availability")} options={meta.truckAvailability} />
        <Select label="Fuel type" value={f.fuelType} onChange={set("fuelType")} options={meta.fuelTypes} />
        <Input label="Tank capacity (L)" type="number" min="1" required value={f.fuelTankCapacityL} onChange={set("fuelTankCapacityL")} />
        <Input label="Current fuel (L)" type="number" min="0" value={f.currentFuelL} onChange={set("currentFuelL")} />
        <Input label="Measured efficiency (km/L)" type="number" min="0" step="0.1" value={f.fuelEfficiencyKmPerL} onChange={set("fuelEfficiencyKmPerL")} hint="Used to check fuel sufficiency" />
        <Input label="Odometer (km)" type="number" min="0" value={f.odometerKm} onChange={set("odometerKm")} />
        <Select label="Home harbour" value={f.homeHarbour} onChange={set("homeHarbour")} placeholder="None" options={(harbours.data?.data || []).map((h) => ({ value: h._id, label: h.name }))} />
        <Input label="Last maintenance" type="date" value={f.lastMaintenanceDate} onChange={set("lastMaintenanceDate")} />
        <Input label="Next maintenance" type="date" value={f.nextMaintenanceDate} onChange={set("nextMaintenanceDate")} />
        <div className="flex items-end pb-2"><Checkbox label="Refrigerated" checked={f.refrigerated} onChange={set("refrigerated")} /></div>
        <Textarea className="sm:col-span-3" label="Notes" value={f.notes} onChange={set("notes")} />
        <div className="sm:col-span-3"><ErrorBox error={error} /></div>
      </form>
    </Modal>
  );
};

const TruckDetail = ({ id, onClose, onEdit }) => {
  const { meta } = useTransport();
  const [t, setT] = useState(null);
  const [tab, setTab] = useState("maintenance");
  const [m, setM] = useState({ type: "service", description: "", cost: "", performedAt: toLocalInput(new Date()).slice(0, 10), nextDueDate: "", conditionAfter: "" });
  const [fuel, setFuel] = useState({ kind: "purchase", litres: "", pricePerLitre: "", odometerKm: "" });
  const [busy, setBusy] = useState(false);
  const load = () => transportApi.truck(id).then((r) => setT(r.data)).catch((e) => toast.error(errorMessage(e)));
  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  const act = async (fn, msg) => {
    setBusy(true);
    try {
      await fn();
      toast.success(msg);
      load();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  if (!t) return <Modal open title="Truck" onClose={onClose}><Spinner /></Modal>;
  return (
    <Modal open wide title={`${t.registrationNumber} · ${t.model}`} onClose={onClose} footer={<Button variant="secondary" onClick={() => onEdit(t)}>Edit details</Button>}>
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2"><StatusBadge status={t.condition} /><StatusBadge status={t.availability} />{t.refrigerated && <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700"><Snowflake size={12} /> Refrigerated</span>}</div>
        <KeyValues cols={4} items={[
          ["Type", t.truckType], ["Capacity", kg(t.maxCapacityKg)], ["Fuel", `${t.currentFuelL} / ${t.fuelTankCapacityL} L (${t.fuelType.replace(/_/g, " ")})`],
          ["Efficiency", t.fuelEfficiencyKmPerL ? `${t.fuelEfficiencyKmPerL} km/L` : "Not recorded"], ["Odometer", t.odometerKm != null ? `${t.odometerKm} km` : "—"],
          ["Last maintenance", dOnly(t.lastMaintenanceDate)], ["Next maintenance", dOnly(t.nextMaintenanceDate)], ["Home harbour", t.homeHarbour?.name],
        ]} />
        <Tabs value={tab} onChange={setTab} tabs={[{ value: "maintenance", label: "Maintenance" }, { value: "fuel", label: "Fuel" }, { value: "deliveries", label: "Deliveries" }]} />
        {tab === "maintenance" && (
          <>
            <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-3 dark:bg-slate-800/50">
              <Select label="Type" value={m.type} onChange={(e) => setM({ ...m, type: e.target.value })} options={["service", "repair", "inspection", "breakdown", "other"]} />
              <Input label="Date" type="date" value={m.performedAt} onChange={(e) => setM({ ...m, performedAt: e.target.value })} />
              <Input label="Cost (LKR)" type="number" min="0" value={m.cost} onChange={(e) => setM({ ...m, cost: e.target.value })} />
              <Input className="sm:col-span-3" label="Description" required value={m.description} onChange={(e) => setM({ ...m, description: e.target.value })} />
              <Input label="Next due" type="date" value={m.nextDueDate} onChange={(e) => setM({ ...m, nextDueDate: e.target.value })} />
              <Select label="Condition after" value={m.conditionAfter} onChange={(e) => setM({ ...m, conditionAfter: e.target.value })} placeholder="Unchanged" options={meta.truckConditions} />
              <div className="flex items-end"><Button icon={Wrench} loading={busy} disabled={!m.description.trim()} onClick={() => act(() => transportApi.addMaintenance(id, { ...m, cost: m.cost === "" ? 0 : Number(m.cost), nextDueDate: m.nextDueDate || undefined, conditionAfter: m.conditionAfter || undefined }), "Maintenance recorded")}>Record</Button></div>
            </div>
            <DataTable rows={t.maintenance} columns={[
              { key: "performedAt", label: "Date", render: (r) => dOnly(r.performedAt) }, { key: "type", label: "Type" }, { key: "description", label: "Description" },
              { key: "cost", label: "Cost", render: (r) => money(r.cost) }, { key: "conditionAfter", label: "Condition after", render: (r) => r.conditionAfter || "—" }, { key: "by", label: "By", render: (r) => r.recordedBy?.name },
            ]} />
          </>
        )}
        {tab === "fuel" && (
          <>
            <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-4 dark:bg-slate-800/50">
              <Select label="Kind" value={fuel.kind} onChange={(e) => setFuel({ ...fuel, kind: e.target.value })} options={[{ value: "purchase", label: "Purchase" }, { value: "manual_reading", label: "Gauge reading" }]} />
              <Input label={fuel.kind === "purchase" ? "Litres bought" : "Litres in tank"} type="number" min="0" value={fuel.litres} onChange={(e) => setFuel({ ...fuel, litres: e.target.value })} />
              {fuel.kind === "purchase" && <Input label="Price / litre (LKR)" type="number" min="0" value={fuel.pricePerLitre} onChange={(e) => setFuel({ ...fuel, pricePerLitre: e.target.value })} />}
              <div className="flex items-end"><Button icon={Fuel} loading={busy} disabled={!fuel.litres} onClick={() => act(() => transportApi.addFuel(id, { kind: fuel.kind, litres: Number(fuel.litres), pricePerLitre: fuel.pricePerLitre ? Number(fuel.pricePerLitre) : undefined }), "Fuel recorded")}>Record</Button></div>
            </div>
            <DataTable rows={t.fuel} columns={[
              { key: "recordedAt", label: "Date", render: (r) => dt(r.recordedAt) }, { key: "kind", label: "Kind", render: (r) => r.kind.replace(/_/g, " ") },
              { key: "litres", label: "Litres" }, { key: "pricePerLitre", label: "Price / L", render: (r) => (r.pricePerLitre ? money(r.pricePerLitre) : "—") }, { key: "totalCost", label: "Total", render: (r) => (r.totalCost ? money(r.totalCost) : "—") },
            ]} />
          </>
        )}
        {tab === "deliveries" && <DataTable rows={t.deliveries} columns={[{ key: "deliveryNumber", label: "Delivery" }, { key: "driver", label: "Driver", render: (r) => r.driver?.name }, { key: "scheduledStart", label: "Departure", render: (r) => dt(r.scheduledStart) }, { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> }]} />}
      </div>
    </Modal>
  );
};

const Trucks = () => {
  const { meta } = useTransport();
  const list = useServerList(transportApi.trucks, { defaultSort: "registrationNumber" });
  const [form, setForm] = useState(null);
  const [detail, setDetail] = useState(null);
  return (
    <div className="space-y-6">
      <DashboardPageHeader eyebrow="Transport & Returns" title="Trucks" description="Capacities, conditions, fuel and maintenance history for the fleet." icon={Truck} theme="blue" action={<Button icon={Plus} onClick={() => setForm({})}>Add truck</Button>} />
      <Card padded={false}>
        <DataTable list={list} onRowClick={(r) => setDetail(r._id)}
          toolbar={
            <>
              <SearchBox value={list.params.search} onChange={(search) => list.set({ search })} placeholder="Search registration" />
              <FilterSelect value={list.params.condition} onChange={(condition) => list.set({ condition })} options={meta.truckConditions} placeholder="Any condition" />
              <FilterSelect value={list.params.availability} onChange={(availability) => list.set({ availability })} options={meta.truckAvailability} placeholder="Any availability" />
              <FilterSelect value={list.params.refrigerated} onChange={(refrigerated) => list.set({ refrigerated })} options={[{ value: "true", label: "Refrigerated" }, { value: "false", label: "Not refrigerated" }]} placeholder="Refrigeration" />
            </>
          }
          columns={[
            { key: "registrationNumber", label: "Registration", sortKey: "registrationNumber", render: (r) => <span className="font-semibold text-[#1677FF]">{r.registrationNumber}</span> },
            { key: "model", label: "Model", render: (r) => `${r.model} · ${r.truckType}` },
            { key: "cap", label: "Capacity", sortKey: "maxCapacityKg", render: (r) => kg(r.maxCapacityKg) },
            { key: "ref", label: "Refrigerated", render: (r) => (r.refrigerated ? <Snowflake size={16} className="text-[#1677FF]" aria-label="Yes" /> : "—") },
            { key: "fuel", label: "Fuel", render: (r) => (
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"><div className="h-full rounded-full bg-[#1677FF]" style={{ width: `${Math.min(100, r.fuelPercent || 0)}%` }} /></div>
                <span className="text-xs tabular-nums">{r.currentFuelL}/{r.fuelTankCapacityL} L</span>
              </div>
            ) },
            { key: "condition", label: "Condition", sortKey: "condition", render: (r) => <StatusBadge status={r.condition} /> },
            { key: "availability", label: "Availability", render: (r) => <StatusBadge status={r.availability} /> },
            { key: "next", label: "Next maintenance", sortKey: "nextMaintenanceDate", render: (r) => <span className={r.maintenanceOverdue ? "font-semibold text-red-600" : ""}>{dOnly(r.nextMaintenanceDate)}{r.maintenanceOverdue && " (overdue)"}</span> },
          ]}
        />
      </Card>
      {form && <TruckForm truck={form._id ? form : null} onClose={() => setForm(null)} onDone={() => { setForm(null); list.reload(); }} />}
      {detail && <TruckDetail id={detail} onClose={() => setDetail(null)} onEdit={(t) => { setDetail(null); setForm(t); }} />}
    </div>
  );
};

export default Trucks;
