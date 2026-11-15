import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Download, Wallet } from "lucide-react";
import DashboardPageHeader from "../../../components/DashboardPageHeader";
import transportApi, { dOnly, dt, errorMessage, kg, money, newIdempotencyKey } from "../../../services/transportApi";
import { downloadInvoicePdf } from "../exporters";
import { Button, Card, DataTable, ErrorBox, FilterSelect, Input, KeyValues, Modal, SearchBox, Select, Spinner, StatusBadge, Tabs, Textarea } from "../ui";
import { useAsync, useServerList, useTransport } from "../hooks";

const InvoiceModal = ({ id, onClose, onChanged }) => {
  const settings = useAsync(() => transportApi.settings(), []);
  const [inv, setInv] = useState(null);
  const [error, setError] = useState(null);
  const [pay, setPay] = useState({ kind: "payment", amount: "", method: "", reference: "", paidAt: "", note: "" });
  const [adj, setAdj] = useState({ kind: "charge", label: "", amount: "", reason: "" });
  const [key, setKey] = useState(newIdempotencyKey);
  const [busy, setBusy] = useState(false);
  const load = () => transportApi.invoice(id).then((r) => setInv(r.data)).catch(setError);
  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  const run = async (fn, msg, reset) => {
    setBusy(true);
    try {
      await fn();
      toast.success(msg);
      reset();
      onChanged();
      load();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  if (error) return <Modal open title="Invoice" onClose={onClose}><ErrorBox error={error} /></Modal>;
  if (!inv) return <Modal open title="Invoice" onClose={onClose}><Spinner /></Modal>;
  const outstanding = Math.max(0, inv.totals.finalPayable - (inv.amountPaid - inv.amountRefunded));
  const methods = settings.data?.data?.paymentMethods || [];

  return (
    <Modal open wide title={`Invoice ${inv.invoiceNumber}`} onClose={onClose} footer={<Button variant="secondary" icon={Download} onClick={() => downloadInvoicePdf(inv)}>Download PDF</Button>}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3"><StatusBadge status={inv.paymentStatus} /><span className="text-sm text-slate-500">Outstanding {money(outstanding)} · due {dOnly(inv.dueDate)}</span></div>
        <KeyValues cols={3} items={[["Buyer", `${inv.buyerSnapshot?.name} · ${inv.buyerSnapshot?.phone}`], ["Order / delivery", `${inv.order?.orderNumber} / ${inv.delivery?.deliveryNumber}`], ["Delivered to", inv.buyerSnapshot?.address]]} />
        <DataTable rows={inv.lines} columns={[
          { key: "fishName", label: "Fish" }, { key: "loadedKg", label: "Loaded", render: (r) => kg(r.loadedKg) }, { key: "acceptedKg", label: "Accepted", render: (r) => kg(r.acceptedKg) },
          { key: "damagedKg", label: "Damaged", render: (r) => kg(r.damagedKg) }, { key: "missingKg", label: "Missing", render: (r) => kg(r.missingKg) },
          { key: "pricePerKg", label: "Price / kg", render: (r) => money(r.pricePerKg) }, { key: "acceptedValue", label: "Accepted value", render: (r) => money(r.acceptedValue) },
        ]} />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-1 text-sm">
            {[["Accepted fish value", inv.totals.acceptedValue], ["+ Approved charges", inv.totals.additionalCharges], ["− Discounts", inv.totals.discounts], ["− Approved refunds", inv.totals.refunds]].map(([k, v]) => <p key={k} className="flex justify-between"><span className="text-slate-500">{k}</span><span className="tabular-nums">{money(v)}</span></p>)}
            <p className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold dark:border-slate-700"><span>Final payable</span><span>{money(inv.totals.finalPayable)}</span></p>
            {inv.adjustments.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs text-slate-500">{inv.adjustments.map((a) => <li key={a._id}>{a.kind}: {a.label} {money(a.amount)} — {a.reason} ({dt(a.at)})</li>)}</ul>
            )}
          </div>
          <div className="space-y-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <Tabs value={pay.kind} onChange={(kind) => setPay({ ...pay, kind })} tabs={[{ value: "payment", label: "Record payment" }, { value: "refund", label: "Record refund" }]} />
            <p className="text-xs text-slate-500">Records money received or returned outside the system. No money is transferred here.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Amount (LKR)" type="number" min="0.01" step="0.01" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} hint={pay.kind === "payment" ? `Outstanding ${money(outstanding)}` : undefined} />
              <Select label="Method" value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })} placeholder="Select" options={methods} />
              <Input label="Reference" value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} hint="Bank / receipt reference" />
              <Input label="Date" type="date" value={pay.paidAt} onChange={(e) => setPay({ ...pay, paidAt: e.target.value })} />
            </div>
            <Button variant="success" loading={busy} disabled={!pay.amount || !pay.method} onClick={() => run(() => transportApi.recordPayment(id, { ...pay, amount: Number(pay.amount), paidAt: pay.paidAt || undefined }, key), pay.kind === "refund" ? "Refund recorded" : "Payment recorded", () => { setPay({ ...pay, amount: "", reference: "" }); setKey(newIdempotencyKey()); })}>Save</Button>
          </div>
        </div>
        <div className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-4 dark:border-slate-700">
          <Select label="Adjustment" value={adj.kind} onChange={(e) => setAdj({ ...adj, kind: e.target.value })} options={[{ value: "charge", label: "Additional charge" }, { value: "discount", label: "Discount" }, { value: "refund", label: "Refund" }]} />
          <Input label="Label" value={adj.label} onChange={(e) => setAdj({ ...adj, label: e.target.value })} />
          <Input label="Amount (LKR)" type="number" min="0.01" value={adj.amount} onChange={(e) => setAdj({ ...adj, amount: e.target.value })} />
          <Textarea className="sm:col-span-4" label="Reason (audited)" value={adj.reason} onChange={(e) => setAdj({ ...adj, reason: e.target.value })} rows={2} />
          <div className="sm:col-span-4"><Button variant="secondary" loading={busy} disabled={!adj.label || !adj.amount || !adj.reason} onClick={() => run(() => transportApi.adjustInvoice(id, { ...adj, amount: Number(adj.amount) }), "Invoice adjusted", () => setAdj({ kind: "charge", label: "", amount: "", reason: "" }))}>Apply adjustment</Button></div>
        </div>
        <div>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Payment history</h4>
          <DataTable rows={inv.payments} columns={[
            { key: "paidAt", label: "Date", render: (r) => dt(r.paidAt) }, { key: "kind", label: "Type", render: (r) => <span className="capitalize">{r.kind}</span> },
            { key: "amount", label: "Amount", render: (r) => money(r.amount) }, { key: "method", label: "Method" }, { key: "reference", label: "Reference", render: (r) => r.reference || "—" }, { key: "by", label: "Recorded by", render: (r) => r.recordedBy?.name },
          ]} />
        </div>
      </div>
    </Modal>
  );
};

