import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle, CheckCircle2, ClipboardList, Clock, Fish, LayoutDashboard, PackageX, Receipt, Truck, Undo2, Users, Wallet, TrendingDown,
} from "lucide-react";
import DashboardPageHeader from "../../../components/DashboardPageHeader";
import transportApi, { kg, money } from "../../../services/transportApi";
import { ChartCard } from "../charts";
import { ErrorBox, FilterSelect, Spinner, StatCard } from "../ui";
import { useAsync } from "../hooks";

const monthLabel = (k) => {
  const [y, m] = k.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(undefined, { month: "short", year: "2-digit" });
};

const Overview = () => {
  const [months, setMonths] = useState("6");
  const ov = useAsync(() => transportApi.overview(), []);
  const ch = useAsync(() => transportApi.charts(Number(months)), [months]);
  const o = ov.data?.data;
  const c = ch.data?.data;

  const mapMonths = (rows = [], pick) => rows.map((r) => ({ month: monthLabel(r._id), ...pick(r) }));

  return (
    <div className="space-y-6">
      <DashboardPageHeader eyebrow="Transport & Returns" title="Overview" description="Orders, fleet, deliveries, damage and money — at a glance." icon={LayoutDashboard} theme="blue" />

      <ErrorBox error={ov.error} onRetry={ov.reload} />
      {ov.loading ? <Spinner /> : o && (
        <>
          {(o.flaggedDamageReports > 0 || o.pendingExpenseApprovals > 0 || o.pendingOrders > 0) && (
            <div className="flex flex-wrap gap-2 text-sm">
              {o.pendingOrders > 0 && <Link to="/transport/orders" className="rounded-xl bg-amber-50 px-3 py-2 font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">{o.pendingOrders} order(s) awaiting approval →</Link>}
              {o.flaggedDamageReports > 0 && <Link to="/transport/damage" className="rounded-xl bg-red-50 px-3 py-2 font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300">{o.flaggedDamageReports} damage report(s) need review →</Link>}
              {o.pendingExpenseApprovals > 0 && <Link to="/transport/expenses" className="rounded-xl bg-amber-50 px-3 py-2 font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">{o.pendingExpenseApprovals} expense(s) to review →</Link>}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total orders" value={o.totalOrders} icon={ClipboardList} tone="navy" />
            <StatCard label="Pending orders" value={o.pendingOrders} icon={Clock} tone="orange" />
            <StatCard label="Active deliveries" value={o.activeDeliveries} icon={Truck} tone="blue" />
            <StatCard label="Completed deliveries" value={o.completedDeliveries} icon={CheckCircle2} tone="green" />
            <StatCard label="Available trucks" value={o.availableTrucks} icon={Truck} tone="green" />
            <StatCard label="Available drivers" value={o.availableDrivers} icon={Users} tone="green" />
            <StatCard label="Damaged fish" value={kg(o.damagedFishKg)} icon={AlertTriangle} tone="red" hint={`Missing: ${kg(o.missingFishKg)}`} />
            <StatCard label="Returned fish" value={kg(o.returnedFishKg)} icon={Undo2} tone="orange" />
            <StatCard label="Delivery expenses" value={money(o.totalDeliveryExpenses)} icon={Receipt} tone="navy" />
            <StatCard label="Return expenses" value={money(o.totalReturnExpenses)} icon={PackageX} tone="orange" />
            <StatCard label="Financial loss (finalized)" value={money(o.totalFinancialLoss)} icon={TrendingDown} tone="red" />
            <StatCard label="Pending payments" value={money(o.pendingPaymentsAmount)} icon={Wallet} tone="orange" />
          </div>
        </>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[#102A43] dark:text-white">Trends</h2>
        <FilterSelect value={months} onChange={(v) => setMonths(v || "6")} placeholder="Period" options={[{ value: "3", label: "Last 3 months" }, { value: "6", label: "Last 6 months" }, { value: "12", label: "Last 12 months" }]} />
      </div>
      <ErrorBox error={ch.error} onRetry={ch.reload} />
      {ch.loading ? <Spinner /> : c && (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Monthly deliveries" xKey="month" data={mapMonths(c.deliveries, (r) => ({ completed: r.completed, other: r.total - r.completed - r.cancelled, cancelled: r.cancelled }))}
            series={[{ key: "completed", label: "Completed" }, { key: "other", label: "Open" }, { key: "cancelled", label: "Cancelled" }]} stacked />
          <ChartCard title="Damaged & missing fish (kg)" xKey="month" data={mapMonths(c.damage, (r) => ({ damagedKg: r.damagedKg, missingKg: r.missingKg }))}
            series={[{ key: "damagedKg", label: "Damaged kg" }, { key: "missingKg", label: "Missing kg" }]} />
          <ChartCard title="Fish damage percentage" type="line" xKey="month" data={mapMonths(c.damage, (r) => ({ damagePercent: r.damagePercent }))}
            series={[{ key: "damagePercent", label: "Damage %" }]} valueFormatter={(v) => `${Number(v).toFixed(1)}%`} />
          <ChartCard title="Delivery vs return expenses (LKR)" xKey="month" data={mapMonths(c.expenses, (r) => ({ delivery: r.delivery, return: r.return }))}
            series={[{ key: "delivery", label: "Delivery" }, { key: "return", label: "Return" }]} />
          <ChartCard title="Monthly financial loss (LKR, finalized)" type="line" xKey="month" data={mapMonths(c.losses, (r) => ({ netLoss: r.netLoss }))}
            series={[{ key: "netLoss", label: "Net loss" }]} />
          <ChartCard title="Truck utilisation (deliveries)" type="hbar" xKey="registrationNumber" data={c.truckUtilisation}
            series={[{ key: "deliveries", label: "Deliveries" }]} />
          <ChartCard title="Driver performance (on-time %)" type="hbar" xKey="name" data={c.driverPerformance}
            series={[{ key: "onTimePercent", label: "On-time %" }]} valueFormatter={(v) => `${Number(v).toFixed(0)}%`} />
          <ChartCard title="Orders by destination" type="hbar" xKey="_id" data={c.destinations}
            series={[{ key: "orders", label: "Orders" }]} />
        </div>
      )}
      <p className="flex items-center gap-1 text-xs text-slate-400"><Fish size={12} /> All figures come from recorded deliveries, expenses and approved assessments.</p>
    </div>
  );
};

export default Overview;
