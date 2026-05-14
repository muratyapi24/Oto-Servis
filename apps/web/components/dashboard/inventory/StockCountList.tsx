"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import {
  ClipboardList,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Package,
} from "lucide-react";

dayjs.locale("tr");

interface StockCount {
  id: string;
  status: "DRAFT" | "IN_PROGRESS" | "COMPLETED";
  notes?: string | null;
  createdAt: string;
  completedAt?: string | null;
  location?: {
    id: string;
    name: string;
  } | null;
  _count?: {
    items: number;
  };
}

interface StockCountListProps {
  counts: StockCount[];
  total: number;
  locations?: Array<{ id: string; name: string }>;
}

const STATUS_CONFIG = {
  DRAFT: {
    label: "Taslak",
    className: "bg-slate-100 text-slate-600 border border-slate-200",
  },
  IN_PROGRESS: {
    label: "Devam Ediyor",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  COMPLETED: {
    label: "Tamamlandı",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
};

const PAGE_SIZE = 10;

export default function StockCountList({
  counts,
  total,
  locations = [],
}: StockCountListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [locationFilter, setLocationFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return counts.filter((c) => {
      const matchSearch =
        !searchTerm ||
        (c.location?.name ?? "Tüm Lokasyonlar")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (c.notes ?? "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
      const matchLocation =
        locationFilter === "ALL" ||
        (locationFilter === "ALL_LOCATIONS" && !c.location) ||
        c.location?.id === locationFilter;
      return matchSearch && matchStatus && matchLocation;
    });
  }, [counts, searchTerm, statusFilter, locationFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterChange = () => {
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Filtreler */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleFilterChange();
              }}
              placeholder="Lokasyon veya not ara..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                handleFilterChange();
              }}
              className="py-2 px-3 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
            >
              <option value="ALL">Tüm Durumlar</option>
              {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>

            {locations.length > 0 && (
              <select
                value={locationFilter}
                onChange={(e) => {
                  setLocationFilter(e.target.value);
                  handleFilterChange();
                }}
                className="py-2 px-3 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
              >
                <option value="ALL">Tüm Lokasyonlar</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-gray-800/50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Sayım</th>
                <th className="px-6 py-4">Lokasyon</th>
                <th className="px-6 py-4">Başlangıç</th>
                <th className="px-6 py-4">Tamamlanma</th>
                <th className="px-6 py-4">Kalem</th>
                <th className="px-6 py-4">Durum</th>
                <th className="px-6 py-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <Package className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-slate-400 dark:text-slate-500 font-medium">
                      Stok sayımı bulunamadı.
                    </p>
                  </td>
                </tr>
              ) : (
                paginated.map((count) => {
                  const statusCfg =
                    STATUS_CONFIG[count.status] || STATUS_CONFIG.DRAFT;
                  return (
                    <tr
                      key={count.id}
                      className="hover:bg-slate-50 dark:bg-gray-800/50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <ClipboardList className="w-4 h-4 text-blue-500 shrink-0" />
                          <div>
                            <span className="font-black text-slate-900 dark:text-white tracking-tight">
                              Sayım #{count.id.slice(-6).toUpperCase()}
                            </span>
                            {count.notes && (
                              <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 max-w-[200px] truncate">
                                {count.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800 dark:text-gray-200">
                          {count.location?.name ?? "Tüm Lokasyonlar"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {dayjs(count.createdAt).format("DD MMM YYYY")}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {count.completedAt
                          ? dayjs(count.completedAt).format("DD MMM YYYY")
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold bg-slate-100 dark:bg-gray-700 text-slate-600 px-2 py-1 rounded-lg">
                          {count._count?.items ?? 0} kalem
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black ${statusCfg.className}`}
                        >
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/inventory/stock-counts/${count.id}`}
                          className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-gray-700 hover:bg-blue-50 hover:text-blue-700 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Detay
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Sayfalama */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-gray-700 flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {filtered.length} sonuçtan {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)} gösteriliyor
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-gray-800/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-700 dark:text-gray-300">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-gray-800/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
