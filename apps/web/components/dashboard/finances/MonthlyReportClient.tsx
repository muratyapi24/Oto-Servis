"use client";

import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  BarChart3,
  PieChart,
  Wallet,
  Receipt,
} from "lucide-react";
import { exportToPdf, exportToExcel } from "@/lib/report-export";

interface MonthlyReportClientProps {
  data: {
    month: string;
    income: number;
    expense: number;
    profit: number;
  }[];
}

export default function MonthlyReportClient({ data }: MonthlyReportClientProps) {
  const formatMoney = (val: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(val);

  const totalIncome = data.reduce((s, d) => s + d.income, 0);
  const totalExpense = data.reduce((s, d) => s + d.expense, 0);
  const totalProfit = totalIncome - totalExpense;
  const maxBar = Math.max(...data.map((d) => Math.max(d.income, d.expense)), 1);

  return (
    <div className="space-y-8">
      {/* Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 border border-slate-100 rounded-2xl p-6 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              6 Aylık Toplam Gelir
            </p>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
              {formatMoney(totalIncome)}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-slate-100 rounded-2xl p-6 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 flex items-center justify-center">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              6 Aylık Toplam Gider
            </p>
            <p className="text-2xl font-black text-red-600 mt-1">
              {formatMoney(totalExpense)}
            </p>
          </div>
        </div>
        <div className={`border rounded-2xl p-6 shadow-sm flex items-start gap-4 ${totalProfit >= 0 ? "bg-blue-50 border-blue-100" : "bg-red-50 border-red-100"}`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${totalProfit >= 0 ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Net Kâr/Zarar
            </p>
            <p className={`text-2xl font-black mt-1 ${totalProfit >= 0 ? "text-blue-700" : "text-red-700"}`}>
              {formatMoney(totalProfit)}
            </p>
          </div>
        </div>
      </div>

      {/* Bar Chart (CSS-based) */}
      <div className="bg-white dark:bg-gray-800 border border-slate-100 rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Aylık Gelir/Gider Trendi</h3>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() =>
                exportToPdf({
                  title: "Aylık Finansal Rapor",
                  filename: `aylik-rapor-${new Date().toLocaleDateString("tr-TR").replace(/\./g, "-")}`,
                  columns: [
                    { header: "Ay", dataKey: "month" },
                    { header: "Gelir (₺)", dataKey: "income" },
                    { header: "Gider (₺)", dataKey: "expense" },
                    { header: "Kâr (₺)", dataKey: "profit" },
                  ],
                  data,
                })
              }
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 dark:bg-gray-800/50 transition-colors"
            >
              <Receipt className="w-3.5 h-3.5 text-red-500" />
              PDF
            </button>
            <button
              onClick={() =>
                exportToExcel({
                  title: "Aylık Finansal Rapor",
                  filename: `aylik-rapor-${new Date().toLocaleDateString("tr-TR").replace(/\./g, "-")}`,
                  columns: [
                    { header: "Ay", dataKey: "month" },
                    { header: "Gelir (₺)", dataKey: "income" },
                    { header: "Gider (₺)", dataKey: "expense" },
                    { header: "Kâr (₺)", dataKey: "profit" },
                  ],
                  data,
                })
              }
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 dark:bg-gray-800/50 transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5 text-green-600" />
              Excel
            </button>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Gelir</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-400 rounded-sm"></div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Gider</span>
            </div>
          </div>
        </div>

        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
            <PieChart className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-bold">Henüz rapor verisi bulunmuyor.</p>
            <p className="text-xs mt-1">Fatura oluşturdukça veriler otomatik olarak burada görünecektir.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {data.map((item, idx) => {
              const incomeWidth = (item.income / maxBar) * 100;
              const expenseWidth = (item.expense / maxBar) * 100;
              return (
                <div key={idx} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-black text-slate-700 dark:text-gray-300 w-28">{item.month}</span>
                    <div className="flex items-center gap-6 text-xs font-bold">
                      <span className="text-blue-600">{formatMoney(item.income)}</span>
                      <span className="text-red-500">{formatMoney(item.expense)}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${item.profit >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                        {item.profit >= 0 ? "+" : ""}{formatMoney(item.profit)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="w-full bg-slate-50 dark:bg-gray-800/50 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-700 ease-out group-hover:shadow-[0_0_12px_rgba(37,99,235,0.4)]"
                        style={{ width: `${incomeWidth}%` }}
                      ></div>
                    </div>
                    <div className="w-full bg-slate-50 dark:bg-gray-800/50 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-red-400 h-full rounded-full transition-all duration-700 ease-out group-hover:shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                        style={{ width: `${expenseWidth}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Table */}
      <div className="bg-white dark:bg-gray-800 border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">Detaylı Tablo</h3>
          <Link
            href="/dashboard/finances/invoices"
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
          >
            Tüm Faturaları Gör <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 dark:bg-gray-800/50/50">
                <th className="text-left px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Dönem</th>
                <th className="text-right px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Gelir</th>
                <th className="text-right px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Gider</th>
                <th className="text-right px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Net Kâr/Zarar</th>
                <th className="text-right px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Kârlılık</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => {
                const margin = item.income > 0 ? ((item.profit / item.income) * 100).toFixed(1) : "0.0";
                return (
                  <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 dark:bg-gray-800/50/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-gray-200">{item.month}</td>
                    <td className="px-6 py-4 text-sm font-bold text-right text-emerald-600">{formatMoney(item.income)}</td>
                    <td className="px-6 py-4 text-sm font-bold text-right text-red-500">{formatMoney(item.expense)}</td>
                    <td className={`px-6 py-4 text-sm font-black text-right ${item.profit >= 0 ? "text-blue-700" : "text-red-700"}`}>
                      {formatMoney(item.profit)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-xs font-black px-2 py-1 rounded-lg ${Number(margin) >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                        %{margin}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
