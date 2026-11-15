import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, RefreshCw, Settings as SettingsIcon } from "lucide-react";
import DashboardPageHeader from "../../../components/DashboardPageHeader";
import transportApi, { dOnly, dt, errorMessage, kg, money } from "../../../services/transportApi";
import { Button, Card, Checkbox, ConfirmDialog, DataTable, ErrorBox, FilterSelect, Input, Modal, Select, Spinner, StatusBadge, Tabs } from "../ui";
import { useAsync, useServerList } from "../hooks";

const General = () => {
  const s = useAsync(() => transportApi.settings(), []);
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (s.data) setF({ ...s.data.data, paymentMethods: s.data.data.paymentMethods.join(", ") });
  }, [s.data]);
  if (s.error) return <ErrorBox error={s.error} onRetry={s.reload} />;
  if (!f) return <Spinner />;
  const num = (v) => (v === "" || v == null ? null : Number(v));
  const save = async () => {
    setBusy(true);
    try {
      await transportApi.updateSettings({
        longDistanceKm: Number(f.longDistanceKm),
        discrepancyToleranceKg: Number(f.discrepancyToleranceKg),
        averageSpeedKmh: num(f.averageSpeedKmh),
        paymentDueDays: Number(f.paymentDueDays),
        autoApproveMatchingReports: f.autoApproveMatchingReports,
        defaultFuelPricePerLitre: num(f.defaultFuelPricePerLitre),
        paymentMethods: f.paymentMethods.split(",").map((m) => m.trim()).filter(Boolean),
      });
      toast.success("Settings saved");
      s.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card title="Business rules">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Input label="Long-distance threshold (km)" type="number" min="1" value={f.longDistanceKm} onChange={(e) => setF({ ...f, longDistanceKm: e.target.value })} hint="Refrigerated trucks are prioritised above this" />
        <Input label="Damage discrepancy tolerance (kg)" type="number" min="0" step="0.1" value={f.discrepancyToleranceKg} onChange={(e) => setF({ ...f, discrepancyToleranceKg: e.target.value })} hint="Driver vs buyer differences above this are flagged" />
        <Input label="Average truck speed (km/h)" type="number" min="1" value={f.averageSpeedKmh ?? ""} onChange={(e) => setF({ ...f, averageSpeedKmh: e.target.value })} hint="Optional — used to estimate delivery duration" />
        <Input label="Payment due (days after invoice)" type="number" min="0" value={f.paymentDueDays} onChange={(e) => setF({ ...f, paymentDueDays: e.target.value })} />
        <Input label="Reference fuel price (LKR / L)" type="number" min="0" value={f.defaultFuelPricePerLitre ?? ""} onChange={(e) => setF({ ...f, defaultFuelPricePerLitre: e.target.value })} hint="Optional reference only; expenses use the price actually paid" />
        <Input label="Payment methods" value={f.paymentMethods} onChange={(e) => setF({ ...f, paymentMethods: e.target.value })} hint="Comma separated" />
        <div className="sm:col-span-2 lg:col-span-3">
          <Checkbox label="Automatically approve damage assessments when driver and buyer reports match" checked={f.autoApproveMatchingReports} onChange={(e) => setF({ ...f, autoApproveMatchingReports: e.target.checked })} />
          <p className="mt-1 pl-6 text-xs text-slate-500">Off by default: you approve every assessment. Flagged differences always need your review.</p>
        </div>
      </div>
      <Button className="mt-5" onClick={save} loading={busy}>Save settings</Button>
    </Card>
  );
};

