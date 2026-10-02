import { useEffect, useState } from "react";
import api, { API_ORIGIN } from "../services/api";

const CONNECTION_CHECK_URL = `${API_ORIGIN}/api/market-prices`;
const HISTORY_KEY = "internetConnectionHistory";
const HISTORY_WINDOW_MS = 3 * 60 * 60 * 1000;

const readHistory = () => {
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(history)
      ? history.filter((sample) => Date.now() - sample.checkedAt <= HISTORY_WINDOW_MS)
      : [];
  } catch {
    return [];
  }
};

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
  const [history, setHistory] = useState(readHistory);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      // Connection checks continue to work if browser storage is unavailable.
    }
  }, [history]);

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
          const response = await fetch(CONNECTION_CHECK_URL, {
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
        setHistory((current) => [
          ...current,
          {
            status: nextConnection.status,
            checkedAt: nextConnection.checkedAt.getTime(),
          },
        ].filter((sample) => Date.now() - sample.checkedAt <= HISTORY_WINDOW_MS));
        if (report && boatId) {
          const statusKey = `internetStatus:${boatId}`;
          const reportedAtKey = `internetStatusReportedAt:${boatId}`;
          const previous = localStorage.getItem(statusKey);
          const lastReportedAt = Number(localStorage.getItem(reportedAtKey)) || 0;
          if (previous !== nextConnection.status || Date.now() - lastReportedAt >= 60000) {
            try {
              await api.post("/notifications/connection-status", {
                boatId,
                status: nextConnection.status,
                previousStatus: previous,
                latency: nextConnection.latency,
              });
              localStorage.setItem(statusKey, nextConnection.status);
            } catch {
              // Status remains available locally while the reporting API is unreachable.
            } finally {
              localStorage.setItem(reportedAtKey, String(Date.now()));
            }
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
    history,
  };
}