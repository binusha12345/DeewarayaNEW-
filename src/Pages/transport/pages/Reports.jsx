import { useState } from "react";
import toast from "react-hot-toast";
import { BarChart3, FileSpreadsheet, FileText, Play } from "lucide-react";
import DashboardPageHeader from "../../../components/DashboardPageHeader";
import transportApi, { dOnly, dt, errorMessage } from "../../../services/transportApi";
import { exportCsv, exportPdf, fetchAll } from "../exporters";
import { Button, Card, DataTable, EmptyState, Input, Select } from "../ui";
import { cx } from "../hooks";

const n2 = (v) => (v == null ? "" : Number(v).toFixed(2));
const inRange = (d, from, to) => {
  const t = new Date(d).getTime();
  return (!from || t >= new Date(from).getTime()) && (!to || t <= new Date(`${to}T23:59:59`).getTime());
};
const monthsBetween = (from) => Math.min(24, Math.max(1, Math.ceil((Date.now() - new Date(from || Date.now()).getTime()) / (30 * 86400000)) + 1));

const deliveryCols = [
  { label: "Delivery", value: (r) => r.deliveryNumber },
  { label: "Order", value: (r) => r.order?.orderNumber },
  { label: "Buyer", value: (r) => r.buyer?.name },
  { label: "Truck", value: (r) => r.truck?.registrationNumber },
  { label: "Driver", value: (r) => r.driver?.name },
  { label: "Destination", value: (r) => r.order?.destination?.island || r.order?.destination?.address },
  { label: "Quantity kg", value: (r) => r.order?.totalQuantityKg },
  { label: "Departure", value: (r) => dt(r.record?.departureTime || r.scheduledStart) },
  { label: "Arrival", value: (r) => dt(r.record?.arrivalTime) },
  { label: "Status", value: (r) => r.status },
];
const damageCols = [
  { label: "Delivery", value: (r) => r.delivery?.deliveryNumber },
  { label: "Order", value: (r) => r.order?.orderNumber },
  { label: "Driver", value: (r) => r.delivery?.driver?.name },
  { label: "Truck", value: (r) => r.delivery?.truck?.registrationNumber },
  { label: "Loaded kg", value: (r) => r.totals?.loadedKg },
  { label: "Damaged kg", value: (r) => r.totals?.damagedKg },
  { label: "Damage %", value: (r) => n2(r.totals?.damagePercent) },
  { label: "Damage value LKR", value: (r) => n2(r.totals?.damageValue) },
  { label: "Missing kg", value: (r) => r.totals?.missingKg },
  { label: "Missing %", value: (r) => n2(r.totals?.missingPercent) },
  { label: "Missing value LKR", value: (r) => n2(r.totals?.missingValue) },
  { label: "Responsibility", value: (r) => (r.responsibility?.approved ? r.responsibility.party : "Not approved") },
  { label: "Approved", value: (r) => dOnly(r.approvedAt) },
];
const approvedDamage = async ({ from, to }) =>
  (await fetchAll(transportApi.damageReports, { status: "approved" })).filter((r) => inRange(r.approvedAt, from, to));

