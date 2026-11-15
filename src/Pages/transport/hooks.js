// Non-component helpers for the transport dashboard (kept apart from components for fast refresh).
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export const cx = (...c) => c.filter(Boolean).join(" ");

// Enums + live socket shared by all dashboard pages (provided by TransportApp).
export const TransportContext = createContext({ meta: null, socket: null, setUnread: () => {} });
export const useTransport = () => useContext(TransportContext);

export const useAsync = (fn, deps = []) => {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });
  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const r = await fnRef.current();
      setState({ data: r, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error });
    }
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { run(); }, deps);
  return { ...state, reload: run };
};

// Server-side paginated list. fetcher(params) must return { data, pagination }.
export const useServerList = (fetcher, { initial = {}, defaultSort = "-createdAt" } = {}) => {
  const [params, setParams] = useState({ page: 1, limit: 15, sort: defaultSort, ...initial });
  const [state, setState] = useState({ rows: [], pagination: null, loading: true, error: null });
  const fetchRef = useRef(fetcher);
  useEffect(() => {
    fetchRef.current = fetcher;
  });
  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v != null));
      const r = await fetchRef.current(clean);
      setState({ rows: r.data || [], pagination: r.pagination, loading: false, error: null });
    } catch (error) {
      setState((s) => ({ ...s, loading: false, error }));
    }
  }, [params]);
  useEffect(() => { load(); }, [load]);
  const set = (patch) => setParams((p) => ({ ...p, page: 1, ...patch }));
  return { ...state, params, set, setPage: (page) => setParams((p) => ({ ...p, page })), reload: load };
};
