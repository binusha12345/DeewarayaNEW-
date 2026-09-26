// client/src/Pages/Public/owner/DailyCalculation.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import OwnerSidebar from "../../../components/OwnerSidebar";
import DashboardNav from "../../../components/DashboardNav";
import SuccessNotice from "../../../components/SuccessNotice";
import {
  FaPlus,
  FaTrash,
  FaSave,
  FaFish,
  FaGasPump,
  FaArrowLeft,
  FaHistory,
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const EXPENSE_CATEGORIES = [
  { value: "fuel", label: "⛽ Fuel", icon: "⛽" },
  { value: "driver_salary", label: "👨‍✈️ Driver Salary", icon: "👨‍✈️" },
  { value: "ice", label: "🧊 Ice", icon: "🧊" },
  { value: "repair_maintenance", label: "🔧 Repair & Maintenance", icon: "🔧" },
  { value: "equipment", label: "🎣 Equipment", icon: "🎣" },
  { value: "other", label: "📦 Other", icon: "📦" },
];

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

const DailyCalculation = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dailySaveSuccess, setDailySaveSuccess] = useState(false);

  const [fishEntries, setFishEntries] = useState([
    { fishName: "", quantity: "", pricePerUnit: "", unit: "kg" },
  ]);

  const [expenses, setExpenses] = useState([
    { category: "fuel", description: "", amount: "", fuelLiters: "" },
  ]);

  const [pastEntries, setPastEntries] = useState([]);

  useEffect(() => {
    fetchPastEntries();
  }, []);

  const fetchPastEntries = async () => {
    try {
      const res = await api.get("/finance/daily?limit=7");
      setPastEntries(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch entries", err);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) {
      return;
    }

    try {
      await api.delete(`/finance/daily/${entryId}`);
      await fetchPastEntries();
      alert("✅ Entry deleted successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete entry");
    }
  };

  const addFishEntry = () => {
    setFishEntries([
      ...fishEntries,
      { fishName: "", quantity: "", pricePerUnit: "", unit: "kg" },
    ]);
  };

  const removeFishEntry = (index) => {
    if (fishEntries.length > 1) {
      setFishEntries(fishEntries.filter((_, i) => i !== index));
    }
  };

  const updateFishEntry = (index, field, value) => {
    const updated = [...fishEntries];
    updated[index][field] = value;
    setFishEntries(updated);
  };

  const addExpense = () => {
    setExpenses([
      ...expenses,
      { category: "other", description: "", amount: "", fuelLiters: "" },
    ]);
  };

  const removeExpense = (index) => {
    if (expenses.length > 1) {
      setExpenses(expenses.filter((_, i) => i !== index));
    }
  };

  const updateExpense = (index, field, value) => {
    const updated = [...expenses];
    updated[index][field] = value;
    setExpenses(updated);
  };

  const totalFishQuantity = fishEntries.reduce(
    (sum, f) => sum + (parseFloat(f.quantity) || 0),
    0
  );

  const totalIncome = fishEntries.reduce(
    (sum, f) =>
      sum + (parseFloat(f.quantity) || 0) * (parseFloat(f.pricePerUnit) || 0),
    0
  );

  const totalExpenses = expenses.reduce(
    (sum, e) => sum + (parseFloat(e.amount) || 0),
    0
  );

  const netProfit = totalIncome - totalExpenses;

  const handleSave = async () => {
    const validFish = fishEntries.filter(
      (f) => f.fishName && f.quantity && f.pricePerUnit
    );
    const validExpenses = expenses.filter((e) => e.amount);

    if (validFish.length === 0) {
      alert("Please add at least one fish entry");
      return;
    }

    setSaving(true);
    try {
      await api.post("/finance/daily", {
        date,
        fishEntries: validFish.map((f) => ({
          fishName: f.fishName,
          quantity: parseFloat(f.quantity),
          pricePerUnit: parseFloat(f.pricePerUnit),
          unit: f.unit,
        })),
        expenses: validExpenses.map((e) => ({
          category: e.category,
          description: e.description,
          amount: parseFloat(e.amount),
          fuelLiters:
            e.category === "fuel" ? parseFloat(e.fuelLiters) || 0 : undefined,
        })),
      });

      setSaved(true);
      setDailySaveSuccess(true);

      // Refresh past entries so new one shows
      await fetchPastEntries();

      // Reset form for next entry
      setFishEntries([
        { fishName: "", quantity: "", pricePerUnit: "", unit: "kg" },
      ]);
      setExpenses([
        { category: "fuel", description: "", amount: "", fuelLiters: "" },
      ]);

      setTimeout(() => setSaved(false), 3000);
      setTimeout(() => setDailySaveSuccess(false), 3000);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save entry");
    } finally {
      setSaving(false);
    }
  };

  const incomeChartData = fishEntries
    .filter((f) => f.fishName && f.quantity && f.pricePerUnit)
    .map((f) => ({
      name: f.fishName,
      income:
        (parseFloat(f.quantity) || 0) * (parseFloat(f.pricePerUnit) || 0),
      quantity: parseFloat(f.quantity) || 0,
    }));

  const expenseChartData = EXPENSE_CATEGORIES.map((cat) => ({
    name: cat.label.replace(/^[^\w]+ /, ""),
    value: expenses
      .filter((e) => e.category === cat.value)
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0),
  })).filter((d) => d.value > 0);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <OwnerSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardNav />

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => navigate("/owner/finance")}
                className="p-2 bg-white rounded-lg shadow hover:bg-gray-100"
              >
                <FaArrowLeft />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                  📝 Daily Calculation
                </h1>
                <p className="text-gray-500 text-sm">
                  Record your daily fish catch and expenses
                </p>
              </div>
            </div>

            {/* ===== PAST ENTRIES SECTION ===== */}
            {pastEntries.length > 0 && (
              <div className="bg-white rounded-xl shadow p-6 mb-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FaHistory className="text-blue-500" />
                  Recent Daily Entries (Last 7 Days)
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">
                          Date
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">
                          Fish
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-700">
                          Qty
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-green-700">
                          Income
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-red-700">
                          Expenses
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-blue-700">
                          Profit
                        </th>
                        <th className="px-4 py-2 text-center font-semibold text-gray-700">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastEntries.map((entry, index) => (
                        <tr
                          key={entry._id || index}
                          className="border-t hover:bg-blue-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium">
                              {new Date(entry.date).toLocaleDateString("en-US", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(entry.date).toLocaleDateString("en-US", {
                                weekday: "short",
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {entry.fishEntries.slice(0, 2).map((f, i) => (
                                <span
                                  key={i}
                                  className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full"
                                  title={`${f.quantity} ${f.unit} @ Rs. ${f.pricePerUnit}`}
                                >
                                  {f.fishName}
                                </span>
                              ))}
                              {entry.fishEntries.length > 2 && (
                                <span className="text-xs text-gray-500">
                                  +{entry.fishEntries.length - 2} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-700">
                            {entry.totalFishQuantity || 0} kg
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-green-600">
                            Rs. {(entry.totalIncome || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-red-600">
                            Rs. {(entry.totalExpenses || 0).toLocaleString()}
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-bold ${
                              (entry.netProfit || 0) >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            Rs. {(entry.netProfit || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleDeleteEntry(entry._id)}
                              className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                              title="Delete entry"
                            >
                              <FaTrash size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Date Picker */}
            <div className="bg-white rounded-xl shadow p-4 mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📅 Select Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg 
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ===== INCOME SECTION ===== */}
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-green-700 flex items-center gap-2">
                    <FaFish /> Fish Income
                  </h2>
                  <button
                    onClick={addFishEntry}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-100 
                               text-green-700 rounded-lg hover:bg-green-200 text-sm"
                  >
                    <FaPlus /> Add Fish
                  </button>
                </div>

                {fishEntries.map((fish, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 mb-3 
                               bg-gray-50 hover:bg-green-50 transition-colors"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-gray-600">
                        Fish #{index + 1}
                      </span>
                      {fishEntries.length > 1 && (
                        <button
                          onClick={() => removeFishEntry(index)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <FaTrash size={14} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Fish Name"
                        value={fish.fishName}
                        onChange={(e) =>
                          updateFishEntry(index, "fishName", e.target.value)
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg 
                                   focus:ring-2 focus:ring-green-500 text-sm"
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Qty"
                          value={fish.quantity}
                          onChange={(e) =>
                            updateFishEntry(index, "quantity", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg 
                                     focus:ring-2 focus:ring-green-500 text-sm"
                        />
                        <select
                          value={fish.unit}
                          onChange={(e) =>
                            updateFishEntry(index, "unit", e.target.value)
                          }
                          className="px-2 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="kg">kg</option>
                          <option value="pieces">pcs</option>
                        </select>
                      </div>
                      <input
                        type="number"
                        placeholder="Price per unit (Rs.)"
                        value={fish.pricePerUnit}
                        onChange={(e) =>
                          updateFishEntry(index, "pricePerUnit", e.target.value)
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg 
                                   focus:ring-2 focus:ring-green-500 text-sm"
                      />
                    </div>

                    {fish.quantity && fish.pricePerUnit && (
                      <div className="mt-2 text-right text-sm font-semibold text-green-600">
                        Subtotal: Rs.{" "}
                        {(
                          (parseFloat(fish.quantity) || 0) *
                          (parseFloat(fish.pricePerUnit) || 0)
                        ).toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}

                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Fish Quantity:</span>
                    <span className="font-bold">
                      {totalFishQuantity.toLocaleString()} kg
                    </span>
                  </div>
                  <div className="flex justify-between text-lg mt-1">
                    <span className="font-semibold text-green-700">
                      Total Income:
                    </span>
                    <span className="font-bold text-green-700">
                      Rs. {totalIncome.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* ===== EXPENSES SECTION ===== */}
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-red-700 flex items-center gap-2">
                    📉 Expenses
                  </h2>
                  <button
                    onClick={addExpense}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-100 
                               text-red-700 rounded-lg hover:bg-red-200 text-sm"
                  >
                    <FaPlus /> Add Expense
                  </button>
                </div>

                {expenses.map((exp, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 mb-3 
                               bg-gray-50 hover:bg-red-50 transition-colors"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-gray-600">
                        Expense #{index + 1}
                      </span>
                      {expenses.length > 1 && (
                        <button
                          onClick={() => removeExpense(index)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <FaTrash size={14} />
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <select
                        value={exp.category}
                        onChange={(e) =>
                          updateExpense(index, "category", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg 
                                   focus:ring-2 focus:ring-red-500 text-sm"
                      >
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>

                      {exp.category === "fuel" && (
                        <div className="flex items-center gap-2">
                          <FaGasPump className="text-orange-500" />
                          <input
                            type="number"
                            placeholder="Liters"
                            value={exp.fuelLiters}
                            onChange={(e) =>
                              updateExpense(index, "fuelLiters", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-orange-300 
                                       rounded-lg focus:ring-2 focus:ring-orange-500 
                                       text-sm bg-orange-50"
                          />
                          <span className="text-sm text-gray-500">L</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Description (optional)"
                          value={exp.description}
                          onChange={(e) =>
                            updateExpense(index, "description", e.target.value)
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg 
                                     focus:ring-2 focus:ring-red-500 text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Amount (Rs.)"
                          value={exp.amount}
                          onChange={(e) =>
                            updateExpense(index, "amount", e.target.value)
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg 
                                     focus:ring-2 focus:ring-red-500 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold text-red-700">
                      Total Expenses:
                    </span>
                    <span className="font-bold text-red-700">
                      Rs. {totalExpenses.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== NET PROFIT SECTION ===== */}
            <div
              className={`mt-6 p-6 rounded-xl shadow-lg text-center ${
                netProfit >= 0
                  ? "bg-gradient-to-r from-green-500 to-emerald-600"
                  : "bg-gradient-to-r from-red-500 to-rose-600"
              }`}
            >
              <h2 className="text-white text-lg mb-2">Daily Net Profit</h2>
              <p className="text-4xl font-bold text-white">
                Rs. {netProfit.toLocaleString()}
              </p>
              <div className="flex justify-center gap-8 mt-3 text-white/80 text-sm">
                <span>Income: Rs. {totalIncome.toLocaleString()}</span>
                <span>|</span>
                <span>Expenses: Rs. {totalExpenses.toLocaleString()}</span>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleSave}
                disabled={loading}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl text-white 
                           font-semibold text-lg shadow-lg transition-all ${
                             saved
                               ? "bg-green-500"
                               : "bg-blue-600 hover:bg-blue-700 hover:scale-105"
                           }`}
              >
                <FaSave />
                {loading
                  ? "Saving..."
                  : saved
                  ? "✅ Saved!"
                  : "Save Daily Entry"}
              </button>
            </div>

            {/* ===== QUICK SUMMARY & CHARTS ===== */}
            {(incomeChartData.length > 0 || expenseChartData.length > 0) && (
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {incomeChartData.length > 0 && (
                  <div className="bg-white rounded-xl shadow p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                      📊 Fish Income Breakdown
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={incomeChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => `Rs. ${value.toLocaleString()}`}
                        />
                        <Bar
                          dataKey="income"
                          fill="#10b981"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {expenseChartData.length > 0 && (
                  <div className="bg-white rounded-xl shadow p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                      🥧 Expense Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={expenseChartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          dataKey="value"
                        >
                          {expenseChartData.map((_, index) => (
                            <Cell
                              key={index}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => `Rs. ${value.toLocaleString()}`}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* ===== RECOMMENDATIONS ===== */}
            <div className="mt-8 bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                💡 Quick Recommendations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {netProfit < 0 && (
                  <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                    <p className="font-semibold text-red-700">⚠️ Loss Alert</p>
                    <p className="text-sm text-red-600">
                      Today's expenses exceed income. Review your costs and
                      consider adjusting fish prices.
                    </p>
                  </div>
                )}

                {totalExpenses > 0 &&
                  expenses.some(
                    (e) =>
                      e.category === "fuel" &&
                      parseFloat(e.amount) > totalExpenses * 0.4
                  ) && (
                    <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                      <p className="font-semibold text-orange-700">
                        ⛽ High Fuel Cost
                      </p>
                      <p className="text-sm text-orange-600">
                        Fuel is over 40% of expenses. Optimize routes and check
                        engine efficiency.
                      </p>
                    </div>
                  )}

                {netProfit > 0 && (
                  <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                    <p className="font-semibold text-green-700">
                      ✅ Profitable Day
                    </p>
                    <p className="text-sm text-green-600">
                      Great job! Consider saving Rs.{" "}
                      {Math.round(netProfit * 0.2).toLocaleString()} (20%) for
                      emergencies.
                    </p>
                  </div>
                )}

                <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <p className="font-semibold text-blue-700">
                    📈 Track Consistently
                  </p>
                  <p className="text-sm text-blue-600">
                    Record daily to get accurate monthly reports and identify
                    profitable patterns.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
        {dailySaveSuccess && (
          <SuccessNotice
            type="daily"
            label="Save complete"
            title="Daily entry saved successfully"
            message="Your fish catch and expense details have been added to the finance records."
            onClose={() => setDailySaveSuccess(false)}
          />
        )}
      </div>
    </div>
  );
};

export default DailyCalculation;