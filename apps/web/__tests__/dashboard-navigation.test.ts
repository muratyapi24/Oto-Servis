import {
  DASHBOARD_NAV_GROUPS,
  DASHBOARD_QUICK_LINKS,
  MOBILE_WEB_NAV_ITEMS,
  flattenDashboardNavGroups,
} from "@/lib/dashboard-navigation";

describe("dashboard navigation contract", () => {
  const visibleSidebarItems = flattenDashboardNavGroups(DASHBOARD_NAV_GROUPS);
  const visibleHrefs = visibleSidebarItems.map((item) => item.href);

  it("uses one visible finance entry instead of splitting finance across sidebar modules", () => {
    expect(visibleHrefs).toContain("/dashboard/finances");
    expect(visibleHrefs).not.toContain("/dashboard/finance/invoices");
    expect(visibleHrefs).not.toContain("/dashboard/finance/payments");
  });

  it("keeps secondary workflows out of the top-level sidebar", () => {
    expect(visibleHrefs).not.toContain("/dashboard/crm");
    expect(visibleHrefs).not.toContain("/dashboard/locations");
    expect(visibleHrefs).not.toContain("/dashboard/settings/billing");
  });

  it("derives header quick links from visible dashboard destinations", () => {
    const quickLinkHrefs = DASHBOARD_QUICK_LINKS.map((item) => item.href);

    expect(quickLinkHrefs).toEqual([
      "/dashboard",
      "/dashboard/services",
      "/dashboard/customers",
      "/dashboard/finances",
    ]);

    for (const href of quickLinkHrefs) {
      expect(visibleHrefs).toContain(href);
    }
  });

  it("keeps mobile web navigation focused on daily field workflows", () => {
    const mobileHrefs = MOBILE_WEB_NAV_ITEMS.map((item) => item.href);

    expect(mobileHrefs).toEqual([
      "/m/firma/panel",
      "/m/firma/kuyruk",
      "/m/firma/araclar",
      "/m/firma/stok",
      "/m/firma/finans",
      "/m/firma/ayarlar",
    ]);
  });
});
