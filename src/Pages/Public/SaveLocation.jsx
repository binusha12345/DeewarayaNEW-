import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../services/api";
import { flushLocationQueue, queueLocation } from "../../services/locationQueue";

const SaveLocation = () => {
  const { t } = useTranslation();
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
      setStatus(t('saveLocation.boatIdRequired'));
      return;
    }

    if (!navigator.geolocation) {
      setStatus(t('saveLocation.geolocationUnsupported'));
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
            setStatus(t('saveLocation.internetUnavailable'));
            return;
          }

          let res;
          try {
            res = await api.post("/tracking/update", location);
          } catch (error) {
            if (error.response) throw error;
            await queueLocation(location);
            setStatus(t('saveLocation.connectionLost'));
            return;
          }

          console.log("Save Location Success:", res.data);
          setStatus(res.data.message || t('saveLocation.locationSaved'));
        } catch (error) {
          console.log("Save Location Error:", error);
          console.log("Error Response:", error.response);
          console.log("Error Data:", error.response?.data);

          setStatus(
            error.response?.data?.message ||
              error.message ||
              t('saveLocation.failedToSave')
          );
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.log("Geolocation Error:", error);
        setStatus(t('saveLocation.locationDenied'));
        setLoading(false);
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">
          {t('saveLocation.title')}
        </h1>

        <label className="block text-sm font-semibold text-slate-700 mb-2">
          {t('saveLocation.boatId')}
        </label>
        <input
          type="text"
          placeholder={t('saveLocation.enterBoatId')}
          value={boatId}
          onChange={(e) => setBoatId(e.target.value)}
          className="border border-slate-300 p-3 rounded-lg w-full mb-4 outline-none focus:border-blue-500"
        />

        <button
          onClick={saveCurrentLocation}
          disabled={loading}
          className="bg-blue-700 text-white px-4 py-3 rounded-lg w-full font-semibold disabled:opacity-60 disabled:cursor-not-allowed hover:bg-blue-800 transition"
        >
          {loading ? t('saveLocation.saving') : t('saveLocation.saveCurrentGps')}
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