import { useEffect, useRef, useState } from "react";
import api from "../services/api";

const pendingReadingsKey = (boatId) => `signalReadingsPending:${boatId}`;

const getPendingReadings = (boatId) => {
  try {
    const pending = JSON.parse(localStorage.getItem(pendingReadingsKey(boatId)) || "[]");
    return Array.isArray(pending) ? pending : [];
  } catch {
    return [];
  }
};

const savePendingReading = (boatId, reading) => {
  const pending = getPendingReadings(boatId);
  const last = pending[pending.length - 1];
  if (!last || last.status !== reading.status || Date.now() - new Date(last.recordedAt).getTime() >= 15 * 60 * 1000) {
    localStorage.setItem(pendingReadingsKey(boatId), JSON.stringify([...pending, reading].slice(-100)));
  }
};

export default function useBoatSignalMonitor(user, { includeOwnerStatus = false } = {}) {
  const [signalInfo, setSignalInfo] = useState({ status: "checking", boatName: "" });
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
          for (const assignedBoat of boats) {
            const heartbeatKey = `driverHeartbeatAt:${assignedBoat._id}`;
            const lastHeartbeat = Number(localStorage.getItem(heartbeatKey)) || 0;
            if (Date.now() - lastHeartbeat < 60000) continue;
            try {
              await api.post("/notifications/connection-status", {
                boatId: assignedBoat._id,
                status: "good",
              });
              localStorage.setItem(heartbeatKey, String(Date.now()));
            } catch {
              // The backend marks this boat offline if heartbeats stop arriving.
            }
          }
          const savedBoatId = localStorage.getItem("signalBoatId:driver") || localStorage.getItem("signalBoatId");
          const boat = boats.find((item) => item._id === savedBoatId) || boats[0];
          const fresh = boat?.connectionCheckedAt && Date.now() - new Date(boat.connectionCheckedAt).getTime() <= 2 * 60 * 1000;
          const status = fresh ? boat.connectionStatus || "checking" : "offline";
          driverSignalRef.current = { boatId: boat?._id || "", status, latency: null };
          window.dispatchEvent(new Event("signal-driver-status"));
          if (active) setSignalInfo({ status: boat ? status : "checking", boatName: boat?.boatName || "" });
          return;
        }

        const boatStatuses = boats.map((boat) => {
          let status = "checking";
          if (boat.connectionCheckedAt) {
            status = Date.now() - new Date(boat.connectionCheckedAt).getTime() > 2 * 60 * 1000
              ? "offline"
              : boat.connectionStatus || "checking";
          }
          return { boat, status };
        });
        const concerningBoat = boatStatuses.find(({ status }) => status === "poor")
          || boatStatuses.find(({ status }) => status === "offline")
          || boatStatuses.find(({ status }) => status === "medium");
        const allGood = boatStatuses.length > 0 && boatStatuses.every(({ status }) => status === "good");
        const monitoredBoat = concerningBoat
          || (allGood ? boatStatuses[0] : boatStatuses.find(({ status }) => status !== "good"))
          || boatStatuses[0];
        const nextStatus = concerningBoat?.status || (allGood ? "good" : "checking");
        if (active) setSignalInfo({ status: nextStatus, boatName: monitoredBoat?.boat.boatName || "" });
      } catch {
        if (active) setSignalInfo({ status: "checking", boatName: "" });
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
          const reading = {
            boatId,
            status,
            latency,
            latitude: coords.latitude,
            longitude: coords.longitude,
            recordedAt: new Date().toISOString(),
          };
          try {
            const pending = getPendingReadings(boatId);
            for (const queuedReading of pending) await api.post("/signal/readings", queuedReading);
            if (pending.length) localStorage.removeItem(pendingReadingsKey(boatId));
            await api.post("/signal/readings", reading);
            window.dispatchEvent(new CustomEvent("signal-coverage-result", { detail: { error: "" } }));
          } catch (error) {
            savePendingReading(boatId, reading);
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
    const interval = setInterval(capture, 30 * 1000);
    window.addEventListener("signal-driver-status", capture);
    const syncConnection = (event) => {
      const { status, latency } = event.detail || {};
      if (!["good", "medium", "poor", "offline"].includes(status)) return;
      driverSignalRef.current = { ...driverSignalRef.current, status, latency: latency ?? null };
      capture();
    };
    window.addEventListener("signal-connection-update", syncConnection);
    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener("signal-driver-status", capture);
      window.removeEventListener("signal-connection-update", syncConnection);
    };
  }, [coverageEnabled, user?.role]);

  return signalInfo;
}