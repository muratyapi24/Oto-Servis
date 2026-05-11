export const DASHBOARD_LAYOUT = {
  sidebarWidth: "w-64",
  mainOffset: "ml-64",
  headerHeight: "min-h-16",
  pagePadding: "p-8",
  pageMaxWidth: "max-w-7xl",
  pageGap: "space-y-6",
} as const;

export const DASHBOARD_TYPOGRAPHY = {
  sectionLabel: "text-xs font-bold tracking-widest uppercase text-slate-500",
  pageTitle: "text-3xl font-bold text-on-surface tracking-tight",
  pageSubtitle: "text-sm text-slate-600 font-medium leading-6",
  cardTitle: "text-base font-semibold text-on-surface",
  body: "text-sm text-on-surface-variant leading-6",
  meta: "text-xs text-slate-500",
} as const;

export const DASHBOARD_SURFACES = {
  card: "bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-sm",
  panel: "bg-surface-container-lowest border border-outline-variant/25 rounded-xl shadow-sm",
  mutedPanel: "bg-surface-container-low border border-outline-variant/20 rounded-xl",
} as const;

export function dashboardPageContainerClass(className = "") {
  return [
    DASHBOARD_LAYOUT.pagePadding,
    DASHBOARD_LAYOUT.pageGap,
    DASHBOARD_LAYOUT.pageMaxWidth,
    "mx-auto w-full",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}