const Payments = () => {
  const { meta } = useTransport();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState("invoices");
  const invoices = useServerList(transportApi.invoices, { defaultSort: "-issuedAt" });
  const payments = useServerList(transportApi.payments, { defaultSort: "-paidAt" });
  const openId = params.get("invoice");
  return (
    <div className="space-y-6">
      <DashboardPageHeader eyebrow="Transport & Returns" title="Payments" description="Delivery invoices, adjustments, recorded payments and refunds." icon={Wallet} theme="emerald" />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: "invoices", label: "Invoices" }, { value: "history", label: "Payment history" }]} />
      {tab === "invoices" ? (
        <Card padded={false}>
          <DataTable list={invoices} onRowClick={(r) => setParams({ invoice: r._id })}
            toolbar={
              <>
                <SearchBox value={invoices.params.search} onChange={(search) => invoices.set({ search })} placeholder="Search invoice number" />
                <FilterSelect value={invoices.params.status} onChange={(status) => invoices.set({ status })} options={meta.paymentStatuses} placeholder="Any status" />
              </>
            }
            columns={[
              { key: "invoiceNumber", label: "Invoice", sortKey: "issuedAt", render: (r) => <span className="font-semibold text-[#1677FF]">{r.invoiceNumber}</span> },
              { key: "buyer", label: "Buyer", render: (r) => r.buyerSnapshot?.name },
              { key: "order", label: "Order", render: (r) => r.order?.orderNumber },
              { key: "accepted", label: "Accepted", render: (r) => kg(r.totals?.acceptedKg) },
              { key: "payable", label: "Final payable", render: (r) => money(r.totals?.finalPayable) },
              { key: "paid", label: "Paid", render: (r) => money(r.amountPaid - r.amountRefunded) },
              { key: "due", label: "Due", sortKey: "dueDate", render: (r) => dOnly(r.dueDate) },
              { key: "status", label: "Status", render: (r) => <StatusBadge status={r.paymentStatus} /> },
            ]}
          />
        </Card>
      ) : (
        <Card padded={false}>
          <DataTable list={payments} onRowClick={(r) => setParams({ invoice: r.invoice?._id })} columns={[
            { key: "paidAt", label: "Date", sortKey: "paidAt", render: (r) => dt(r.paidAt) },
            { key: "invoice", label: "Invoice", render: (r) => r.invoice?.invoiceNumber },
            { key: "kind", label: "Type", render: (r) => <span className="capitalize">{r.kind}</span> },
            { key: "amount", label: "Amount", sortKey: "amount", render: (r) => money(r.amount) },
            { key: "method", label: "Method" },
            { key: "reference", label: "Reference", render: (r) => r.reference || "—" },
          ]} />
        </Card>
      )}
      {openId && <InvoiceModal id={openId} onClose={() => setParams({})} onChanged={() => { invoices.reload(); payments.reload(); }} />}
    </div>
  );
};

export default Payments;
