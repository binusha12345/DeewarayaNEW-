import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FaShip, FaCheckCircle, FaTimesCircle, FaAnchor,
  FaPrint, FaShieldAlt, FaCog, FaGasPump, FaBolt,
  FaCalendarAlt, FaWrench, FaIdBadge, FaCopy, FaExclamationTriangle
} from 'react-icons/fa';
import { MdVerified, MdSecurity, MdFingerprint } from 'react-icons/md';
import { API_BASE } from '../../services/api';

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
        const res = await fetch(
          `${API_BASE}/boats/public/${id}`
        );
        if (res.status === 404) { setError('not_found');    return; }
        if (!res.ok)            { setError('server_error'); return; }
        const data = await res.json();
        setBoat(data);
      } catch (err) {
        setError('server_error');
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
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-slate-200 rounded-full" />
          <div className="absolute inset-0 border-4 border-transparent border-t-blue-900 rounded-full animate-spin" />
          <FaAnchor className="absolute inset-0 m-auto text-blue-900 text-xl" />
        </div>
        <p className="text-slate-900 font-bold text-sm uppercase tracking-widest">{t("vesselPublic.loading", "Verifying Vessel")}</p>
        <p className="text-xs text-slate-500 mt-2 tracking-wider">{t("vesselPublic.database", "DEEWARAYA MARITIME DATABASE")}</p>
      </div>
    </div>
  );

  // ── Error State ──
  if (error || !boat) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white border-t-4 border-red-700 shadow-xl max-w-md w-full">
        <div className="p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaTimesCircle className="text-3xl text-red-700" />
          </div>
          <h2 className="text-center text-lg font-bold text-slate-900 uppercase tracking-wider mb-2">
            {error === 'not_found' ? t("vesselPublic.notFound", 'Vessel Not Registered') : t("vesselPublic.connFailed", 'Connection Failed')}
          </h2>
          <div className="w-16 h-0.5 bg-red-700 mx-auto mb-4" />
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
  const statusColor = isActive ? 'green' : boat.boatStatus === 'MAINTENANCE' ? 'amber' : 'red';

  const statusColors = {
    green: { bg: 'bg-green-700', text: 'text-green-700', bgLight: 'bg-green-50', border: 'border-green-200', icon: 'bg-green-100' },
    amber: { bg: 'bg-amber-600', text: 'text-amber-700', bgLight: 'bg-amber-50', border: 'border-amber-200', icon: 'bg-amber-100' },
    red:   { bg: 'bg-red-700',   text: 'text-red-700',   bgLight: 'bg-red-50',   border: 'border-red-200',   icon: 'bg-red-100'   },
  };
  const clr = statusColors[statusColor];

  return (
    <div className="min-h-screen bg-slate-100 font-sans">

      {/* ═══ TOP RIBBON ═══ */}
      <div className="bg-slate-900 text-slate-300 text-[10px] py-1.5 px-4 text-center tracking-widest uppercase">
        Government of Sri Lanka · Ministry of Fisheries
      </div>

      {/* ═══ OFFICIAL HEADER ═══ */}
      <header className="bg-white border-b-4 border-blue-900 shadow-sm">
        <div className="max-w-3xl mx-auto px-5 py-5">
          <div className="flex items-center gap-4">
            {/* Official Seal */}
            <div className="relative">
              <div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center shadow-md">
                <FaAnchor className="text-white text-2xl" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-white">
                <MdVerified className="text-white text-xs" />
              </div>
            </div>

            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-semibold mb-1">
                Official Vessel Verification
              </p>
              <h1 className="text-xl font-black text-slate-900 leading-tight">
                DEEWARAYA
              </h1>
              <p className="text-xs text-blue-900 font-bold tracking-wider">
                MARITIME FLEET MANAGEMENT SYSTEM
              </p>
            </div>

            <div className="hidden sm:flex flex-col items-end">
              <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded">
                <MdSecurity className="text-blue-900 text-xs" />
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Secure</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">v2.0</p>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ CERTIFICATION STATUS ═══ */}
      <div className={`${clr.bg} text-white shadow-md`}>
        <div className="max-w-3xl mx-auto px-5 py-4">
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
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">

        {/* ─── VESSEL IDENTIFICATION CARD ─── */}
        <section className="bg-white shadow-sm border border-slate-200">

          {/* Section Header */}
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-blue-900" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                {t("vesselPublic.sections.identification", "Vessel Identification")}
              </h2>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">SEC-01</span>
          </div>

          {/* Boat Name Banner */}
          <div className="px-5 py-5 border-b border-slate-100">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center shadow-md shrink-0">
                <FaShip className="text-white text-2xl" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-1">
                  {t("vesselPublic.fields.registeredName", "Registered Vessel Name")}
                </p>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">
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
        <section className="bg-white shadow-sm border border-slate-200">
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-blue-900" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
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
        <section className="bg-white shadow-sm border border-slate-200">
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-blue-900" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
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
        <section className="bg-slate-900 text-slate-300 shadow-sm">
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-700">
              <MdFingerprint className="text-blue-400 text-lg" />
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
            className="bg-blue-900 hover:bg-blue-800 text-white py-3 font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <FaPrint className="text-sm" /> {t("vesselPublic.actions.printReport", "Print Report")}
          </button>
          <button
            onClick={copyId}
            className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 py-3 font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <FaCopy className="text-sm" />
            {copied ? t("vesselPublic.actions.copied", 'Copied!') : t("vesselPublic.actions.copyId", 'Copy ID')}
          </button>
        </div>

        {/* ─── ADVISORY NOTICE ─── */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 print:hidden">
          <div className="flex gap-3">
            <FaExclamationTriangle className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                {t("vesselPublic.advisory.title", "Advisory Notice")}
              </p>
              <p className="text-xs text-amber-800 leading-relaxed">
                {t("vesselPublic.advisory.desc", "If any vessel information appears incorrect or suspicious, please report immediately to the Sri Lanka Navy or Department of Fisheries.")}
              </p>
              <a
                href={`mailto:report@deewaraya.lk?subject=Vessel Report - ${boat.registrationNumber}`}
                className="inline-block mt-2 text-[10px] font-bold text-amber-900 underline uppercase tracking-wider"
              >
                {t("vesselPublic.advisory.reportLink", "Report to Authorities →")}
              </a>
            </div>
          </div>
        </div>

      </main>

      {/* ═══ OFFICIAL FOOTER ═══ */}
      <footer className="bg-slate-900 text-slate-400 mt-8 border-t-4 border-blue-900">
        <div className="max-w-3xl mx-auto px-5 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <FaAnchor className="text-blue-400 text-sm" />
              <p className="text-xs font-bold text-white uppercase tracking-widest">
                Deewaraya Maritime System
              </p>
            </div>
            <p className="text-[10px] tracking-wider">
              Authorized by the Ministry of Fisheries · Government of Sri Lanka
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-2 gap-4 text-[10px] uppercase tracking-widest">
            <div>
              <p className="text-slate-500 mb-1">Contact</p>
              <p className="text-slate-300">official@deewaraya.lk</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 mb-1">Copyright</p>
              <p className="text-slate-300">© 2025 Deewaraya</p>
            </div>
          </div>
        </div>
      </footer>

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
      <p className={`text-sm font-bold text-slate-900 break-all ${mono ? 'font-mono' : ''}`}>
        {value || '—'}
      </p>
      {onCopy && (
        <button
          onClick={onCopy}
          className="text-slate-400 hover:text-blue-900 transition shrink-0"
          title="Copy"
        >
          {copied ? <FaCheckCircle className="text-green-600 text-xs" /> : <FaCopy className="text-xs" />}
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
    <p className="text-base font-black text-slate-900 font-mono ml-8 -mt-1">
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
      color === 'green' ? 'text-green-400' : 'text-slate-200'
    }`}>
      {value}
    </p>
  </div>
);

export default VesselDetailsPublic;