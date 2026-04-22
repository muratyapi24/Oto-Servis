"use client";

import { useState } from "react";
import { DollarSign, Activity, BarChart2, AlertTriangle } from "lucide-react";
import StockValueReport from "@/components/dashboard/inventory/StockValueReport";
import MovementHistoryReport from "@/components/dashboard/inventory/MovementHistoryReport";
import TopUsedPartsReport from "@/components/dashboard/inventory/TopUsedPartsReport";
import CriticalStockReport from "@/components/dashboard/inventory/CriticalStockReport";

interface StockValueCategory {
  categoryId: string;
  categoryName: string;
  partCount: number;
  totalStock: number;
  totalValue: number;
  parts: Array<{
    id: string;
    name: string;
    partNumber: string;
    currentStock: number;
    purchasePrice: number;
    stockValue: number;
  }>;
}

interface StockValueSummary {
  totalCategories: number;
  totalPartTypes: number;
  grandTotalStock: number;
  grandTotalValue: number;
}

interface TopPart {
  partId: string;
  name: string;
  partNumber: string;
  category: { id: string; name: string } | null;
  currentStock: number;
  purchasePrice: number;
  sellingPrice: number;
  totalUsedQuantity: number;
  movementCount: number;
}

interface CriticalPart {
  id: string;
  name: string;
  partNumber: string;
  currentStock: number;
  minStockLevel: number;
  deficit: number;
  purchasePrice: number;
  category: { id: string; name: string } | null;
  supplier: {
    id: string;
    name: string;
    contactPerson: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  location: { id: string; name: string } | null;
}

interface Movement {
  id: string;
  type: "IN" | "OUT" | "ADJUST";
  quantity: number;
  reason: string | null;
  createdAt: Date;
  part: {
    id: string;
    name: string;
    partNumber: string;
    unit: string;
  };
  location: { id: string; name: string } | null;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface ReportsTabsProps {
  stockValueCategories: StockValueCategory[];
  stockValueSummary: StockValueSummary;
  topUsedParts: TopPart[];
  defaultDateRange: { startDate: string; endDate: string };
  criticalParts: CriticalPart[];
  criticalSummary: { totalCritical: number; outOfStock: number; belowMinimum: number };
  initialMovements: Movement[];
  initialPagination: Pagination;
}

const TABS = [
  {
    id: "stock-value",
    label: "Stok Değeri",
    icon: DollarSign,
    description: "Kategori bazlı stok değer analizi",
  },
  {
    id: "movement-history",
    label: "Hareket Geçmişi",
    icon: Activity,
    description: "Stok giriş/çıkış hareketleri",
  },
  {
    id: "top-used",
    label: "En Çok Kullanılan",
    icon: BarChart2,
    description: "Kullanım sıklığı analizi",
  },
  {
    id: "critical-stock",
    label: "Kritik Stok",
    icon: AlertTriangle,
    description: "Minimum stok altındaki parçalar",
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ReportsTabs({
  stockValueCategories,
  stockValueSummary,
  topUsedParts,
  defaultDateRange,
  criticalParts,
  criticalSummary,
  initialMovements,
  initialPagination,
}: ReportsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("stock-value");

  return (
    <div className="space-y-6">
      {/* Tab Navigasyonu */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-1.5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-black transition-all ${
                  isActive
                    ? "bg-amber-500 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{tab.label}</span>
                {tab.id === "critical-stock" && criticalSummary.totalCritical > 0 && (
                  <span
                    className={`ml-auto flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black ${
                      isActive ? "bg-white/20 text-white" : "bg-red-100 text-red-600"
                    }`}
                  >
                    {criticalSummary.totalCritical}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab İçerikleri */}
      {activeTab === "stock-value" && (
        <StockValueReport
          categories={stockValueCategories}
          summary={stockValueSummary}
        />
      )}

      {activeTab === "movement-history" && (
        <MovementHistoryReport
          initialMovements={initialMovements}
          initialPagination={initialPagination}
        />
      )}

      {activeTab === "top-used" && (
        <TopUsedPartsReport
          initialParts={topUsedParts}
          initialDateRange={defaultDateRange}
        />
      )}

      {activeTab === "critical-stock" && (
        <CriticalStockReport
          parts={criticalParts}
          summary={criticalSummary}
        />
      )}
    </div>
  );
}
