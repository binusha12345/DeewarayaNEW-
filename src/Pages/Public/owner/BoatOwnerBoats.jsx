import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, QrCode, Eye, Loader2 } from "lucide-react";
import OwnerSidebar from "../../../components/OwnerSidebar";
import DashboardNav from "../../../components/DashboardNav";
import api, { apiUrl } from "../../../services/api";

const BoatOwnerBoats = () => {
  const navigate = useNavigate();

  const [boats, setBoats] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [savingDriver, setSavingDriver] = useState({});
  const [assignmentErrors, setAssignmentErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

const getBoatImageUrl = (boat) => {
  if (!boat.imageUrl) return "https://via.placeholder.com/400x250";

  return apiUrl(boat.imageUrl);
};

  const fetchBoats = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/boats");
      
      // If backend returns array directly:
      setBoats(res.data);

      // If backend returns object like { boats: [...] }
      // then use this instead:
      // setBoats(res.data.boats);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load boats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoats();
    api.get("/boats/drivers")
      .then(({ data }) => setDrivers(Array.isArray(data) ? data : []))
      .catch(() => setDrivers([]));
  }, []);

  const handleAssignDriver = async (boatId, driverId) => {
    setSavingDriver((current) => ({ ...current, [boatId]: true }));
    setAssignmentErrors((current) => ({ ...current, [boatId]: "" }));
    try {
      const { data } = await api.patch(`/boats/${boatId}/driver`, { driverId });
      setBoats((current) => current.map((boat) => boat._id === boatId ? data.boat : boat));
    } catch (err) {
      setAssignmentErrors((current) => ({
        ...current,
        [boatId]: err.response?.data?.message || "Could not update driver assignment",
      }));
    } finally {
      setSavingDriver((current) => ({ ...current, [boatId]: false }));
    }
  };

  const handleAddBoat = () => {
    navigate("/addnewboat");
  };

  const handleViewDetails = (boatId) => {
    navigate(`/boatdetails/${boatId}`);
  };

  const handleQr = (boatId) => {
    navigate(`/boatqr/${boatId}`);
  };

  return (
    <div data-tour="boats-list" className="flex h-screen bg-[#f1f5f9] font-sans text-slate-800 overflow-hidden">

      <style>{boatListStyles}</style>
      {/* Sidebar */}
      <OwnerSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <DashboardNav />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-10">
          {/* Header */}
          <div className="flex justify-between items-end mb-10">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Fleet / <span className="text-blue-600">Vessel List</span>
              </p>
              <h1 className="text-3xl font-black text-slate-900 leading-tight">
                Boats Management
              </h1>
            </div>

            <button
              onClick={handleAddBoat}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#2056d3] text-white rounded-lg text-sm font-bold hover:bg-blue-900 transition cursor-pointer"
            >
              <Plus size={18} />
              Add New Boat
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center gap-3 text-slate-600">
              <Loader2 className="animate-spin" size={20} />
              <span>Loading boats...</span>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="p-4 rounded-lg bg-red-100 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          {/* No Boats */}
          {!loading && !error && boats.length === 0 && (
            <div className="p-6 rounded-xl bg-white border border-slate-200 text-slate-500 text-sm">
              No boats found. Click <span className="font-bold">Add New Boat</span> to register your first boat.
            </div>
          )}

          {/* Boats Grid */}
          {!loading && !error && boats.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {boats.map((boat) => (
                <div
                  key={boat._id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100"
                >
                  <div className="relative h-48">
                        <img
                          src={getBoatImageUrl(boat)}
                          alt={boat.boatName}
                          className="w-full h-full object-cover"
                        />
                      <div
                        className={`absolute top-4 right-4 px-3 py-1 rounded-md text-[9px] font-black tracking-widest ${
                          boat.boatStatus === "ACTIVE"
                            ? "bg-blue-100 text-blue-700"
                            : boat.boatStatus === "MAINTENANCE"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {boat.boatStatus}

                      </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-6">
                      <h3 className="text-[24px] font-bold text-slate-900 mb-1">
                        Boat: {boat.boatName}
                      </h3>

                      <p className="text-[16px] text-slate-600 font-medium">
                        {boat.boatType} Registration No: {boat.registrationNumber}
                      </p>

                      <p className="text-[14px] text-slate-600 mt-2">
                        Boat Manufacture Year: {boat.modelYear}
                      </p>

                      <p className="text-[14px] text-slate-600 mt-2">
                        Engine Type: {boat.engineType}
                      </p>
                      <label className="mt-5 block border-t border-slate-200 pt-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Assigned driver
                        <select
                          value={boat.driver?._id || ""}
                          onChange={(event) => handleAssignDriver(boat._id, event.target.value)}
                          disabled={savingDriver[boat._id]}
                          className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-slate-800 outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100 disabled:opacity-60"
                        >
                          <option value="">No driver assigned</option>
                          {drivers.map((driver) => (
                            <option key={driver._id} value={driver._id}>
                              {driver.name} · {driver.email}
                            </option>
                          ))}
                        </select>
                        {savingDriver[boat._id] && <span className="mt-1 block normal-case tracking-normal">Saving assignment…</span>}
                        {assignmentErrors[boat._id] && <span role="alert" className="mt-1 block normal-case tracking-normal text-red-700">{assignmentErrors[boat._id]}</span>}
                        {!drivers.length && <span className="mt-1 block normal-case tracking-normal">No drivers are registered yet.</span>}
                      </label>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(boat._id)}
                        className="flex-1 bg-[#2b4fa9] text-white py-2.5 rounded-lg text-xs font-bold hover:bg-[#004a75] transition flex items-center justify-center gap-2"
                      >
                        <Eye size={16} />
                        View Details
                      </button>

                      <button
                        onClick={() => handleQr(boat._id)}
                        className="p-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition"
                      >
                        <QrCode size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

// ============================================================
// ✅ RESPONSIVE STYLES - Proper & Clean
// ============================================================

const boatListStyles = `

  /* ==============================
     BASE - Page foundation
     ============================== */


  /* ==============================
     LARGE DESKTOP (1280px+)
     - Everything stays original
     ============================== */


  /* ==============================
     LAPTOP (max-width: 1280px)
     ============================== */
  @media (max-width: 1280px) {

    /* Main padding */
    main {
      padding: 2rem !important;
    }

    /* Header */
    main h1 {
      font-size: 1.75rem !important;
    }

    /* Header margin */
    main > div:first-child {
      margin-bottom: 2rem !important;
    }

    /* Boats grid */
    main .grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3 {
      gap: 1.5rem !important;
    }

    /* Boat card image */
    main .relative.h-48 {
      height: 11rem !important;
    }

    /* Boat card content */
    main .p-6 {
      padding: 1.25rem !important;
    }

    /* Boat name */
    main .text-\\[24px\\].font-bold {
      font-size: 1.25rem !important;
    }

    /* Boat type */
    main .text-\\[16px\\].text-slate-600 {
      font-size: 0.875rem !important;
    }

    /* Boat model year */
    main .text-\\[14px\\].text-slate-600 {
      font-size: 0.8125rem !important;
    }

    /* Add boat button */
    main button.bg-\\[\\#2056d3\\] {
      padding: 0.5rem 1.25rem !important;
      font-size: 0.8125rem !important;
    }
  }


  /* ==============================
     SMALL LAPTOP (max-width: 1024px)
     ============================== */
  @media (max-width: 1024px) {

    main {
      padding: 1.75rem !important;
    }

    main h1 {
      font-size: 1.625rem !important;
    }

    /* Header */
    main > div:first-child {
      margin-bottom: 1.75rem !important;
    }

    /* Grid - 2 columns */
    main .grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3 {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 1.25rem !important;
    }

    /* Card image */
    main .relative.h-48 {
      height: 10rem !important;
    }

    /* Card padding */
    main .p-6 {
      padding: 1.125rem !important;
    }

    /* Boat name */
    main .text-\\[24px\\].font-bold {
      font-size: 1.125rem !important;
    }

    /* Boat type */
    main .text-\\[16px\\].text-slate-600 {
      font-size: 0.8125rem !important;
    }

    /* Boat model year */
    main .text-\\[14px\\].text-slate-600 {
      font-size: 0.75rem !important;
    }

    /* Add button */
    main button.bg-\\[\\#2056d3\\] {
      padding: 0.5rem 1rem !important;
      font-size: 0.75rem !important;
    }

    /* View details button */
    main button.bg-\\[\\#2b4fa9\\] {
      padding: 0.5rem !important;
      font-size: 0.6875rem !important;
    }
  }


  /* ==============================
     TABLET (max-width: 768px)
     - Stack header
     - 2 column grid
     - Compact cards
     ============================== */
  @media (max-width: 768px) {

    main {
      padding: 1.25rem !important;
    }

    /* Header - stack vertically */
    main > div:first-child {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 1rem !important;
      margin-bottom: 1.5rem !important;
    }

    main h1 {
      font-size: 1.5rem !important;
      line-height: 1.3 !important;
    }

    main p.text-\\[10px\\] {
      font-size: 0.5625rem !important;
    }

    /* Add boat button - full width on tablet */
    main button.bg-\\[\\#2056d3\\] {
      width: 100% !important;
      justify-content: center !important;
      padding: 0.625rem 1rem !important;
      font-size: 0.8125rem !important;
      border-radius: 0.625rem !important;
    }

    /* Grid - 2 columns */
    main .grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3 {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 1rem !important;
    }

    /* Card image */
    main .relative.h-48 {
      height: 9rem !important;
    }

    /* Status badge */
    main .absolute.top-4.right-4 {
      top: 0.5rem !important;
      right: 0.5rem !important;
      padding: 0.2rem 0.5rem !important;
      font-size: 0.5rem !important;
    }

    /* Card padding */
    main .p-6 {
      padding: 1rem !important;
    }

    /* Card margin bottom */
    main .mb-6 {
      margin-bottom: 0.875rem !important;
    }

    /* Boat name */
    main .text-\\[24px\\].font-bold {
      font-size: 1rem !important;
      margin-bottom: 0.25rem !important;
    }

    /* Boat type */
    main .text-\\[16px\\].text-slate-600 {
      font-size: 0.75rem !important;
    }

    /* Boat model year */
    main .text-\\[14px\\].text-slate-600 {
      font-size: 0.6875rem !important;
      margin-top: 0.25rem !important;
    }

    /* Action buttons */
    main .flex.gap-2 {
      gap: 0.375rem !important;
    }

    main button.bg-\\[\\#2b4fa9\\] {
      padding: 0.5rem !important;
      font-size: 0.625rem !important;
      border-radius: 0.5rem !important;
    }

    main button.p-2\\.5.border {
      padding: 0.5rem !important;
      border-radius: 0.5rem !important;
    }

    /* Loading & error states */
    main .p-4.rounded-lg {
      padding: 0.875rem !important;
      font-size: 0.8125rem !important;
    }

    main .p-6.rounded-xl {
      padding: 1rem !important;
      font-size: 0.8125rem !important;
    }
  }


  /* ==============================
     MOBILE (max-width: 640px)
     ============================== */
  @media (max-width: 640px) {

    main {
      padding: 1rem !important;
    }

    main h1 {
      font-size: 1.375rem !important;
    }

    /* Grid - single column */
    main .grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3 {
      grid-template-columns: 1fr !important;
      gap: 0.875rem !important;
    }

    /* Card image */
    main .relative.h-48 {
      height: 11rem !important;
    }

    /* Status badge */
    main .absolute.top-4.right-4 {
      top: 0.625rem !important;
      right: 0.625rem !important;
    }

    /* Card padding */
    main .p-6 {
      padding: 1.125rem !important;
    }

    /* Boat name */
    main .text-\\[24px\\].font-bold {
      font-size: 1.125rem !important;
    }

    /* Boat type */
    main .text-\\[16px\\].text-slate-600 {
      font-size: 0.8125rem !important;
    }

    /* Boat model year */
    main .text-\\[14px\\].text-slate-600 {
      font-size: 0.75rem !important;
    }

    /* View details button */
    main button.bg-\\[\\#2b4fa9\\] {
      padding: 0.625rem !important;
      font-size: 0.6875rem !important;
    }

    /* QR button */
    main button.p-2\\.5.border {
      padding: 0.625rem !important;
    }
  }


  /* ==============================
     SMALL MOBILE (max-width: 480px)
     ============================== */
  @media (max-width: 480px) {

    main {
      padding: 0.875rem !important;
    }

    main h1 {
      font-size: 1.25rem !important;
    }

    main p.text-\\[10px\\] {
      font-size: 0.5rem !important;
    }

    /* Add button */
    main button.bg-\\[\\#2056d3\\] {
      font-size: 0.75rem !important;
      padding: 0.5rem 0.875rem !important;
      gap: 0.375rem !important;
    }

    /* Grid */
    main .grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3 {
      gap: 0.75rem !important;
    }

    /* Card image */
    main .relative.h-48 {
      height: 10rem !important;
    }

    /* Card padding */
    main .p-6 {
      padding: 1rem !important;
    }

    /* Boat name */
    main .text-\\[24px\\].font-bold {
      font-size: 1.0625rem !important;
    }

    /* Boat type */
    main .text-\\[16px\\].text-slate-600 {
      font-size: 0.75rem !important;
    }

    /* Boat model year */
    main .text-\\[14px\\].text-slate-600 {
      font-size: 0.6875rem !important;
    }

    /* Action buttons */
    main button.bg-\\[\\#2b4fa9\\] {
      padding: 0.5rem !important;
      font-size: 0.625rem !important;
      gap: 0.375rem !important;
      border-radius: 0.5rem !important;
    }

    main button.p-2\\.5.border {
      padding: 0.5rem !important;
      border-radius: 0.5rem !important;
    }

    main .mb-6 {
      margin-bottom: 0.75rem !important;
    }
  }


  /* ==============================
     VERY SMALL (max-width: 360px)
     ============================== */
  @media (max-width: 360px) {

    main {
      padding: 0.625rem !important;
    }

    main h1 {
      font-size: 1.125rem !important;
    }

    /* Header margin */
    main > div:first-child {
      margin-bottom: 1rem !important;
      gap: 0.75rem !important;
    }

    /* Add button */
    main button.bg-\\[\\#2056d3\\] {
      font-size: 0.6875rem !important;
      padding: 0.5rem 0.75rem !important;
    }

    /* Card image */
    main .relative.h-48 {
      height: 9rem !important;
    }

    /* Card padding */
    main .p-6 {
      padding: 0.875rem !important;
    }

    /* Boat name */
    main .text-\\[24px\\].font-bold {
      font-size: 1rem !important;
    }

    /* Boat type */
    main .text-\\[16px\\].text-slate-600 {
      font-size: 0.6875rem !important;
    }

    /* Boat model year */
    main .text-\\[14px\\].text-slate-600 {
      font-size: 0.625rem !important;
    }

    /* Status badge */
    main .absolute.top-4.right-4 {
      font-size: 0.45rem !important;
      padding: 0.15rem 0.4rem !important;
    }

    /* Action buttons */
    main button.bg-\\[\\#2b4fa9\\] {
      font-size: 0.5625rem !important;
      padding: 0.5rem 0.375rem !important;
    }

    main button.p-2\\.5.border {
      padding: 0.4rem !important;
    }

    main .flex.gap-2 {
      gap: 0.25rem !important;
    }
  }


  /* ==============================
     ANIMATIONS
     ============================== */
  @keyframes boatListFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0);   }
  }

  @keyframes cardSlideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0);    }
  }

  main {
    animation: boatListFadeIn 0.3s ease forwards;
  }

  /* Staggered card animation */
  main .grid > div:nth-child(1) { animation: cardSlideUp 0.3s ease 0.05s both; }
  main .grid > div:nth-child(2) { animation: cardSlideUp 0.3s ease 0.10s both; }
  main .grid > div:nth-child(3) { animation: cardSlideUp 0.3s ease 0.15s both; }
  main .grid > div:nth-child(4) { animation: cardSlideUp 0.3s ease 0.20s both; }
  main .grid > div:nth-child(5) { animation: cardSlideUp 0.3s ease 0.25s both; }
  main .grid > div:nth-child(6) { animation: cardSlideUp 0.3s ease 0.30s both; }

  /* Card hover lift */
  main .grid > div {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  main .grid > div:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 32px rgba(0,0,0,0.10) !important;
  }
`;

export default BoatOwnerBoats;