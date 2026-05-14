"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import type { ComponentType } from "react";
import { DASHBOARD_WORKSPACE_NAV } from "@/lib/dashboard-ui-standards";
import { canAccess } from "@/lib/permissions";

type WorkspaceNavTone = "amber" | "blue" | "cyan" | "emerald" | "violet";
type WorkspaceNavVariant = "cards" | "compact";

export type WorkspaceNavTab<TIcon extends string = string> = {
  label: string;
  description?: string;
  href: string;
  icon: TIcon;
};

type WorkspaceNavProps<TIcon extends string> = {
  tabs: WorkspaceNavTab<TIcon>[];
  icons: Record<TIcon, ComponentType<{ className?: string }>>;
  tone?: WorkspaceNavTone;
  variant?: WorkspaceNavVariant;
  columns?: 2 | 3 | 4 | 5 | 7;
  exactRootHrefs?: string[];
  isActiveTab?: (pathname: string | null, href: string) => boolean;
};

const GRID_CLASSES: Record<NonNullable<WorkspaceNavProps<string>["columns"]>, string> = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  7: "md:grid-cols-3 xl:grid-cols-7",
};

function defaultIsActiveTab(
  pathname: string | null,
  href: string,
  exactRootHrefs: string[]
) {
  if (exactRootHrefs.includes(href)) {
    return pathname === href;
  }

  return pathname === href || pathname?.startsWith(`${href}/`);
}

export default function WorkspaceNav<TIcon extends string>({
  tabs,
  icons,
  tone = "blue",
  variant = "cards",
  columns = 3,
  exactRootHrefs = [],
  isActiveTab,
}: WorkspaceNavProps<TIcon>) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const visibleTabs = role ? tabs.filter((tab) => canAccess(role, tab.href)) : tabs;
  const toneClasses = DASHBOARD_WORKSPACE_NAV.tones[tone];

  if (variant === "compact") {
    return (
      <nav className={DASHBOARD_WORKSPACE_NAV.compactShell}>
        {visibleTabs.map((tab) => {
          const Icon = icons[tab.icon] as ComponentType<{ className?: string }>;
          const isActive = isActiveTab
            ? isActiveTab(pathname, tab.href)
            : defaultIsActiveTab(pathname, tab.href, exactRootHrefs);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`${DASHBOARD_WORKSPACE_NAV.compactItem} ${
                isActive
                  ? toneClasses.active
                  : DASHBOARD_WORKSPACE_NAV.itemIdle
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? toneClasses.activeIcon : DASHBOARD_WORKSPACE_NAV.iconIdle}`} />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className={`${DASHBOARD_WORKSPACE_NAV.cardsShell} ${GRID_CLASSES[columns]}`}>
      {visibleTabs.map((tab) => {
        const Icon = icons[tab.icon] as ComponentType<{ className?: string }>;
        const isActive = isActiveTab
          ? isActiveTab(pathname, tab.href)
          : defaultIsActiveTab(pathname, tab.href, exactRootHrefs);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`${DASHBOARD_WORKSPACE_NAV.cardItem} ${
              isActive
                ? toneClasses.active
                : DASHBOARD_WORKSPACE_NAV.itemIdle
            }`}
          >
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${isActive ? toneClasses.activeIcon : DASHBOARD_WORKSPACE_NAV.iconIdle}`} />
            <span className="min-w-0">
              <span className="block text-sm font-black leading-5">{tab.label}</span>
              {tab.description && (
                <span className={DASHBOARD_WORKSPACE_NAV.description}>
                  {tab.description}
                </span>
              )}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
