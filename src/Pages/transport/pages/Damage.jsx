import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import DashboardPageHeader from "../../../components/DashboardPageHeader";
import transportApi, { dt, kg, money, pct } from "../../../services/transportApi";
import { Card, DataTable, EmptyState, FilterSelect, StatusBadge, Tabs } from "../ui";
import { useServerList } from "../hooks";

const VIEWS = [
  { value: "review", label: "Needs review" },
  { value: "flagged", label: "Flagged" },
  { value: "approved", label: "Approved" },
  { value: "all", label: "All" },
];

const Damage = () => {
  const navigate = useNavigate();
  const list = useServerList(transportApi.damageReports, { initial: { status: "flagged_for_review,pending_approval" }, defaultSort: "-updatedAt" });
  const view = list.params.flagged === "true" ? "flagged" : list.params.status === "approved" ? "approved" : list.params.status ? "review" : "all";
  const setView = (v) =>
    list.set({
      status: v === "review" ? "flagged_for_review,pending_approval" : v === "approved" ? "approved" : "",
      flagged: v === "flagged" ? "true" : "",
    });

  return (
    <div className="space-y-6">
      <DashboardPageHeader eyebrow="Transport & Returns" title="Damage Management" description="Driver-reported and buyer-verified damage, kept separate. Differences are flagged for your verification." icon={AlertTriangle} theme="rose" />
      <Card padded={false}>
        <DataTable
          list={list}
          onRowClick={(r) => r.delivery && navigate(`/transport/deliveries/${r.delivery._id}?tab=damage`)}
          empty={<EmptyState title="No damage reports here" />}
          toolbar={
            <>
              <Tabs tabs={VIEWS} value={view} onChange={setView} />
              <FilterSelect value={list.params.withDamage} onChange={(withDamage) => list.set({ withDamage })} options={[{ value: "true", label: "Only with damaged fish" }]} placeholder="Any quantity" />
            </>
          }
          columns={[
            { key: "delivery", label: "Delivery", render: (r) => <span className="font-semibold text-[#1677FF]">{r.delivery?.deliveryNumber}</span> },
            { key: "order", label: "Order", render: (r) => r.order?.orderNumber },
            { key: "buyer", label: "Buyer", render: (r) => r.delivery?.buyer?.name },
            { key: "driver", label: "Driver / truck", render: (r) => `${r.delivery?.driver?.name || "—"} · ${r.delivery?.truck?.registrationNumber || ""}` },
            { key: "loaded", label: "Loaded", render: (r) => kg(r.totals?.loadedKg) },
            { key: "damaged", label: "Damaged", render: (r) => <span className={r.totals?.damagedKg > 0 ? "font-semibold text-red-600" : ""}>{kg(r.totals?.damagedKg)} ({pct(r.totals?.damagePercent)})</span> },
            { key: "missing", label: "Missing", render: (r) => <span className={r.totals?.missingKg > 0 ? "font-semibold text-red-600" : ""}>{kg(r.totals?.missingKg)} ({pct(r.totals?.missingPercent)})</span> },
            { key: "value", label: "Damage + missing value", render: (r) => money((r.totals?.damageValue || 0) + (r.totals?.missingValue || 0)) },
            { key: "flag", label: "Discrepancy", render: (r) => (r.discrepancy?.flagged ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600"><AlertTriangle size={13} /> {r.discrepancy.details.length} issue(s)</span> : "—") },
            { key: "responsibility", label: "Responsibility", render: (r) => (r.responsibility?.approved ? r.responsibility.party : r.status === "approved" ? <StatusBadge status="pending" /> : "—") },
            { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "updated", label: "Updated", sortKey: "updatedAt", render: (r) => dt(r.updatedAt) },
          ]}
        />
      </Card>
    </div>
  );
};

export default Damage;
