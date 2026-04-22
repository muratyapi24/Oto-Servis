"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface SearchResults {
  customers: { id: string; firstName?: string; lastName?: string; companyName?: string; phone: string }[];
  vehicles: { id: string; plate: string; brand: string; model: string }[];
  serviceOrders: { id: string; orderNumber: string; status: string; complaintDescription: string }[];
  parts: { id: string; name: string; partNumber: string }[];
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=all`);
      const data = await res.json();
      if (data.results) setResults(data.results);
    } catch {
      // Sessizce başarısız ol
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, doSearch]);

  // Ctrl+K ile aç
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const hasResults = results && (
    results.customers.length > 0 ||
    results.vehicles.length > 0 ||
    results.serviceOrders.length > 0 ||
    results.parts.length > 0
  );

  return (
    <>
      {/* Arama tetikleyici */}
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors"
        aria-label="Ara (Ctrl+K)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>Ara...</span>
        <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-xs border rounded bg-gray-100">⌘K</kbd>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center gap-3 p-4 border-b">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                placeholder="Müşteri, araç, servis emri veya parça ara..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 outline-none text-sm"
                autoComplete="off"
              />
              {loading && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
            </div>

            {hasResults && (
              <div className="max-h-80 overflow-y-auto p-2">
                {results!.customers.length > 0 && (
                  <div className="mb-2">
                    <div className="px-2 py-1 text-xs font-medium text-gray-400 uppercase">Müşteriler</div>
                    {results!.customers.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => { router.push(`/dashboard/customers/${c.id}`); setOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 text-sm"
                      >
                        {c.companyName ?? `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim()} · {c.phone}
                      </button>
                    ))}
                  </div>
                )}
                {results!.vehicles.length > 0 && (
                  <div className="mb-2">
                    <div className="px-2 py-1 text-xs font-medium text-gray-400 uppercase">Araçlar</div>
                    {results!.vehicles.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => { router.push(`/dashboard/vehicles/${v.id}`); setOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 text-sm"
                      >
                        {v.plate} · {v.brand} {v.model}
                      </button>
                    ))}
                  </div>
                )}
                {results!.serviceOrders.length > 0 && (
                  <div className="mb-2">
                    <div className="px-2 py-1 text-xs font-medium text-gray-400 uppercase">Servis Emirleri</div>
                    {results!.serviceOrders.map((o) => (
                      <button
                        key={o.id}
                        onClick={() => { router.push(`/dashboard/services/${o.id}`); setOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 text-sm"
                      >
                        #{o.orderNumber} · {o.complaintDescription.slice(0, 50)}
                      </button>
                    ))}
                  </div>
                )}
                {results!.parts.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-xs font-medium text-gray-400 uppercase">Parçalar</div>
                    {results!.parts.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { router.push(`/dashboard/inventory`); setOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 text-sm"
                      >
                        {p.name} · {p.partNumber}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {query.length >= 2 && !loading && !hasResults && (
              <div className="p-6 text-center text-sm text-gray-500">
                "{query}" için sonuç bulunamadı
              </div>
            )}

            {!query && (
              <div className="p-4 text-center text-sm text-gray-400">
                Aramak için yazmaya başlayın
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
