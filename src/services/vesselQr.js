const DEFAULT_PUBLIC_ORIGIN = "https://dry-hyphen-grinning.ngrok-free.dev";

export function getPublicVesselUrl(boatId) {
  const configuredOrigin = import.meta.env.VITE_PUBLIC_APP_URL?.trim();
  const currentOrigin = window.location.origin;
  const publicOrigin = configuredOrigin
    || (currentOrigin.includes("ngrok") ? currentOrigin : DEFAULT_PUBLIC_ORIGIN);

  return `${publicOrigin.replace(/\/+$/, "")}/vessel/${encodeURIComponent(boatId)}`;
}
