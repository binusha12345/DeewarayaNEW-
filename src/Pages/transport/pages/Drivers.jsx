import { useState } from "react";
import toast from "react-hot-toast";
import { Plus, Users } from "lucide-react";
import DashboardPageHeader from "../../../components/DashboardPageHeader";
import transportApi, { dOnly, dt } from "../../../services/transportApi";
import { Button, Card, DataTable, ErrorBox, FilterSelect, Input, KeyValues, Modal, SearchBox, Select, Spinner, StatusBadge } from "../ui";
import { useAsync, useTransport } from "../hooks";

const DriverForm = ({ driver, onClose, onDone }) => {
  const { meta } = useTransport();
  const trucks = useAsync(() => transportApi.trucks({ limit: 100 }), []);
  const editing = !!driver;
  const [f, setF] = useState(editing
    ? { licenceNumber: driver.licenceNumber, licenceExpiry: driver.licenceExpiry?.slice(0, 10), availability: driver.availability, assignedTruck: driver.assignedTruck?._id || "" }
    : { name: "", email: "", phone: "", nic: "", address: "", password: "", licenceNumber: "", licenceExpiry: "", assignedTruck: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (editing) await transportApi.updateDriver(driver.user._id, { ...f, assignedTruck: f.assignedTruck || null });
      else await transportApi.createDriver({ ...f, assignedTruck: f.assignedTruck || undefined });
      toast.success(editing ? "Driver updated" : "Driver account created. Share the password with the driver securely.");
      onDone();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open wide title={editing ? `Edit ${driver.user.name}` : "Add truck driver"} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="driver-form" loading={busy}>Save</Button></>}>
      <form id="driver-form" onSubmit={save} className="grid gap-3 sm:grid-cols-2">
        {!editing && (
          <>
            <Input label="Full name" required value={f.name} onChange={set("name")} />
            <Input label="Email (login)" type="email" required value={f.email} onChange={set("email")} />
            <Input label="Phone" required pattern="[0-9]{10}" title="10 digits" value={f.phone} onChange={set("phone")} />
            <Input label="NIC" required pattern="[0-9]{12}" title="12 digits" value={f.nic} onChange={set("nic")} />
            <Input className="sm:col-span-2" label="Address" required value={f.address} onChange={set("address")} />
            <Input label="Temporary password" type="password" required minLength={8} autoComplete="new-password" value={f.password} onChange={set("password")} hint="At least 8 characters" />
          </>
        )}
        <Input label="Driving licence number" required value={f.licenceNumber} onChange={set("licenceNumber")} />
        <Input label="Licence expiry" type="date" required value={f.licenceExpiry} onChange={set("licenceExpiry")} />
        {editing && <Select label="Availability" value={f.availability} onChange={set("availability")} options={meta.driverAvailability} />}
        <Select label="Assigned truck" value={f.assignedTruck} onChange={set("assignedTruck")} placeholder="None" options={(trucks.data?.data || []).map((t) => ({ value: t._id, label: t.registrationNumber }))} />
        <div className="sm:col-span-2"><ErrorBox error={error} /></div>
      </form>
    </Modal>
  );
};

const DriverDetail = ({ userId, onClose }) => {
  const r = useAsync(() => transportApi.driver(userId), [userId]);
  const d = r.data?.data;
  return (
    <Modal open wide title={d ? d.user.name : "Driver"} onClose={onClose}>
      {r.loading ? <Spinner /> : r.error ? <ErrorBox error={r.error} /> : (
        <div className="space-y-5">
          <KeyValues cols={3} items={[["Phone", d.user.phone], ["Email", d.user.email], ["Licence", `${d.licenceNumber} (expires ${dOnly(d.licenceExpiry)})`], ["Assigned truck", d.assignedTruck?.registrationNumber], ["Availability", <StatusBadge key="a" status={d.availability} />], ["Online", d.online ? "Yes" : "No"]]} />
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Delivery history</h4>
          <DataTable rows={d.history} columns={[
            { key: "deliveryNumber", label: "Delivery" }, { key: "order", label: "Order", render: (x) => x.order?.orderNumber }, { key: "truck", label: "Truck", render: (x) => x.truck?.registrationNumber },
            { key: "dest", label: "Destination", render: (x) => x.order?.destination?.island || x.order?.destination?.address }, { key: "start", label: "Departure", render: (x) => dt(x.scheduledStart) }, { key: "status", label: "Status", render: (x) => <StatusBadge status={x.status} /> },
          ]} />
        </div>
      )}
    </Modal>
  );
};

const Drivers = () => {
  const { meta } = useTransport();
  const [filters, setFilters] = useState({ availability: "", search: "" });
  const list = useAsync(() => transportApi.drivers(filters), [filters.availability, filters.search]);
  const [form, setForm] = useState(null);
  const [detail, setDetail] = useState(null);
  return (
    <div className="space-y-6">
      <DashboardPageHeader eyebrow="Transport & Returns" title="Drivers" description="Truck driver accounts, licences, availability and delivery history." icon={Users} theme="blue" action={<Button icon={Plus} onClick={() => setForm({})}>Add driver</Button>} />
      <Card padded={false}>
        <ErrorBox error={list.error} onRetry={list.reload} />
        <DataTable
          rows={list.data?.data}
          loading={list.loading}
          onRowClick={(r) => setDetail(r.user._id)}
          toolbar={
            <>
              <SearchBox value={filters.search} onChange={(search) => setFilters({ ...filters, search })} placeholder="Search name, phone, licence" />
              <FilterSelect value={filters.availability} onChange={(availability) => setFilters({ ...filters, availability })} options={meta.driverAvailability} placeholder="Any availability" />
            </>
          }
          columns={[
            { key: "name", label: "Driver", render: (r) => <span className="font-semibold text-[#1677FF]">{r.user.name}</span> },
            { key: "phone", label: "Contact", render: (r) => r.user.phone },
            { key: "licence", label: "Licence", render: (r) => r.licenceNumber },
            { key: "expiry", label: "Licence expiry", render: (r) => <span className={r.licenceExpired ? "font-semibold text-red-600" : ""}>{dOnly(r.licenceExpiry)}{r.licenceExpired && " (expired)"}</span> },
            { key: "truck", label: "Assigned truck", render: (r) => r.assignedTruck?.registrationNumber || "—" },
            { key: "availability", label: "Availability", render: (r) => <StatusBadge status={r.availability} /> },
            { key: "deliveries", label: "Deliveries", render: (r) => `${r.deliveries.completed} / ${r.deliveries.total}` },
            { key: "act", label: "", render: (r) => <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); setForm(r); }}>Edit</Button> },
          ]}
        />
      </Card>
      {form && <DriverForm driver={form.user ? form : null} onClose={() => setForm(null)} onDone={() => { setForm(null); list.reload(); }} />}
      {detail && <DriverDetail userId={detail} onClose={() => setDetail(null)} />}
    </div>
  );
};

export default Drivers;
