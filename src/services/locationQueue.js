import api from "./api";

const DATABASE_NAME = "deewaraya-tracking";
const STORE_NAME = "pending-locations";

const getCurrentUserId = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null")?._id || null;
  } catch {
    return null;
  }
};

const openDatabase = () => new Promise((resolve, reject) => {
  const request = indexedDB.open(DATABASE_NAME, 1);
  request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

export const queueLocation = async (location) => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("Sign in before saving GPS locations offline");
  const database = await openDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).add({ ...location, userId, queuedAt: new Date().toISOString() });
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
};

export const flushLocationQueue = async () => {
  if (!navigator.onLine) return 0;
  const userId = getCurrentUserId();
  if (!userId) return 0;
  const database = await openDatabase();
  const locations = await new Promise((resolve, reject) => {
    const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  let synced = 0;
  for (const location of locations) {
    if (location.userId !== userId) continue;
    const id = location.id;
    const payload = { ...location };
    delete payload.id;
    delete payload.queuedAt;
    delete payload.userId;
    try {
      await api.post("/tracking/update", payload);
      await new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, "readwrite");
        transaction.objectStore(STORE_NAME).delete(id);
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
      });
      synced += 1;
    } catch {
      break;
    }
  }
  database.close();
  return synced;
};