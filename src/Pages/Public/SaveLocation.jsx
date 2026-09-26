import React, { useState } from "react";
import api from "../../services/api";
import { flushLocationQueue, queueLocation } from "../../services/locationQueue";

const SaveLocation = () => {
  const [boatId, setBoatId] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const syncPendingLocations = () => flushLocationQueue().catch(() => {});
    syncPendingLocations();
    window.addEventListener("online", syncPendingLocations);
    return () => window.removeEventListener("online", syncPendingLocations);
  }, []);

  const saveCurrentLocation = () => {
    setStatus("");

    if (!boatId.trim()) {
      setStatus("Boat ID එක දාන්න.");
      return;
    }

    if (!navigator.geolocation) {
      setStatus("Geolocation unsupported in this browser");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          console.log("GPS Coordinates:", latitude, longitude);

          const location = {
            boatId,
            latitude,
            longitude,
            speed: 0,
            zone: "Unknown",
          };

          if (!navigator.onLine) {
            await queueLocation(location);
            setStatus("Internet unavailable. GPS location saved on this device and will sync when online.");
            return;
          }

          let res;
          try {
            res = await api.post("/tracking/update", location);
          } catch (error) {
            if (error.response) throw error;
            await queueLocation(location);
            setStatus("Connection lost. GPS location saved on this device and will sync when online.");
            return;
          }

          console.log("Save Location Success:", res.data);
          setStatus(res.data.message || "Location saved successfully");
        } catch (error) {
          console.log("Save Location Error:", error);
          console.log("Error Response:", error.response);
          console.log("Error Data:", error.response?.data);

          setStatus(
            error.response?.data?.message ||
              error.message ||
              "Failed to save location"
          );
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.log("Geolocation Error:", error);
        setStatus("Location access denied or unavailable");
        setLoading(false);
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">
          Save GPS Location
        </h1>

        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Boat ID
        </label>
        <input
          type="text"
          placeholder="Enter Boat ID"
          value={boatId}
          onChange={(e) => setBoatId(e.target.value)}
          className="border border-slate-300 p-3 rounded-lg w-full mb-4 outline-none focus:border-blue-500"
        />

        <button
          onClick={saveCurrentLocation}
          disabled={loading}
          className="bg-blue-700 text-white px-4 py-3 rounded-lg w-full font-semibold disabled:opacity-60 disabled:cursor-not-allowed hover:bg-blue-800 transition"
        >
          {loading ? "Saving..." : "Save Current GPS Location"}
        </button>

        {status && (
          <p
            className={`mt-4 text-sm font-medium ${
              status.toLowerCase().includes("success")
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {status}
          </p>
        )}
      </div>
    </div>
  );
};

export default SaveLocation;