const REPORTS = {
  daily: {
    label: "Daily delivery report",
    single: true,
    load: ({ from }) => fetchAll(transportApi.deliveries, { from: `${from}T00:00:00`, to: `${from}T23:59:59` }),
    columns: deliveryCols,
  },
  monthly: {
    label: "Monthly delivery report",
    load: ({ from, to }) => fetchAll(transportApi.deliveries, { from, to: to && `${to}T23:59:59` }),
    columns: deliveryCols,
  },
  damaged: { label: "Damaged fish report", load: async (p) => (await approvedDamage(p)).filter((r) => r.totals?.damagedKg > 0), columns: damageCols },
  missing: { label: "Missing fish report", load: async (p) => (await approvedDamage(p)).filter((r) => r.totals?.missingKg > 0), columns: damageCols },
  returns: {
    label: "Return management report",
    load: async ({ from, to }) => (await fetchAll(transportApi.returns, {})).filter((r) => inRange(r.createdAt, from, to)),
    columns: [
      { label: "Return", value: (r) => r.returnNumber }, { label: "Delivery", value: (r) => r.delivery?.deliveryNumber }, { label: "Fish", value: (r) => r.fishName },
      { label: "Return kg", value: (r) => r.returnKg }, { label: "Decision", value: (r) => r.decision.replace(/_/g, " ") },
      { label: "Transport", value: (r) => (r.sharedJourney ? "Shared journey" : r.truck?.registrationNumber || "") }, { label: "Status", value: (r) => r.status }, { label: "Created", value: (r) => dOnly(r.createdAt) },
    ],
  },
  truckExpense: {
    label: "Truck expense report",
    load: async ({ from, to }) => {
      const rows = await fetchAll(transportApi.expenses, { status: "approved", from, to: to && `${to}T23:59:59` });
      const by = {};
      rows.forEach((e) => {
        const t = e.delivery?.truck?.registrationNumber || "Unknown";
        by[t] = by[t] || { truck: t, delivery: 0, return: 0, shared: 0, fuel: 0, count: 0 };
        by[t][e.scope] += e.amount;
        if (e.category === "fuel") by[t].fuel += e.amount;
        by[t].count += 1;
      });
      return Object.values(by);
    },
    columns: [
      { label: "Truck", value: (r) => r.truck }, { label: "Delivery LKR", value: (r) => n2(r.delivery) }, { label: "Shared LKR", value: (r) => n2(r.shared) },
      { label: "Return LKR", value: (r) => n2(r.return) }, { label: "of which fuel LKR", value: (r) => n2(r.fuel) },
      { label: "Total LKR", value: (r) => n2(r.delivery + r.shared + r.return) }, { label: "Expense records", value: (r) => r.count },
    ],
  },
  fuel: {
    label: "Fuel consumption report",
    load: ({ from, to }) => fetchAll(transportApi.expenses, { status: "approved", category: "fuel", from, to: to && `${to}T23:59:59` }),
    columns: [
      { label: "Date", value: (r) => dOnly(r.incurredAt) }, { label: "Delivery", value: (r) => r.delivery?.deliveryNumber }, { label: "Truck", value: (r) => r.delivery?.truck?.registrationNumber },
      { label: "Scope", value: (r) => r.scope }, { label: "Start L", value: (r) => r.fuel?.startL }, { label: "Purchased L", value: (r) => r.fuel?.purchasedL },
      { label: "End L", value: (r) => r.fuel?.endL }, { label: "Consumed L", value: (r) => r.fuel?.consumedL }, { label: "Price/L", value: (r) => n2(r.fuel?.pricePerLitre) }, { label: "Cost LKR", value: (r) => n2(r.amount) },
    ],
  },
  drivers: {
    label: "Driver performance report",
    load: async ({ from }) => (await transportApi.charts(monthsBetween(from))).data.driverPerformance,
    columns: [{ label: "Driver", value: (r) => r.name }, { label: "Completed deliveries", value: (r) => r.completed }, { label: "On-time %", value: (r) => r.onTimePercent }, { label: "Avg damage %", value: (r) => r.avgDamagePercent }],
    note: "Covers whole months from the start date to today.",
  },
  loss: {
    label: "Financial loss report",
    load: ({ from, to }) => fetchAll(transportApi.losses, { from, to: to && `${to}T23:59:59` }),
    columns: [
      { label: "Delivery", value: (r) => r.delivery?.deliveryNumber }, { label: "Order", value: (r) => r.delivery?.order?.orderNumber }, { label: "Truck", value: (r) => r.delivery?.truck?.registrationNumber },
      { label: "Damaged LKR", value: (r) => n2(r.snapshot?.figures?.damagedValue) }, { label: "Missing LKR", value: (r) => n2(r.snapshot?.figures?.missingValue) },
      { label: "Delivery cost", value: (r) => n2(r.snapshot?.figures?.deliveryCost) }, { label: "Return cost", value: (r) => n2(r.snapshot?.figures?.returnCost) },
      { label: "Recovered", value: (r) => n2(r.snapshot?.figures?.totalRecovered) }, { label: "Net loss LKR", value: (r) => n2(r.snapshot?.figures?.netLoss) },
      { label: "Responsibility", value: (r) => (r.allocation || []).map((a) => `${a.party} ${a.percent}%`).join("; ") }, { label: "Finalized", value: (r) => dOnly(r.finalizedAt) },
    ],
  },
  payments: {
    label: "Buyer payment report",
    load: async ({ from, to }) => (await fetchAll(transportApi.invoices, {})).filter((r) => inRange(r.issuedAt, from, to)),
    columns: [
      { label: "Invoice", value: (r) => r.invoiceNumber }, { label: "Buyer", value: (r) => r.buyerSnapshot?.name }, { label: "Order", value: (r) => r.order?.orderNumber },
      { label: "Accepted kg", value: (r) => r.totals?.acceptedKg }, { label: "Final payable", value: (r) => n2(r.totals?.finalPayable) }, { label: "Paid", value: (r) => n2(r.amountPaid - r.amountRefunded) },
      { label: "Outstanding", value: (r) => n2(Math.max(0, r.totals.finalPayable - (r.amountPaid - r.amountRefunded))) }, { label: "Status", value: (r) => r.paymentStatus }, { label: "Issued", value: (r) => dOnly(r.issuedAt) }, { label: "Due", value: (r) => dOnly(r.dueDate) },
    ],
  },
  overall: {
    label: "Overall transportation performance",
    load: async ({ from }) => {
      const c = (await transportApi.charts(monthsBetween(from))).data;
      const months = {};
      const m = (k) => (months[k] = months[k] || { month: k });
      c.deliveries.forEach((r) => Object.assign(m(r._id), { deliveries: r.total, completed: r.completed, cancelled: r.cancelled }));
      c.damage.forEach((r) => Object.assign(m(r._id), { loadedKg: r.loadedKg, damagedKg: r.damagedKg, missingKg: r.missingKg, damagePercent: r.damagePercent }));
      c.expenses.forEach((r) => Object.assign(m(r._id), { deliveryCost: r.delivery, returnCost: r.return }));
      c.losses.forEach((r) => Object.assign(m(r._id), { netLoss: r.netLoss }));
      return Object.values(months).sort((a, b) => a.month.localeCompare(b.month));
    },
    columns: [
      { label: "Month", value: (r) => r.month }, { label: "Deliveries", value: (r) => r.deliveries ?? 0 }, { label: "Completed", value: (r) => r.completed ?? 0 }, { label: "Cancelled", value: (r) => r.cancelled ?? 0 },
      { label: "Loaded kg", value: (r) => r.loadedKg ?? 0 }, { label: "Damaged kg", value: (r) => r.damagedKg ?? 0 }, { label: "Missing kg", value: (r) => r.missingKg ?? 0 }, { label: "Damage %", value: (r) => n2(r.damagePercent ?? 0) },
      { label: "Delivery cost", value: (r) => n2(r.deliveryCost ?? 0) }, { label: "Return cost", value: (r) => n2(r.returnCost ?? 0) }, { label: "Net loss", value: (r) => n2(r.netLoss ?? 0) },
    ],
    note: "Covers whole months from the start date to today.",
  },
};

