
import React from "react";
import { Link } from "react-router-dom";
import OwnerSidebar from "../../../components/OwnerSidebar";
import DashboardNav from "../../../components/DashboardNav";
import {
  FaCalculator,
  FaChartBar,
  FaCalendarAlt,
  FaFileInvoiceDollar,
} from "react-icons/fa";

const Finance = () => {
  return (
    <div data-tour="finance-page" className="flex h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
      <OwnerSidebar />
      <div className="flex-1">
        <DashboardNav />
        <div className="p-6 max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              💰 Finance Management
            </h1>
            <p className="text-gray-500 mt-2">
              Track your daily income, expenses and monthly performance
            </p>
          </div>

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
        </div>
      </div>
    </div>
  );
};

export default Finance;