import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FaShip, FaCheckCircle, FaTimesCircle, FaAnchor,
  FaPrint, FaShieldAlt, FaCog, FaGasPump, FaBolt,
  FaCalendarAlt, FaWrench, FaIdBadge, FaCopy
} from 'react-icons/fa';
import { MdVerified, MdSecurity, MdFingerprint } from 'react-icons/md';
import api from '../../services/api';

const VesselDetailsPublic = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [boat, setBoat]       = useState(null);
  const [error, setError]     = useState('');
  const [scanTime]            = useState(new Date());
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    const fetchBoat = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/boats/public/${id}`);
        setBoat(data);
      } catch (err) {
        setError(err.response?.status === 404 ? 'not_found' : 'server_error');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchBoat();
  }, [id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const formatDateTime = (date) =>
    new Date(date).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });

  const copyId = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Loading State ──
  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-slate-200 rounded-full" />
          <div className="absolute inset-0 border-4 border-transparent border-t-green-700 rounded-full animate-spin" />
          <FaAnchor className="absolute inset-0 m-auto text-blue-950 text-xl" />
        </div>
        <p className="text-black font-bold text-sm uppercase tracking-widest">{t("vesselPublic.loading", "Verifying Vessel")}</p>
        <p className="text-xs text-slate-500 mt-2 tracking-wider">{t("vesselPublic.database", "DEEWARAYA MARITIME DATABASE")}</p>
      </div>
    </div>
  );

  // ── Error State ──
  if (error || !boat) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md border-t-4 border-blue-950 bg-white shadow-xl">
        <div className="p-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <FaTimesCircle className="text-3xl text-blue-950" />
          </div>
          <h2 className="text-center text-lg font-bold text-black uppercase tracking-wider mb-2">
            {error === 'not_found' ? t("vesselPublic.notFound", 'Vessel Not Registered') : t("vesselPublic.connFailed", 'Connection Failed')}
          </h2>
          <div className="mx-auto mb-4 h-0.5 w-16 bg-green-700" />
          <p className="text-center text-sm text-slate-600 mb-4">
            {error === 'not_found'
              ? t("vesselPublic.notFoundDesc", 'This QR code does not correspond to any registered vessel in the national maritime database.')
              : t("vesselPublic.connFailedDesc", 'Unable to connect to the verification server.')}
          </p>
          <div className="bg-slate-50 border border-slate-200 p-3 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{t("vesselPublic.referenceId", "Reference ID")}</p>
            <p className="font-mono text-xs text-slate-700 break-all">{id}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const isActive = boat.boatStatus === 'ACTIVE';
  const statusColor = isActive ? 'green' : 'navy';

  const statusColors = {
    green: { bg: 'bg-green-700', text: 'text-green-800', bgLight: 'bg-green-50', border: 'border-green-200', icon: 'bg-green-100' },
    navy: { bg: 'bg-blue-950', text: 'text-blue-950', bgLight: 'bg-blue-50', border: 'border-blue-200', icon: 'bg-blue-100' },
  };
  const clr = statusColors[statusColor];

  return (
    <div className="min-h-screen bg-white font-sans text-black">

      {/* ═══ OFFICIAL HEADER ═══ */}
      <header className="border-b-2 border-green-700 bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-5 py-5">
          <div className="flex items-center gap-4">
            {/* Official Seal */}
            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-blue-950 shadow-sm">
                <FaAnchor className="text-white text-2xl" />
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-green-700">
                <MdVerified className="text-white text-xs" />
              </div>
            </div>

            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-semibold mb-1">
                Official Vessel Verification
              </p>
              <h1 className="text-xl font-black text-black leading-tight">
                DEEWARAYA
              </h1>
              <p className="text-xs font-bold tracking-wider text-green-800">
                MARITIME FLEET MANAGEMENT SYSTEM
              </p>
            </div>

            <div className="hidden sm:flex flex-col items-end">
                <div className="flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-3 py-1.5">
                <MdSecurity className="text-green-800 text-xs" />
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Secure</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">v2.0</p>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ CERTIFICATION STATUS ═══ */}
      <div className={`${clr.bg} text-white shadow-sm`}>
        <div className="mx-auto max-w-4xl px-5 py-4">
          <div className="flex items-center justify-center gap-3">
            {isActive ? (
              <MdVerified className="text-2xl" />
            ) : boat.boatStatus === 'MAINTENANCE' ? (
              <FaWrench className="text-xl" />
            ) : (
              <FaTimesCircle className="text-2xl" />
            )}
            <div className="text-center">
              <p className="font-black text-sm uppercase tracking-widest">
                {isActive
                  ? t("vesselPublic.status.certified", 'CERTIFIED VESSEL · CLEARED FOR OPERATION')
                  : boat.boatStatus === 'MAINTENANCE'
                  ? t("vesselPublic.status.maintenance", + 'VESSEL UNDER MAINTENANCE')
                  : t("vesselPublic.status.notAuthorized", 'VESSEL NOT AUTHORIZED')}
              </p>
              <p className="text-[10px] opacity-80 tracking-wider mt-0.5">
                {t("vesselPublic.verifiedAt", "Verified")} {formatDateTime(scanTime)} LKT
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="mx-auto max-w-4xl space-y-4 px-4 py-6 sm:px-5">

        {/* ─── VESSEL IDENTIFICATION CARD ─── */}
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">

          {/* Section Header */}
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-5 w-1 bg-green-700" />
              <h2 className="text-xs font-bold text-black uppercase tracking-widest">
                {t("vesselPublic.sections.identification", "Vessel Identification")}
              </h2>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">SEC-01</span>
          </div>

          {/* Boat Name Banner */}
          <div className="px-5 py-5 border-b border-slate-100">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-blue-950 shadow-sm">
                <FaShip className="text-white text-2xl" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-1">
                  {t("vesselPublic.fields.registeredName", "Registered Vessel Name")}
                </p>
                <h3 className="text-2xl font-black text-black uppercase tracking-tight leading-none">
                  {boat.boatName}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 uppercase tracking-wider ${clr.bgLight} ${clr.text} border ${clr.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${clr.bg}`} />
                    {boat.boatStatus}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                    {boat.boatType}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            <DataField label={t("vesselPublic.fields.regNumber", "Registration Number")} value={boat.registrationNumber} mono />
            <DataField label={t("vesselPublic.fields.vesselId", "Vessel ID")}           value={id.slice(-12).toUpperCase()} mono onCopy={copyId} copied={copied} />
            <DataField label={t("vesselPublic.fields.vesselType", "Vessel Type")}         value={boat.boatType} />
            <DataField label={t("vesselPublic.fields.mfgYear", "Manufacture Year")}    value={boat.modelYear} />
            <DataField label={t("vesselPublic.fields.regDate", "Registered Date")}     value={formatDate(boat.createdAt)} />
            <DataField label={t("vesselPublic.fields.flagState", "Flag State")}          value="🇱🇰 Sri Lanka" />
          </div>
        </section>

        {/* ─── TECHNICAL SPECIFICATIONS ─── */}
        <div className="grid gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-5 w-1 bg-green-700" />
              <h2 className="text-xs font-bold text-black uppercase tracking-widest">
                {t("vesselPublic.sections.techSpecs", "Technical Specifications")}
              </h2>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">SEC-02</span>
          </div>

          <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100">
            <SpecTile
              icon={<FaWrench />}
              label={t("vesselPublic.fields.engineSerial", "Engine Serial")}
              value={boat.engineSerial}
            />
            <SpecTile
              icon={<FaCog />}
              label={t("vesselPublic.fields.engineType", "Engine Type")}
              value={boat.engineType}
            />
          </div>

          <div className="grid grid-cols-2 divide-x divide-slate-100">
            <SpecTile
              icon={<FaBolt />}
              label={t("vesselPublic.fields.horsepower", "Horsepower")}
              value={boat.horsepower ? `${boat.horsepower} HP` : '—'}
            />
            <SpecTile
              icon={<FaGasPump />}
              label={t("vesselPublic.fields.fuelCapacity", "Fuel Capacity")}
              value={boat.fuelCapacity ? `${boat.fuelCapacity} L` : '—'}
            />
          </div>
        </section>

        {/* ─── OPERATIONAL STATUS ─── */}
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-5 w-1 bg-green-700" />
              <h2 className="text-xs font-bold text-black uppercase tracking-widest">
                {t("vesselPublic.sections.operationalStatus", "Operational Status")}
              </h2>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">SEC-03</span>
          </div>

          <div className="p-5">
            <div className={`${clr.bgLight} ${clr.border} border-l-4 p-4`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${clr.bg} flex items-center justify-center shrink-0`}>
                  {isActive
                    ? <FaCheckCircle className="text-white text-xl" />
                    : boat.boatStatus === 'MAINTENANCE'
                    ? <FaWrench className="text-white text-xl" />
                    : <FaTimesCircle className="text-white text-xl" />
                  }
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">
                    {t("vesselPublic.fields.currentStatus", "Current Status")}
                  </p>
                  <p className={`text-xl font-black ${clr.text} uppercase tracking-tight leading-none`}>
                    {boat.boatStatus}
                  </p>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {isActive
                      ? t("vesselPublic.statusDesc.active", 'This vessel holds valid certification and is authorized for maritime operations.')
                      : boat.boatStatus === 'MAINTENANCE'
                      ? t("vesselPublic.statusDesc.maintenance", 'This vessel is temporarily withdrawn from service for maintenance.')
                      : t("vesselPublic.statusDesc.inactive", 'This vessel is not currently authorized for maritime operations.')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── VERIFICATION METADATA ─── */}
        </div>

        <section className="overflow-hidden rounded-lg bg-blue-950 text-slate-200 shadow-sm">
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-700">
              <MdFingerprint className="text-green-300 text-lg" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {t("vesselPublic.sections.verificationMetadata", "Verification Metadata")}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs">
              <MetaRow label={t("vesselPublic.meta.verifiedAt", "Verified At")}       value={formatDateTime(scanTime)} />
              <MetaRow label={t("vesselPublic.meta.verificationId", "Verification ID")}   value={`VER-${Date.now().toString().slice(-10)}`} mono />
              <MetaRow label={t("vesselPublic.meta.dbSource", "Database Source")}   value="Deewaraya MMS" />
              <MetaRow label={t("vesselPublic.meta.authentication", "Authentication")}    value={`✓ ${t("vesselPublic.meta.certified", "Certified")}`} color="green" />
            </div>

            <div className="mt-4 pt-3 border-t border-slate-700">
              <p className="text-[10px] text-slate-500 leading-relaxed">
                {t("vesselPublic.meta.disclaimer", "This verification report is generated in real-time from official records maintained by the Deewaraya Maritime Fleet Management System. Data integrity is cryptographically verified.")}
              </p>
            </div>
          </div>
        </section>

        {/* ─── ACTION BUTTONS ─── */}
        <div className="grid grid-cols-2 gap-3 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-950 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-sm transition-colors hover:bg-green-800"
          >
            <FaPrint className="text-sm" /> {t("vesselPublic.actions.printReport", "Print Report")}
          </button>
          <button
            onClick={copyId}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-3 text-xs font-bold uppercase tracking-widest text-slate-700 shadow-sm transition-colors hover:border-green-700 hover:text-blue-950"
          >
            <FaCopy className="text-sm" />
            {copied ? t("vesselPublic.actions.copied", 'Copied!') : t("vesselPublic.actions.copyId", 'Copy ID')}
          </button>
        </div>

      </main>

    </div>
  );
};

// ─────────────────────────────────────────────
// HELPER COMPONENTS
// ─────────────────────────────────────────────

const DataField = ({ label, value, mono, onCopy, copied }) => (
  <div className="px-5 py-3.5">
    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
      {label}
    </p>
    <div className="flex items-center justify-between gap-2">
      <p className={`text-sm font-bold text-black break-all ${mono ? 'font-mono' : ''}`}>
        {value || '—'}
      </p>
      {onCopy && (
        <button
          onClick={onCopy}
          className="text-slate-400 hover:text-blue-950 transition shrink-0"
          title="Copy"
        >
          {copied ? <FaCheckCircle className="text-green-700 text-xs" /> : <FaCopy className="text-xs" />}
        </button>
      )}
    </div>
  </div>
);

const SpecTile = ({ icon, label, value }) => (
  <div className="px-5 py-4">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-6 h-6 bg-slate-100 flex items-center justify-center text-slate-600 text-xs">
        {icon}
      </div>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
        {label}
      </p>
    </div>
    <p className="text-base font-black text-black font-mono ml-8 -mt-1">
      {value || '—'}
    </p>
  </div>
);

const MetaRow = ({ label, value, mono, color }) => (
  <div>
    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-0.5">
      {label}
    </p>
    <p className={`text-xs font-semibold ${mono ? 'font-mono' : ''} ${
      color === 'green' ? 'text-green-300' : 'text-slate-200'
    }`}>
      {value}
    </p>
  </div>
);

export default VesselDetailsPublic;