const SimpleForm = ({ title, fields, initial, onSave, onClose }) => {
  const [f, setF] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSave(f);
      onClose();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open title={title} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="simple-form" loading={busy}>Save</Button></>}>
      <form id="simple-form" onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        {fields.map((fd) =>
          fd.type === "checkbox" ? (
            <div key={fd.key} className="sm:col-span-2"><Checkbox label={fd.label} checked={!!f[fd.key]} onChange={(e) => setF({ ...f, [fd.key]: e.target.checked })} /></div>
          ) : fd.options ? (
            <Select key={fd.key} label={fd.label} required={fd.required} value={f[fd.key] ?? ""} onChange={(e) => setF({ ...f, [fd.key]: e.target.value })} placeholder={fd.placeholder ?? "Select"} options={fd.options} />
          ) : (
            <Input key={fd.key} className={fd.wide ? "sm:col-span-2" : ""} label={fd.label} type={fd.type || "text"} required={fd.required} step="any" value={f[fd.key] ?? ""} onChange={(e) => setF({ ...f, [fd.key]: e.target.value })} hint={fd.hint} />
          )
        )}
        <div className="sm:col-span-2"><ErrorBox error={error} /></div>
      </form>
    </Modal>
  );
};

const geo = (f) => (f.latitude !== "" && f.latitude != null && f.longitude !== "" && f.longitude != null ? { latitude: Number(f.latitude), longitude: Number(f.longitude) } : undefined);

const Harbours = () => {
  const list = useAsync(() => transportApi.harbours(), []);
  const [form, setForm] = useState(null);
  const fields = [
    { key: "name", label: "Name", required: true }, { key: "code", label: "Code", required: true }, { key: "island", label: "Island / region" }, { key: "address", label: "Address" },
    { key: "latitude", label: "Latitude", type: "number" }, { key: "longitude", label: "Longitude", type: "number", hint: "Coordinates enable distance estimates" }, { key: "active", label: "Active", type: "checkbox" },
  ];
  const save = async (f) => {
    const body = { name: f.name, code: f.code, island: f.island, address: f.address, location: geo(f), active: f.active };
    if (f._id) await transportApi.updateHarbour(f._id, body);
    else await transportApi.createHarbour(body);
    toast.success("Harbour saved");
    list.reload();
  };
  return (
    <Card title="Harbours" padded={false} action={<Button size="sm" icon={Plus} onClick={() => setForm({ active: true })}>Add harbour</Button>}>
      <ErrorBox error={list.error} />
      <DataTable rows={list.data?.data} loading={list.loading} onRowClick={(h) => setForm({ ...h, latitude: h.location?.latitude ?? "", longitude: h.location?.longitude ?? "" })} columns={[
        { key: "name", label: "Name" }, { key: "code", label: "Code" }, { key: "island", label: "Island" },
        { key: "loc", label: "Coordinates", render: (h) => (h.location?.latitude != null ? `${h.location.latitude}, ${h.location.longitude}` : "Not set") },
        { key: "active", label: "Status", render: (h) => <StatusBadge status={h.active ? "available" : "unavailable"} /> },
      ]} />
      {form && <SimpleForm title={form._id ? "Edit harbour" : "Add harbour"} fields={fields} initial={form} onSave={save} onClose={() => setForm(null)} />}
    </Card>
  );
};

