import { useEffect, useState } from "react";
import api from "../services/api";

const API_ORIGIN = import.meta.env.VITE_API_URL || "http://localhost:5000";

const classifyLatency = (latency) => {
  if (latency <= 300) return "good";
  if (latency <= 1000) return "medium";
  return "poor";
};

export default function useInternetStatus({ boatId = "", report = false } = {}) {
  const [connection, setConnection] = useState({
    status: navigator.onLine ? "checking" : "offline",
    latency: null,
    checkedAt: null,
  });
  const [samples, setSamples] = useState([]);

  useEffect(() => {
    let active = true;
    let checking = false;

    const checkConnection = async () => {
      if (checking) return;
      checking = true;
      let nextConnection;

      if (!navigator.onLine) {
        nextConnection = { status: "offline", latency: null, checkedAt: new Date() };
      } else {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const startedAt = performance.now();
        try {
          const response = await fetch(`${API_ORIGIN}/`, {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          });
          if (!response.ok) throw new Error("Connection check failed");
          const latency = Math.round(performance.now() - startedAt);
          nextConnection = { status: classifyLatency(latency), latency, checkedAt: new Date() };
        } catch {
          nextConnection = { status: navigator.onLine ? "poor" : "offline", latency: null, checkedAt: new Date() };
        } finally {
          clearTimeout(timeout);
        }
      }

      if (active) {
        setConnection(nextConnection);
        setSamples((current) => [
          ...current,
          {
            latency: nextConnection.latency,
            available: nextConnection.latency !== null,
            checkedAt: nextConnection.checkedAt.getTime(),
          },
        ].slice(-30));
        if (report && boatId) {
          const statusKey = `internetStatus:${boatId}`;
          try {
            const previous = localStorage.getItem(statusKey);
            if (previous !== nextConnection.status) {
              await api.post("/notifications/connection-status", {
                boatId,
                status: nextConnection.status,
                previousStatus: previous,
                latency: nextConnection.latency,
              });
            }
          } catch {
            // Status remains available locally while the reporting API is unreachable.
          } finally {
            localStorage.setItem(statusKey, nextConnection.status);
          }
        }
      }
      checking = false;
    };

    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    window.addEventListener("online", checkConnection);
    window.addEventListener("offline", checkConnection);
    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener("online", checkConnection);
      window.removeEventListener("offline", checkConnection);
    };
  }, [boatId, report]);

  const successfulLatencies = samples
    .filter((sample) => sample.available)
    .map((sample) => sample.latency);
  const averageLatency = successfulLatencies.length
    ? Math.round(successfulLatencies.reduce((total, latency) => total + latency, 0) / successfulLatencies.length)
    : null;
  const stability = samples.length
    ? Math.round((successfulLatencies.length / samples.length) * 100)
    : null;

  return {
    ...connection,
    averageLatency,
    stability,
    sampleCount: samples.length,
    latencySampleCount: successfulLatencies.length,
  };
}