import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { io } from "socket.io-client";
import {
  Anchor,
  Check,
  Clock3,
  Copy,
  Fuel,
  Gauge,
  QrCode,
  Ship,
  UserRound,
} from "lucide-react";
import DashboardNav from "../../../components/DashboardNav";
import DriverSidebar from "../../../components/DriverSidebar";
import DashboardPageHeader from "../../../components/DashboardPageHeader";
import api, { API_ORIGIN, apiUrl } from "../../../services/api";
import { getPublicVesselUrl } from "../../../services/vesselQr";

const formatDate = (date) => date
  ? new Date(date).toLocaleDateString("en-LK", { day: "2-digit", month: "short", year: "numeric" })
  : "Not available";

const detailItems = (boat) => [
  ["Vessel type", boat.boatType || "Not available"],
  ["Build year", boat.modelYear || "Not available"],
  ["Engine type", boat.engineType || "Not available"],
  ["Engine serial", boat.engineSerial || "Not available"],
  ["Horsepower", boat.horsepower ? `${boat.horsepower} HP` : "Not available"],
  ["Fuel capacity", boat.fuelCapacity ? `${boat.fuelCapacity} L` : "Not available"],
  ["Assigned on", formatDate(boat.createdAt)],
];

export default function AssignedBoatQR() {
  const [boats, setBoats] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [requestingBoatId, setRequestingBoatId] = useState("");
  const [copiedBoatId, setCopiedBoatId] = useState("");
  const [notice, setNotice] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    let active = true;
    const loadAssignedBoats = async () => {
      try {
        const [boatResponse, requestResponse] = await Promise.all([
          api.get("/boats/assigned"),
          api.get("/notifications/qr-requests"),
        ]);
        if (!active) return;
        setBoats(Array.isArray(boatResponse.data) ? boatResponse.data : []);
        setRequests(Array.isArray(requestResponse.data) ? requestResponse.data : []);
      } catch (error) {
        if (active) setPageError(error.response?.data?.message || "Could not load your assigned boats.");
      } finally {
        if (active) setLoading(false);
      }
    };
    loadAssignedBoats();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const socket = io(API_ORIGIN, { auth: { token }, transports: ["websocket", "polling"] });
    socket.on("notification:qr-shared", (request) => {
      setRequests((current) => [request, ...current.filter((item) => item._id !== request._id)]);
      setNotice(`QR code shared for ${request.boat?.boatName || "your assigned boat"}.`);
      setActionError("");
    });
    return () => socket.disconnect();
  }, [token]);

  const getRequestForBoat = (boatId) => requests.find((request) =>
    String(request.boat?._id || request.boat) === String(boatId)
  );

  const requestQr = async (boat) => {
    setRequestingBoatId(boat._id);
    setActionError("");
    setNotice("");
    try {
      const { data } = await api.post(`/notifications/qr-requests/${boat._id}`);
      setRequests((current) => [data, ...current.filter((item) => item._id !== data._id)]);
    } catch (error) {
      setActionError(error.response?.data?.message || `Could not request the QR code for ${boat.boatName}.`);
    } finally {
      setRequestingBoatId("");
    }
  };

  const copyPublicLink = async (boat) => {
    try {
      await navigator.clipboard.writeText(getPublicVesselUrl(boat._id));
      setCopiedBoatId(boat._id);
      window.setTimeout(() => setCopiedBoatId(""), 2000);
    } catch {
      setActionError("Could not copy the public vessel link.");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 text-slate-950">
      <DriverSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardNav />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-9">
          <div className="mx-auto max-w-6xl">
            <DashboardPageHeader
              eyebrow="Driver fleet access"
              title="Assigned Boats & QR Codes"
              description="Review boats assigned to you and request owner approval to access public vessel records."
              icon={QrCode}
              theme="violet"
            />

            {pageError && <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{pageError}</p>}
            {actionError && <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{actionError}</p>}
            {notice && <p role="status" className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">{notice}</p>}

            {loading ? (
              <div className="flex min-h-64 items-center justify-center text-sm text-slate-500">Loading assigned boats…</div>
            ) : boats.length === 0 ? (
              <section className="rounded-lg border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                <Anchor size={28} className="mx-auto text-cyan-800" />
                <h2 className="mt-4 text-lg font-bold text-slate-950">No boat assigned yet</h2>
                <p className="mt-2 text-sm text-slate-600">A boat owner’s assignment will appear here.</p>
              </section>
            ) : (
              <div className="space-y-5">
                {boats.map((boat) => {
                  const request = getRequestForBoat(boat._id);
                  const qrShared = request?.requestStatus === "shared";
                  const qrValue = getPublicVesselUrl(boat._id);
                  return (
                    <article key={boat._id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
                        <div className="flex min-w-0 items-center gap-3">
                          {boat.imageUrl ? (
                            <img src={apiUrl(boat.imageUrl)} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                          ) : (
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-950 text-white"><Ship size={21} /></span>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Assigned vessel</p>
                            <h2 className="truncate text-lg font-bold text-slate-950">{boat.boatName}</h2>
                            <p className="text-sm text-slate-600">{boat.registrationNumber}</p>
                          </div>
                        </div>
                        <span className={`rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${boat.boatStatus === "ACTIVE" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
                          {boat.boatStatus || "Status unavailable"}
                        </span>
                      </div>

                      <div className="grid lg:grid-cols-[minmax(0,1fr)_17rem]">
                        <div className="px-5 py-5 sm:px-6">
                          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
                            <UserRound size={16} className="text-cyan-800" />
                            <span>Assigned by {boat.owner?.name || "Boat owner"}</span>
                          </div>
                          {boat.owner?.email && <p className="-mt-2 mb-4 pl-6 text-xs text-slate-500">{boat.owner.email}</p>}
                          <dl className="grid gap-x-6 gap-y-4 border-t border-slate-100 pt-4 sm:grid-cols-2 xl:grid-cols-3">
                            {detailItems(boat).map(([label, value]) => (
                              <div key={label} className="min-w-0">
                                <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</dt>
                                <dd className="mt-1 break-words text-sm font-semibold text-slate-900">{value}</dd>
                              </div>
                            ))}
                          </dl>
                        </div>

                        <aside className="border-t border-slate-200 bg-slate-50 px-5 py-5 lg:border-l lg:border-t-0">
                          {qrShared ? (
                            <div className="flex flex-col items-center text-center">
                              <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-800"><Check size={15} /> QR code shared</p>
                              <div className="mt-3 bg-white p-2 shadow-sm">
                                <QRCodeCanvas value={qrValue} size={160} level="H" includeMargin />
                              </div>
                              <button onClick={() => copyPublicLink(boat)} className="mt-3 inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-cyan-700 hover:text-blue-950">
                                <Copy size={14} /> {copiedBoatId === boat._id ? "Link copied" : "Copy vessel link"}
                              </button>
                            </div>
                          ) : request?.requestStatus === "pending" ? (
                            <div className="flex h-full min-h-36 flex-col items-center justify-center text-center">
                              <Clock3 size={23} className="text-cyan-800" />
                              <p className="mt-3 text-sm font-bold text-slate-900">Request sent</p>
                              <p className="mt-1 text-xs leading-5 text-slate-600">The boat owner will share the QR code here after approval.</p>
                            </div>
                          ) : (
                            <div className="flex h-full min-h-36 flex-col items-center justify-center text-center">
                              <QrCode size={24} className="text-cyan-800" />
                              <p className="mt-3 text-sm font-bold text-slate-900">Vessel QR access</p>
                              <p className="mt-1 text-xs leading-5 text-slate-600">Ask the owner to share this boat’s public verification code.</p>
                              <button
                                onClick={() => requestQr(boat)}
                                disabled={requestingBoatId === boat._id}
                                className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-950 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-cyan-800 disabled:cursor-wait disabled:opacity-60"
                              >
                                <QrCode size={15} />
                                {requestingBoatId === boat._id ? "Sending request…" : "Request QR code"}
                              </button>
                            </div>
                          )}
                        </aside>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
