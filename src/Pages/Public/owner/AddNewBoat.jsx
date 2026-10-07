import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Info,
  Sliders,
  Upload,
  ShieldCheck,
  X,
  ArrowRight,
} from "lucide-react";
import OwnerSidebar from "../../../components/OwnerSidebar";
import DashboardNav from "../../../components/DashboardNav";
import DashboardPageHeader from "../../../components/DashboardPageHeader";
import api from "../../../services/api";

const initialFormData = {
  boatName: "",
  registrationNumber: "",
  boatType: "",
  modelYear: "",
  engineSerial: "",
  fuelCapacity: "",
  horsepower: "",
  engineType: "", 
  imageFile: null,
  boatStatus: "ACTIVE",
};

const AddNewBoat = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState("");

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
  const file = e.target.files[0];

  if (file) {
    setFormData((prev) => ({
      ...prev,
      imageFile: file,
    }));

    setImagePreview(URL.createObjectURL(file));
  }
  };
  const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setSuccess("");

    // ✅ DEBUG - See what's happening
  const token = localStorage.getItem("token");
  console.log("=".repeat(50));
  console.log("🔑 TOKEN IN LOCALSTORAGE:", token);
  console.log("🔑 TOKEN EXISTS:", !!token);
  console.log("🔑 ALL LOCALSTORAGE KEYS:", Object.keys(localStorage));
  console.log("=".repeat(50));

  if (!token) {
    setError("❌ You are not logged in. Please login first.");
    setTimeout(() => navigate("/login"), 2000);
    return;
  }

  if (
    !formData.boatName ||
    !formData.registrationNumber ||
    !formData.boatType ||
    !formData.modelYear ||
    !formData.engineSerial ||
    !formData.fuelCapacity ||
    !formData.horsepower ||
    !formData.engineType ||
    !formData.boatStatus
  ) {
    setError("Boat Name, Registration Number, Boat Type, Model/Year needed.");
    return;
  }

    // ✅ Validate model year is 4 digits
  if (formData.modelYear.length !== 4) {
    setError("Model year must be exactly 4 digits.");
    return;
  }

  // ✅ Validate numbers > 0
  if (Number(formData.fuelCapacity) <= 0) {
    setError("Fuel capacity must be greater than 0.");
    return;
  }

  try {
    setLoading(true);

    const data = new FormData();
    data.append("boatName", formData.boatName);
    data.append("registrationNumber", formData.registrationNumber);
    data.append("boatType", formData.boatType);
    data.append("modelYear", formData.modelYear);
    data.append("engineSerial", formData.engineSerial);
    data.append("fuelCapacity", formData.fuelCapacity);
    data.append("horsepower", formData.horsepower);
    data.append("boatStatus", formData.boatStatus);
    data.append("engineType", formData.engineType); 
    if (formData.imageFile) {
      data.append("image", formData.imageFile);
    }

    const res = await api.post("/boats", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    setSuccess(res.data.message || "Boat registered successfully");

    setTimeout(() => {
      navigate("/boatownerboats");
    }, 800);
  } catch (err) {
    console.log("Boat Save Error Full:", err);
    console.log("Boat Save Error Response:", err.response);
    console.log("Boat Save Error Data:", err.response?.data);

    setError(
      err.response?.data?.message ||
      err.message ||
      "Boat registration failed"
    );
  } finally {
    setLoading(false);
  }
};
  
  const handleSaveDraft = () => {
    localStorage.setItem("boatDraft", JSON.stringify(formData));
    setSuccess("Draft saved locally.");
  };

  const handleCancel = () => {
    navigate("/boatownerboats");
  };

  return (
    <div data-tour="add-boat-btn" className="flex h-screen bg-[#f8fafc] font-sans text-slate-800 overflow-hidden">

      <style>{addBoatStyles}</style> 
      {/* Sidebar */}
      <OwnerSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <DashboardNav />

        {/* Scrollable Form Area */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-12">
          <DashboardPageHeader
            eyebrow="Fleet expansion"
            title="Register New Boat"
            description="Add a vessel to your fleet by completing its identification and technical details."
            icon={Plus}
            theme="emerald"
          />

          {/* Error / Success */}
          {error && (
            <div className="mb-6 rounded-lg bg-red-100 text-red-700 px-4 py-3 text-sm font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-lg bg-green-100 text-green-700 px-4 py-3 text-sm font-medium">
              {success}
            </div>
          )}

          <div className="flex flex-col xl:flex-row gap-8">
            {/* Left: Input Sections */}
            <div className="flex-1 space-y-4">
              {/* Boat Information Card */}
              <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 bg-[#0f2a4a] text-white rounded-lg flex items-center justify-center">
                    <Info size={20} />
                  </div>
                  <h3 className="font-bold text-[18px] text-slate-900">
                    Boat Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <FormInput 
                    
                    label="BOAT NAME"
                    name="boatName"
                    value={formData.boatName}
                    onChange={handleChange}
                    placeholder="e.g. Sea Guardian II"
                    
                  />

                  <FormInput
                    label="REGISTRATION NUMBER"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    placeholder="MAR-990-234X"
                  />

                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-bold text-slate-600 uppercase tracking-widest">
                      BOAT TYPE
                    </label>
                    <select
                      name="boatType"
                      value={formData.boatType}
                      onChange={handleChange}
                      className="bg-[#f8fafc] border border-slate-200 rounded-lg p-2 text-[12px] text-slate-600 focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Select Category</option>
                      <option value="Ruvala">Ruvala</option>
                      <option value="One-day Boat">One-day Boat</option>
                      <option value="Tanker Boat">Tanker Boat</option>
                    </select>
                  </div>

                  <FormInput
                    label="BOAT MANUFACTURE YEAR"
                    name="modelYear"
                    value={formData.modelYear}
                    onChange={handleChange}
                    placeholder="2024"
                    type="number"
                  />

                </div>
              </div>

              {/* Engine & Technical Card */}
              <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                    <Sliders size={20} />
                  </div>
                  <h3 className="font-bold text-[18px] text-slate-900">
                    Engine & Technical Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormInput
                    label="ENGINE SERIAL"
                    name="engineSerial"
                    value={formData.engineSerial}
                    onChange={handleChange}
                    placeholder="S/N 8839120"
                  />

              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-bold text-slate-600 uppercase tracking-widest">
                  BOAT STATUS
                </label>
                <select
                  name="boatStatus"
                  value={formData.boatStatus}
                  onChange={handleChange}
                  className="bg-[#f8fafc] border border-slate-200 rounded-lg p-2 text-[12px] text-slate-600 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="NON-ACTIVE">NON-ACTIVE</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                </select>
              </div>

                  <div className="relative">
                    <FormInput
                      label="FUEL CAPACITY (L) OF THE BOAT"
                      name="fuelCapacity"
                      value={formData.fuelCapacity}
                      onChange={handleChange}
                      placeholder="500"
                      type="number"
                    />
                    <span className="absolute right-12 bottom-4 text-[12px] font-bold text-slate-600 uppercase">
                      Liters
                    </span>
                  </div>

                  <div className="relative ">
                    <FormInput 
                      label="HORSEPOWER (HP)"
                      name="horsepower"
                      value={formData.horsepower}
                      onChange={handleChange}
                      placeholder="350"
                      type="number"
                    />
                    <span className="absolute right-12 bottom-4 text-[12px] font-bold text-slate-600 uppercase">
                      HP
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                  <FormInput 
                    
                    label="ENGINE TYPE"
                    name="engineType"
                    value={formData.engineType}
                    onChange={handleChange}
                    placeholder="Yamaha"
                    
                  />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Upload & Status */}
            <div className="w-full xl:w-80 space-y-6">
              {/* Vessel Imagery Card */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-[12px] font-bold text-slate-600 uppercase tracking-widest mb-4 ml-20">
                  Vessel Imagery
                </h3>

                <div className="border-2 border-dashed text-[14px] border-slate-400 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100/50 transition-colors group">
                  

                  <div className="w-full">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="w-full px-2 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition cursor-pointer"
                  >
                    Choose Boat Image
                  </button>

                  <p className="text-[12px] text-slate-800 mt-2">
                    Select an image from your computer
                  </p>
                </div>
                </div>

                {/* Preview */}
                <div className="mt-6 rounded-xl overflow-hidden h-32 relative">
                  <img
                    src={
                      imagePreview ||
                      "https://images.unsplash.com/photo-15444053912wCEAAkGBxQTEhUTExIWFhUXGBobGBgYGRoaGBoXGBUXGBcYGBgaISggGBolHRUXITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0OGxAQGy0lHyUtLS0tLS0tLy0tLS0tLS0tLS0tLS8tLS0tLS0tLS0tLS0tLS0tLS0tLS0vLS0tLS0tLf-f925b34bc25e?w=400"
                    }
                    alt="Boat Preview"
                    className="w-full h-full object-cover opacity-90"
                  />
                  <div className="absolute inset-0 flex items-center justify-center border border-white/20 bg-black/10">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                      Preview Frame
                    </span>
                  </div>
                </div>
              </div>

              {/* Compliance Box */}
              <div className="bg-[#0f2a4a] rounded-xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 rounded-full"></div>

                <div className="flex items-center gap-2 mb-4 relative z-10">
                  <ShieldCheck size={18} className="text-blue-400" />
                  <h3 className="text-[12px] font-bold uppercase tracking-widest">
                    Regulatory Compliance
                  </h3>
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed relative z-10 mb-6">
                  Registration details will be verified against the IMO Global
                  Integrated Shipping Information System. Ensure all technical
                  fields match manufacturer documentation.
                </p>

                <div className="flex justify-between items-center relative z-10 pt-4 border-t border-white/10">
                  <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">
                    Auth Code
                  </span>
                  <span className="text-[12px] font-mono text-blue-200">
                    NAV-AUTH-2024-X
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions Bar */}
          <footer className="mt-10 px-0 py-6 bg-white border-t border-slate-100 flex items-center justify-between rounded-xl">
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-2 text-red-500 text-[14px] font-bold hover:bg-red-50 px-4 py-2 rounded-lg transition cursor-pointer ml-10"
            >
              <X size={14} /> Cancel
            </button>

            <div className="flex gap-4">
              {/*<button
                type="button"
                onClick={handleSaveDraft}
                className="px-8 py-2.5 bg-slate-100 text-slate-600 rounded-lg text-[16px] font-bold hover:bg-slate-200 transition cursor-pointer"
              >
                Save Draft
              </button>*/}

              <button
                type="submit"
                disabled={loading}
                className="px-10 py-2.5 mr-10 bg-[#1b416f] text-white rounded-lg text-[14px] font-bold hover:bg-slate-800 transition shadow-lg flex items-center gap-3 group cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : "Register Boat"}
                <ArrowRight
                  size={14}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
};

const FormInput = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required = true,
  inputClassName = "",
}) => (
  <div className="flex flex-col gap-2 w-full">
    <label className="text-[12px] font-bold text-slate-600 uppercase tracking-widest">
      {label}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className={`bg-[#f8fafc] border border-slate-200 rounded-lg p-2 text-[12px] focus:ring-1 focus:ring-blue-500 outline-none transition-all ${inputClassName}`}
    />
  </div>
);


