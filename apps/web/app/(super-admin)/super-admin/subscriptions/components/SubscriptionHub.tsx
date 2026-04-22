"use client";

import React, { useState, useMemo } from "react";
import { cancelSubscription, changeSubscriptionPlan, createSubscriptionPlan } from "@/lib/actions/superadmin.actions";
import { useRouter } from "next/navigation";

export default function SubscriptionHub({
  subscriptions,
  plans,
}: {
  subscriptions: any[];
  plans: any[];
}) {
  const router = useRouter();
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Modals state
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isChangePlanOpen, setIsChangePlanOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Derived / Filtered data
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      // Search
      const textMatch =
        sub.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.tenant?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.plan?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      // Plan 
      const planMatch = selectedPlan === "all" || sub.planId === selectedPlan;

      // Status
      const statusMatch = selectedStatus === "all" || sub.status === selectedStatus;

      return textMatch && planMatch && statusMatch;
    });
  }, [subscriptions, searchTerm, selectedPlan, selectedStatus]);

  // Handlers
  const handleCancelClick = (sub: any) => {
    setSelectedSub(sub);
    setIsCancelOpen(true);
  };

  const handleChangePlanClick = (sub: any) => {
    setSelectedSub(sub);
    setIsChangePlanOpen(true);
  };

  const handleDetailClick = (sub: any) => {
    setSelectedSub(sub);
    setIsDetailOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedSub) return;
    setLoading(true);
    await cancelSubscription(selectedSub.id);
    setLoading(false);
    setIsCancelOpen(false);
    router.refresh();
  };

  const handleChangePlanConfirm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSub) return;
    const formData = new FormData(e.currentTarget);
    const newPlanId = formData.get("planId") as string;
    
    setLoading(true);
    await changeSubscriptionPlan(selectedSub.id, newPlanId);
    setLoading(false);
    setIsChangePlanOpen(false);
    router.refresh();
  };

  const handleAddPlanConfirm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Parse Limits
    const serviceOrders = parseInt(formData.get("limit_serviceOrders") as string, 10) || 500;
    const users = parseInt(formData.get("limit_users") as string, 10) || 3;
    const dataRetentionYears = parseInt(formData.get("limit_dataRetention") as string, 10) || 1;

    // Parse Features
    const aiDiagnostics = formData.get("feature_aiDiagnostics") === "on";
    const whiteLabel = formData.get("feature_whiteLabel") as string;
    const advancedInventory = formData.get("feature_advancedInventory") === "on";
    const apiWebhook = formData.get("feature_apiWebhook") === "on";

    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      priceMonthly: formData.get("priceMonthly") as string,
      limits: {
        serviceOrders,
        users,
        dataRetentionYears,
      },
      features: {
        aiDiagnostics,
        whiteLabel,
        advancedInventory,
        apiWebhook,
      }
    };
    
    setLoading(true);
    await createSubscriptionPlan(data);
    setLoading(false);
    setIsAddPlanOpen(false);
    router.refresh();
  };

  return (
    <>
      {/* FILTER HEADER */}
      <div className="bg-surface-container-low border-b border-outline/20 p-4 shrink-0">
        <div className="flex flex-col gap-3 max-w-6xl mx-auto">
          <div className="relative flex items-center gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
                search
              </span>
              <input
                className="w-full bg-white border border-outline/30 rounded py-2 pl-10 pr-4 text-xs font-medium placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                placeholder="Müşteri adı, e-posta, abonelik ID veya paket Tipi ile arama yapın..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded border border-outline/20 bg-surface-container-low text-[9px] text-outline font-mono shadow-sm">
                  CTRL
                </kbd>
                <kbd className="px-1.5 py-0.5 rounded border border-outline/20 bg-surface-container-low text-[9px] text-outline font-mono shadow-sm">
                  K
                </kbd>
              </div>
            </div>
            <button onClick={() => setIsAddPlanOpen(true)} disabled={loading} className="flex flex-shrink-0 items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded shadow-sm hover:bg-primary/90 transition-colors">
              <span className="material-symbols-outlined text-sm">add</span>
              YENİ PAKET EKLE
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between w-full gap-y-2">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">
                  Paket Filtresi:
                </span>
                <button
                  onClick={() => setSelectedPlan("all")}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-colors ${
                    selectedPlan === "all"
                      ? "border-primary/40 bg-primary/5 text-primary"
                      : "border-outline/20 bg-white hover:bg-surface-container text-outline"
                  }`}
                >
                  Tüm Paketler
                </button>
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                      selectedPlan === plan.id
                        ? "border-primary/40 bg-primary/5 text-primary"
                        : "border-outline/20 bg-white hover:bg-surface-container text-outline"
                    }`}
                  >
                    {plan.name}
                  </button>
                ))}
              </div>
              <div className="hidden sm:block h-3 w-px bg-outline/20"></div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">
                  Durum:
                </span>
                <button 
                  onClick={() => setSelectedStatus(selectedStatus === "ACTIVE" ? "all" : "ACTIVE")}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${selectedStatus === "ACTIVE" ? "bg-surface-container border-outline/30" : "border-transparent"}`}
                >
                  <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim"></span>
                  <span className="text-[10px] font-semibold">Aktif</span>
                </button>
                <button 
                  onClick={() => setSelectedStatus(selectedStatus === "PAST_DUE" ? "all" : "PAST_DUE")}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${selectedStatus === "PAST_DUE" ? "bg-surface-container border-outline/30" : "border-transparent"}`}
                >
                  <span className="w-2 h-2 rounded-full bg-secondary-container"></span>
                  <span className="text-[10px] font-semibold">Gecikmiş</span>
                </button>
                <button 
                  onClick={() => setSelectedStatus(selectedStatus === "CANCELLED" ? "all" : "CANCELLED")}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${selectedStatus === "CANCELLED" ? "bg-surface-container border-outline/30" : "border-transparent"}`}
                >
                  <span className="w-2 h-2 rounded-full bg-outline"></span>
                  <span className="text-[10px] font-semibold">İptal Edilmiş</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-y-auto p-4 bg-surface-container-lowest">
        <div className="max-w-6xl mx-auto bg-white border border-outline/20 rounded shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-tighter border-b border-outline-variant/30 bg-surface-container-low w-20">
                    ID
                  </th>
                  <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-tighter border-b border-outline-variant/30 bg-surface-container-low">
                    Müşteri Adı & İletişim
                  </th>
                  <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-tighter border-b border-outline-variant/30 bg-surface-container-low">
                    Paket Tipi
                  </th>
                  <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-tighter border-b border-outline-variant/30 bg-surface-container-low">
                    Durum
                  </th>
                  <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-tighter border-b border-outline-variant/30 bg-surface-container-low">
                    Devir / Bitiş
                  </th>
                  <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-tighter border-b border-outline-variant/30 bg-surface-container-low text-right">
                    Aylık Tutar
                  </th>
                  <th className="px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-tighter border-b border-outline-variant/30 bg-surface-container-low text-center w-32">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {filteredSubscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-outline/50 font-sans text-xs">Arama kriterlerine uygun abonelik bulunamadı.</td>
                  </tr>
                ) : filteredSubscriptions.map(sub => {
                  const isEnt = sub.plan?.name?.toUpperCase().includes('ENT');
                  const isPro = sub.plan?.name?.toUpperCase().includes('PRO');

                  return (
                    <tr key={sub.id} className="hover:bg-surface-container-lowest transition-colors border-l-2 border-transparent hover:border-primary">
                      <td className="text-outline px-3 py-2 text-xs border-b border-outline-variant/10 align-middle">
                        #{sub.id.substring(0,6)}
                      </td>
                      <td className="px-3 py-2 text-xs border-b border-outline-variant/10 align-middle">
                        <div className="flex flex-col">
                          <span className="font-bold text-on-surface font-body truncate max-w-[180px]">
                            {sub.tenant?.name || "Bilinmeyen Firma"}
                          </span>
                          <span className="text-[10px] text-outline font-normal font-sans truncate max-w-[180px]">
                            {sub.tenant?.email || "E-posta Yok"}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs border-b border-outline-variant/10 align-middle">
                        <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase ${isEnt ? 'bg-primary-container text-white' : isPro ? 'bg-secondary text-white' : 'bg-surface-container-highest text-on-surface'}`}>
                          {sub.plan?.name || "TRIAL"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs border-b border-outline-variant/10 align-middle">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase font-sans ${sub.status === 'ACTIVE' || sub.status === 'TRIAL' ? 'text-tertiary' : sub.status === 'CANCELLED' ? 'text-outline border-none line-through decoration-outline' : 'text-error'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sub.status === 'ACTIVE' || sub.status === 'TRIAL' ? 'bg-tertiary' : sub.status === 'CANCELLED' ? 'bg-outline' : 'bg-error'}`}></span>{" "}
                          {sub.status}
                        </span>
                      </td>
                      <td className={`px-3 py-2 text-xs border-b border-outline-variant/10 align-middle font-sans ${sub.status === 'CANCELLED' ? 'text-outline line-through italic' : 'text-on-surface'}`}>
                        {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric'}) : "-"}
                      </td>
                      <td className="text-right font-bold text-on-surface px-3 py-2 text-xs border-b border-outline-variant/10 align-middle">
                        ₺{sub.plan?.priceMonthly?.toLocaleString('tr-TR')},00
                      </td>
                      <td className="px-3 py-2 text-xs border-b border-outline-variant/10 align-middle">
                        <div className="flex items-center justify-center gap-1 text-primary">
                          <button
                            onClick={() => handleDetailClick(sub)}
                            className="flex items-center justify-center p-1 rounded hover:bg-primary/10 transition-colors border border-transparent hover:border-primary/20"
                            title="Detayları Görüntüle"
                          >
                            <span className="material-symbols-outlined text-lg">
                              visibility
                            </span>
                          </button>
                          <button
                            onClick={() => handleChangePlanClick(sub)}
                            className="flex items-center justify-center p-1 rounded hover:bg-primary/10 transition-colors border border-transparent hover:border-primary/20"
                            title="Planı Değiştir"
                          >
                            <span className="material-symbols-outlined text-lg">
                              edit_note
                            </span>
                          </button>
                          {sub.status !== 'CANCELLED' && (
                            <button
                              onClick={() => handleCancelClick(sub)}
                              className="flex items-center justify-center p-1 rounded hover:bg-error/10 text-error transition-colors border border-transparent hover:border-error/20"
                              title="İptal Et"
                            >
                              <span className="material-symbols-outlined text-lg">
                                cancel
                              </span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="bg-surface-container-low px-4 py-3 flex items-center justify-between border-t border-outline/10">
            <span className="text-[10px] font-bold text-outline font-mono uppercase">
              Toplam {filteredSubscriptions.length} abonelik gösteriliyor
            </span>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {isDetailOpen && selectedSub && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-outline/10 flex justify-between items-center bg-surface-container-lowest">
              <h2 className="text-lg font-bold text-on-surface">Abonelik Detayı</h2>
              <button onClick={() => setIsDetailOpen(false)} className="text-outline hover:text-error transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4 font-sans text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-outline uppercase block mb-1">Abonelik ID</label>
                  <div className="font-mono text-on-surface">{selectedSub.id}</div>
                </div>
                <div>
                  <label className="text-xs font-bold text-outline uppercase block mb-1">Firma Adı</label>
                  <div className="font-bold text-on-surface">{selectedSub.tenant?.name}</div>
                </div>
                <div>
                  <label className="text-xs font-bold text-outline uppercase block mb-1">E-posta</label>
                  <div className="text-on-surface">{selectedSub.tenant?.email || "-"}</div>
                </div>
                <div>
                  <label className="text-xs font-bold text-outline uppercase block mb-1">Durum</label>
                  <div className={`font-bold uppercase ${selectedSub.status === 'ACTIVE' ? 'text-tertiary' : 'text-error'}`}>{selectedSub.status}</div>
                </div>
                <div>
                  <label className="text-xs font-bold text-outline uppercase block mb-1">Mevcut Paket</label>
                  <div className="font-bold text-on-surface">{selectedSub.plan?.name}</div>
                </div>
                <div>
                  <label className="text-xs font-bold text-outline uppercase block mb-1">Aylık Ücret</label>
                  <div className="text-on-surface">₺{selectedSub.plan?.priceMonthly?.toLocaleString('tr-TR')}</div>
                </div>
                <div>
                  <label className="text-xs font-bold text-outline uppercase block mb-1">Başlangıç Tarihi</label>
                  <div className="text-on-surface">{new Date(selectedSub.startDate).toLocaleDateString('tr-TR')}</div>
                </div>
                <div>
                  <label className="text-xs font-bold text-outline uppercase block mb-1">Sonraki Yenileme</label>
                  <div className="text-on-surface">{selectedSub.currentPeriodEnd ? new Date(selectedSub.currentPeriodEnd).toLocaleDateString('tr-TR') : "-"}</div>
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-outline/10 text-right">
                <button onClick={() => setIsDetailOpen(false)} className="px-6 py-2 bg-primary/10 text-primary text-xs font-bold rounded hover:bg-primary/20">KAPAT</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE PLAN MODAL */}
      {isChangePlanOpen && selectedSub && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden border">
            <div className="px-6 py-4 border-b border-outline/10 flex justify-between items-center bg-surface-container-lowest">
              <h2 className="text-base font-bold text-on-surface">Paket Değişikliği (Geçiş)</h2>
              <button onClick={() => setIsChangePlanOpen(false)} className="text-outline hover:text-error transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleChangePlanConfirm} className="p-6">
              <p className="text-xs text-outline mb-4">
                <strong>{selectedSub.tenant?.name}</strong> firmasının abonelik paketini değiştirmek üzeresiniz. Yeni paket anında aktif olacaktır.
              </p>
              
              <div className="space-y-3 mb-6">
                {plans.map(plan => (
                  <label key={plan.id} className="flex items-center gap-3 p-3 border border-outline/20 rounded cursor-pointer hover:bg-surface-container-lowest transition-colors has-[:checked]:border-primary has-[:checked]:ring-1 has-[:checked]:ring-primary">
                    <input type="radio" name="planId" value={plan.id} defaultChecked={selectedSub.planId === plan.id} className="w-4 h-4 text-primary focus:ring-primary/20" />
                    <div>
                      <div className="text-sm font-bold text-on-surface">{plan.name}</div>
                      <div className="text-xs text-outline">₺{plan.priceMonthly?.toLocaleString('tr-TR')} / Ay</div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex gap-3 w-full">
                <button type="button" onClick={() => setIsChangePlanOpen(false)} className="flex-1 px-4 py-2 text-xs font-bold border border-outline/20 rounded text-on-surface hover:bg-surface-container-low transition-colors">İPTAL</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 text-xs font-bold bg-primary text-white rounded hover:bg-primary/90 transition-colors">
                  {loading ? "KAYDEDİLİYOR..." : "KAYDET & GEÇİŞ YAP"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL MODAL */}
      {isCancelOpen && selectedSub && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden p-6 border-2 border-error/50">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center text-error border-4 border-error/20">
                <span className="material-symbols-outlined text-2xl">warning</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-surface">Aboneliği İptal Et</h3>
                <p className="text-sm text-outline mt-1">
                  <strong>{selectedSub.tenant?.name}</strong> firmasının aboneliğini iptal etmek üzeresiniz. Bu işlem sonrasında firma sisteme erişimini kaybedebilir.
                </p>
              </div>
              <div className="flex gap-3 w-full pt-4">
                <button onClick={() => setIsCancelOpen(false)} className="flex-1 px-4 py-2 text-xs font-bold border border-outline/20 rounded text-on-surface hover:bg-surface-container-low transition-colors">VAZGEÇ</button>
                <button onClick={handleCancelConfirm} disabled={loading} className="flex-1 px-4 py-2 text-xs font-bold bg-error text-white rounded hover:bg-error/90 transition-colors">
                  {loading ? "İPTAL EDİLİYOR..." : "EVET, İPTAL ET"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD PLAN MODAL */}
      {isAddPlanOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 text-left">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col border">
            <div className="px-6 py-4 border-b border-outline/10 flex justify-between items-center bg-surface-container-lowest shrink-0">
              <h2 className="text-base font-bold text-on-surface">Yeni Paket Ekle</h2>
              <button onClick={() => setIsAddPlanOpen(false)} className="text-outline hover:text-error transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddPlanConfirm} className="flex-1 overflow-y-auto p-6 bg-surface-container-lowest font-sans">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-primary uppercase border-b border-outline/10 pb-2">1. Temel Bilgiler</h3>
                  <div>
                    <label className="text-xs font-bold text-outline uppercase block mb-1">Paket Adı</label>
                    <input required name="name" type="text" placeholder="Örn: Premium" className="w-full bg-white border border-outline/20 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-outline uppercase block mb-1">Açıklama (Opsiyonel)</label>
                    <input name="description" type="text" placeholder="Kısaca açıklayın..." className="w-full bg-white border border-outline/20 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-outline uppercase block mb-1">Aylık Temel Fiyatlandırma (₺)</label>
                    <input required name="priceMonthly" type="number" min="0" step="any" placeholder="Örn: 5000" className="w-full bg-white border border-outline/20 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-primary uppercase border-b border-outline/10 pb-2">2. Kullanım Limitleri</h3>
                  <div>
                    <label className="text-xs font-bold text-outline uppercase block mb-1">Aylık Toplam Servis Kaydı</label>
                    <input required name="limit_serviceOrders" type="number" defaultValue={500} min="-1" className="w-full bg-white border border-outline/20 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
                    <span className="text-[10px] text-outline italic mt-1 block">-1 değeri sınırsız anlamına gelir.</span>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-outline uppercase block mb-1">Eşzamanlı Personel Erişimi</label>
                    <input required name="limit_users" type="number" defaultValue={3} min="-1" className="w-full bg-white border border-outline/20 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-outline uppercase block mb-1">Veri Saklama Politikası</label>
                    <select name="limit_dataRetention" defaultValue={1} className="w-full bg-white border border-outline/20 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none">
                      <option value="1">1 Yıl</option>
                      <option value="5">5 Yıl</option>
                      <option value="-1">Süresiz</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-primary uppercase border-b border-outline/10 pb-2">3. Modül ve Özellik İzinleri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 p-3 border border-outline/20 rounded bg-white cursor-pointer hover:bg-surface-container-low transition-colors">
                    <input type="checkbox" name="feature_aiDiagnostics" className="w-4 h-4 text-primary rounded focus:ring-primary rounded-sm" />
                    <span className="text-sm font-semibold text-on-surface">Entegre YZ Teşhis Modülü</span>
                  </label>
                  
                  <label className="flex items-center gap-3 p-3 border border-outline/20 rounded bg-white cursor-pointer hover:bg-surface-container-low transition-colors">
                    <input type="checkbox" name="feature_advancedInventory" className="w-4 h-4 text-primary rounded focus:ring-primary rounded-sm" />
                    <span className="text-sm font-semibold text-on-surface">Gelişmiş Stok Modülü</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-outline/20 rounded bg-white cursor-pointer hover:bg-surface-container-low transition-colors">
                    <input type="checkbox" name="feature_apiWebhook" className="w-4 h-4 text-primary rounded focus:ring-primary rounded-sm" />
                    <span className="text-sm font-semibold text-on-surface">API Webhook Erişimi</span>
                  </label>

                  <div className="flex flex-col gap-1 p-2 border border-outline/20 rounded bg-white">
                    <span className="text-[10px] font-bold text-outline uppercase px-1">White-label Mobil Uygulama</span>
                    <select name="feature_whiteLabel" defaultValue="no" className="w-full bg-transparent border-none text-sm font-semibold focus:ring-0 outline-none text-on-surface cursor-pointer">
                      <option value="no">Hayır / Yok</option>
                      <option value="optional">Opsiyonel (+Ücretli)</option>
                      <option value="yes">Evet (Dahil)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 w-full border-t border-outline/10 pt-6 mt-6 shrink-0">
                <button type="button" onClick={() => setIsAddPlanOpen(false)} className="px-6 py-2 text-xs font-bold border border-outline/20 rounded text-on-surface hover:bg-surface-container-low transition-colors">İPTAL</button>
                <button type="submit" disabled={loading} className="px-8 py-2 text-xs font-bold bg-primary text-white rounded hover:bg-primary/90 transition-colors">
                  {loading ? "EKLENİYOR..." : "PAKETİ OLUŞTUR"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
