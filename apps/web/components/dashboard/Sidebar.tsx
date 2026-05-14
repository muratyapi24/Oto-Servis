"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { filterNavItems, resolveNavItemHref } from "@/lib/permissions";
import { useEffect, useState } from "react";
import { getTenantProfile } from "@/lib/actions/tenant.actions";
import {
  DASHBOARD_NAV_GROUPS,
  flattenDashboardNavGroups,
  isDashboardNavItemActive,
} from "@/lib/dashboard-navigation";
import { DASHBOARD_CHROME } from "@/lib/dashboard-ui-standards";

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
    <aside className={DASHBOARD_CHROME.sidebarShell}>
      {/* Brand */}
      <div className={DASHBOARD_CHROME.sidebarBrand}>
        <div className={DASHBOARD_CHROME.sidebarLogo}>
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
          <h1 className={DASHBOARD_CHROME.sidebarBrandTitle}>
            {tenantInfo?.name || "Yükleniyor..."}
          </h1>
          <p
            className={DASHBOARD_CHROME.sidebarBrandSubtitle}
            title={tenantInfo?.slogan || ""}
          >
            {tenantInfo
              ? tenantInfo.slogan || "Oto Servis Yönetimi"
              : "..."}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className={DASHBOARD_CHROME.sidebarNav}>
        {DASHBOARD_NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) =>
            accessibleHrefs.has(item.href)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label || "home"} className={DASHBOARD_CHROME.sidebarGroup}>
              {group.label && (
                <p className={DASHBOARD_CHROME.sidebarGroupLabel}>
                  {group.label}
                </p>
              )}
              {visibleItems.map((item) => {
                const targetHref = resolveNavItemHref(userRole, item);
                const isActive = isDashboardNavItemActive(item, pathname);

                return (
                  <Link
                    key={item.href}
                    href={targetHref}
                    className={`${DASHBOARD_CHROME.sidebarItem} ${
                      isActive
                        ? DASHBOARD_CHROME.sidebarItemActive
                        : DASHBOARD_CHROME.sidebarItemIdle
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
      <div className={DASHBOARD_CHROME.sidebarFooter}>
        <Link
          href="/dashboard/settings/billing"
          className={DASHBOARD_CHROME.sidebarUpgradeCard}
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
            className={DASHBOARD_CHROME.sidebarFooterLink}
          >
            <span className="material-symbols-outlined text-[16px] mr-2.5">credit_card</span>
            Abonelik & Fatura
          </Link>
          <Link
            href="#"
            className={DASHBOARD_CHROME.sidebarFooterLink}
          >
            <span className="material-symbols-outlined text-[16px] mr-2.5">help</span>
            Yardım Merkezi
          </Link>
          <button
            onClick={() => signOut()}
            className={DASHBOARD_CHROME.sidebarFooterDanger}
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
