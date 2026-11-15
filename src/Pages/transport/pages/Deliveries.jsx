import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { Fish } from "lucide-react";
import "leaflet/dist/leaflet.css";
import DashboardPageHeader from "../../../components/DashboardPageHeader";
import transportApi, { dt, kg } from "../../../services/transportApi";
import { Card, DataTable, EmptyState, FilterSelect, SearchBox, StatusBadge, Tabs } from "../ui";
import { useAsync, useServerList, useTransport } from "../hooks";

const SL_CENTER = [7.8731, 80.7718];
const VIEWS = [
  { value: "active", label: "Active" },
  { value: "Not Started", label: "Scheduled" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
  { value: "all", label: "All" },
];

// Live map of active trucks. Positions update over Socket.IO.
export const LiveMap = ({ deliveries, height = 380 }) => {
  const { socket } = useTransport();
  // Last stored positions, overridden by live socket updates.
  const [live, setLive] = useState({});
  const pos = useMemo(
    () => ({ ...Object.fromEntries(deliveries.filter((d) => d.record?.lastLocation?.latitude != null).map((d) => [d._id, d.record.lastLocation])), ...live }),
    [deliveries, live]
  );
  useEffect(() => {
    if (!socket) return undefined;
    deliveries.forEach((d) => socket.emit("transport:watch", { deliveryId: d._id }));
    const onLoc = (p) => setLive((cur) => ({ ...cur, [p.deliveryId]: { latitude: p.latitude, longitude: p.longitude, at: p.at } }));
    socket.on("delivery:location", onLoc);
    return () => {
      socket.off("delivery:location", onLoc);
      deliveries.forEach((d) => socket.emit("transport:unwatch", { deliveryId: d._id }));
    };
  }, [socket, deliveries]);
  const located = deliveries.filter((d) => pos[d._id]);
  return (
    <div className="overflow-hidden rounded-2xl" style={{ height }}>
      <MapContainer center={located.length ? [pos[located[0]._id].latitude, pos[located[0]._id].longitude] : SL_CENTER} zoom={located.length ? 9 : 7} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {located.map((d) => (
          <CircleMarker key={d._id} center={[pos[d._id].latitude, pos[d._id].longitude]} radius={9} pathOptions={{ color: "#ffffff", weight: 2, fillColor: d.status === "Delayed" ? "#EF4444" : "#1677FF", fillOpacity: 1 }}>
            <Popup>
              <strong>{d.deliveryNumber}</strong><br />
              {d.truck?.registrationNumber} · {d.driver?.name}<br />
              {d.status} · updated {dt(pos[d._id].at)}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
};

const Deliveries = () => {
  const navigate = useNavigate();
  const { meta } = useTransport();
  const [view, setView] = useState("active");
  const list = useServerList(transportApi.deliveries, { initial: { active: "true" }, defaultSort: "-scheduledStart" });
  const live = useAsync(() => transportApi.deliveries({ active: "true", limit: 100 }), []);

  const changeView = (v) => {
    setView(v);
    if (v === "active") list.set({ active: "true", status: "" });
    else list.set({ active: "", status: v === "all" ? "" : v });
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader eyebrow="Transport & Returns" title="Deliveries" description="Monitor trucks on the road, delays and incidents. Open a delivery for loading, damage, costs and settlement." icon={Fish} theme="blue" />
      <Card title={`Live trucks (${live.data?.data?.length ?? 0})`}>
        {live.data?.data?.length ? <LiveMap deliveries={live.data.data} /> : <EmptyState title="No trucks on the road" text="Active deliveries appear here once drivers start sharing GPS." />}
      </Card>
      <Card padded={false}>
        <DataTable
          list={list}
          onRowClick={(r) => navigate(`/transport/deliveries/${r._id}`)}
          toolbar={
            <>
              <Tabs tabs={VIEWS} value={view} onChange={changeView} />
              <SearchBox value={list.params.search} onChange={(search) => list.set({ search })} placeholder="Search delivery number" />
              {view === "all" && <FilterSelect value={list.params.status} onChange={(status) => list.set({ status })} options={meta.deliveryStatuses} placeholder="Any status" />}
            </>
          }
          columns={[
            { key: "deliveryNumber", label: "Delivery", render: (r) => <span className="font-semibold text-[#1677FF]">{r.deliveryNumber}</span> },
            { key: "order", label: "Order", render: (r) => r.order?.orderNumber },
            { key: "buyer", label: "Buyer", render: (r) => r.buyer?.name },
            { key: "qty", label: "Quantity", render: (r) => kg(r.order?.totalQuantityKg) },
            { key: "truck", label: "Truck", render: (r) => r.truck?.registrationNumber },
            { key: "driver", label: "Driver", render: (r) => r.driver?.name },
            { key: "dest", label: "Destination", render: (r) => r.order?.destination?.island || r.order?.destination?.address },
            { key: "start", label: "Departure", sortKey: "scheduledStart", render: (r) => dt(r.record?.departureTime || r.scheduledStart) },
            { key: "status", label: "Status", sortKey: "status", render: (r) => <StatusBadge status={r.status} /> },
          ]}
        />
      </Card>
    </div>
  );
};

export default Deliveries;
