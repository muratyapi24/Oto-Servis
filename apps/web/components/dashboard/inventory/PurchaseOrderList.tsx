"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import {
  ShoppingCart,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Package,
} from "lucide-react";

dayjs.locale("tr");

interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: "DRAFT" | "SENT" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED";
  totalAmount: number | string;
  subTotal: number | string;
  taxAmount: number | string;
  expectedDate?: string | null;
  createdAt: string;
  supplier: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
  };
  _count?: {
    items: number;
    stockMovements: number;
  };
}

interface PurchaseOrderListProps {
  orders: PurchaseOrder[];
  total: number;
  suppliers?: Array<{ id: string; name: string }>;
}

const STATUS_CONFIG = {
  DRAFT: {
    label: "Taslak",
    className: "bg-slate-100 text-slate-600 border border-slate-200",
  },
  SENT: {
    label: "Gönderildi",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  PARTIALLY_RECEIVED: {
    label: "Kısmi Teslim",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  RECEIVED: {
    label: "Teslim Alındı",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  CANCELLED: {
    label: "İptal Edildi",
    className: "bg-red-50 text-red-600 border border-red-200",
  },
};

const PAGE_SIZE = 10;

export default function PurchaseOrderList({
  orders,
  total,
  suppliers = [],
}: PurchaseOrderListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [supplierFilter, setSupplierFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const formatMoney = (val: number | string) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(Number(val) || 0);
  };

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        !searchTerm ||
        o.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.supplier.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
      const matchSupplier =
        supplierFilter === "ALL" || o.supplier.id === supplierFilter;
      return matchSearch && matchStatus && matchSupplier;
    });
  }, [orders, searchTerm, statusFilter, supplierFilter]);

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
              placeholder="PO numarası veya tedarikçi ara..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
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
              className="py-2 px-3 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
            >
              <option value="ALL">Tüm Durumlar</option>
              {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>

            {suppliers.length > 0 && (
              <select
                value={supplierFilter}
                onChange={(e) => {
                  setSupplierFilter(e.target.value);
                  handleFilterChange();
                }}
                className="py-2 px-3 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none"
              >
                <option value="ALL">Tüm Tedarikçiler</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
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
                <th className="px-6 py-4">PO Numarası</th>
                <th className="px-6 py-4">Tedarikçi</th>
                <th className="px-6 py-4">Tarih</th>
                <th className="px-6 py-4">Beklenen Teslim</th>
                <th className="px-6 py-4">Kalem</th>
                <th className="px-6 py-4">Toplam Tutar</th>
                <th className="px-6 py-4">Durum</th>
                <th className="px-6 py-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <Package className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-slate-400 dark:text-slate-500 font-medium">
                      Satın alma siparişi bulunamadı.
                    </p>
                  </td>
                </tr>
              ) : (
                paginated.map((order) => {
                  const statusCfg =
                    STATUS_CONFIG[order.status] || STATUS_CONFIG.DRAFT;
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50 dark:bg-gray-800/50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4 text-amber-500 shrink-0" />
                          <span className="font-black text-slate-900 dark:text-white tracking-tight">
                            {order.poNumber}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 dark:text-gray-200">
                          {order.supplier.name}
                        </div>
                        {order.supplier.email && (
                          <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            {order.supplier.email}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {dayjs(order.createdAt).format("DD MMM YYYY")}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {order.expectedDate
                          ? dayjs(order.expectedDate).format("DD MMM YYYY")
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold bg-slate-100 dark:bg-gray-700 text-slate-600 px-2 py-1 rounded-lg">
                          {order._count?.items ?? 0} kalem
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-black text-slate-900 dark:text-white">
                          {formatMoney(order.totalAmount)}
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
                          href={`/dashboard/inventory/purchase-orders/${order.id}`}
                          className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-gray-700 hover:bg-amber-50 hover:text-amber-700 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
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
