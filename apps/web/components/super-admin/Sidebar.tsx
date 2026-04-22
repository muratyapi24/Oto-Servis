"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { signOut, useSession } from "next-auth/react"

type NavItem = { name: string; href: string; icon: string }
type NavGroup = { id: string; label: string; icon: string; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  {
    id: "ana-yonetim",
    label: "Ana Yönetim",
    icon: "dashboard",
    items: [
      { name: "Sistem Sağlığı",       href: "/super-admin",                    icon: "monitor_heart" },
      { name: "Komuta Merkezi",        href: "/super-admin/command-center",     icon: "radar" },
      { name: "Stratejik İçgörüler",   href: "/super-admin/strategic-insights", icon: "insights" },
      { name: "SaaS Genel Bakış",      href: "/super-admin/saas-overview",      icon: "cloud" },
    ]
  },
  {
    id: "tenant-kullanici",
    label: "Tenant & Kullanıcı",
    icon: "apartment",
    items: [
      { name: "Firmalar",              href: "/super-admin/tenants",            icon: "apartment" },
      { name: "Kullanıcı Dizini",      href: "/super-admin/users",              icon: "group" },
      { name: "Yetki & Rol Yönetimi",  href: "/super-admin/roles",              icon: "admin_panel_settings" },
      { name: "Tenant Performans",     href: "/super-admin/tenant-performance", icon: "leaderboard" },
    ]
  },
  {
    id: "abonelik-finans",
    label: "Abonelik & Finans",
    icon: "subscriptions",
    items: [
      { name: "Abonelikler",           href: "/super-admin/subscriptions",      icon: "subscriptions" },
      { name: "Paketler",              href: "/super-admin/plans",              icon: "inventory_2" },
      { name: "Ödemeler",              href: "/super-admin/payments",           icon: "account_balance_wallet" },
      { name: "Ödeme Operasyonları",   href: "/super-admin/payment-operations", icon: "payments" },
      { name: "İndirim & Kuponlar",    href: "/super-admin/coupons",            icon: "local_offer" },
      { name: "Ek Hizmetler",          href: "/super-admin/addons",             icon: "extension" },
    ]
  },
  {
    id: "teknik-altyapi",
    label: "Teknik Altyapı",
    icon: "dns",
    items: [
      { name: "Güvenlik Tehdit İzleme", href: "/super-admin/security",          icon: "security" },
      { name: "Veritabanı Sağlığı",    href: "/super-admin/database-health",    icon: "storage" },
      { name: "Yedekleme & Kurtarma",  href: "/super-admin/backup-recovery",    icon: "backup" },
      { name: "Bulut Maliyet",         href: "/super-admin/cloud-costs",        icon: "cloud_done" },
      { name: "Kapasite Planlama",     href: "/super-admin/capacity",           icon: "speed" },
      { name: "Altyapı Haritası",      href: "/super-admin/infrastructure",     icon: "hub" },
      { name: "Dağıtım & Güncelleme",  href: "/super-admin/deployments",        icon: "rocket_launch" },
    ]
  },
  {
    id: "analitik-raporlama",
    label: "Analitik & Raporlama",
    icon: "bar_chart",
    items: [
      { name: "Analitik",              href: "/super-admin/analytics",          icon: "bar_chart_4_bars" },
      { name: "Raporlar",              href: "/super-admin/reports",            icon: "summarize" },
      { name: "Özel Rapor",            href: "/super-admin/reports/custom",     icon: "edit_note" },
    ]
  },
  {
    id: "operasyon",
    label: "Operasyon",
    icon: "support_agent",
    items: [
      { name: "Destek Kuyruğu",        href: "/super-admin/support",            icon: "support_agent" },
      { name: "NPS Paneli",            href: "/super-admin/nps",                icon: "sentiment_satisfied" },
      { name: "Bildirimler",           href: "/super-admin/notifications",      icon: "notifications" },
      { name: "Otomasyon İş Akışı",    href: "/super-admin/automation",         icon: "account_tree" },
    ]
  },
  {
    id: "gelistirici-guvenlik",
    label: "Geliştirici & Güvenlik",
    icon: "code",
    items: [
      { name: "API Entegrasyonlar",    href: "/super-admin/api-integrations",   icon: "api" },
      { name: "Geliştirici Portal",    href: "/super-admin/developer",          icon: "terminal" },
      { name: "KMS",                   href: "/super-admin/kms",                icon: "key" },
      { name: "Denetim Kasası",        href: "/super-admin/audit",              icon: "gavel" },
    ]
  },
  {
    id: "sistem-diagnostics",
    label: "Sistem Diagnostics",
    icon: "settings",
    items: [
      { name: "Loglar",                href: "/super-admin/logs",               icon: "history" },
      { name: "Ayarlar",               href: "/super-admin/settings",           icon: "settings" },
      { name: "Arşiv & Veri Temizleme", href: "/super-admin/archive",           icon: "archive" },
      { name: "Mobil Uygulama Yönetimi", href: "/super-admin/mobile-management", icon: "phone_android" },
    ]
  },
]

