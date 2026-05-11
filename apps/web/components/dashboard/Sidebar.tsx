"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { filterNavItems } from "@/lib/permissions";
import { useEffect, useState } from "react";
import { getTenantProfile } from "@/lib/actions/tenant.actions";
import {
  DASHBOARD_NAV_GROUPS,
  flattenDashboardNavGroups,
} from "@/lib/dashboard-navigation";
import { DASHBOARD_LAYOUT } from "@/lib/dashboard-ui-standards";

// Flatten all items for permission filtering
const allMenuItems = flattenDashboardNavGroups(DASHBOARD_NAV_GROUPS);

export function Sidebar() {
  const pathname = usePathname();

  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const tenantId = session?.user?.tenantId;

  const accessibleHrefs = new Set(
    filterNavItems(userRole, allMenuItems).map((i) => i.href)
  );

  const [tenantInfo, setTenantInfo] = useState<{
    name: string;
    logoUrl?: string;
    slogan?: string;
  } | null>(null);

  useEffect(() => {
    if (tenantId) {
      getTenantProfile().then((res) => {
        if (res?.tenant) {
          setTenantInfo({
            name: res.tenant.name,
            logoUrl: res.tenant.logoUrl || undefined,
            slogan: res.tenant.slogan || undefined,
          });
        }
      });
    }
  }, [tenantId]);

  return (
    <aside
      className={`h-screen ${DASHBOARD_LAYOUT.sidebarWidth} fixed left-0 top-0 bg-blue-50/50 flex flex-col py-4 z-50 overflow-y-auto border-r border-outline-variant/15`}
    >
      {/* Brand */}
      <div className="px-6 mb-6 flex items-center space-x-3 shrink-0">
        <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center overflow-hidden shrink-0">
          {tenantInfo?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenantInfo.logoUrl}
              alt="Firma Logosu"
              className="w-full h-full object-cover"
            />
          ) : (
            <span
              className="material-symbols-outlined text-white"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              precision_manufacturing
            </span>
          )}
        </div>
        <div className="flex-1 overflow-hidden" title={tenantInfo?.name}>
          <h1 className="text-lg font-black text-blue-800 leading-tight truncate">
            {tenantInfo?.name || "Yükleniyor..."}
          </h1>
          <p
            className="text-[10px] uppercase tracking-widest text-slate-500 font-bold truncate"
            title={tenantInfo?.slogan || ""}
          >
            {tenantInfo
              ? tenantInfo.slogan || "Oto Servis Yönetimi"
              : "..."}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-0.5">
        {DASHBOARD_NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) =>
            accessibleHrefs.has(item.href)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label || "home"} className="mb-2">
              {group.label && (
                <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 select-none">
                  {group.label}
                </p>
              )}
              {visibleItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname?.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-4 py-2.5 rounded-lg mx-1 transition-all ${
                      isActive
                        ? "bg-blue-100 text-blue-800 font-semibold translate-x-1"
                        : "text-slate-600 hover:bg-white/60 hover:translate-x-1"
                    }`}
                  >
                    <span
                      className="material-symbols-outlined mr-3 text-[20px] shrink-0"
                      style={
                        isActive
                          ? { fontVariationSettings: "'FILL' 1" }
                          : undefined
                      }
                    >
                      {item.icon}
                    </span>
                    <span className="text-sm truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0 mt-2 px-4 pb-2">
        <Link
          href="/dashboard/settings/billing"
          className="block bg-primary-container p-4 rounded-xl text-white mb-3 group hover:shadow-lg transition-all"
        >
          <p className="text-xs font-semibold opacity-80 mb-1">ABONELİK</p>
          <p className="text-sm font-bold mb-3">Paketinizi Yönetin</p>
          <span className="w-full py-2 bg-secondary-container group-hover:bg-secondary rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">upgrade</span>
            Planı Yükselt
          </span>
        </Link>
        <div className="space-y-0.5">
          <Link
            href="/dashboard/settings/billing"
            className="flex items-center px-3 py-2 text-slate-500 text-sm hover:text-primary transition-colors rounded-lg hover:bg-white/40"
          >
            <span className="material-symbols-outlined text-[16px] mr-2.5">credit_card</span>
            Abonelik & Fatura
          </Link>
          <Link
            href="#"
            className="flex items-center px-3 py-2 text-slate-500 text-sm hover:text-primary transition-colors rounded-lg hover:bg-white/40"
          >
            <span className="material-symbols-outlined text-[16px] mr-2.5">help</span>
            Yardım Merkezi
          </Link>
          <button
            onClick={() => signOut()}
            className="flex items-center w-full px-3 py-2 text-slate-500 text-sm hover:text-error transition-colors rounded-lg hover:bg-white/40"
          >
            <span className="material-symbols-outlined text-[16px] mr-2.5">logout</span>
            Çıkış Yap
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
