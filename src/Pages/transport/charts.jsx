// Chart helpers (Recharts). Palette validated for CVD separation in light and dark mode
// (slots 1-3 of the reference categorical palette). Every chart has a legend for >=2 series
// and a table view, since the light-mode third slot is below 3:1 contrast.
import { useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useThemeContext } from "../../context/ThemeContext";
import { Card, EmptyState, Tabs } from "./ui";

const PALETTE = {
  light: ["#2a78d6", "#eb6834", "#1baf7a"],
  dark: ["#3987e5", "#d95926", "#199e70"],
};

const useChartTheme = () => {
  const { mode } = useThemeContext();
  const dark = mode === "dark";
  return {
    series: dark ? PALETTE.dark : PALETTE.light,
    grid: dark ? "#1e293b" : "#eef2f6",
    axis: dark ? "#94a3b8" : "#64748b",
    tooltip: {
      contentStyle: { background: dark ? "#0f172a" : "#ffffff", border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`, borderRadius: 12, fontSize: 12 },
      labelStyle: { color: dark ? "#f1f5f9" : "#102A43", fontWeight: 600 },
      itemStyle: { color: dark ? "#cbd5e1" : "#334155" },
    },
  };
};

const fmt = (v) => (typeof v === "number" ? v.toLocaleString(undefined, { maximumFractionDigits: 2 }) : v);

/**
 * series: [{ key, label }]  (max 3 — fold anything beyond into another chart)
 * type: "bar" | "line" | "hbar"
 */
export const ChartCard = ({ title, data = [], xKey, series, type = "bar", valueFormatter = fmt, height = 260, stacked = false }) => {
  const theme = useChartTheme();
  const [view, setView] = useState("chart");
  const many = series.length > 1;
  const axisProps = { stroke: theme.axis, tick: { fontSize: 11, fill: theme.axis }, tickLine: false, axisLine: false };

  const body = !data.length ? (
    <EmptyState title="No data for this period" />
  ) : view === "table" ? (
    <div className="max-h-[300px] overflow-auto">
      <table className="min-w-full text-sm">
        <thead><tr className="text-left text-xs text-slate-500"><th className="py-2 pr-4">{xKey}</th>{series.map((s) => <th key={s.key} className="py-2 pr-4">{s.label}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {data.map((r, i) => (
            <tr key={i} className="text-slate-700 dark:text-slate-200"><td className="py-1.5 pr-4">{r[xKey]}</td>{series.map((s) => <td key={s.key} className="py-1.5 pr-4 tabular-nums">{valueFormatter(r[s.key] ?? 0)}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <ResponsiveContainer width="100%" height={height}>
      {type === "line" ? (
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={theme.grid} vertical={false} />
          <XAxis dataKey={xKey} {...axisProps} />
          <YAxis {...axisProps} tickFormatter={valueFormatter} width={70} />
          <Tooltip {...theme.tooltip} formatter={valueFormatter} cursor={{ stroke: theme.axis, strokeDasharray: "3 3" }} />
          {many && <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />}
          {series.map((s, i) => <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={theme.series[i]} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: "transparent" }} activeDot={{ r: 5 }} />)}
        </LineChart>
      ) : (
        <BarChart data={data} layout={type === "hbar" ? "vertical" : "horizontal"} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} barGap={2} barCategoryGap="30%">
          <CartesianGrid stroke={theme.grid} vertical={type === "hbar"} horizontal={type !== "hbar"} />
          {type === "hbar" ? (
            <>
              <XAxis type="number" {...axisProps} tickFormatter={valueFormatter} />
              <YAxis type="category" dataKey={xKey} {...axisProps} width={110} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} {...axisProps} />
              <YAxis {...axisProps} tickFormatter={valueFormatter} width={70} />
            </>
          )}
          <Tooltip {...theme.tooltip} formatter={valueFormatter} cursor={{ fill: theme.grid }} />
          {many && <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />}
          {series.map((s, i) => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={theme.series[i]} stackId={stacked ? "s" : undefined}
              radius={stacked && i < series.length - 1 ? 0 : type === "hbar" ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={36} />
          ))}
        </BarChart>
      )}
    </ResponsiveContainer>
  );

  return (
    <Card title={title} action={<Tabs value={view} onChange={setView} tabs={[{ value: "chart", label: "Chart" }, { value: "table", label: "Table" }]} />}>
      {body}
    </Card>
  );
};