const STORAGE_KEY = "bst-sidebar-groups"

function useSidebarState(pathname: string) {
  const activeGroupId = NAV_GROUPS.find(g =>
    g.items.some(item =>
      item.href === "/super-admin"
        ? pathname === "/super-admin"
        : pathname === item.href || pathname.startsWith(item.href + "/")
    )
  )?.id

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return activeGroupId ? { [activeGroupId]: true } : {}
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const parsed = stored ? JSON.parse(stored) : {}
      if (activeGroupId) parsed[activeGroupId] = true
      return parsed
    } catch {
      return activeGroupId ? { [activeGroupId]: true } : {}
    }
  })

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => {
      const next = { ...prev, [groupId]: !prev[groupId] }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  return { openGroups, toggleGroup, activeGroupId }
}

const isItemActive = (item: NavItem, pathname: string) =>
  item.href === "/super-admin"
    ? pathname === "/super-admin"
    : pathname === item.href || pathname.startsWith(item.href + "/")

export default function SuperAdminSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { openGroups, toggleGroup } = useSidebarState(pathname)

  const userName = session?.user?.name || "Admin"
  const userInitials = userName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)

  return (
    <aside className="w-64 bg-inverse-surface text-inverse-on-surface flex flex-col h-full border-r border-outline/20 shrink-0">
      {/* Logo */}
      <div className="p-4 flex flex-col justify-center border-b border-outline-variant/10 bg-black/10 h-16 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white text-lg">analytics</span>
          </div>
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold tracking-tight text-surface-bright uppercase truncate">BST COMMAND CENTER</h1>
            <p className="text-[9px] font-bold text-tertiary-fixed opacity-80 uppercase tracking-widest">v4.2.0 Stable</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV_GROUPS.map(group => {
          const isOpen = !!openGroups[group.id]
          return (
            <div key={group.id} className="mb-0.5">
              {/* Grup başlığı */}
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-outline/70">{group.icon}</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-outline/70">{group.label}</span>
                </div>
                <span className={`material-symbols-outlined text-sm text-outline/50 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                  expand_more
                </span>
              </button>

              {/* Grup öğeleri */}
              {isOpen && (
                <div className="pb-1">
                  {group.items.map(item => {
                    const active = isItemActive(item, pathname)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-1.5 mx-1 rounded transition-colors ${
                          active
                            ? "bg-primary/20 text-white border-l-2 border-primary"
                            : "hover:bg-white/5 text-surface-dim border-l-2 border-transparent"
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">{item.icon}</span>
                        <span className={`text-xs truncate ${active ? "font-semibold" : "font-medium"}`}>{item.name}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Kullanıcı */}
      <div className="p-3 border-t border-outline-variant/10 bg-black/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary-container text-white flex items-center justify-center text-xs font-bold shrink-0">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate">{userName}</p>
            <p className="text-[9px] text-outline uppercase truncate">Super Admin</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/superadmin-login" })}
            className="material-symbols-outlined text-outline cursor-pointer hover:text-white text-lg transition-colors p-1 rounded hover:bg-white/5"
          >
            logout
          </button>
        </div>
      </div>
    </aside>
  )
}
