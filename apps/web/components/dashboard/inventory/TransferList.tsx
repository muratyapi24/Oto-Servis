"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import {
  ArrowRightLeft,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Package,
  MapPin,
} from "lucide-react";

dayjs.locale("tr");

interface StockTransferItem {
  id: string;
  partId: string;
  quantity: number | string;
  part: {
    id: string;
    name: string;
    partNumber: string;
    unit: string;
  };
}

interface StockTransfer {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  notes?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  approvedAt?: string | null;
  completedAt?: string | null;
  fromLocation: {
    id: string;
    name: string;
  };
  toLocation: {
    id: string;
    name: string;
  };
  items: StockTransferItem[];
  _count?: {
    items: number;
  };
}

interface TransferListProps {
  transfers: StockTransfer[];
  total: number;
  locations?: Array<{ id: string; name: string }>;
}

const STATUS_CONFIG = {
  PENDING: {
    label: "Bekliyor",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  APPROVED: {
    label: "Onaylandı",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  REJECTED: {
    label: "Reddedildi",
    className: "bg-red-50 text-red-700 border border-red-200",
  },
  COMPLETED: {
    label: "Tamamlandı",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
};

const PAGE_SIZE = 10;

export default function TransferList({
  transfers,
  total,
  locations = [],
}: TransferListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [locationFilter, setLocationFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return transfers.filter((t) => {
      const matchSearch =
        !searchTerm ||
        t.fromLocation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.toLocation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.notes ?? "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
      const matchLocation =
        locationFilter === "ALL" ||
        t.fromLocation.id === locationFilter ||
        t.toLocation.id === locationFilter;
      return matchSearch && matchStatus && matchLocation;
    });
  }, [transfers, searchTerm, statusFilter, locationFilter]);

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
                <th className="px-6 py-4">Transfer</th>
                <th className="px-6 py-4">Kaynak → Hedef</th>
                <th className="px-6 py-4">Tarih</th>
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
                      Transfer bulunamadı.
                    </p>
                  </td>
                </tr>
              ) : (
                paginated.map((transfer) => {
                  const statusCfg =
                    STATUS_CONFIG[transfer.status] || STATUS_CONFIG.PENDING;
                  return (
                    <tr
                      key={transfer.id}
                      className="hover:bg-slate-50 dark:bg-gray-800/50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <ArrowRightLeft className="w-4 h-4 text-blue-500 shrink-0" />
                          <div>
                            <span className="font-black text-slate-900 dark:text-white tracking-tight">
                              Transfer #{transfer.id.slice(-6).toUpperCase()}
                            </span>
                            {transfer.notes && (
                              <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 max-w-[200px] truncate">
                                {transfer.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span className="font-bold text-slate-800 dark:text-gray-200">
                            {transfer.fromLocation.name}
                          </span>
                          <ArrowRightLeft className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span className="font-bold text-slate-800 dark:text-gray-200">
                            {transfer.toLocation.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {dayjs(transfer.createdAt).format("DD MMM YYYY")}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {transfer.completedAt
                          ? dayjs(transfer.completedAt).format("DD MMM YYYY")
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold bg-slate-100 dark:bg-gray-700 text-slate-600 px-2 py-1 rounded-lg">
                          {transfer._count?.items ?? transfer.items.length} kalem
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
                          href={`/dashboard/inventory/transfers/${transfer.id}`}
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
