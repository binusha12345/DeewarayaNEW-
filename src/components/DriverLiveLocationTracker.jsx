import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const DriverLiveLocationTracker = () => {
  const { user, token } = useAuth();
  const [status, setStatus] = useState("starting");
  const [trackingBoatId, setTrackingBoatId] = useState("");

  useEffect(() => {
    const notificationId = "driver-live-location";
    const messages = {
      waiting: "Waiting for GPS. Allow location access to share your boat’s position with its owner.",
      sharing: "Your boat’s location is being shared with its owner.",
      unsupported: "This device does not support GPS location sharing.",
      unassigned: "No boat is assigned to this driver account.",
      "permission-denied": "GPS permission is blocked. Allow location access in your browser settings.",
      "gps-error": "Could not get a GPS fix. Location sharing will resume when GPS is available.",
      "connection-error": "Could not send the boat location. Check your internet connection; sharing will retry.",
    };

    if (status === "inactive" || status === "starting") {
      toast.dismiss(notificationId);
    } else if (status === "waiting") {
      toast.loading(messages[status], { id: notificationId });
    } else if (status === "sharing") {
      toast.success(messages[status], { id: notificationId });
    } else if (messages[status]) {
      toast.error(messages[status], { id: notificationId });
    }
  }, [status]);

  useEffect(() => {
    const handleBoatChange = (event) => setTrackingBoatId(event.detail);
    window.addEventListener("driver-live-tracking-boat-change", handleBoatChange);
    return () => window.removeEventListener("driver-live-tracking-boat-change", handleBoatChange);
  }, []);

  useEffect(() => {
    if (user?.role !== "driver" || !token) {
      setStatus("inactive");
      return undefined;
    }

    let active = true;
    let sending = false;
    let lastSentAt = 0;
    let watchId;

    const startTracking = async () => {
      if (!navigator.geolocation) {
        setStatus("unsupported");
        return;
      }

      try {
        const { data } = await api.get("/boats/assigned");
        if (!active) return;
        const boats = Array.isArray(data) ? data : [];
        const boat = boats.find((item) => item._id === trackingBoatId)
          || boats.find((item) => item._id === localStorage.getItem("signalBoatId:driver"))
          || boats[0];
        if (!boat) {
          setStatus("unassigned");
          return;
        }

        localStorage.setItem("signalBoatId:driver", boat._id);
        if (trackingBoatId !== boat._id) {
          setTrackingBoatId(boat._id);
          return;
        }
        setStatus("waiting");
        watchId = navigator.geolocation.watchPosition(
          async ({ coords }) => {
            if (!active || sending || Date.now() - lastSentAt < 15000) return;
            sending = true;
            try {
              await api.post("/tracking/live", {
                boatId: boat._id,
                latitude: coords.latitude,
                longitude: coords.longitude,
                accuracy: coords.accuracy,
              });
              if (active) setStatus("sharing");
              lastSentAt = Date.now();
            } catch {
              if (active) setStatus("connection-error");
            } finally {
              sending = false;
            }
          },
          (error) => {
            if (!active) return;
            setStatus(error.code === error.PERMISSION_DENIED ? "permission-denied" : "gps-error");
          },
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
        );
      } catch {
        if (active) setStatus("connection-error");
      }
    };

    startTracking();
    return () => {
      active = false;
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
    };
  }, [token, trackingBoatId, user?._id, user?.role]);

  return null;
};

export default DriverLiveLocationTracker;
