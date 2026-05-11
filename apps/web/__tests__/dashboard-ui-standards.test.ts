import {
  DASHBOARD_LAYOUT,
  DASHBOARD_SURFACES,
  DASHBOARD_TYPOGRAPHY,
  dashboardPageContainerClass,
} from "@/lib/dashboard-ui-standards";

describe("dashboard UI standards", () => {
  it("defines one spacing contract for dashboard chrome and pages", () => {
    expect(DASHBOARD_LAYOUT.sidebarWidth).toBe("w-64");
    expect(DASHBOARD_LAYOUT.mainOffset).toBe("ml-64");
    expect(DASHBOARD_LAYOUT.pagePadding).toBe("p-8");
    expect(dashboardPageContainerClass()).toContain("p-8");
    expect(dashboardPageContainerClass()).toContain("max-w-7xl");
  });

  it("keeps dashboard page typography below marketing hero scale", () => {
    expect(DASHBOARD_TYPOGRAPHY.pageTitle).toContain("text-3xl");
    expect(DASHBOARD_TYPOGRAPHY.pageTitle).not.toContain("text-4xl");
    expect(DASHBOARD_TYPOGRAPHY.sectionLabel).toContain("text-xs");
  });

  it("sets restrained SaaS surface styles for repeated dashboard components", () => {
    expect(DASHBOARD_SURFACES.card).toContain("rounded-xl");
    expect(DASHBOARD_SURFACES.card).not.toMatch(/rounded-2xl|rounded-3xl/);
    expect(DASHBOARD_SURFACES.panel).toContain("shadow-sm");
  });
});
