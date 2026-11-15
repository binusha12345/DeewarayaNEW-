import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { MapContainer, Polyline, CircleMarker, TileLayer, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { AlertTriangle, ArrowLeft, CheckCircle2, Lock, Plus, Scale } from "lucide-react";
import { API_ORIGIN } from "../../../services/api";
import transportApi, { dt, errorMessage, kg, money, newIdempotencyKey, pct } from "../../../services/transportApi";
import { Button, Card, Checkbox, ConfirmDialog, DataTable, EmptyState, ErrorBox, Input, KeyValues, Modal, Photos, Select, Spinner, StatusBadge, Tabs, Textarea } from "../ui";
import { cx, useTransport } from "../hooks";

// ---------- Summary + route ----------
const RouteMap = ({ id }) => {
  const { socket } = useTransport();
  const [t, setT] = useState(null);
  useEffect(() => {
    transportApi.track(id).then((r) => setT(r.data)).catch(() => {});
  }, [id]);
  useEffect(() => {
    if (!socket) return undefined;
    socket.emit("transport:watch", { deliveryId: id });
    const onLoc = (p) => p.deliveryId === id && setT((cur) => cur && { ...cur, lastLocation: p, path: [...cur.path, p] });
    socket.on("delivery:location", onLoc);
    return () => {
      socket.off("delivery:location", onLoc);
      socket.emit("transport:unwatch", { deliveryId: id });
    };
  }, [socket, id]);
  if (!t) return <Spinner />;
  const pts = t.path.map((p) => [p.latitude, p.longitude]);
  const origin = t.origin?.location?.latitude != null ? [t.origin.location.latitude, t.origin.location.longitude] : null;
  const dest = t.destination?.location?.latitude != null ? [t.destination.location.latitude, t.destination.location.longitude] : null;
  const center = t.lastLocation ? [t.lastLocation.latitude, t.lastLocation.longitude] : dest || origin || [7.8731, 80.7718];
  return (
    <div className="space-y-2">
      <div className="h-[340px] overflow-hidden rounded-2xl">
        <MapContainer center={center} zoom={8} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {pts.length > 1 && <Polyline positions={pts} pathOptions={{ color: "#1677FF", weight: 3 }} />}
          {origin && <CircleMarker center={origin} radius={7} pathOptions={{ color: "#fff", weight: 2, fillColor: "#102A43", fillOpacity: 1 }}><Popup>Harbour: {t.origin.name}</Popup></CircleMarker>}
          {dest && <CircleMarker center={dest} radius={7} pathOptions={{ color: "#fff", weight: 2, fillColor: "#22C55E", fillOpacity: 1 }}><Popup>Destination: {t.destination.address}</Popup></CircleMarker>}
          {t.lastLocation && <CircleMarker center={[t.lastLocation.latitude, t.lastLocation.longitude]} radius={9} pathOptions={{ color: "#fff", weight: 2, fillColor: "#1677FF", fillOpacity: 1 }}><Popup>Truck · {dt(t.lastLocation.at)}</Popup></CircleMarker>}
        </MapContainer>
      </div>
      <p className="text-xs text-slate-500">
        {t.lastLocation ? `Last GPS update ${dt(t.lastLocation.at)}` : "No GPS position received yet"}
        {t.remainingStraightLineKm != null && ` · about ${t.remainingStraightLineKm} km (straight line) to destination`}
      </p>
    </div>
  );
};

const Summary = ({ d }) => (
  <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
    <div className="space-y-6">
      <Card title="Delivery">
        <KeyValues cols={3} items={[
          ["Order", <Link key="o" className="text-[#1677FF]" to="/transport/orders">{d.order?.orderNumber}</Link>],
          ["Buyer", `${d.buyer?.name} · ${d.buyer?.phone}`],
          ["Harbour", d.harbour?.name],
          ["Destination", `${d.order?.destination?.address}${d.order?.destination?.island ? ` (${d.order.destination.island})` : ""}`],
          ["Truck", `${d.truck?.registrationNumber} · ${d.truck?.model}${d.truck?.refrigerated ? " · refrigerated" : ""}`],
          ["Driver", `${d.driver?.name} · ${d.driver?.phone}`],
          ["Scheduled", `${dt(d.scheduledStart)} → ${dt(d.scheduledEnd)}`],
          ["Departed", dt(d.record?.departureTime)],
          ["Arrived", dt(d.record?.arrivalTime)],
          ["Estimated distance", d.estimatedDistanceKm != null ? `${d.estimatedDistanceKm} km` : "—"],
          ["Actual distance", d.record?.actualDistanceKm != null ? `${d.record.actualDistanceKm} km` : "—"],
          ["Fuel start → end", d.record?.startFuelL != null ? `${d.record.startFuelL} L → ${d.record.endFuelL ?? "?"} L` : "—"],
        ]} />
        {d.record?.handover?.submittedAt && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800">Handover {dt(d.record.handover.submittedAt)} to {d.record.handover.receiverName || "buyer"}{d.record.handover.notes && ` — ${d.record.handover.notes}`}</p>}
      </Card>
      <Card title="Route">{["Not Started", "Cancelled"].includes(d.status) ? <EmptyState title="Not on the road yet" /> : <RouteMap id={d._id} />}</Card>
    </div>
    <Card title="Timeline & incidents">
      {!d.record?.events?.length ? <EmptyState title="No events yet" /> : (
        <ol className="space-y-3 border-l-2 border-slate-200 pl-4 dark:border-slate-700">
          {d.record.events.slice().reverse().map((e) => (
            <li key={e._id} className="text-sm">
              <div className="flex items-center gap-2">
                <span className={cx("font-semibold capitalize", ["breakdown", "accident", "delay"].includes(e.type) && "text-red-600")}>{e.status || e.type}</span>
                <span className="text-xs text-slate-400">{dt(e.at)}</span>
              </div>
              {e.note && <p className="text-slate-600 dark:text-slate-300">{e.note}</p>}
              {e.photos?.length > 0 && <div className="mt-2"><Photos paths={e.photos} origin={API_ORIGIN} /></div>}
            </li>
          ))}
        </ol>
      )}
    </Card>
  </div>
);

// ---------- Loading ----------
const Loading = ({ d, reload }) => {
  const [confirm, setConfirm] = useState(null);
  const l = d.loading;
  if (!l) return <Card><EmptyState title="Loading not recorded yet" text="The driver records actual loaded quantities and photos at the harbour." /></Card>;
  return (
    <Card title="Loading record" action={<StatusBadge status={l.verificationStatus} />}>
      <div className="space-y-5">
        <KeyValues cols={4} items={[["Loaded at", dt(l.loadedAt)], ["Location", l.location?.name || "—"], ["Expected", kg(l.totalExpectedKg)], ["Actually loaded", kg(l.totalLoadedKg)]]} />
        <DataTable rows={l.items} columns={[
          { key: "fishName", label: "Fish" },
          { key: "expectedKg", label: "Expected", render: (r) => kg(r.expectedKg) },
          { key: "loadedKg", label: "Loaded", render: (r) => kg(r.loadedKg) },
          { key: "diff", label: "Difference", render: (r) => <span className={r.loadedKg < r.expectedKg ? "text-amber-600" : ""}>{kg(r.loadedKg - r.expectedKg)}</span> },
        ]} />
        <Photos paths={l.photos} origin={API_ORIGIN} />
        {l.notes && <p className="text-sm text-slate-600">{l.notes}</p>}
        {l.verificationNote && <p className="text-sm text-slate-600">Manager note: {l.verificationNote}</p>}
        {l.verificationStatus === "pending" && (
          <div className="flex gap-2">
            <Button variant="success" icon={CheckCircle2} onClick={() => setConfirm("verified")}>Verify loading</Button>
            <Button variant="danger" onClick={() => setConfirm("disputed")}>Dispute</Button>
          </div>
        )}
      </div>
      <ConfirmDialog open={!!confirm} title={confirm === "verified" ? "Verify loading" : "Dispute loading"} reasonLabel="Note" reasonRequired={confirm === "disputed"} variant={confirm === "verified" ? "success" : "danger"}
        onClose={() => setConfirm(null)} onConfirm={async (note) => { await transportApi.verifyLoading(d._id, { status: confirm, note }); toast.success("Loading updated"); reload(); }} />
    </Card>
  );
};

// ---------- Damage ----------
const ApproveModal = ({ d, onClose, onDone }) => {
  const a = d.assessment;
  const [basis, setBasis] = useState("buyer");
  const [note, setNote] = useState("");
  const [items, setItems] = useState(() => Object.fromEntries(a.items.map((i) => [String(i.fishType), { goodKg: i.goodKg, damagedKg: i.damagedKg, missingKg: i.missingKg, rejectedKg: i.rejectedKg }])));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await transportApi.approveAssessment(d._id, {
        basis,
        note,
        items: basis === "manager" ? a.items.map((i) => ({ fishType: i.fishType, ...Object.fromEntries(Object.entries(items[String(i.fishType)]).map(([k, v]) => [k, Number(v)])) })) : undefined,
      });
      toast.success("Assessment approved. Invoice generated and delivery completed.");
      onDone();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open wide title="Approve final damage figures" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="success" onClick={submit} loading={busy} disabled={basis !== "buyer" && !note.trim()}>Approve &amp; complete delivery</Button></>}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">This generates the buyer's invoice and locks the delivery. Choose which figures are final:</p>
        <Select label="Use figures from" value={basis} onChange={(e) => setBasis(e.target.value)} options={[
          { value: "buyer", label: "Buyer verification (default)" },
          { value: "driver", label: "Driver's damaged quantity (missing taken from buyer)" },
          { value: "manager", label: "My own verified figures" },
        ]} />
        {basis === "manager" && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs text-slate-500"><tr><th className="py-2 pr-3">Fish</th><th className="pr-3">Loaded</th><th className="pr-3">Good</th><th className="pr-3">Damaged</th><th className="pr-3">Missing</th><th className="pr-3">Rejected good</th></tr></thead>
              <tbody>
                {a.items.map((i) => {
                  const k = String(i.fishType);
                  const row = items[k];
                  const sumOk = Math.abs(Number(row.goodKg) + Number(row.damagedKg) + Number(row.missingKg) - i.loadedKg) < 0.011;
                  return (
                    <tr key={k}>
                      <td className="py-1 pr-3 font-medium">{i.fishName}</td>
                      <td className={cx("pr-3", !sumOk && "text-red-600")}>{kg(i.loadedKg)}</td>
                      {["goodKg", "damagedKg", "missingKg", "rejectedKg"].map((f) => (
                        <td key={f} className="pr-3"><input type="number" min="0" step="0.01" aria-label={`${i.fishName} ${f}`} className="w-24 rounded-lg border border-slate-200 px-2 py-1 dark:border-slate-700 dark:bg-slate-800" value={row[f]} onChange={(e) => setItems({ ...items, [k]: { ...row, [f]: e.target.value } })} /></td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-1 text-xs text-slate-500">Good + damaged + missing must equal the loaded quantity.</p>
          </div>
        )}
        <Textarea label="Note" required={basis !== "buyer"} value={note} onChange={(e) => setNote(e.target.value)} />
        <ErrorBox error={error} />
      </div>
    </Modal>
  );
};

const ResponsibilityForm = ({ d, meta, locked, reload }) => {
  const r = d.assessment.responsibility || {};
  const [party, setParty] = useState(r.party || "Undetermined");
  const [shares, setShares] = useState(r.shares?.length ? r.shares : [{ party: "", percent: 50 }, { party: "", percent: 50 }]);
  const [note, setNote] = useState(r.note || "");
  const [busy, setBusy] = useState(false);
  const specific = meta.responsibilityParties.filter((p) => !["Shared Responsibility", "Undetermined"].includes(p));
  const save = async () => {
    setBusy(true);
    try {
      await transportApi.setResponsibility(d._id, { party, note, shares: party === "Shared Responsibility" ? shares.map((s) => ({ party: s.party, percent: Number(s.percent) })) : [] });
      toast.success("Responsibility saved");
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const total = shares.reduce((t, s) => t + Number(s.percent || 0), 0);
  return (
    <Card title="Financial responsibility" action={r.approved ? <StatusBadge status="approved" /> : <StatusBadge status="pending" />}>
      <div className="space-y-3">
        <Select label="Responsible party" value={party} onChange={(e) => setParty(e.target.value)} options={meta.responsibilityParties} disabled={locked} />
        {party === "Shared Responsibility" && (
          <div className="space-y-2">
            {shares.map((s, i) => (
              <div key={i} className="flex gap-2">
                <select aria-label="Party" className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" value={s.party} disabled={locked} onChange={(e) => setShares(shares.map((x, j) => (j === i ? { ...x, party: e.target.value } : x)))}>
                  <option value="">Select party</option>
                  {specific.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <input aria-label="Percent" type="number" min="0" max="100" className="w-24 rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" value={s.percent} disabled={locked} onChange={(e) => setShares(shares.map((x, j) => (j === i ? { ...x, percent: e.target.value } : x)))} />
              </div>
            ))}
            <div className="flex items-center justify-between text-xs">
              <button type="button" className="font-semibold text-[#1677FF]" disabled={locked} onClick={() => setShares([...shares, { party: "", percent: 0 }])}>+ Add party</button>
              <span className={Math.abs(total - 100) > 0.01 ? "text-red-600" : "text-green-600"}>Total {total}%</span>
            </div>
          </div>
        )}
        <Textarea label="Justification" value={note} onChange={(e) => setNote(e.target.value)} disabled={locked} />
        {!locked && <Button onClick={save} loading={busy} icon={Scale}>{party === "Undetermined" ? "Save as undetermined" : "Approve responsibility"}</Button>}
      </div>
    </Card>
  );
};

const CompareRow = ({ label, driver, buyer, final, flag }) => (
  <tr className={flag ? "bg-red-50/60 dark:bg-red-500/5" : ""}>
    <td className="py-2 pr-4 text-slate-500">{label}</td>
    <td className="py-2 pr-4 tabular-nums">{driver}</td>
    <td className="py-2 pr-4 tabular-nums">{buyer}</td>
    <td className="py-2 pr-4 font-semibold tabular-nums">{final}</td>
  </tr>
);

const Damage = ({ d, meta, reload, lossFinal }) => {
  const [approving, setApproving] = useState(false);
  const a = d.assessment;
  const dr = d.driverReport;
  const bv = d.buyerVerification;
  if (!a) return <Card><EmptyState title="No assessment" /></Card>;
  const canApprove = ["flagged_for_review", "pending_approval"].includes(a.status);
  return (
    <div className="space-y-6">
      {a.discrepancy?.flagged && a.status !== "approved" && (
        <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300" role="alert">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Reports differ — manager verification required</p>
            <ul className="mt-1 list-disc pl-5">
              {a.discrepancy.details.map((x, i) => (
                <li key={i}>{x.fishName}: {x.field === "damagedKg" ? `driver reported ${x.driverKg} kg damaged, buyer ${x.buyerKg} kg` : x.field === "missingKg" ? `buyer reports ${x.buyerKg} kg missing` : x.field === "driverLoadedKg" ? `driver's loaded figure ${x.driverKg} kg differs from loading record ${x.loadedKg} kg` : `${x.field}: ${x.differenceKg} kg`}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <Card title="Driver report vs buyer verification" action={<StatusBadge status={a.status} />}>
        {!dr && !bv ? <EmptyState title="Waiting for reports" text="The driver reports fish condition on arrival; the buyer then verifies independently." /> : (
          <div className="space-y-6">
            {a.items.length > 0 && a.items.map((i) => {
              const di = dr?.items.find((x) => String(x.fishType) === String(i.fishType));
              const bi = bv?.items.find((x) => String(x.fishType) === String(i.fishType));
              const dmgFlag = di && bi && Math.abs(di.damagedKg - bi.damagedKg) > 0.01;
              return (
                <div key={String(i.fishType)} className="overflow-x-auto">
                  <h4 className="mb-2 font-semibold text-[#102A43] dark:text-white">{i.fishName} · {money(i.pricePerKg)}/kg</h4>
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-xs uppercase text-slate-400"><tr><th className="py-1 pr-4"></th><th className="pr-4">Driver</th><th className="pr-4">Buyer</th><th className="pr-4">{a.status === "approved" ? `Final (${a.basis})` : "Calculated"}</th></tr></thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      <CompareRow label="Loaded" driver={kg(di?.loadedKg)} buyer="—" final={kg(i.loadedKg)} />
                      <CompareRow label="Received" driver="—" buyer={kg(bi?.receivedKg)} final={kg(i.goodKg + i.damagedKg)} />
                      <CompareRow label="Good quality" driver="—" buyer={kg(bi?.goodKg)} final={kg(i.goodKg)} />
                      <CompareRow label="Damaged" driver={kg(di?.damagedKg)} buyer={kg(bi?.damagedKg)} final={kg(i.damagedKg)} flag={dmgFlag} />
                      <CompareRow label="Missing" driver="—" buyer={kg(bi?.missingKg)} final={kg(i.missingKg)} flag={i.missingKg > 0} />
                      <CompareRow label="Rejected (good)" driver="—" buyer={kg(bi?.rejectedKg)} final={kg(i.rejectedKg)} />
                      <CompareRow label="Accepted" driver="—" buyer="—" final={kg(i.acceptedKg)} />
                      <CompareRow label="Damage %" driver="—" buyer="—" final={pct(i.damagePercent)} />
                      <CompareRow label="Missing %" driver="—" buyer="—" final={pct(i.missingPercent)} />
                      <CompareRow label="Damage value" driver="—" buyer="—" final={money(i.damageValue)} />
                      <CompareRow label="Missing value" driver="—" buyer="—" final={money(i.missingValue)} />
                      <CompareRow label="Accepted value" driver="—" buyer="—" final={money(i.acceptedValue)} />
                    </tbody>
                  </table>
                </div>
              );
            })}
            {!a.items.length && <p className="text-sm text-slate-500">Figures are calculated when the buyer submits verification.</p>}
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Driver evidence</h4>
                {dr ? (<><p className="mb-2 text-sm">{dr.reason}{dr.description && ` — ${dr.description}`} <span className="text-slate-400">({dt(dr.observedAt)})</span></p><Photos paths={dr.photos} origin={API_ORIGIN} /></>) : <p className="text-sm text-slate-400">Not submitted</p>}
              </div>
              <div>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Buyer evidence</h4>
                {bv ? (<><p className="mb-2 text-sm"><StatusBadge status={bv.decision} /> {bv.damageReason} {bv.comments && `— ${bv.comments}`} <span className="text-slate-400">({dt(bv.submittedAt)})</span></p><Photos paths={bv.photos} origin={API_ORIGIN} /></>) : <p className="text-sm text-slate-400">Not submitted</p>}
              </div>
            </div>
            {canApprove && <Button variant="success" icon={CheckCircle2} onClick={() => setApproving(true)}>Review &amp; approve final figures</Button>}
            {a.status === "approved" && <p className="text-sm text-slate-500">Approved {dt(a.approvedAt)}{a.managerNote && ` — ${a.managerNote}`}</p>}
          </div>
        )}
      </Card>
      {a.status === "approved" && <ResponsibilityForm d={d} meta={meta} locked={lossFinal} reload={reload} />}
      {approving && <ApproveModal d={d} onClose={() => setApproving(false)} onDone={() => { setApproving(false); reload(); }} />}
    </div>
  );
};

// ---------- Expenses & costs ----------
const ExpenseForm = ({ d, meta, returns, onClose, onDone }) => {
  const [f, setF] = useState({ scope: "delivery", category: "fuel", amount: "", description: "", returnRequest: "", fuel: { startL: d.record?.startFuelL ?? "", purchasedL: "", endL: d.record?.endFuelL ?? "", pricePerLitre: "" } });
  const [busy, setBusy] = useState(false);
  const [key] = useState(newIdempotencyKey);
  const consumed = Number(f.fuel.startL || 0) + Number(f.fuel.purchasedL || 0) - Number(f.fuel.endL || 0);
  const save = async () => {
    setBusy(true);
    try {
      await transportApi.addExpense(d._id, {
        scope: f.scope,
        category: f.category,
        description: f.description,
        returnRequest: f.scope === "return" ? f.returnRequest : undefined,
        ...(f.category === "fuel" ? { fuel: Object.fromEntries(Object.entries(f.fuel).map(([k, v]) => [k, v === "" ? undefined : Number(v)])) } : { amount: Number(f.amount) }),
      }, key);
      toast.success("Expense recorded");
      onDone();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open title="Record expense" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} loading={busy}>Save</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select label="Applies to" value={f.scope} onChange={(e) => setF({ ...f, scope: e.target.value })} options={[{ value: "delivery", label: "Original delivery" }, { value: "shared", label: "Shared journey (delivery + return)" }, { value: "return", label: "Additional return cost" }]} />
        <Select label="Category" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} options={meta.expenseCategories} />
        {f.scope === "return" && <Select className="sm:col-span-2" label="Return" required value={f.returnRequest} onChange={(e) => setF({ ...f, returnRequest: e.target.value })} placeholder="Select return" options={returns.map((r) => ({ value: r._id, label: `${r.returnNumber} · ${r.fishName} ${kg(r.returnKg)}${r.sharedJourney ? " (shared journey)" : ""}` }))} />}
        {f.category === "fuel" ? (
          <>
            {["startL", "purchasedL", "endL", "pricePerLitre"].map((k) => (
              <Input key={k} label={{ startL: "Starting fuel (L)", purchasedL: "Fuel purchased (L)", endL: "Ending fuel (L)", pricePerLitre: "Price per litre (LKR)" }[k]} type="number" min="0" step="0.01" required={k !== "purchasedL"} value={f.fuel[k]} onChange={(e) => setF({ ...f, fuel: { ...f.fuel, [k]: e.target.value } })} />
            ))}
            <p className="text-sm text-slate-600 sm:col-span-2 dark:text-slate-300">Fuel consumed: <b>{consumed.toFixed(2)} L</b> · Cost: <b>{money(consumed * Number(f.fuel.pricePerLitre || 0))}</b></p>
          </>
        ) : (
          <Input label="Amount (LKR)" type="number" min="0.01" step="0.01" required value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
        )}
        <Input className="sm:col-span-2" label="Description" required={f.category === "other"} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
      </div>
    </Modal>
  );
};

const Costs = ({ d, meta, reload, lossFinal }) => {
  const [costs, setCosts] = useState(null);
  const [adding, setAdding] = useState(false);
  const [review, setReview] = useState(null);
  const loadCosts = () => transportApi.costs(d._id).then((r) => setCosts(r.data)).catch(() => {});
  useEffect(() => { loadCosts(); }, [d]); // eslint-disable-line react-hooks/exhaustive-deps
  const cats = costs ? Object.entries(costs.delivery.byCategory) : [];
  const rcats = costs ? Object.entries(costs.return.byCategory) : [];
  return (
    <div className="space-y-6">
      {costs && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card title="Delivery cost breakdown">
            {cats.length ? <ul className="space-y-1 text-sm">{cats.map(([k, v]) => <li key={k} className="flex justify-between"><span className="capitalize text-slate-500">{k.replace(/_/g, " ")}</span><span className="tabular-nums">{money(v)}</span></li>)}</ul> : <p className="text-sm text-slate-400">No approved expenses</p>}
            <p className="mt-3 flex justify-between border-t border-slate-100 pt-3 font-bold dark:border-slate-800"><span>Total delivery cost</span><span>{money(costs.deliveryCost)}</span></p>
            {costs.shared.total > 0 && <p className="text-xs text-slate-500">Includes {money(costs.shared.total)} shared journey cost (counted once)</p>}
          </Card>
          <Card title="Return cost breakdown">
            {rcats.length ? <ul className="space-y-1 text-sm">{rcats.map(([k, v]) => <li key={k} className="flex justify-between"><span className="capitalize text-slate-500">{k.replace(/_/g, " ")}</span><span className="tabular-nums">{money(v)}</span></li>)}</ul> : <p className="text-sm text-slate-400">No return expenses</p>}
            <p className="mt-3 flex justify-between border-t border-slate-100 pt-3 font-bold dark:border-slate-800"><span>Total return cost</span><span>{money(costs.returnCost)}</span></p>
          </Card>
          <Card title="Unit costs">
            <KeyValues cols={2} items={[
              ["Total transportation", money(costs.totalTransportCost)],
              ["Loaded quantity", kg(costs.loadedKg)],
              ["Cost per kg", costs.costPerKg != null ? money(costs.costPerKg) : "Needs loading record"],
              ["Cost per km", costs.costPerKm != null ? money(costs.costPerKm) : "Needs actual distance"],
              ["Distance", costs.distanceKm != null ? `${costs.distanceKm} km` : "—"],
              ["Awaiting approval", money(costs.pendingApprovalTotal)],
            ]} />
          </Card>
        </div>
      )}
      <Card title="Expense records" padded={false} action={!lossFinal && d.status !== "Cancelled" && <Button size="sm" icon={Plus} onClick={() => setAdding(true)}>Add expense</Button>}>
        <DataTable rows={d.expenses} empty={<EmptyState title="No expenses recorded" />} columns={[
          { key: "incurredAt", label: "Date", render: (r) => dt(r.incurredAt) },
          { key: "scope", label: "Applies to", render: (r) => <span className="capitalize">{r.scope}</span> },
          { key: "category", label: "Category", render: (r) => <span className="capitalize">{r.category.replace(/_/g, " ")}</span> },
          { key: "detail", label: "Detail", render: (r) => r.category === "fuel" && r.fuel?.consumedL != null ? `${r.fuel.startL}+${r.fuel.purchasedL}−${r.fuel.endL} = ${r.fuel.consumedL} L × ${r.fuel.pricePerLitre}` : r.description || "—" },
          { key: "amount", label: "Amount", render: (r) => money(r.amount) },
          { key: "photos", label: "Receipts", render: (r) => (r.photos?.length ? <Photos paths={r.photos} origin={API_ORIGIN} /> : "—") },
          { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
          { key: "act", label: "", render: (r) => r.status === "submitted" && !lossFinal && (
            <div className="flex gap-1">
              <Button size="sm" variant="success" onClick={() => transportApi.reviewExpense(r._id, { status: "approved" }).then(() => { toast.success("Approved"); reload(); }).catch((e) => toast.error(errorMessage(e)))}>Approve</Button>
              <Button size="sm" variant="ghost" onClick={() => setReview(r)}>Reject</Button>
            </div>
          ) },
        ]} />
      </Card>
      {adding && <ExpenseForm d={d} meta={meta} returns={d.returns} onClose={() => setAdding(false)} onDone={() => { setAdding(false); reload(); }} />}
      <ConfirmDialog open={!!review} title="Reject expense" reasonLabel="Reason (sent to the driver)" reasonRequired variant="danger" confirmLabel="Reject"
        onClose={() => setReview(null)} onConfirm={async (note) => { await transportApi.reviewExpense(review._id, { status: "rejected", note }); toast.success("Rejected"); reload(); }} />
    </div>
  );
};

// ---------- Returns ----------
export const NewReturnModal = ({ d, meta, onClose, onDone }) => {
  const items = d.assessment?.items || [];
  const [f, setF] = useState({ fishType: items[0] ? String(items[0].fishType) : "", returnKg: "", decision: "return_to_harbour", reason: "", destinationKind: "harbour", address: "", approveNow: true });
  const [busy, setBusy] = useState(false);
  const [key] = useState(newIdempotencyKey);
  const line = items.find((i) => String(i.fishType) === f.fishType);
  const used = d.returns.filter((r) => String(r.fishType) === f.fishType && r.status !== "Rejected").reduce((t, r) => t + r.returnKg, 0);
  const max = line ? Math.max(0, line.damagedKg + line.rejectedKg - used) : 0;
  const save = async () => {
    setBusy(true);
    try {
      await transportApi.createReturn({
        deliveryId: d._id, fishType: f.fishType, returnKg: Number(f.returnKg), decision: f.decision, reason: f.reason, approveNow: f.approveNow,
        destination: { kind: f.destinationKind, harbour: f.destinationKind === "harbour" ? d.harbour?._id : undefined, address: f.address },
      }, key);
      toast.success("Return created");
      onDone();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open title="Decide what happens to damaged fish" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} loading={busy} disabled={!f.reason.trim() || !f.returnKg}>Save decision</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select label="Fish" value={f.fishType} onChange={(e) => setF({ ...f, fishType: e.target.value })} options={items.map((i) => ({ value: String(i.fishType), label: `${i.fishName} (${kg(i.damagedKg)} damaged, ${kg(i.rejectedKg)} rejected)` }))} />
        <Input label="Quantity (kg)" type="number" min="0.01" max={max} step="0.01" required value={f.returnKg} onChange={(e) => setF({ ...f, returnKg: e.target.value })} hint={`Up to ${kg(max)} not yet covered by a return`} />
        <Select label="Decision" value={f.decision} onChange={(e) => setF({ ...f, decision: e.target.value })} options={meta.returnDecisions} />
        <Select label="Destination" value={f.destinationKind} onChange={(e) => setF({ ...f, destinationKind: e.target.value })} options={["harbour", "supplier", "disposal_site", "inspection_centre", "none", "other"]} />
        {f.destinationKind !== "harbour" && f.destinationKind !== "none" && <Input className="sm:col-span-2" label="Destination address" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />}
        <Textarea className="sm:col-span-2" label="Reason" required value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} />
        <div className="sm:col-span-2"><Checkbox label="Approve this decision now" checked={f.approveNow} onChange={(e) => setF({ ...f, approveNow: e.target.checked })} /></div>
      </div>
    </Modal>
  );
};

const ReturnsTab = ({ d, meta, reload, lossFinal }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const approved = d.assessment?.status === "approved";
  return (
    <Card title="Returns" padded={false} action={approved && !lossFinal && <Button size="sm" icon={Plus} onClick={() => setOpen(true)}>New return decision</Button>}>
      {!approved && <p className="px-5 pt-4 text-sm text-slate-500">Returns can be decided after the damage assessment is approved. Nothing is returned automatically.</p>}
      <DataTable rows={d.returns} onRowClick={() => navigate("/transport/returns")} empty={<EmptyState title="No returns" text="Damaged fish stay recorded as damage unless you decide on a return." />} columns={[
        { key: "returnNumber", label: "Return", render: (r) => <span className="font-semibold text-[#1677FF]">{r.returnNumber}</span> },
        { key: "fishName", label: "Fish" },
        { key: "returnKg", label: "Quantity", render: (r) => kg(r.returnKg) },
        { key: "decision", label: "Decision", render: (r) => r.decision.replace(/_/g, " ") },
        { key: "shared", label: "Journey", render: (r) => (r.sharedJourney ? "Shared" : r.truck ? "Separate" : "—") },
        { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
      ]} />
      {open && <NewReturnModal d={d} meta={meta} onClose={() => setOpen(false)} onDone={() => { setOpen(false); reload(); }} />}
    </Card>
  );
};

// ---------- Loss ----------
const LossTab = ({ d, reload }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const load = () => transportApi.loss(d._id).then((r) => {
    setData(r.data);
    const l = r.data.loss || {};
    setForm({ otherApprovedLosses: l.otherApprovedLosses || 0, recoveries: l.recoveries || 0, insuranceCompensation: l.insuranceCompensation || 0, supplierCompensation: l.supplierCompensation || 0, notes: l.notes || "" });
  }).catch(setError);
  useEffect(() => { load(); }, [d]); // eslint-disable-line react-hooks/exhaustive-deps
  if (error) return <ErrorBox error={error} />;
  if (!data || !form) return <Spinner />;
  const f = data.figures;
  const finalized = data.loss?.status === "finalized";
  const save = async () => {
    setBusy(true);
    try {
      const r = await transportApi.updateLoss(d._id, Object.fromEntries(Object.entries(form).map(([k, v]) => [k, k === "notes" ? v : Number(v)])));
      setData(r.data);
      toast.success("Saved");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const blockers = [
    !data.assessmentApproved && "Approve the damage assessment",
    !data.responsibility?.approved && "Approve the financial responsibility",
    data.openReturns.length && `Close returns: ${data.openReturns.join(", ")}`,
    data.pendingExpenses > 0 && "Review submitted expenses",
  ].filter(Boolean);
  const Row = ({ label, value, sign, strong }) => (
    <li className={cx("flex justify-between py-1", strong && "border-t border-slate-200 pt-2 font-bold dark:border-slate-700")}>
      <span className="text-slate-600 dark:text-slate-300">{sign && <span className="mr-1 inline-block w-3 text-slate-400">{sign}</span>}{label}</span>
      <span className="tabular-nums">{money(value)}</span>
    </li>
  );
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Net delivery loss" action={finalized ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600"><Lock size={13} /> Finalized {dt(data.loss.finalizedAt)}</span> : <StatusBadge status="draft" />}>
        {!data.assessmentApproved && <p className="mb-3 text-sm text-amber-600">Damaged and missing values are counted once the assessment is approved.</p>}
        <ul className="text-sm">
          <Row label="Damaged fish value" value={f.damagedValue} sign="+" />
          <Row label="Missing fish value" value={f.missingValue} sign="+" />
          <Row label="Delivery cost" value={f.deliveryCost} sign="+" />
          <Row label="Return cost" value={f.returnCost} sign="+" />
          <Row label="Other approved losses" value={f.otherApprovedLosses} sign="+" />
          <Row label="Gross loss" value={f.grossLoss} strong />
          <Row label="Recoveries (incl. return recoveries)" value={f.recoveries} sign="−" />
          <Row label="Insurance compensation" value={f.insuranceCompensation} sign="−" />
          <Row label="Supplier compensation" value={f.supplierCompensation} sign="−" />
          <Row label="Net delivery loss" value={f.netLoss} strong />
        </ul>
        {f.warnings?.map((w) => <p key={w} className="mt-2 text-xs text-amber-600">{w}</p>)}
        {data.buyerPayment && <p className="mt-4 text-xs text-slate-500">Buyer invoice: {money(data.buyerPayment.finalPayable)} payable ({data.buyerPayment.paymentStatus}); refunds {money(data.buyerPayment.refunds)} are excluded from the loss to avoid double-counting.</p>}
        {finalized && data.loss.allocation?.length > 0 && (
          <div className="mt-4">
            <h4 className="mb-1 text-xs font-bold uppercase text-slate-500">Allocated by responsibility</h4>
            <ul className="text-sm">{data.loss.allocation.map((a) => <li key={a.party} className="flex justify-between"><span>{a.party} ({a.percent}%)</span><span className="tabular-nums">{money(a.amount)}</span></li>)}</ul>
          </div>
        )}
      </Card>
      <Card title="Recoveries & compensation">
        <div className="grid gap-3 sm:grid-cols-2">
          {[["otherApprovedLosses", "Other approved losses"], ["recoveries", "Other recoveries"], ["insuranceCompensation", "Insurance compensation"], ["supplierCompensation", "Supplier compensation"]].map(([k, l]) => (
            <Input key={k} label={`${l} (LKR)`} type="number" min="0" step="0.01" value={form[k]} disabled={finalized} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
          ))}
          <Textarea className="sm:col-span-2" label="Notes" value={form.notes} disabled={finalized} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        {!finalized && (
          <div className="mt-4 space-y-3">
            <Button variant="secondary" onClick={save} loading={busy}>Save values</Button>
            {blockers.length > 0 ? (
              <ul className="list-disc space-y-0.5 pl-5 text-xs text-amber-700 dark:text-amber-400">{blockers.map((b) => <li key={b}>{b}</li>)}</ul>
            ) : (
              <Button variant="danger" icon={Lock} onClick={() => setConfirm(true)}>Finalize loss</Button>
            )}
          </div>
        )}
      </Card>
      <ConfirmDialog open={confirm} title="Finalize financial loss" message={`Net loss ${money(f.netLoss)} will be frozen and allocated by responsibility. Expenses and returns for this delivery are then locked.`} variant="danger" confirmLabel="Finalize"
        onClose={() => setConfirm(false)} onConfirm={async () => { await transportApi.finalizeLoss(d._id); toast.success("Loss finalized"); reload(); }} />
    </div>
  );
};

// ---------- Invoice ----------
const InvoiceTab = ({ d }) => {
  const navigate = useNavigate();
  const inv = d.invoice;
  if (!inv) return <Card><EmptyState title="No invoice yet" text="The invoice is generated automatically when the final damage figures are approved." /></Card>;
  return (
    <Card title={`Invoice ${inv.invoiceNumber}`} action={<div className="flex items-center gap-2"><StatusBadge status={inv.paymentStatus} /><Button size="sm" onClick={() => navigate(`/transport/payments?invoice=${inv._id}`)}>Manage payment</Button></div>}>
      <DataTable rows={inv.lines} columns={[
        { key: "fishName", label: "Fish" },
        { key: "loadedKg", label: "Loaded", render: (r) => kg(r.loadedKg) },
        { key: "acceptedKg", label: "Accepted", render: (r) => kg(r.acceptedKg) },
        { key: "damagedKg", label: "Damaged", render: (r) => kg(r.damagedKg) },
        { key: "missingKg", label: "Missing", render: (r) => kg(r.missingKg) },
        { key: "pricePerKg", label: "Price / kg", render: (r) => money(r.pricePerKg) },
        { key: "acceptedValue", label: "Accepted value", render: (r) => money(r.acceptedValue) },
      ]} />
      <div className="mt-4 ml-auto max-w-sm space-y-1 text-sm">
        {[["Accepted fish value", inv.totals.acceptedValue], ["+ Approved charges", inv.totals.additionalCharges], ["− Discounts", inv.totals.discounts], ["− Refunds", inv.totals.refunds]].map(([k, v]) => <p key={k} className="flex justify-between"><span className="text-slate-500">{k}</span><span className="tabular-nums">{money(v)}</span></p>)}
        <p className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold dark:border-slate-700"><span>Final payable</span><span>{money(inv.totals.finalPayable)}</span></p>
        <p className="flex justify-between text-slate-500"><span>Paid</span><span>{money(inv.amountPaid - inv.amountRefunded)}</span></p>
      </div>
    </Card>
  );
};

// ---------- Page ----------
const TABS = [
  { value: "summary", label: "Summary & tracking" },
  { value: "loading", label: "Loading" },
  { value: "damage", label: "Damage & verification" },
  { value: "costs", label: "Expenses & costs" },
  { value: "returns", label: "Returns" },
  { value: "loss", label: "Financial loss" },
  { value: "invoice", label: "Invoice" },
];

const DeliveryDetail = () => {
  const { id } = useParams();
  const { meta, socket } = useTransport();
  const [d, setD] = useState(null);
  const [error, setError] = useState(null);
  const [search] = useSearchParams();
  const [tab, setTab] = useState(() => (TABS.some((t) => t.value === search.get("tab")) ? search.get("tab") : "summary"));
  const [eventOpen, setEventOpen] = useState(false);
  const load = () => transportApi.delivery(id).then((r) => setD(r.data)).catch(setError);
  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!socket) return undefined;
    const onStatus = (p) => p.deliveryId === id && load();
    socket.on("delivery:status", onStatus);
    return () => socket.off("delivery:status", onStatus);
  }, [socket, id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <ErrorBox error={error} onRetry={load} />;
  if (!d) return <Spinner />;
  const lossFinal = d.loss?.status === "finalized";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/transport/deliveries" className="rounded-xl p-2 text-slate-500 hover:bg-white dark:hover:bg-slate-800" aria-label="Back to deliveries"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="flex items-center gap-2 text-xl font-black text-[#102A43] dark:text-white">{d.deliveryNumber} <StatusBadge status={d.status} />{d.locked && <Lock size={15} className="text-slate-400" aria-label="Locked" />}</h1>
            <p className="text-sm text-slate-500">{d.order?.orderNumber} · {d.buyer?.name} · {kg(d.order?.totalQuantityKg)}</p>
          </div>
        </div>
        {!d.locked && d.status !== "Cancelled" && <Button variant="secondary" onClick={() => setEventOpen(true)}>Log incident / note</Button>}
      </div>
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      {tab === "summary" && <Summary d={d} />}
      {tab === "loading" && <Loading d={d} reload={load} />}
      {tab === "damage" && <Damage d={d} meta={meta} reload={load} lossFinal={lossFinal} />}
      {tab === "costs" && <Costs d={d} meta={meta} reload={load} lossFinal={lossFinal} />}
      {tab === "returns" && <ReturnsTab d={d} meta={meta} reload={load} lossFinal={lossFinal} />}
      {tab === "loss" && <LossTab d={d} reload={load} />}
      {tab === "invoice" && <InvoiceTab d={d} />}
      <EventModal open={eventOpen} id={d._id} onClose={() => setEventOpen(false)} onDone={() => { setEventOpen(false); load(); }} />
    </div>
  );
};

const EventModal = ({ open, id, onClose, onDone }) => {
  const [type, setType] = useState("note");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      await transportApi.reportEvent(id, { type, note });
      toast.success("Recorded");
      setNote("");
      onDone();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open={open} title="Log incident or note" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} loading={busy} disabled={!note.trim()}>Save</Button></>}>
      <div className="space-y-3">
        <Select label="Type" value={type} onChange={(e) => setType(e.target.value)} options={["note", "delay", "breakdown", "accident", "incident"]} />
        <Textarea label="Details" required value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
    </Modal>
  );
};

export default DeliveryDetail;