const FishTypes = () => {
  const list = useAsync(() => transportApi.fishTypes(true), []);
  const [form, setForm] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const fields = [
    { key: "name", label: "Name", required: true }, { key: "localName", label: "Local name" }, { key: "category", label: "Category" },
    { key: "marketPricePerKg", label: "Market price per kg (LKR)", type: "number" }, { key: "imageUrl", label: "Image URL", wide: true },
    { key: "requiresRefrigeration", label: "Requires refrigeration", type: "checkbox" }, { key: "active", label: "Active", type: "checkbox" },
  ];
  const save = async (f) => {
    const body = { ...f, marketPricePerKg: f.marketPricePerKg === "" || f.marketPricePerKg == null ? undefined : Number(f.marketPricePerKg) };
    delete body._id;
    ["priceSource", "priceUpdatedAt", "createdAt", "updatedAt", "__v"].forEach((k) => delete body[k]);
    if (f._id) await transportApi.updateFishType(f._id, body);
    else await transportApi.createFishType(body);
    toast.success("Fish type saved");
    list.reload();
  };
  const sync = async () => {
    setSyncing(true);
    try {
      const r = await transportApi.syncFishTypes();
      toast.success(r.message);
      list.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSyncing(false);
    }
  };
  return (
    <Card title="Fish types" padded={false} action={<div className="flex gap-2"><Button size="sm" variant="secondary" icon={RefreshCw} loading={syncing} onClick={sync}>Sync CFHC prices</Button><Button size="sm" icon={Plus} onClick={() => setForm({ active: true, requiresRefrigeration: true })}>Add</Button></div>}>
      <DataTable rows={list.data?.data} loading={list.loading} onRowClick={setForm} columns={[
        { key: "name", label: "Name" }, { key: "localName", label: "Local name" }, { key: "price", label: "Market price / kg", render: (f) => money(f.marketPricePerKg) },
        { key: "src", label: "Price source", render: (f) => `${f.priceSource || "—"} ${f.priceUpdatedAt ? `(${dOnly(f.priceUpdatedAt)})` : ""}` },
        { key: "ref", label: "Refrigeration", render: (f) => (f.requiresRefrigeration ? "Required" : "No") },
        { key: "active", label: "Status", render: (f) => <StatusBadge status={f.active ? "available" : "unavailable"} /> },
      ]} />
      {form && <SimpleForm title={form._id ? `Edit ${form.name}` : "Add fish type"} fields={fields} initial={form} onSave={save} onClose={() => setForm(null)} />}
    </Card>
  );
};

