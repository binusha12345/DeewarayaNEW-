
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import OwnerSidebar from "../../../components/OwnerSidebar";
import DashboardNav from "../../../components/DashboardNav";
import DashboardPageHeader from "../../../components/DashboardPageHeader";
import { Wallet } from "lucide-react";
import api from "../../../services/api";
import cfhcLogo from '../../../assets/cfhc.png';
import {
  FaCalculator,
  FaChartBar,
  FaCalendarAlt,
  FaFileInvoiceDollar,
} from "react-icons/fa";

const MarketPricesWidget = () => {
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMarketData = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/market-prices");
      if (!data.success || !data.data) throw new Error(data.message || "Market prices are unavailable");
      setMarketData(data.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "Could not load market prices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketData();
  }, []);

  if (loading) {
    return <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading Sri Lanka market prices...</section>;
  }

  if (!marketData) {
    return (
      <section className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6" role="alert">
        <h2 className="text-lg font-bold text-slate-900">Market prices unavailable</h2>
        <p className="mt-2 text-sm text-slate-700">{error || "The server has not generated market price data yet."}</p>
        <button onClick={loadMarketData} className="mt-4 rounded-md bg-cyan-900 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800">Try again</button>
      </section>
    );
  }

  const fuel = marketData.fuel || {};
  const fish = Array.isArray(marketData.fish) ? marketData.fish : [];
  const hasLiveFishData = marketData.fish_source?.toLowerCase().includes("live");

  return (
    <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-cyan-800">Sri Lanka</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Market price reference</h2>
        </div>
        <p className="text-xs text-slate-500">Updated: {marketData.last_updated || "Not available"}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-slate-50 p-4">
          <h3 className="mb-3 font-bold text-slate-800">Fuel prices <span className="font-normal text-slate-500">(LKR / liter)</span></h3>
          <ul className="divide-y divide-slate-200">
            {[
              ["Auto Diesel", "auto_diesel", fuel.auto_diesel],
              ["Super Diesel", "super_diesel", fuel.super_diesel],
              ["Kerosene Oil", "kerosene", fuel.kerosene],
            ].map(([label, key, price]) => (
              <li key={label} className="flex justify-between gap-3 py-2 text-sm">
                <span>
                  <span className="block text-slate-600">{label}</span>
                  {marketData.fuel_effective_from?.[key] && <span className="mt-0.5 block text-xs text-slate-500">Effective {marketData.fuel_effective_from[key]}</span>}
                </span>
                <strong className="shrink-0 text-slate-900">{price == null ? "--" : `Rs. ${Number(price).toLocaleString()}`}</strong>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg bg-slate-50 p-4">
          <h3 className="mb-3 font-bold text-slate-800">Fish prices <span className="font-normal text-slate-500">(LKR / kg)</span></h3>
          {fish.length ? (
            <ul className="divide-y divide-slate-200">
              {fish.map((item, index) => (
                <li key={`${item.name}-${index}`} className="flex justify-between gap-3 py-2 text-sm">
                  <span className="text-slate-600">{item.name}</span>
                  <strong className="shrink-0 text-slate-900">{item.price == null ? "--" : `Rs. ${Number(item.price).toLocaleString()}`}</strong>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-500">No fish prices available.</p>}
        </div>
      </div>
      <div className="mt-5 border-t border-slate-200 pt-4">
        <p className="mb-3 text-xs font-bold uppercase text-slate-500">Price data sources</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <a
            href={marketData.fuel_source || "https://ceypetco.gov.lk/marketing-sales/"}
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50"
          >
            <img
              src="https://ceypetco.gov.lk/wp-content/uploads/2024/02/Ceylon_Petroleum_Corporation_logo.png"
              alt=""
              className="h-12 w-20 shrink-0 object-contain"
              loading="lazy"
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-800">Ceylon Petroleum Corporation</span>
              <span className="mt-0.5 block text-xs text-slate-500">Official fuel prices · Open source</span>
            </span>
          </a>
          <a
            src="src/assets/cfhc.png"
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50"
          >
            <img
              src={cfhcLogo}
              alt=""
              className="h-12 w-20 shrink-0 object-contain"
              loading="lazy"
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-800">Ceylon Fishery Harbours Corporation</span>
              <span className="mt-0.5 block text-xs text-slate-500">
                {hasLiveFishData ? "Live fish-price feed · Open source" : "Fish prices are estimates · View official site"}
              </span>
            </span>
          </a>
        </div>
        <p className="mt-3 text-xs text-slate-500">Updated: {marketData.last_updated || "Not available"}</p>
      </div>
    </section>
  );
};

const Finance = () => {
  return (
    <div data-tour="finance-page" className="flex h-screen overflow-hidden bg-slate-100 font-sans text-slate-800">
      <OwnerSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardNav />
        <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl p-6">
          <DashboardPageHeader
            eyebrow="Fleet performance"
            title="Finance Management"
            description="Track daily income, expenses, and your monthly performance."
            icon={Wallet}
            theme="green"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Daily Calculation */}
            <Link
              to="/owner/finance/daily"
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl 
                         transition-all duration-300 p-8 border-l-4 border-blue-500
                         hover:scale-[1.02]"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center 
                                justify-center group-hover:bg-blue-500 transition-colors">
                  <FaCalculator className="text-2xl text-blue-500 
                                           group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Daily Calculation
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Record daily fish catch & expenses
                  </p>
                </div>
              </div>
              <ul className="text-gray-600 text-sm space-y-1 ml-2">
                <li>• Enter fish name, quantity & price</li>
                <li>• Track fuel, salary, ice & other expenses</li>
                <li>• Calculate daily net profit</li>
                <li>• View quick summary & chart</li>
              </ul>
            </Link>

            {/* Monthly Reports */}
            <Link
              to="/owner/finance/monthly"
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl 
                         transition-all duration-300 p-8 border-l-4 border-green-500
                         hover:scale-[1.02]"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center 
                                justify-center group-hover:bg-green-500 transition-colors">
                  <FaChartBar className="text-2xl text-green-500 
                                         group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Monthly Reports
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Analyze monthly performance & trends
                  </p>
                </div>
              </div>
              <ul className="text-gray-600 text-sm space-y-1 ml-2">
                <li>• Monthly income & expense summary</li>
                <li>• Compare months side by side</li>
                <li>• Performance charts & analytics</li>
                <li>• Send PDF report to email</li>
              </ul>
            </Link>
          </div>
          <MarketPricesWidget />
        </div>
        </main>
      </div>
    </div>
  );
};

export default Finance;