const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
};

const Reports = () => {
  const [type, setType] = useState("monthly");
  const [range, setRange] = useState({ from: monthStart(), to: today() });
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(false);
  const def = REPORTS[type];
  const run = async () => {
    setBusy(true);
    try {
      setRows(await def.load(def.single ? { from: range.from } : range));
    } catch (e) {
      toast.error(errorMessage(e));
      setRows(null);
    } finally {
      setBusy(false);
    }
  };
  const file = `${type}-report-${range.from}${def.single ? "" : `_${range.to}`}`;
  const subtitle = def.single ? range.from : `${range.from} to ${range.to}`;
  return (
    <div className="space-y-6">
      <DashboardPageHeader eyebrow="Transport & Returns" title="Reports" description="Generate and download delivery, damage, return, expense, fuel, driver, loss and payment reports as PDF or Excel (CSV)." icon={BarChart3} theme="indigo" />
      <Card>
        <div className="grid gap-3 sm:grid-cols-[1fr_180px_180px_auto]">
          <Select label="Report" value={type} onChange={(e) => { setType(e.target.value); setRows(null); }} options={Object.entries(REPORTS).map(([value, r]) => ({ value, label: r.label }))} />
          <Input label={def.single ? "Day" : "From"} type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
          {!def.single ? <Input label="To" type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} /> : <div />}
          <div className="flex items-end"><Button icon={Play} onClick={run} loading={busy}>Generate</Button></div>
        </div>
        {def.note && <p className="mt-2 text-xs text-slate-500">{def.note}</p>}
      </Card>
      {rows && (
        <Card title={`${def.label} · ${rows.length} rows`} padded={false} action={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" icon={FileSpreadsheet} disabled={!rows.length} onClick={() => exportCsv(file, def.columns, rows)}>Excel (CSV)</Button>
            <Button size="sm" variant="secondary" icon={FileText} onClick={() => exportPdf(file, def.label, def.columns, rows, { subtitle })}>PDF</Button>
          </div>
        }>
          <DataTable rows={rows.slice(0, 100)} empty={<EmptyState title="No records in this period" />}
            columns={def.columns.map((c, i) => ({ key: String(i), label: c.label, render: (r) => c.value(r) ?? "—" }))} />
          {rows.length > 100 && <p className={cx("px-5 py-3 text-xs text-slate-500")}>Showing the first 100 rows — downloads include all {rows.length}.</p>}
        </Card>
      )}
    </div>
  );
};

export default Reports;
