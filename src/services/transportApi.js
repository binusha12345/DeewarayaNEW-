// Transport module API client. Reuses the existing axios instance (token + ngrok headers).
import api from "./api";

const T = "/transport";
const data = (p) => p.then((r) => r.data);

export const errorMessage = (err, fallback = "Something went wrong") => {
  const d = err?.response?.data;
  if (d?.details?.errors?.length) return d.details.errors.join(" • ");
  return d?.message || err?.message || fallback;
};

// Random key per user action, so a double-click or retry can't create duplicates.
export const newIdempotencyKey = () =>
  (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

const withKey = (key) => ({ headers: { "Idempotency-Key": key || newIdempotencyKey() } });

const t = {
  get: (url, params) => data(api.get(T + url, { params })),
  post: (url, body, config) => data(api.post(T + url, body, config)),
  put: (url, body) => data(api.put(T + url, body)),
  patch: (url, body) => data(api.patch(T + url, body)),
};

export const transportApi = {
  meta: () => t.get("/meta/enums"),
  // dashboard
  overview: () => t.get("/dashboard/overview"),
  charts: (months = 6) => t.get("/dashboard/charts", { months }),
  // catalog
  harbours: () => t.get("/harbours"),
  createHarbour: (b) => t.post("/harbours", b),
  updateHarbour: (id, b) => t.put(`/harbours/${id}`, b),
  fishTypes: (all = true) => t.get("/fish-types", { all }),
  createFishType: (b) => t.post("/fish-types", b),
  updateFishType: (id, b) => t.put(`/fish-types/${id}`, b),
  syncFishTypes: () => t.post("/fish-types/sync"),
  inventory: (params) => t.get("/inventory", params),
  availability: (params) => t.get("/inventory/availability", params),
  addInventory: (b) => t.post("/inventory", b),
  adjustInventory: (id, b) => t.patch(`/inventory/${id}`, b),
  // orders
  orders: (params) => t.get("/orders", params),
  order: (id) => t.get(`/orders/${id}`),
  updateOrder: (id, b) => t.patch(`/orders/${id}`, b),
  approveOrder: (id, b) => t.post(`/orders/${id}/approve`, b),
  rejectOrder: (id, reason) => t.post(`/orders/${id}/reject`, { reason }),
  setOrderStatus: (id, status, note) => t.post(`/orders/${id}/status`, { status, note }),
  cancelOrder: (id, reason) => t.post(`/orders/${id}/cancel`, { reason }),
  recommendations: (orderId, params) => t.get(`/orders/${orderId}/recommendations`, params),
  // fleet & people
  trucks: (params) => t.get("/trucks", params),
  truck: (id) => t.get(`/trucks/${id}`),
  createTruck: (b) => t.post("/trucks", b),
  updateTruck: (id, b) => t.put(`/trucks/${id}`, b),
  addMaintenance: (id, b) => t.post(`/trucks/${id}/maintenance`, b),
  addFuel: (id, b) => t.post(`/trucks/${id}/fuel`, b),
  drivers: (params) => t.get("/drivers", params),
  driver: (userId) => t.get(`/drivers/${userId}`),
  createDriver: (b) => t.post("/drivers", b),
  updateDriver: (userId, b) => t.put(`/drivers/${userId}`, b),
  buyers: () => t.get("/buyers"),
  // deliveries
  assign: (b, key) => t.post("/deliveries", b, withKey(key)),
  deliveries: (params) => t.get("/deliveries", params),
  delivery: (id) => t.get(`/deliveries/${id}`),
  updateAssignment: (id, b) => t.patch(`/deliveries/${id}`, b),
  cancelDelivery: (id, reason) => t.post(`/deliveries/${id}/cancel`, { reason }),
  track: (id) => t.get(`/deliveries/${id}/track`),
  verifyLoading: (id, b) => t.post(`/deliveries/${id}/loading/verify`, b),
  reportEvent: (id, b) => t.post(`/deliveries/${id}/events`, b),
  // damage
  damageReports: (params) => t.get("/damage-reports", params),
  assessment: (id) => t.get(`/deliveries/${id}/assessment`),
  approveAssessment: (id, b) => t.post(`/deliveries/${id}/assessment/approve`, b),
  setResponsibility: (id, b) => t.put(`/deliveries/${id}/assessment/responsibility`, b),
  // finance
  addExpense: (id, b, key) => t.post(`/deliveries/${id}/expenses`, b, withKey(key)),
  expenses: (params) => t.get("/expenses", params),
  reviewExpense: (expenseId, b) => t.post(`/expenses/${expenseId}/review`, b),
  costs: (id) => t.get(`/deliveries/${id}/costs`),
  losses: (params) => t.get("/losses", params),
  loss: (id) => t.get(`/deliveries/${id}/loss`),
  updateLoss: (id, b) => t.put(`/deliveries/${id}/loss`, b),
  finalizeLoss: (id) => t.post(`/deliveries/${id}/loss/finalize`),
  // returns
  returns: (params) => t.get("/returns", params),
  returnById: (id) => t.get(`/returns/${id}`),
  createReturn: (b, key) => t.post("/returns", b, withKey(key)),
  decideReturn: (id, b) => t.post(`/returns/${id}/decide`, b),
  approveReturn: (id, note) => t.post(`/returns/${id}/approve`, { note }),
  rejectReturn: (id, reason) => t.post(`/returns/${id}/reject`, { reason }),
  assignReturn: (id, b) => t.post(`/returns/${id}/assign`, b),
  returnStatus: (id, status, note) => t.post(`/returns/${id}/status`, { status, note }),
  completeReturn: (id, b) => t.post(`/returns/${id}/complete`, b),
  // invoices
  invoices: (params) => t.get("/invoices", params),
  invoice: (id) => t.get(`/invoices/${id}`),
  adjustInvoice: (id, b) => t.post(`/invoices/${id}/adjustments`, b),
  recordPayment: (id, b, key) => t.post(`/invoices/${id}/payments`, b, withKey(key)),
  payments: (params) => t.get("/payments", params),
  // system
  notifications: (params) => t.get("/notifications", params),
  markRead: (id) => t.post(`/notifications/${id}/read`),
  markAllRead: () => t.post("/notifications/read-all"),
  auditLogs: (params) => t.get("/audit-logs", params),
  settings: () => t.get("/settings"),
  updateSettings: (b) => t.put("/settings", b),
};

export const money = (n) =>
  n == null || Number.isNaN(Number(n)) ? "—" : `LKR ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const kg = (n) => (n == null ? "—" : `${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })} kg`);
export const pct = (n) => (n == null ? "—" : `${Number(n).toFixed(2)}%`);
export const dt = (d) => (d ? new Date(d).toLocaleString() : "—");
export const dOnly = (d) => (d ? new Date(d).toLocaleDateString() : "—");
// <input type="datetime-local"> value in local time
export const toLocalInput = (d) => {
  if (!d) return "";
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 16);
};

export default transportApi;
