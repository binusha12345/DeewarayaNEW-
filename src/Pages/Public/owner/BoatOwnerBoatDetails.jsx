import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Anchor,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Compass,
  Fuel,
  Gauge,
  MapPin,
  QrCode,
  Ship,
  Wifi,
  Wrench,
} from "lucide-react";
import OwnerSidebar from "../../../components/OwnerSidebar";
import DashboardNav from "../../../components/DashboardNav";
import api, { apiUrl } from "../../../services/api";
import { useTranslation } from "react-i18next";

const statusStyles = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-800",
  MAINTENANCE: "border-amber-200 bg-amber-50 text-amber-800",
  "NON-ACTIVE": "border-slate-200 bg-slate-100 text-slate-700",
};

const connectionStyles = {
  good: "text-emerald-700",
  medium: "text-amber-700",
  poor: "text-orange-700",
  offline: "text-slate-500",
};

function Detail({ label, value, icon: Icon }) {
  const { t } = useTranslation();
  return (
    <div className="flex min-w-0 gap-3 rounded-2xl border border-slate-100 bg-white p-4">
      {Icon && (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-800">
          <Icon size={18} />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm font-bold text-slate-900">
          {value || t("boatOwnerBoatDetails.notProvided")}
        </p>
      </div>
    </div>
  );
}

function formatDate(value, t) {
  if (!value) return t("boatOwnerBoatDetails.notRecorded");
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? t("boatOwnerBoatDetails.notRecorded")
    : date.toLocaleDateString("en-LK", { day: "numeric", month: "long", year: "numeric" });
}

export default function BoatOwnerBoatDetails() {
  const { boatId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [boat, setBoat] = useState(location.state?.boat || null);
  const [loading, setLoading] = useState(!location.state?.boat);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const loadBoat = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get("/boats");
        const ownedBoat = Array.isArray(data) ? data.find((item) => item._id === boatId) : null;
        if (!ownedBoat) throw new Error(t("boatOwnerBoatDetails.errors.notFound"));
        if (active) setBoat(ownedBoat);
      } catch (requestError) {
        if (active) {
          setError(
            requestError.response?.data?.message || 
            requestError.message || 
            t("boatOwnerBoatDetails.errors.loadFailed")
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    if (!boatId) {
      setError(t("boatOwnerBoatDetails.errors.idRequired"));
      setLoading(false);
    } else {
      loadBoat();
    }

    return () => {
      active = false;
    };
  }, [boatId, t]);

  const imageUrl = useMemo(() => (boat?.imageUrl ? apiUrl(boat.imageUrl) : ""), [boat?.imageUrl]);
  
  const coordinates = boat?.latitude != null && boat?.longitude != null
    ? `${boat.latitude}, ${boat.longitude}`
    : t("boatOwnerBoatDetails.locationNotRecorded");
    
  const mapUrl = boat?.latitude != null && boat?.longitude != null
    ? `https://www.google.com/maps?q=${boat.latitude},${boat.longitude}`
    : "";
    
  const connection = boat?.connectionStatus || "offline";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans text-slate-800">
      <OwnerSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardNav />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
            <button
              type="button"
              onClick={() => navigate("/boatownerboats")}
              className="inline-flex items-center gap-2 rounded-xl px-1 py-2 text-sm font-semibold text-slate-600 transition hover:text-cyan-900"
            >
              <ArrowLeft size={18} /> {t("boatOwnerBoatDetails.actions.backToBoats")}
            </button>

            {loading ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm font-medium text-slate-500">
                {t("boatOwnerBoatDetails.loading")}
              </div>
            ) : error || !boat ? (
              <section className="rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm">
                <CircleAlert className="mx-auto text-rose-600" size={32} />
                <h1 className="mt-3 text-xl font-bold text-slate-900">
                  {t("boatOwnerBoatDetails.detailsUnavailable")}
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  {error || t("boatOwnerBoatDetails.errors.notAvailable")}
                </p>
                <Link to="/boatownerboats" className="mt-5 inline-flex rounded-xl bg-cyan-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-cyan-800">
                  {t("boatOwnerBoatDetails.actions.returnToBoats")}
                </Link>
              </section>
            ) : (
              <>
                <section className="relative isolate overflow-hidden rounded-3xl bg-slate-950 shadow-xl">
                  {imageUrl ? (
                    <img src={imageUrl} alt={boat.boatName} className="absolute inset-0 -z-20 h-full w-full object-cover opacity-35" />
                  ) : null}
                  <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950 via-slate-950/90 to-cyan-950/60" />
                  <div className="flex flex-col gap-6 p-6 text-white sm:p-9 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">
                        {t("boatOwnerBoatDetails.header.vesselRecord")}
                      </p>
                      <h1 className="mt-2 break-words text-3xl font-black tracking-tight sm:text-4xl">{boat.boatName}</h1>
                      <p className="mt-2 text-sm text-white/75">
                        {boat.boatType || t("boatOwnerBoatDetails.vesselFallback")}{" "}
                        <span className="px-2 text-white/40">·</span> {boat.registrationNumber}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusStyles[boat.boatStatus] || statusStyles["NON-ACTIVE"]}`}>
                          {boat.boatStatus === "ACTIVE"
                            ? t("boatOwnerBoatDetails.status.active")
                            : boat.boatStatus === "MAINTENANCE"
                            ? t("boatOwnerBoatDetails.status.maintenance")
                            : boat.boatStatus === "NON-ACTIVE"
                            ? t("boatOwnerBoatDetails.status.nonActive")
                            : t("boatOwnerBoatDetails.status.unknown")}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold capitalize text-white`}>
                          <Wifi size={13} className={connectionStyles[connection] || "text-white"} />{" "}
                          {t(`boatOwnerBoatDetails.connection.${connection}`)}{" "}
                          {t("boatOwnerBoatDetails.connectionLabel")}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link to="/qr-code" state={{ boatId: boat._id }} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-cyan-50">
                        <QrCode size={17} /> {t("boatOwnerBoatDetails.actions.qrCode")}
                      </Link>
                      <Link to={`/weather/${boat._id}`} className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20">
                        <Compass size={17} /> {t("boatOwnerBoatDetails.actions.weather")}
                      </Link>
                    </div>
                  </div>
                </section>

                <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Detail label={t("boatOwnerBoatDetails.labels.modelYear")} value={boat.modelYear} icon={CalendarDays} />
                  <Detail label={t("boatOwnerBoatDetails.labels.engine")} value={boat.engineType} icon={Wrench} />
                  <Detail label={t("boatOwnerBoatDetails.labels.power")} value={boat.horsepower ? `${boat.horsepower} HP` : ""} icon={Gauge} />
                  <Detail label={t("boatOwnerBoatDetails.labels.fuelCapacity")} value={boat.fuelCapacity ? `${boat.fuelCapacity} L` : ""} icon={Fuel} />
                </section>

                <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
                  <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                    <div className="mb-5 flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-900"><Ship size={21} /></span>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">{t("boatOwnerBoatDetails.specs.title")}</h2>
                        <p className="text-sm text-slate-500">{t("boatOwnerBoatDetails.specs.description")}</p>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Detail label={t("boatOwnerBoatDetails.labels.regNo")} value={boat.registrationNumber} icon={Anchor} />
                      <Detail label={t("boatOwnerBoatDetails.labels.vesselType")} value={boat.boatType} icon={Ship} />
                      <Detail label={t("boatOwnerBoatDetails.labels.engineType")} value={boat.engineType} icon={Wrench} />
                      <Detail label={t("boatOwnerBoatDetails.labels.engineSerial")} value={boat.engineSerial} icon={Gauge} />
                      <Detail label={t("boatOwnerBoatDetails.labels.horsepower")} value={boat.horsepower ? `${boat.horsepower} HP` : ""} icon={Gauge} />
                      <Detail label={t("boatOwnerBoatDetails.labels.fuelCapacity")} value={boat.fuelCapacity ? `${boat.fuelCapacity} L` : ""} icon={Fuel} />
                    </div>
                  </section>

                  <div className="space-y-6">
                    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-800"><Compass size={21} /></span>
                        <div>
                          <h2 className="font-bold text-slate-900">{t("boatOwnerBoatDetails.driver.title")}</h2>
                          <p className="text-xs text-slate-500">{t("boatOwnerBoatDetails.driver.description")}</p>
                        </div>
                      </div>
                      {boat.driver ? (
                        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                          <p className="font-bold text-slate-900">{boat.driver.name || t("boatOwnerBoatDetails.driver.driverFallback")}</p>
                          <p className="mt-1 break-all text-sm text-slate-600">{boat.driver.email || t("boatOwnerBoatDetails.driver.emailNotProvided")}</p>
                        </div>
                      ) : (
                        <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-medium text-amber-800">
                          {t("boatOwnerBoatDetails.driver.noDriver")}
                        </p>
                      )}
                    </section>

                    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800"><MapPin size={21} /></span>
                        <div>
                          <h2 className="font-bold text-slate-900">{t("boatOwnerBoatDetails.location.title")}</h2>
                          <p className="text-xs text-slate-500">{t("boatOwnerBoatDetails.location.description")}</p>
                        </div>
                      </div>
                      <p className="mt-4 break-all rounded-2xl bg-slate-50 p-4 font-mono text-sm text-slate-700">{coordinates}</p>
                      {mapUrl && (
                        <a href={mapUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-cyan-900 hover:text-cyan-700">
                          <MapPin size={15} /> {t("boatOwnerBoatDetails.actions.openMap")}
                        </a>
                      )}
                    </section>
                  </div>
                </div>

                <section className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={17} className="text-emerald-700" /> {t("boatOwnerBoatDetails.footer.recordFleet")}
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 size={15} /> {t("boatOwnerBoatDetails.footer.registered")} {formatDate(boat.createdAt, t)}
                    </span>
                    <span>
                      {t("boatOwnerBoatDetails.footer.updated")} {formatDate(boat.updatedAt, t)}
                    </span>
                  </div>
                </section>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}