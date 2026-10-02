import { useEffect, useRef, useState } from "react";
import api from "../services/api";

export default function useBoatSignalMonitor(user, { includeOwnerStatus = false } = {}) {
  const [signalStatus, setSignalStatus] = useState("checking");
  const [coverageEnabled, setCoverageEnabled] = useState(false);
  const coveragePreferenceKey = `signalCoverageEnabled:${user?._id || user?.id || "user"}`;
  const driverSignalRef = useRef({ boatId: "", status: "checking", latency: null });

  useEffect(() => {
    const syncCoverageSetting = () => {
      setCoverageEnabled(localStorage.getItem(coveragePreferenceKey) === "true");
    };
    syncCoverageSetting();
    window.addEventListener("signal-coverage-setting", syncCoverageSetting);
    return () => window.removeEventListener("signal-coverage-setting", syncCoverageSetting);
  }, [coveragePreferenceKey]);

  useEffect(() => {
    const shouldLoad = user?.role === "driver" || (includeOwnerStatus && user?.role === "owner");
    if (!shouldLoad) return undefined;

    let active = true;
    const loadSignalStatus = async () => {
      try {
        const endpoint = user.role === "owner" ? "/boats" : "/boats/assigned";
        const { data } = await api.get(endpoint);
        const boats = Array.isArray(data) ? data : [];
        if (user.role === "driver") {
          const savedBoatId = localStorage.getItem("signalBoatId:driver") || localStorage.getItem("signalBoatId");
          const boat = boats.find((item) => item._id === savedBoatId) || boats[0];
          const fresh = boat?.connectionCheckedAt && Date.now() - new Date(boat.connectionCheckedAt).getTime() <= 2 * 60 * 1000;
          const status = fresh ? boat.connectionStatus || "checking" : "offline";
          driverSignalRef.current = { boatId: boat?._id || "", status, latency: null };
          window.dispatchEvent(new Event("signal-driver-status"));
          if (active) setSignalStatus(boat ? status : "checking");
          return;
        }

        const statuses = boats.map((boat) => {
          if (!boat.connectionCheckedAt) return "checking";
          if (Date.now() - new Date(boat.connectionCheckedAt).getTime() > 2 * 60 * 1000) return "offline";
          return boat.connectionStatus || "checking";
        });
        const nextStatus = statuses.includes("poor") || statuses.includes("offline")
          ? statuses.includes("poor") ? "poor" : "offline"
          : statuses.includes("medium")
            ? "medium"
            : statuses.length && statuses.every((status) => status === "good")
              ? "good"
              : "checking";
        if (active) setSignalStatus(nextStatus);
      } catch {
        if (active) setSignalStatus("checking");
      }
    };

    loadSignalStatus();
    const interval = setInterval(loadSignalStatus, 15000);
    window.addEventListener("signal-boat-change", loadSignalStatus);
    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener("signal-boat-change", loadSignalStatus);
    };
  }, [includeOwnerStatus, user?.role]);

  useEffect(() => {
    if (user?.role !== "driver" || !coverageEnabled || !navigator.geolocation) return undefined;
    let active = true;
    const capture = () => {
      const { boatId, status, latency } = driverSignalRef.current;
      if (!boatId || status === "checking") return;
      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          if (!active) return;
          try {
            await api.post("/signal/readings", {
              boatId,
              status,
              latency,
              latitude: coords.latitude,
              longitude: coords.longitude,
            });
            window.dispatchEvent(new CustomEvent("signal-coverage-result", { detail: { error: "" } }));
          } catch (error) {
            window.dispatchEvent(new CustomEvent("signal-coverage-result", {
              detail: { error: error.response?.data?.message || "Could not save this signal reading" },
            }));
          }
        },
        (error) => {
          if (active) window.dispatchEvent(new CustomEvent("signal-coverage-result", {
            detail: { error: error.code === 1 ? "Location permission is disabled" : "Could not read GPS location" },
          }));
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    };

    capture();
    const interval = setInterval(capture, 15 * 60 * 1000);
    window.addEventListener("signal-driver-status", capture);
    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener("signal-driver-status", capture);
    };
  }, [coverageEnabled, user?.role]);

  return signalStatus;
}