const Inventory = () => {
  const harbours = useAsync(() => transportApi.harbours(), []);
  const fish = useAsync(() => transportApi.fishTypes(), []);
  const list = useServerList(transportApi.inventory, { defaultSort: "-createdAt" });
  const [add, setAdd] = useState(null);
  const [adjust, setAdjust] = useState(null);
  const [adjustValues, setAdjustValues] = useState({});
  const [confirmAdjust, setConfirmAdjust] = useState(false);
  const hOpts = (harbours.data?.data || []).map((h) => ({ value: h._id, label: h.name }));
  const fOpts = (fish.data?.data || []).map((f) => ({ value: f._id, label: f.name }));
  return (
    <Card title="Harbour fish inventory" padded={false} action={<Button size="sm" icon={Plus} onClick={() => setAdd({})}>Add stock</Button>}>
      <DataTable list={list}
        toolbar={
          <>
            <FilterSelect value={list.params.harbour} onChange={(harbour) => list.set({ harbour })} options={hOpts} placeholder="All harbours" />
            <FilterSelect value={list.params.fishType} onChange={(fishType) => list.set({ fishType })} options={fOpts} placeholder="All fish" />
            <FilterSelect value={list.params.status} onChange={(status) => list.set({ status })} options={["available", "depleted", "withdrawn"]} placeholder="Any status" />
          </>
        }
        columns={[
          { key: "fish", label: "Fish", render: (r) => r.fishType?.name }, { key: "harbour", label: "Harbour", render: (r) => r.harbour?.name },
          { key: "available", label: "Available", sortKey: "availableKg", render: (r) => kg(r.availableKg) }, { key: "reserved", label: "Reserved", render: (r) => kg(r.reservedKg) },
          { key: "sold", label: "Sold", render: (r) => kg(r.soldKg) }, { key: "price", label: "Price / kg", sortKey: "pricePerKg", render: (r) => money(r.pricePerKg) },
          { key: "source", label: "Source", render: (r) => r.source.replace(/_/g, " ") }, { key: "catch", label: "Catch date", sortKey: "catchDate", render: (r) => dOnly(r.catchDate) },
          { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
          { key: "act", label: "", render: (r) => <Button size="sm" variant="secondary" onClick={() => { setAdjust(r); setAdjustValues({ availableKg: r.availableKg, pricePerKg: r.pricePerKg, status: r.status }); }}>Adjust</Button> },
        ]}
      />
      {add && <SimpleForm title="Add stock" initial={{ catchDate: new Date().toISOString().slice(0, 10) }} onClose={() => setAdd(null)}
        fields={[{ key: "fishType", label: "Fish", required: true, options: fOpts }, { key: "harbour", label: "Harbour", required: true, options: hOpts }, { key: "quantityKg", label: "Quantity (kg)", type: "number", required: true }, { key: "pricePerKg", label: "Price per kg (LKR)", type: "number", required: true }, { key: "catchDate", label: "Catch date", type: "date" }, { key: "notes", label: "Notes", wide: true }]}
        onSave={async (f) => { await transportApi.addInventory({ ...f, quantityKg: Number(f.quantityKg), pricePerKg: Number(f.pricePerKg) }); toast.success("Stock added"); list.reload(); }} />}
      {adjust && (
        <Modal open title={`Adjust ${adjust.fishType?.name} at ${adjust.harbour?.name}`} onClose={() => setAdjust(null)}
          footer={<><Button variant="secondary" onClick={() => setAdjust(null)}>Cancel</Button><Button onClick={() => setConfirmAdjust(true)}>Save</Button></>}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input label="Available (kg)" type="number" min="0" value={adjustValues.availableKg} onChange={(e) => setAdjustValues({ ...adjustValues, availableKg: e.target.value })} hint={`${kg(adjust.reservedKg)} reserved is not affected`} />
            <Input label="Price / kg" type="number" min="0" value={adjustValues.pricePerKg} onChange={(e) => setAdjustValues({ ...adjustValues, pricePerKg: e.target.value })} />
            <Select label="Status" value={adjustValues.status} onChange={(e) => setAdjustValues({ ...adjustValues, status: e.target.value })} options={["available", "depleted", "withdrawn"]} />
          </div>
          <ConfirmDialog open={confirmAdjust} title="Confirm stock adjustment" reasonLabel="Reason (audited)" reasonRequired confirmLabel="Save adjustment"
            onClose={() => setConfirmAdjust(false)}
            onConfirm={async (reason) => { await transportApi.adjustInventory(adjust._id, { availableKg: Number(adjustValues.availableKg), pricePerKg: Number(adjustValues.pricePerKg), status: adjustValues.status, reason }); toast.success("Stock adjusted"); setAdjust(null); list.reload(); }} />
        </Modal>
      )}
    </Card>
  );
};

const Audit = () => {
  const list = useServerList(transportApi.auditLogs);
  return (
    <Card title="Audit log" padded={false}>
      <DataTable list={list}
        toolbar={<FilterSelect value={list.params.entityType} onChange={(entityType) => list.set({ entityType })} placeholder="All records" options={["TransportOrder", "DeliveryAssignment", "LoadingRecord", "DriverDamageReport", "BuyerVerification", "DamageAssessment", "ReturnRequest", "ReturnRecord", "ExpenseRecord", "Invoice", "LossAssessment", "Truck", "DriverProfile", "FishInventory", "TransportSetting"]} />}
        columns={[
          { key: "at", label: "When", render: (r) => dt(r.createdAt) },
          { key: "actor", label: "Who", render: (r) => `${r.actor?.name || "system"} (${(r.actorRole || "").replace(/_/g, " ")})` },
          { key: "action", label: "Action" },
          { key: "entity", label: "Record", render: (r) => r.entityType },
          { key: "reason", label: "Reason", render: (r) => r.reason || "—" },
        ]} />
    </Card>
  );
};

const SettingsPage = () => {
  const [tab, setTab] = useState("general");
  return (
    <div className="space-y-6">
      <DashboardPageHeader eyebrow="Transport & Returns" title="Settings" description="Business rules, harbours, fish catalogue, stock and the audit trail." icon={SettingsIcon} theme="cyan" />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: "general", label: "General" }, { value: "harbours", label: "Harbours" }, { value: "fish", label: "Fish types" }, { value: "inventory", label: "Inventory" }, { value: "audit", label: "Audit log" }]} />
      {tab === "general" && <General />}
      {tab === "harbours" && <Harbours />}
      {tab === "fish" && <FishTypes />}
      {tab === "inventory" && <Inventory />}
      {tab === "audit" && <Audit />}
    </div>
  );
};

export default SettingsPage;
