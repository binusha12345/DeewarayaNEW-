import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import {
  FaShip, FaQrcode, FaDownload, FaShareAlt, FaPrint,
  FaWhatsapp, FaEnvelope, FaMobile, FaLink, FaCheckCircle,
  FaChevronDown, FaSearch, FaFileImage, FaFilePdf,
  FaSyncAlt, FaMapMarkerAlt, FaCalendarAlt, FaBolt, FaGasPump, FaUserTie,
  FaExclamationTriangle, FaAnchor
} from 'react-icons/fa';
import { MdVerified, MdEngineering } from 'react-icons/md';
import OwnerSidebar from "../../components/OwnerSidebar";
import DashboardNav from "../../components/DashboardNav";
import DashboardPageHeader from "../../components/DashboardPageHeader";
import api, { apiUrl } from "../../services/api";
import { getPublicVesselUrl } from "../../services/vesselQr";

// ─────────────────────────────────────────────
// Helper: Detail Row
// ─────────────────────────────────────────────
const DetailRow = ({ icon, label, value, color = 'blue' }) => {
  const iconColor = color === 'green' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-900';
  return (
    <div className="flex min-w-0 items-center gap-3 border-b border-slate-100 py-3 last:border-0">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm ${iconColor}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="break-words text-sm font-bold text-slate-800">{value || '—'}</p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
const QRCode = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const requestedBoatId = location.state?.boatId;

  const qrRef = useRef(null);
  const printRef = useRef(null);

  const [boats, setBoats] = useState([]);
  const [loadingBoats, setLoadingBoats] = useState(true);
  const [selectedBoat, setSelectedBoat] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [copied, setCopied] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    const fetchBoats = async () => {
      try {
        setLoadingBoats(true);
        const res = await api.get('/boats');
        const nextBoats = Array.isArray(res.data) ? res.data : [];
        setBoats(nextBoats);
        const requestedBoat = nextBoats.find((boat) => boat._id === requestedBoatId);
        if (requestedBoat) setSelectedBoat(requestedBoat);
      } catch (err) {
        console.error('Failed to fetch boats:', err);
      } finally {
        setLoadingBoats(false);
      }
    };
    fetchBoats();
  }, [requestedBoatId]);

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('.dropdown-wrapper')) {
        setDropdownOpen(false);
        setShowDownload(false);
        setShowShare(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredBoats = boats.filter(b =>
    b.boatName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.registrationNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSafePublicUrl = (boatId) => {
    try {
      if (typeof getPublicVesselUrl === 'function') {
        const url = getPublicVesselUrl(boatId);
        if (url) return url;
      }
    } catch (e) {
      console.warn('vesselQr helper error, falling back:', e);
    }
    const origin = window.location.origin.includes('ngrok')
      ? window.location.origin
      : 'https://dry-hyphen-grinning.ngrok-free.dev';
    return `${origin}/vessel/${boatId}`;
  };

  const qrValue = selectedBoat ? getSafePublicUrl(selectedBoat._id) : '';

  const handleSelectBoat = (boat) => {
    setSelectedBoat(boat);
    setDropdownOpen(false);
    setSearchQuery('');
  };

  const downloadPNG = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    canvas.toBlob((blob) => saveAs(blob, `${selectedBoat?.boatName || 'vessel'}-QR.png`));
    setShowDownload(false);
  };

  const downloadPDF = async () => {
    const el = printRef.current;
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, w, h);
    pdf.save(`${selectedBoat?.boatName || 'vessel'}-QR-Certificate.pdf`);
    setShowDownload(false);
  };

  const handlePrint = () => window.print();

  const copyLink = () => {
    if (!qrValue) return;
    navigator.clipboard.writeText(qrValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    setShowShare(false);
  };

  const shareWhatsApp = () => {
    const msg = `🚢 *${selectedBoat?.boatName}*\n📋 Reg: ${selectedBoat?.registrationNumber}\n🔗 ${qrValue}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    setShowShare(false);
  };

  const shareEmail = () => {
    const sub = `Vessel QR – ${selectedBoat?.boatName}`;
    const body = `Vessel: ${selectedBoat?.boatName}\nReg: ${selectedBoat?.registrationNumber}\nLink: ${qrValue}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(body)}`;
    setShowShare(false);
  };

  const shareSMS = () => {
    window.location.href = `sms:?body=${encodeURIComponent(`🚢 ${selectedBoat?.boatName} – ${qrValue}`)}`;
    setShowShare(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      <OwnerSidebar />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <DashboardNav />

        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
          <div className="mx-auto max-w-7xl space-y-6">

            <DashboardPageHeader
              eyebrow={t('qrCode.breadcrumb', 'Fleet / QR Codes')}
              title={t('qrCode.pageTitle', 'Vessel QR Code Generator')}
              description={t(
                'qrCode.pageSubtitle',
                'Select a boat, generate its unique QR code, and share or download it.'
              )}
              icon={FaQrcode}
              theme="violet"
            />

            {/* ── Step 1: Select Boat ── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  1
                </span>
                <h2 className="text-base font-bold text-slate-800">
                  {t('qrCode.step1', 'Select a Boat')}
                </h2>
              </div>

              {loadingBoats ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Loading boats...
                </div>
              ) : boats.length === 0 ? (
                <div className="flex items-center gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
                  <FaExclamationTriangle />
                  {t('qrCode.noBoats', 'No boats found. Please add boats first.')}
                </div>
              ) : (
                <div className="dropdown-wrapper relative max-w-md">
                  <button
                    onClick={() => setDropdownOpen((v) => !v)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-left transition hover:border-blue-500"
                  >
                    {selectedBoat ? (
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                          <FaShip className="text-sm text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-800">{selectedBoat.boatName}</p>
                          <p className="truncate text-[11px] font-semibold text-slate-400">
                            {selectedBoat.registrationNumber}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">
                        {t('qrCode.chooseBoat', 'Choose a boat...')}
                      </span>
                    )}
                    <FaChevronDown
                      className={`shrink-0 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute top-full z-50 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                      <div className="border-b border-slate-100 p-2">
                        <div className="relative">
                          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search boats..."
                            className="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-3 text-sm outline-none focus:border-blue-500"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-56 overflow-y-auto p-1">
                        {filteredBoats.length === 0 ? (
                          <p className="py-4 text-center text-sm text-slate-400">No boats found</p>
                        ) : (
                          filteredBoats.map((boat) => (
                            <button
                              key={boat._id}
                              onClick={() => handleSelectBoat(boat)}
                              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-blue-50"
                            >
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                                <FaShip className="text-sm" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-slate-800">{boat.boatName}</p>
                                <p className="truncate text-[10px] font-semibold text-slate-400">
                                  {boat.registrationNumber}
                                </p>
                              </div>
                              {boat.boatStatus === 'ACTIVE' && (
                                <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                                  ACTIVE
                                </span>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Empty State ── */}
            {!selectedBoat && !loadingBoats && boats.length > 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
                  <FaShip className="text-3xl text-blue-300" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Select your vessel</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                  Choose a boat from the list above to generate and view its unique maritime QR certificate.
                </p>
              </div>
            )}

            {/* ── Step 2: QR + Boat Details ── */}
            {selectedBoat && (
              <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">

                {/* LEFT: QR Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      2
                    </span>
                    <h2 className="text-base font-bold text-slate-800">
                      {t('qrCode.step2', 'Vessel QR Code')}
                    </h2>
                  </div>

                  <div ref={printRef} className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-900 shadow-md">
                        <FaAnchor className="text-lg text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-900">Deewaraya</p>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Fleet Registry
                        </p>
                      </div>
                    </div>

                    <div className="mb-5 text-center">
                      <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">
                        {selectedBoat.boatName}
                      </h3>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {selectedBoat.registrationNumber}
                      </p>
                    </div>

                    <div
                      ref={qrRef}
                      className="relative mx-auto flex w-fit flex-col items-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="absolute left-[-2px] top-[-2px] h-4 w-4 rounded-tl-lg border-l-2 border-t-2 border-blue-600" />
                      <div className="absolute right-[-2px] top-[-2px] h-4 w-4 rounded-tr-lg border-r-2 border-t-2 border-blue-600" />
                      <div className="absolute bottom-[-2px] left-[-2px] h-4 w-4 rounded-bl-lg border-b-2 border-l-2 border-blue-600" />
                      <div className="absolute bottom-[-2px] right-[-2px] h-4 w-4 rounded-br-lg border-b-2 border-r-2 border-blue-600" />

                      <QRCodeCanvas
                        value={qrValue || 'https://deewaraya.lk'}
                        size={180}
                        fgColor="#0F172A"
                        bgColor="#ffffff"
                        level="H"
                        includeMargin={false}
                      />
                    </div>

                    <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Scan to verify identity
                    </p>
                  </div>

                  <div className="mt-6 flex flex-col gap-3">
                    <div className="dropdown-wrapper relative w-full">
                      <button
                        onClick={() => {
                          setShowDownload((v) => !v);
                          setShowShare(false);
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                      >
                        <FaDownload /> {t('qrCode.download', 'Download QR')}
                      </button>
                      {showDownload && (
                        <div className="absolute left-0 top-full z-30 mt-2 w-full rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                          <button
                            onClick={downloadPNG}
                            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <FaFileImage className="text-blue-500" /> PNG Image
                          </button>
                          <button
                            onClick={downloadPDF}
                            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <FaFilePdf className="text-red-500" /> PDF Document
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="dropdown-wrapper relative">
                        <button
                          onClick={() => {
                            setShowShare((v) => !v);
                            setShowDownload(false);
                          }}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                        >
                          <FaShareAlt /> {t('qrCode.share', 'Share')}
                        </button>
                        {showShare && (
                          <div className="absolute left-0 top-full z-30 mt-2 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                            <button
                              onClick={shareWhatsApp}
                              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-green-50"
                            >
                              <FaWhatsapp className="text-lg text-green-600" /> WhatsApp
                            </button>
                            <button
                              onClick={shareEmail}
                              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-blue-50"
                            >
                              <FaEnvelope className="text-lg text-blue-600" /> Email
                            </button>
                            <button
                              onClick={shareSMS}
                              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-purple-50"
                            >
                              <FaMobile className="text-lg text-purple-600" /> SMS
                            </button>
                            <button
                              onClick={copyLink}
                              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              <FaLink className="text-lg text-slate-500" />
                              {copied ? 'Copied!' : 'Copy Link'}
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={handlePrint}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                      >
                        <FaPrint /> {t('qrCode.print', 'Print')}
                      </button>
                    </div>
                  </div>

                  {copied && (
                    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-2xl">
                      <FaCheckCircle className="text-green-400" /> Link copied to clipboard!
                    </div>
                  )}
                </div>

                {/* RIGHT: Complete Boat Record */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Vessel Database Record
                        </p>
                        <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-slate-900">
                          {selectedBoat.boatName}
                        </h2>
                      </div>
                      <span
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                          selectedBoat.boatStatus === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {selectedBoat.boatStatus === 'ACTIVE' && <MdVerified />}
                        {selectedBoat.boatStatus || 'UNKNOWN'}
                      </span>
                    </div>
                  </div>

                  {/*{selectedBoat.imageUrl && (
                    <div className="border-b border-slate-200 bg-slate-100 p-1">
                      <img
                        src={apiUrl(selectedBoat.imageUrl)}
                        alt={`${selectedBoat.boatName} vessel`}
                        className="h-56 w-full rounded-xl object-cover shadow-inner"
                      />
                    </div>
                  )}*/}

                  <div className="grid gap-x-8 px-6 py-2 sm:grid-cols-2">
                    <DetailRow icon={<MdVerified />} label="Registration Number" value={selectedBoat.registrationNumber} />
                    <DetailRow icon={<FaShip />} label="Vessel Type" value={selectedBoat.boatType} />
                    <DetailRow icon={<FaCalendarAlt />} label="Year Built / Model" value={selectedBoat.modelYear} />
                    <DetailRow icon={<MdEngineering />} label="Engine Type" value={selectedBoat.engineType} />
                    <DetailRow icon={<MdEngineering />} label="Engine Serial" value={selectedBoat.engineSerial} />
                    <DetailRow
                      icon={<FaBolt />}
                      label="Horsepower"
                      value={selectedBoat.horsepower ? `${selectedBoat.horsepower} HP` : null}
                    />
                    <DetailRow
                      icon={<FaGasPump />}
                      label="Fuel Capacity"
                      value={selectedBoat.fuelCapacity ? `${selectedBoat.fuelCapacity} L` : null}
                    />
                    <DetailRow
                      icon={<FaUserTie />}
                      label="Assigned Driver"
                      value={selectedBoat.driver?.name || 'No driver assigned'}
                    />
                    <DetailRow icon={<FaEnvelope />} label="Driver Email" value={selectedBoat.driver?.email} />
                    <DetailRow
                      icon={<FaSyncAlt />}
                      label="Connection Status"
                      value={selectedBoat.connectionStatus?.toUpperCase() || 'OFFLINE'}
                      color={selectedBoat.connectionStatus === 'online' ? 'green' : 'blue'}
                    />
                    <DetailRow
                      icon={<FaMapMarkerAlt />}
                      label="Registered Coordinates"
                      value={
                        selectedBoat.latitude != null && selectedBoat.longitude != null
                          ? `${Number(selectedBoat.latitude).toFixed(5)}, ${Number(selectedBoat.longitude).toFixed(5)}`
                          : 'Not recorded'
                      }
                    />
                    <DetailRow
                      icon={<FaCalendarAlt />}
                      label="Registered On"
                      value={
                        selectedBoat.createdAt
                          ? new Date(selectedBoat.createdAt).toLocaleDateString('en-GB')
                          : null
                      }
                    />
                  </div>

                  <div className="border-t border-slate-100 bg-slate-50 px-6 py-5">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Public Verification Link
                    </p>
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5">
                      <p className="truncate font-mono text-xs text-blue-600">{qrValue}</p>
                      <button
                        onClick={copyLink}
                        className="shrink-0 text-slate-400 transition hover:text-blue-600"
                        title="Copy link"
                      >
                        <FaLink />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default QRCode;