// Live map for the owner/driver dashboards: boat markers + optional trip path.
import { useEffect } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const SRI_LANKA = [7.4, 79.8];

const boatIcon = (color, heading) =>
  L.divIcon({
    className: "",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    html: `<div style="width:34px;height:34px;border-radius:9999px;background:${color};border:3px solid #fff;box-shadow:0 4px 12px rgba(15,23,42,.35);display:flex;align-items:center;justify-content:center">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(${heading ?? 0}deg)"><path d="M12 2 19 21 12 17 5 21Z"/></svg>
    </div>`,
  });

const COLORS = { sea: "#0284c7", port: "#0f172a", alert: "#dc2626", maintenance: "#d97706" };

function FitTo({ points }) {
  const map = useMap();
  const key = JSON.stringify(points);
  useEffect(() => {
    const pts = JSON.parse(key);
    if (pts.length === 1) map.setView(pts[0], 11);
    else if (pts.length > 1) map.fitBounds(pts, { padding: [40, 40], maxZoom: 12 });
  }, [key, map]);
  return null;
}

/**
 * boats: [{ id, name, lat, lng, heading, state: sea|port|alert|maintenance, lines: [string] }]
 * path:  [[lat,lng], ...] (optional)
 */
export default function FleetMap({ boats = [], path = [], className = "" }) {
  const placed = boats.filter((b) => b.lat != null && b.lng != null);
  const fit = [...placed.map((b) => [b.lat, b.lng]), ...(path.length ? [path[0]] : [])];
  return (
    <MapContainer center={SRI_LANKA} zoom={7} scrollWheelZoom={false} className={`h-full w-full ${className}`} style={{ zIndex: 0 }}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {path.length > 1 && <Polyline positions={path} pathOptions={{ color: "#0284c7", weight: 4, opacity: 0.8 }} />}
      {placed.map((b) => (
        <Marker key={b.id} position={[b.lat, b.lng]} icon={boatIcon(COLORS[b.state] || COLORS.port, b.heading)}>
          <Popup>
            <strong>{b.name}</strong>
            {b.lines?.filter(Boolean).map((l) => (
              <div key={l} style={{ fontSize: 12 }}>{l}</div>
            ))}
          </Popup>
        </Marker>
      ))}
      <FitTo points={fit} />
    </MapContainer>
  );
}
