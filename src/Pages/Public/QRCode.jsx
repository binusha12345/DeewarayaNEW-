import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import {
  FaShip, FaQrcode, FaDownload, FaShareAlt, FaPrint,
  FaWhatsapp, FaEnvelope, FaMobile, FaLink, FaCheckCircle,
  FaChevronDown, FaSearch, FaFileImage, FaFilePdf,
  FaSyncAlt, FaShieldAlt, FaMapMarkerAlt, FaPhoneAlt,
  FaExclamationTriangle
} from 'react-icons/fa';
import { MdVerified, MdEngineering } from 'react-icons/md';
import { GiFishingBoat } from 'react-icons/gi';
import OwnerSidebar from "../../components/OwnerSidebar";
import DashboardNav from "../../components/DashboardNav";
import DriverSidebar from "../../components/DriverSidebar";
import api from "../../services/api";

// ─────────────────────────────────────────────
// Helper: Detail Row
// ─────────────────────────────────────────────
const DetailRow = ({ icon, label, value, color = 'blue' }) => {
  const colors = {
    blue:   'bg-blue-50   text-blue-600',
    green:  'bg-green-50  text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red:    'bg-red-50    text-red-600',
    cyan:   'bg-cyan-50   text-cyan-600',
    slate:  'bg-slate-100 text-slate-600',
  };
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm ${colors[color]}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-slate-800 truncate">{value || '—'}</p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
const QRCode = () => {
  const { t } = useTranslation();
  const user     = JSON.parse(localStorage.getItem('user'));
  const userRole = user?.role;

  // ── Refs ──
  const qrRef    = useRef(null);
  const printRef = useRef(null);

  // ── Boats from API ──
  const [boats,          setBoats]          = useState([]);
  const [loadingBoats,   setLoadingBoats]   = useState(true);
  const [selectedBoat,   setSelectedBoat]   = useState(null);
  const [searchQuery,    setSearchQuery]     = useState('');
  const [dropdownOpen,   setDropdownOpen]    = useState(false);

  // ── QR state ──
  const [qrGenerated,    setQrGenerated]    = useState(false);
  const [qrColor,        setQrColor]        = useState('#1e40af');

  // ── UI state ──
  const [copied,         setCopied]         = useState(false);
  const [showDownload,   setShowDownload]   = useState(false);
  const [showShare,      setShowShare]      = useState(false);
  const [generating,     setGenerating]     = useState(false);

  // ── Fetch boats ──
  useEffect(() => {
    const fetchBoats = async () => {
      try {
        setLoadingBoats(true);
        const endpoint = userRole === 'driver' ? '/boats/all' : '/boats';
        const res      = await api.get(endpoint);
        setBoats(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to fetch boats:', err);
      } finally {
        setLoadingBoats(false);
      }
    };
    fetchBoats();
  }, [userRole]);

  // ── Close dropdowns on outside click ──
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

  // ── Filtered boats for search ──
  const filteredBoats = boats.filter(b =>
    b.boatName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.registrationNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── QR URL (encodes all boat data as JSON in URL) ──
  const BASE_URL = 'https://10.57.89.85:5173'; // Replace with your actual base URL
  const qrValue = selectedBoat
    ? `${BASE_URL}/vessel/${selectedBoat._id}`
    : '';


  // ─── Handlers ───────────────────────────────

  const handleSelectBoat = (boat) => {
    setSelectedBoat(boat);
    setDropdownOpen(false);
    setSearchQuery('');
    setQrGenerated(false); // reset QR when new boat selected
  };

  const handleGenerateQR = () => {
    if (!selectedBoat) return;
    setGenerating(true);
    setTimeout(() => {
      setQrGenerated(true);
      setGenerating(false);
    }, 800);
  };

  // Download PNG
  const downloadPNG = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    canvas.toBlob((blob) => {
      saveAs(blob, `${selectedBoat?.boatName || 'vessel'}-QR.png`);
    });
    setShowDownload(false);
  };

  // Download PDF
  const downloadPDF = async () => {
    const el = printRef.current;
    if (!el) return;
    const canvas  = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf     = new jsPDF('portrait', 'mm', 'a4');
    const w       = pdf.internal.pageSize.getWidth();
    const h       = (canvas.height * w) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, w, h);
    pdf.save(`${selectedBoat?.boatName || 'vessel'}-QR-Certificate.pdf`);
    setShowDownload(false);
  };

  // Print
  const handlePrint = () => window.print();

  // Copy link
  const copyLink = () => {
    navigator.clipboard.writeText(qrValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    setShowShare(false);
  };

  // WhatsApp share
  const shareWhatsApp = () => {
    const msg = `🚢 *${selectedBoat?.boatName}*\n📋 Reg: ${selectedBoat?.registrationNumber}\n🔗 ${qrValue}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    setShowShare(false);
  };

  // Email share
  const shareEmail = () => {
    const sub  = `Vessel QR – ${selectedBoat?.boatName}`;
    const body = `Vessel: ${selectedBoat?.boatName}\nReg: ${selectedBoat?.registrationNumber}\nLink: ${qrValue}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(body)}`;
    setShowShare(false);
  };

  // SMS share
  const shareSMS = () => {
    window.location.href = `sms:?body=${encodeURIComponent(`🚢 ${selectedBoat?.boatName} – ${qrValue}`)}`;
    setShowShare(false);
  };

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* Sidebar */}
      {userRole === 'owner' ? <OwnerSidebar /> : <DriverSidebar />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <DashboardNav />

        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
          <div className="max-w-5xl mx-auto space-y-6">

            {/* ── Page Header ── */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-blue-500 mb-1">
                {t("qrCode.breadcrumb", "Fleet / QR Codes")}
              </p>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900">
                {t("qrCode.pageTitle", "Vessel QR Code Generator")}
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {t("qrCode.pageSubtitle", "Select a boat, generate its unique QR code, and share or download it.")}
              </p>
            </div>

            {/* ── Step 1: Select Boat ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                <h2 className="text-base font-bold text-slate-800">{t("qrCode.step1", "Select a Boat")}</h2>
              </div>

              {loadingBoats ? (
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Loading boats...
                </div>
              ) : boats.length === 0 ? (
                <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-yellow-700 text-sm">
                  <FaExclamationTriangle />
                  {t("qrCode.noBoats", "No boats found. Please add boats first.")}
                </div>
              ) : (
                <div className="relative dropdown-wrapper max-w-md">
                  {/* Trigger */}
                  <button
                    onClick={() => setDropdownOpen(v => !v)}
                    className="w-full flex items-center justify-between gap-3 border border-slate-300 rounded-xl px-4 py-3 bg-white hover:border-blue-400 transition text-left"
                  >
                    {selectedBoat ? (
                      <div className="flex items-center gap-2 min-w-0">
                        <FaShip className="text-blue-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{selectedBoat.boatName}</p>
                          <p className="text-xs text-slate-400 truncate">{selectedBoat.registrationNumber}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">{t("qrCode.chooseBoat", "Choose a boat...")}</span>
                    )}
                    <FaChevronDown className={`text-slate-400 shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown */}
                  {dropdownOpen && (
                    <div className="absolute top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                      {/* Search */}
                      <div className="p-2 border-b border-slate-100">
                        <div className="relative">
                          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search boats..."
                            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400"
                            autoFocus
                          />
                        </div>
                      </div>

                      {/* List */}
                      <div className="max-h-56 overflow-y-auto">
                        {filteredBoats.length === 0 ? (
                          <p className="text-center text-sm text-slate-400 py-4">No boats found</p>
                        ) : filteredBoats.map(boat => (
                          <button
                            key={boat._id}
                            onClick={() => handleSelectBoat(boat)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition text-left border-b border-slate-50 last:border-0"
                          >
                            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                              <FaShip className="text-blue-600 text-sm" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">{boat.boatName}</p>
                              <p className="text-xs text-slate-400 truncate">{boat.registrationNumber}</p>
                            </div>
                            {boat.boatStatus === 'ACTIVE' && (
                              <span className="ml-auto shrink-0 text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                ACTIVE
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Generate Button */}
              {selectedBoat && (
                <button
                  onClick={handleGenerateQR}
                  disabled={generating}
                  className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded-xl transition"
                >
                  {generating ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      {t("qrCode.generating", "Generating...")}
                    </>
                  ) : (
                    <>
                      <FaQrcode />
                      {qrGenerated ? t("qrCode.regenerate", 'Regenerate QR Code') : t("qrCode.create", 'Create QR Code')}
                    </>
                  )}
                </button>
              )}
            </div>

            {/* ── Step 2: QR + Boat Details ── */}
            {qrGenerated && selectedBoat && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ── LEFT: QR Card ── */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                    <h2 className="text-base font-bold text-slate-800">{t("qrCode.step2", "Your QR Code")}</h2>
                  </div>

                  {/* Printable area */}
                  <div ref={printRef} className="bg-white">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                        <FaShip className="text-white text-base" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Deewaraya</p>
                        <p className="text-xs text-slate-400">Fleet Management</p>
                      </div>
                    </div>

                    <h3 className="text-lg font-black text-slate-900 mb-0.5">{selectedBoat.boatName}</h3>
                    <p className="text-xs text-slate-400 mb-4">{selectedBoat.registrationNumber}</p>

                    {/* QR Code */}
                    <div
                      ref={qrRef}
                      className="relative bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center"
                    >
                      {/* Corner accents */}
                      <div className="absolute top-2 left-2  w-5 h-5 border-t-2 border-l-2 border-blue-500 rounded-tl-md" />
                      <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-blue-500 rounded-tr-md" />
                      <div className="absolute bottom-2 left-2  w-5 h-5 border-b-2 border-l-2 border-blue-500 rounded-bl-md" />
                      <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-blue-500 rounded-br-md" />

                      <QRCodeCanvas
                        value={qrValue}
                        size={200}
                        fgColor={qrColor}
                        bgColor="#ffffff"
                        level="H"
                        includeMargin
                      />
                      <p className="text-xs text-slate-400 mt-3 font-medium">📱 {t("qrCode.scanToVerify", "Scan to verify vessel")}</p>
                    </div>

                    {/* Mini info strip */}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="bg-blue-50 rounded-lg p-2.5 text-center">
                        <p className="text-[10px] text-blue-500 font-bold uppercase">{t("qrCode.registration", "Registration")}</p>
                        <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">{selectedBoat.registrationNumber}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                        <p className="text-[10px] text-slate-500 font-bold uppercase">{t("qrCode.status", "Status")}</p>
                        <p className={`text-xs font-bold mt-0.5 ${selectedBoat.boatStatus === 'ACTIVE' ? 'text-green-600' : 'text-red-500'}`}>
                          {selectedBoat.boatStatus || '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ── Color Picker ── */}
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">{t("qrCode.qrColor", "QR Color")}</p>
                    <div className="flex items-center gap-2">
                      {['#1e40af','#0891b2','#059669','#7c3aed','#dc2626','#000000'].map(c => (
                        <button
                          key={c}
                          onClick={() => setQrColor(c)}
                          className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${qrColor === c ? 'border-slate-700 scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                      <input
                        type="color"
                        value={qrColor}
                        onChange={e => setQrColor(e.target.value)}
                        className="w-7 h-7 rounded-full border border-slate-200 cursor-pointer"
                        title="Custom color"
                      />
                    </div>
                  </div>

                  {/* ── Action Buttons ── */}
                  <div className="mt-5 flex flex-wrap gap-2">

                    {/* Download */}
                    <div className="relative dropdown-wrapper">
                      <button
                        onClick={() => { setShowDownload(v => !v); setShowShare(false); }}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition"
                      >
                        <FaDownload /> {t("qrCode.download", "Download")}
                      </button>
                      {showDownload && (
                        <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1 min-w-[160px]">
                          <button onClick={downloadPNG} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-blue-50 text-sm text-slate-700">
                            <FaFileImage className="text-blue-500" /> PNG Image
                          </button>
                          <button onClick={downloadPDF} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-blue-50 text-sm text-slate-700">
                            <FaFilePdf className="text-red-500" /> PDF Certificate
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Share */}
                    <div className="relative dropdown-wrapper">
                      <button
                        onClick={() => { setShowShare(v => !v); setShowDownload(false); }}
                        className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-sm font-bold px-4 py-2 rounded-xl transition"
                      >
                        <FaShareAlt /> {t("qrCode.share", "Share")}
                      </button>
                      {showShare && (
                        <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1 min-w-[160px]">
                          <button onClick={shareWhatsApp} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-green-50 text-sm text-slate-700">
                            <FaWhatsapp className="text-green-500" /> WhatsApp
                          </button>
                          <button onClick={shareEmail} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-blue-50 text-sm text-slate-700">
                            <FaEnvelope className="text-blue-500" /> Email
                          </button>
                          <button onClick={shareSMS} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-purple-50 text-sm text-slate-700">
                            <FaMobile className="text-purple-500" /> SMS
                          </button>
                          <button onClick={copyLink} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 text-sm text-slate-700">
                            <FaLink className="text-slate-500" />
                            {copied ? `✓ ${t("qrCode.copiedLink", "Copied!")}` : t("qrCode.copyLink", "Copy Link")}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Print */}
                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-sm font-bold px-4 py-2 rounded-xl transition"
                    >
                      <FaPrint /> {t("qrCode.print", "Print")}
                    </button>
                  </div>

                  {/* Copied toast */}
                  {copied && (
                    <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-semibold">
                      <FaCheckCircle /> {t("qrCode.linkCopied", "Link copied to clipboard!")}
                    </div>
                  )}
                </div>

                {/* ── RIGHT: Boat Details ── */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">3</span>
                    <h2 className="text-base font-bold text-slate-800">{t("qrCode.step3", "Boat Details")}</h2>
                    {selectedBoat.boatStatus === 'ACTIVE' && (
                      <span className="ml-auto text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                        <MdVerified /> ACTIVE
                      </span>
                    )}
                  </div>

                  {/* Boat name hero */}
                  <div className="flex items-center gap-3 mb-5 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                      <GiFishingBoat className="text-white text-xl" />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-base">{selectedBoat.boatName}</p>
                      <p className="text-xs text-blue-600 font-semibold">{selectedBoat.boatType || 'Fishing Vessel'}</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-0">
                    <DetailRow
                      icon={<MdVerified />}
                      label={t("qrCode.fields.regNumber", "Registration Number")}
                      value={selectedBoat.registrationNumber}
                      color="blue"
                    />
                    <DetailRow
                      icon={<MdEngineering />}
                      label={t("qrCode.fields.engineNumber", "Engine Number")}
                      value={selectedBoat.engineNumber}
                      color="purple"
                    />
                    <DetailRow
                      icon={<FaShip />}
                      label={t("qrCode.fields.boatType", "Boat Type")}
                      value={selectedBoat.boatType}
                      color="cyan"
                    />
                    <DetailRow
                      icon={<FaMapMarkerAlt />}
                      label={t("qrCode.fields.homePort", "Home Port / Harbour")}
                      value={selectedBoat.homePort || selectedBoat.harbour}
                      color="red"
                    />
                    <DetailRow
                      icon={<FaPhoneAlt />}
                      label={t("qrCode.fields.emergencyContact", "Emergency Contact")}
                      value={selectedBoat.emergencyContact}
                      color="orange"
                    />
                    <DetailRow
                      icon={<FaShieldAlt />}
                      label={t("qrCode.fields.licenseStatus", "License Status")}
                      value={selectedBoat.licenseStatus || selectedBoat.boatStatus}
                      color="green"
                    />
                    <DetailRow
                      icon={<FaShieldAlt />}
                      label={t("qrCode.fields.modelYear", "Model Year")}
                      value={selectedBoat.modelYear}
                      color="slate"
                    />
                    <DetailRow
                      icon={<FaShieldAlt />}
                      label={t("qrCode.fields.horsepower", "Horsepower")}
                      value={selectedBoat.horsepower ? `${selectedBoat.horsepower} HP` : undefined}
                      color="slate"
                    />
                  </div>

                  {/* Extra specs */}
                  {(selectedBoat.length || selectedBoat.capacity || selectedBoat.color) && (
                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2">
                      {selectedBoat.length && (
                        <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Length</p>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedBoat.length}</p>
                        </div>
                      )}
                      {selectedBoat.capacity && (
                        <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Capacity</p>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedBoat.capacity}</p>
                        </div>
                      )}
                      {selectedBoat.color && (
                        <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Color</p>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedBoat.color}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* QR link preview */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase mb-1">{t("qrCode.qrPointsTo", "QR Code Points To")}</p>
                    <p className="text-xs text-blue-600 font-mono break-all bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
                      {qrValue}
                    </p>
                  </div>
                </div>

              </div>
            )}

            {/* ── How It Works ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-base font-bold text-slate-800 mb-4">{t("qrCode.howItWorks", "How It Works")}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { step: '01', title: t("qrCode.hiw1Title", 'Select Boat'), desc: t("qrCode.hiw1Desc", 'Choose any boat you have added to the system.') },
                  { step: '02', title: t("qrCode.hiw2Title", 'Generate QR'),  desc: t("qrCode.hiw2Desc", 'Click "Create QR Code" to generate a unique code with all boat details.') },
                  { step: '03', title: t("qrCode.hiw3Title", 'Download & Share'), desc: t("qrCode.hiw3Desc", 'Download as PNG/PDF or share via WhatsApp, Email, or SMS.') },
                ].map(item => (
                  <div key={item.step} className="flex gap-3">
                    <span className="text-2xl font-black text-blue-100 shrink-0">{item.step}</span>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default QRCode;