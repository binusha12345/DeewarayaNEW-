import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import OwnerSidebar from "../../../components/OwnerSidebar";
import DashboardNav from "../../../components/DashboardNav";
import DashboardPageHeader from "../../../components/DashboardPageHeader";
import { Wallet } from "lucide-react";
import api from "../../../services/api";
import cfhcLogo from '../../../assets/cfhc.png';
import cepetcoLogo from '../../../assets/images.jpeg';
import {
  FaCalculator,
  FaChartBar,
  FaCalendarAlt,
  FaFileInvoiceDollar,
} from "react-icons/fa";

const MarketPricesWidget = () => {
  const { t } = useTranslation();
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMarketData = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/market-prices");
      if (!data.success || !data.data) throw new Error(data.message || t('finance.marketPrices.unavailable'));
      setMarketData(data.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || t('finance.marketPrices.unavailable'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketData();
  }, []);

  if (loading) {
    return <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">{t('finance.marketPrices.loading')}</section>;
  }

  if (!marketData) {
    return (
      <section className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6" role="alert">
        <h2 className="text-lg font-bold text-slate-900">{t('finance.marketPrices.unavailable')}</h2>
        <p className="mt-2 text-sm text-slate-700">{error || t('finance.marketPrices.notGenerated')}</p>
        <button onClick={loadMarketData} className="mt-4 rounded-md bg-cyan-900 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800">{t('finance.marketPrices.tryAgain')}</button>
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
          <p className="text-xs font-bold uppercase text-cyan-800">{t('finance.marketPrices.sriLanka')}</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">{t('finance.marketPrices.marketPriceReference')}</h2>
        </div>
        <p className="text-xs text-slate-500">{t('finance.marketPrices.updated', { value: marketData.last_updated || t('finance.marketPrices.notAvailable') })}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-slate-50 p-4">
          <h3 className="mb-3 font-bold text-slate-800">{t('finance.marketPrices.fuelPrices')} <span className="font-normal text-slate-500">{t('finance.marketPrices.lkrPerLiter')}</span></h3>
          <ul className="divide-y divide-slate-200">
            {[
              [t('finance.marketPrices.autoDiesel'), "auto_diesel", fuel.auto_diesel],
              [t('finance.marketPrices.superDiesel'), "super_diesel", fuel.super_diesel],
              [t('finance.marketPrices.keroseneOil'), "kerosene", fuel.kerosene],
            ].map(([label, key, price]) => (
              <li key={label} className="flex justify-between gap-3 py-2 text-sm">
                <span>
                  <span className="block text-slate-600">{label}</span>
                  {marketData.fuel_effective_from?.[key] && <span className="mt-0.5 block text-xs text-slate-500">{t('finance.marketPrices.effective', { value: marketData.fuel_effective_from[key] })}</span>}
                </span>
                <strong className="shrink-0 text-slate-900">{price == null ? "--" : `Rs. ${Number(price).toLocaleString()}`}</strong>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg bg-slate-50 p-4">
          <h3 className="mb-3 font-bold text-slate-800">{t('finance.marketPrices.fishPrices')} <span className="font-normal text-slate-500">{t('finance.marketPrices.lkrPerKg')}</span></h3>
          {fish.length ? (
            <ul className="divide-y divide-slate-200">
              {fish.map((item, index) => (
                <li key={`${item.name}-${index}`} className="flex justify-between gap-3 py-2 text-sm">
                  <span className="text-slate-600">{item.name}</span>
                  <strong className="shrink-0 text-slate-900">{item.price == null ? "--" : `Rs. ${Number(item.price).toLocaleString()}`}</strong>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-500">{t('finance.marketPrices.noFishPrices')}</p>}
        </div>
      </div>
      <div className="mt-5 border-t border-slate-200 pt-4">
        <p className="mb-3 text-xs font-bold uppercase text-slate-500">{t('finance.marketPrices.priceDataSources')}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <a
            href="https://ceypetco.gov.lk/"
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50"
          >
            <img
              src={cepetcoLogo}
              alt="cepetco"
              className="h-12 w-20 shrink-0 object-contain"
              loading="lazy"
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-800">{t('finance.marketPrices.ceylonPetroleum')}</span>
              <span className="mt-0.5 block text-xs text-slate-500">{t('finance.marketPrices.officialFuelPrices')}</span>
            </span>
          </a>
          <a
            href="https://cfc.gov.lk/"
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50"
          >
            <img
              src={cfhcLogo}
              alt="ceylon fishery harbor corporation"
              className="h-12 w-20 shrink-0 object-contain"
              loading="lazy"
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-800">{t('finance.marketPrices.cfhc')}</span>
              <span className="mt-0.5 block text-xs text-slate-500">
                {hasLiveFishData ? t('finance.marketPrices.liveFishFeed') : t('finance.marketPrices.fishEstimates')}
              </span>
            </span>
          </a>
        </div>
        <p className="mt-3 text-xs text-slate-500">{t('finance.marketPrices.updated', { value: marketData.last_updated || t('finance.marketPrices.notAvailable') })}</p>
      </div>
    </section>
  );
};

const Finance = () => {
  const { t } = useTranslation();
  return (
    <div data-tour="finance-page" className="flex h-screen overflow-hidden bg-slate-100 font-sans text-slate-800">
      <OwnerSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardNav />
        <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl p-6">
          <DashboardPageHeader
            eyebrow={t('finance.eyebrow')}
            title={t('finance.title')}
            description={t('finance.description')}
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
                    {t('finance.dailyCalculation')}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    {t('finance.dailyCalculationDesc')}
                  </p>
                </div>
              </div>
              <ul className="text-gray-600 text-sm space-y-1 ml-2">
                <li>{t('finance.dailyCalcPoints.0')}</li>
                <li>{t('finance.dailyCalcPoints.1')}</li>
                <li>{t('finance.dailyCalcPoints.2')}</li>
                <li>{t('finance.dailyCalcPoints.3')}</li>
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
                    {t('finance.monthlyReports')}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    {t('finance.monthlyReportsDesc')}
                  </p>
                </div>
              </div>
              <ul className="text-gray-600 text-sm space-y-1 ml-2">
                <li>{t('finance.monthlyReportPoints.0')}</li>
                <li>{t('finance.monthlyReportPoints.1')}</li>
                <li>{t('finance.monthlyReportPoints.2')}</li>
                <li>{t('finance.monthlyReportPoints.3')}</li>
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