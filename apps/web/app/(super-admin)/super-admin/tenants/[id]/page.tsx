import Link from "next/link"
import { redirect } from "next/navigation"
import SuperAdminFooter from "@/components/super-admin/Footer"
import { getTenantById } from "@/lib/actions/superadmin.actions"
import TenantQuickActions from "./TenantQuickActions"

export const metadata = { title: "Tenant Detay | Super Admin" }

const LEVEL_BADGE: Record<string, string> = {
  ERROR: "bg-error-container text-on-error-container",
  CRITICAL: "bg-error-container text-on-error-container",
  WARN: "bg-secondary-container/20 text-secondary",
  INFO: "bg-tertiary-fixed text-on-tertiary-fixed",
}

export default async function TenantDetailPage(props: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ tab?: string }>
}) {
  const params = await props.params
  const searchParams = await props.searchParams
  const tab = searchParams?.tab || "overview"

  const tenant = await getTenantById(params.id)

  if (!tenant || "error" in tenant) {
    redirect("/super-admin/tenants")
  }

  const TABS = [
    { id: "overview", label: "Genel Bakış" },
    { id: "users", label: "Kullanıcılar" },
    { id: "activity", label: "Aktivite Logu" },
    { id: "subscription", label: "Abonelik" },
  ]

  return (
    <>
      <header className="h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link
            href="/super-admin/tenants"
            className="flex items-center gap-1 text-[10px] font-bold text-outline hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Firmalar
          </Link>
          <span className="text-outline/30">|</span>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">apartment</span>
            <h2 className="text-sm font-bold tracking-tight uppercase">{tenant.name}</h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              tenant.status === "ACTIVE"
                ? "bg-tertiary-fixed text-on-tertiary-fixed"
                : "bg-error-container text-on-error-container"
            }`}
          >
            {tenant.status === "ACTIVE" ? "AKTİF" : tenant.status}
          </span>
          <TenantQuickActions tenantId={tenant.id} currentStatus={tenant.status} />
        </div>
      </header>

      <div className="bg-white border-b border-outline/20 px-6 flex items-center shrink-0 gap-1 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`?tab=${t.id}`}
            className={
              tab === t.id
                ? "px-4 py-2 text-xs font-bold border-b-2 border-primary text-primary bg-primary/5 whitespace-nowrap"
                : "px-4 py-2 text-xs font-semibold text-outline hover:text-on-surface transition-colors border-b-2 border-transparent hover:bg-surface-container-low whitespace-nowrap"
            }
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Genel Bakış Tab */}
        {tab === "overview" && (
          <div className="grid grid-cols-12 gap-4">
            {/* Sol Kolon */}
            <div className="col-span-12 lg:col-span-8 space-y-4">
              {/* Firma Bilgi Kartı */}
              <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm p-4">
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest mb-4">Firma Bilgileri</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Firma Adı", value: tenant.name },
                    { label: "E-posta", value: tenant.email || "—" },
                    { label: "Telefon", value: tenant.phone || "—" },
                    { label: "Vergi No", value: tenant.taxNumber || "—" },
                    { label: "Şehir", value: tenant.city || "—" },
                    {
                      label: "Kayıt Tarihi",
                      value: new Date(tenant.createdAt).toLocaleDateString("tr-TR"),
                    },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-0.5">
                        {item.label}
                      </p>
                      <p className="text-xs font-medium text-on-surface">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4 Sayım Kartı */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Kullanıcı", value: tenant._count.users, icon: "group" },
                  { label: "Araç", value: tenant._count.vehicles, icon: "directions_car" },
                  { label: "Servis Emri", value: tenant._count.serviceOrders, icon: "build" },
                  { label: "Müşteri", value: tenant._count.customers, icon: "people" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-surface-container-lowest border border-outline/20 p-3 rounded shadow-sm"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="material-symbols-outlined text-primary text-base">{item.icon}</span>
                      <p className="text-[9px] font-bold text-outline uppercase tracking-widest">{item.label}</p>
                    </div>
                    <p className="text-2xl font-black text-on-surface">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sağ Kolon */}
            <div className="col-span-12 lg:col-span-4">
              <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm p-4">
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest mb-3">Abonelik</h3>
                {tenant.subscription ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-outline">Plan</span>
                      <span className="text-xs font-bold text-on-surface">{tenant.subscription.plan.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-outline">Durum</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          tenant.subscription.status === "ACTIVE"
                            ? "bg-tertiary-fixed text-on-tertiary-fixed"
                            : tenant.subscription.status === "TRIAL"
                            ? "bg-primary/10 text-primary"
                            : "bg-error-container text-on-error-container"
                        }`}
                      >
                        {tenant.subscription.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-outline">Dönem Sonu</span>
                      <span className="text-xs font-mono text-on-surface">
                        {tenant.subscription.currentPeriodEnd
                          ? new Date(tenant.subscription.currentPeriodEnd).toLocaleDateString("tr-TR")
                          : "—"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-outline">Abonelik bulunamadı.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Kullanıcılar Tab */}
        {tab === "users" && (
          <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-outline/10 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">group</span>
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Kullanıcılar</h3>
            </div>
            <div className="p-8 text-center text-outline text-sm">
              Kullanıcı listesi için ayrı API çağrısı gereklidir.
            </div>
          </div>
        )}

        {/* Aktivite Logu Tab */}
        {tab === "activity" && (
          <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-outline/10 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-base">history</span>
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Aktivite Logu</h3>
            </div>
            {tenant.recentAuditLogs.length === 0 ? (
              <div className="p-8 text-center text-outline text-sm">Aktivite kaydı bulunamadı.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="dense-table w-full">
                  <thead>
                    <tr>
                      <th>Zaman</th>
                      <th>Kullanıcı</th>
                      <th>Modül</th>
                      <th>Seviye</th>
                      <th>Mesaj</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenant.recentAuditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="font-mono text-[10px] text-outline whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString("tr-TR")}
                        </td>
                        <td className="text-[10px]">
                          {log.user ? (
                            <div>
                              <p className="font-bold text-on-surface">{log.user.name}</p>
                              <p className="text-outline">{log.user.email}</p>
                            </div>
                          ) : (
                            <span className="text-outline">—</span>
                          )}
                        </td>
                        <td>
                          <span className="font-mono text-[10px] font-bold text-on-surface">{log.module}</span>
                        </td>
                        <td>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              LEVEL_BADGE[log.level] ?? "bg-surface-variant text-on-surface-variant"
                            }`}
                          >
                            {log.level}
                          </span>
                        </td>
                        <td className="max-w-xs truncate text-on-surface-variant text-[10px]">{log.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Abonelik Tab */}
        {tab === "subscription" && (
          <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm p-6">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest mb-4">Abonelik Detayı</h3>
            {tenant.subscription ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Plan Adı", value: tenant.subscription.plan.name },
                    {
                      label: "Aylık Fiyat",
                      value: tenant.subscription.plan.priceMonthly
                        ? `₺${tenant.subscription.plan.priceMonthly.toLocaleString("tr-TR")}`
                        : "—",
                    },
                    { label: "Durum", value: tenant.subscription.status },
                    {
                      label: "Dönem Sonu",
                      value: tenant.subscription.currentPeriodEnd
                        ? new Date(tenant.subscription.currentPeriodEnd).toLocaleDateString("tr-TR")
                        : "—",
                    },
                  ].map((item) => (
                    <div key={item.label} className="p-3 bg-surface-container-low rounded border border-outline/10">
                      <p className="text-[9px] font-bold text-outline uppercase tracking-widest mb-0.5">
                        {item.label}
                      </p>
                      <p className="text-sm font-bold text-on-surface">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-2">
                  <Link
                    href={`/super-admin/subscriptions/${tenant.subscription.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded text-xs font-bold hover:bg-primary/90 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                    Abonelik Detayına Git
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-sm text-outline">Bu firma için abonelik kaydı bulunamadı.</p>
            )}
          </div>
        )}
      </div>

      <SuperAdminFooter />
    </>
  )
}