// ============================================================
// ✅ RESPONSIVE STYLES - Proper & Clean
// ============================================================

const addBoatStyles = `

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

    /* Form padding */
    form.flex-1 {
      padding: 2rem !important;
    }

    /* Header */
    form h1 {
      font-size: 1.875rem !important;
    }

    form p.text-slate-600 {
      font-size: 0.8125rem !important;
    }

    /* Header margin */
    form > div:first-child {
      margin-bottom: 2rem !important;
    }

    /* Main layout */
    form .flex.flex-col.xl\\:flex-row {
      gap: 1.5rem !important;
    }

    /* Right panel width */
    form .w-full.xl\\:w-80 {
      width: 18rem !important;
    }

    /* Card padding */
    form .bg-white.rounded-xl.p-8 {
      padding: 1.5rem !important;
    }

    form .bg-white.rounded-xl.p-6 {
      padding: 1.25rem !important;
    }

    /* Section headings */
    form h3.font-bold.text-\\[18px\\] {
      font-size: 1rem !important;
    }

    /* Footer */
    form footer {
      margin-top: 1.5rem !important;
      padding: 1rem 0 !important;
    }

    form footer button:last-child {
      margin-right: 1.5rem !important;
      padding: 0.5rem 1.75rem !important;
    }

    form footer button:first-child {
      margin-left: 1.5rem !important;
    }
  }


  /* ==============================
     SMALL LAPTOP (max-width: 1024px)
     ============================== */
  @media (max-width: 1024px) {

    form.flex-1 {
      padding: 1.75rem !important;
    }

    form h1 {
      font-size: 1.75rem !important;
    }

    form p.text-slate-600 {
      font-size: 0.75rem !important;
    }

    form > div:first-child {
      margin-bottom: 1.75rem !important;
    }

    /* Stack layout vertically at 1024 */
    form .flex.flex-col.xl\\:flex-row {
      flex-direction: column !important;
      gap: 1.25rem !important;
    }

    /* Right panel full width */
    form .w-full.xl\\:w-80 {
      width: 100% !important;
    }

    /* Right panel - side by side */
    form .w-full.xl\\:w-80.space-y-6 {
      display: grid !important;
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 1.25rem !important;
    }

    /* Card padding */
    form .bg-white.rounded-xl.p-8 {
      padding: 1.25rem !important;
    }

    form .bg-white.rounded-xl.p-6 {
      padding: 1.125rem !important;
    }

    /* Section heading icons */
    form .w-10.h-10.rounded-lg {
      width: 2.25rem !important;
      height: 2.25rem !important;
    }

    /* Section headings */
    form h3.font-bold.text-\\[18px\\] {
      font-size: 0.9375rem !important;
    }

    /* Input label */
    form label.text-\\[12px\\] {
      font-size: 0.625rem !important;
    }

    /* Input */
    form input, form select {
      font-size: 0.6875rem !important;
      padding: 0.5rem !important;
    }

    /* Engine grid - 3 cols stays */
    form .grid.grid-cols-1.md\\:grid-cols-3 {
      grid-template-columns: repeat(3, 1fr) !important;
    }

    /* Footer */
    form footer {
      margin-top: 1.25rem !important;
    }

    form footer button:last-child {
      margin-right: 1.25rem !important;
      padding: 0.5rem 1.5rem !important;
    }

    form footer button:first-child {
      margin-left: 1.25rem !important;
    }
  }


  /* ==============================
     TABLET (max-width: 768px)
     - Stack everything vertically
     - Compact all sections
     ============================== */
  @media (max-width: 768px) {

    form.flex-1 {
      padding: 1.25rem !important;
    }

    /* Header */
    form > div:first-child {
      margin-bottom: 1.25rem !important;
    }

    form h1 {
      font-size: 1.5rem !important;
      margin-bottom: 0.5rem !important;
    }

    form p.text-slate-600 {
      font-size: 0.6875rem !important;
      max-width: 100% !important;
    }

    form .flex.items-center.gap-2.text-blue-600 p {
      font-size: 0.5625rem !important;
    }

    /* Error / success */
    form .mb-6.rounded-lg {
      margin-bottom: 1rem !important;
      padding: 0.625rem 0.875rem !important;
      font-size: 0.75rem !important;
    }

    /* Main layout - full stack */
    form .flex.flex-col.xl\\:flex-row {
      flex-direction: column !important;
      gap: 1rem !important;
    }

    /* Right panel */
    form .w-full.xl\\:w-80 {
      width: 100% !important;
    }

    form .w-full.xl\\:w-80.space-y-6 {
      display: grid !important;
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 1rem !important;
    }

    /* Card paddings */
    form .bg-white.rounded-xl.p-8 {
      padding: 1rem !important;
      border-radius: 0.875rem !important;
    }

    form .bg-white.rounded-xl.p-6 {
      padding: 1rem !important;
      border-radius: 0.875rem !important;
    }

    /* Section icon + heading gap */
    form .flex.items-center.gap-4.mb-8 {
      gap: 0.75rem !important;
      margin-bottom: 1rem !important;
    }

    /* Section icon */
    form .w-10.h-10.rounded-lg {
      width: 2rem !important;
      height: 2rem !important;
    }

    /* Section heading */
    form h3.font-bold.text-\\[18px\\] {
      font-size: 0.875rem !important;
    }

    /* Boat info grid - 2 cols */
    form .grid.grid-cols-1.md\\:grid-cols-2 {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 0.875rem 1.25rem !important;
    }

    /* Engine grid - 2 cols on tablet */
    form .grid.grid-cols-1.md\\:grid-cols-3 {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 0.875rem !important;
    }

    /* Input label */
    form label.text-\\[12px\\] {
      font-size: 0.5625rem !important;
    }

    /* Input & select */
    form input, form select {
      font-size: 0.6875rem !important;
      padding: 0.5rem 0.625rem !important;
      border-radius: 0.5rem !important;
    }

    /* Image upload area */
    form .border-2.border-dashed {
      padding: 1.25rem !important;
      border-radius: 1rem !important;
    }

    /* Image preview */
    form .mt-6.rounded-xl.h-32 {
      height: 7rem !important;
      margin-top: 0.875rem !important;
    }

    /* Compliance box */
    form .bg-\\[\\#0f2a4a\\].rounded-xl.p-6 {
      padding: 1rem !important;
    }

    form .bg-\\[\\#0f2a4a\\] p.text-\\[10px\\] {
      font-size: 0.5625rem !important;
    }

    /* Liters / HP absolute labels */
    form .relative span.absolute {
      right: 0.625rem !important;
      font-size: 0.5625rem !important;
    }

    /* Footer */
    form footer {
      margin-top: 1.25rem !important;
      padding: 0.875rem 0 !important;
      flex-direction: row !important;
      align-items: center !important;
    }

    form footer button:first-child {
      margin-left: 0.75rem !important;
      font-size: 0.75rem !important;
      padding: 0.5rem 0.75rem !important;
    }

    form footer button:last-child {
      margin-right: 0.75rem !important;
      padding: 0.5rem 1.25rem !important;
      font-size: 0.75rem !important;
    }
  }


  /* ==============================
     MOBILE (max-width: 640px)
     ============================== */
  @media (max-width: 640px) {

    form.flex-1 {
      padding: 1rem !important;
    }

    form h1 {
      font-size: 1.375rem !important;
    }

    form p.text-slate-600 {
      font-size: 0.6875rem !important;
    }

    /* Right panel - stack vertically */
    form .w-full.xl\\:w-80.space-y-6 {
      display: flex !important;
      flex-direction: column !important;
      gap: 0.875rem !important;
    }

    /* Card padding */
    form .bg-white.rounded-xl.p-8 {
      padding: 0.875rem !important;
    }

    form .bg-white.rounded-xl.p-6 {
      padding: 0.875rem !important;
    }

    /* Boat info grid - 1 col */
    form .grid.grid-cols-1.md\\:grid-cols-2 {
      grid-template-columns: 1fr !important;
      gap: 0.75rem !important;
    }

    /* Engine grid - 1 col */
    form .grid.grid-cols-1.md\\:grid-cols-3 {
      grid-template-columns: 1fr !important;
      gap: 0.75rem !important;
    }

    /* Section heading margin */
    form .flex.items-center.gap-4.mb-8 {
      margin-bottom: 0.875rem !important;
    }

    /* Input label */
    form label.text-\\[12px\\] {
      font-size: 0.5rem !important;
    }

    /* Input */
    form input, form select {
      font-size: 0.6875rem !important;
      padding: 0.5rem !important;
    }

    /* Liters / HP label */
    form .relative span.absolute {
      display: none !important;
    }

    /* Image upload button */
    form .border-2.border-dashed button {
      font-size: 0.75rem !important;
      padding: 0.5rem !important;
    }

    /* Image preview */
    form .mt-6.rounded-xl.h-32 {
      height: 8rem !important;
    }

    /* Vessel imagery title */
    form h3.text-\\[12px\\].font-bold.text-slate-600 {
      margin-left: 0 !important;
      text-align: left !important;
    }

    /* Compliance box */
    form .bg-\\[\\#0f2a4a\\].rounded-xl.p-6 {
      padding: 0.875rem !important;
    }

    /* Footer */
    form footer {
      flex-direction: column !important;
      gap: 0.75rem !important;
      align-items: stretch !important;
      padding: 0.875rem !important;
      border-radius: 0.875rem !important;
    }

    form footer button:first-child {
      margin-left: 0 !important;
      justify-content: center !important;
      text-align: center !important;
      width: 100% !important;
    }

    form footer > div {
      width: 100% !important;
    }

    form footer > div button {
      width: 100% !important;
      margin-right: 0 !important;
      justify-content: center !important;
      padding: 0.625rem !important;
      font-size: 0.8125rem !important;
    }
  }


  /* ==============================
     SMALL MOBILE (max-width: 480px)
     ============================== */
  @media (max-width: 480px) {

    form.flex-1 {
      padding: 0.875rem !important;
    }

    form h1 {
      font-size: 1.25rem !important;
    }

    /* Header icon + badge */
    form .flex.items-center.gap-2.text-blue-600 {
      margin-bottom: 0.375rem !important;
    }

    /* Card padding */
    form .bg-white.rounded-xl.p-8 {
      padding: 0.75rem !important;
      border-radius: 0.75rem !important;
    }

    form .bg-white.rounded-xl.p-6 {
      padding: 0.75rem !important;
      border-radius: 0.75rem !important;
    }

    /* Section icon */
    form .w-10.h-10.rounded-lg {
      width: 1.75rem !important;
      height: 1.75rem !important;
    }

    /* Section heading */
    form h3.font-bold.text-\\[18px\\] {
      font-size: 0.8125rem !important;
    }

    /* Input gap */
    form .flex.flex-col.gap-2 {
      gap: 0.25rem !important;
    }

    /* Input */
    form input, form select {
      padding: 0.4375rem !important;
      border-radius: 0.5rem !important;
    }

    /* Image preview */
    form .mt-6.rounded-xl.h-32 {
      height: 7rem !important;
      margin-top: 0.625rem !important;
    }

    /* Space-y-4 in left column */
    form .flex-1.space-y-4 > * + * {
      margin-top: 0.75rem !important;
    }

    /* Footer */
    form footer {
      margin-top: 0.875rem !important;
      padding: 0.75rem !important;
      gap: 0.5rem !important;
    }

    form footer > div button {
      font-size: 0.75rem !important;
      padding: 0.5rem !important;
    }
  }


  /* ==============================
     VERY SMALL (max-width: 360px)
     ============================== */
  @media (max-width: 360px) {

    form.flex-1 {
      padding: 0.625rem !important;
    }

    form h1 {
      font-size: 1.125rem !important;
    }

    form p.text-slate-600 {
      font-size: 0.625rem !important;
    }

    /* Card */
    form .bg-white.rounded-xl.p-8 {
      padding: 0.625rem !important;
    }

    form .bg-white.rounded-xl.p-6 {
      padding: 0.625rem !important;
    }

    /* Section icon */
    form .w-10.h-10.rounded-lg {
      width: 1.5rem !important;
      height: 1.5rem !important;
    }

    /* Input */
    form input, form select {
      font-size: 0.625rem !important;
      padding: 0.375rem !important;
    }

    /* Image preview */
    form .mt-6.rounded-xl.h-32 {
      height: 6rem !important;
    }

    /* Upload button */
    form .border-2.border-dashed button {
      font-size: 0.625rem !important;
      padding: 0.375rem !important;
    }

    /* Compliance box */
    form .bg-\\[\\#0f2a4a\\].rounded-xl.p-6 {
      padding: 0.625rem !important;
    }

    form footer {
      padding: 0.625rem !important;
      gap: 0.375rem !important;
    }

    form footer > div button {
      font-size: 0.6875rem !important;
    }
  }


  /* ==============================
     ANIMATIONS
     ============================== */
  @keyframes addBoatFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0);   }
  }

  @keyframes cardReveal {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0);    }
  }

  form {
    animation: addBoatFadeIn 0.3s ease forwards;
  }

  form .bg-white.rounded-xl:nth-child(1) {
    animation: cardReveal 0.3s ease 0.05s both;
  }

  form .bg-white.rounded-xl:nth-child(2) {
    animation: cardReveal 0.3s ease 0.10s both;
  }

  form .bg-\\[\\#0f2a4a\\] {
    animation: cardReveal 0.3s ease 0.15s both;
  }
`;

export default AddNewBoat;