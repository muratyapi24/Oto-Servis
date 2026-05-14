import {
  DASHBOARD_ACTIONS,
  DASHBOARD_CHROME,
  DASHBOARD_DETAIL,
  DASHBOARD_FORMS,
  DASHBOARD_INSIGHT_RAIL,
  DASHBOARD_LIST,
  DASHBOARD_MODAL,
  DASHBOARD_LAYOUT,
  DASHBOARD_STATUS_BADGES,
  DASHBOARD_SURFACES,
  DASHBOARD_TYPOGRAPHY,
  DASHBOARD_WORKSPACE_NAV,
  dashboardPageContainerClass,
  dashboardStatusBadgeClass,
} from "@/lib/dashboard-ui-standards";
import fs from "node:fs";
import path from "node:path";

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

  it("centralizes dashboard chrome and workspace navigation classes", () => {
    expect(DASHBOARD_CHROME.sidebarShell).toContain(DASHBOARD_LAYOUT.sidebarWidth);
    expect(DASHBOARD_CHROME.headerShell).toContain(DASHBOARD_LAYOUT.headerHeight);
    expect(DASHBOARD_WORKSPACE_NAV.cardsShell).toContain("rounded-xl");

    const sidebarSource = fs.readFileSync(
      path.join(process.cwd(), "components/dashboard/Sidebar.tsx"),
      "utf8"
    );
    const headerSource = fs.readFileSync(
      path.join(process.cwd(), "components/dashboard/Header.tsx"),
      "utf8"
    );
    const workspaceNavSource = fs.readFileSync(
      path.join(process.cwd(), "components/dashboard/WorkspaceNav.tsx"),
      "utf8"
    );
    const pageShellSource = fs.readFileSync(
      path.join(process.cwd(), "components/dashboard/PageShell.tsx"),
      "utf8"
    );

    expect(sidebarSource).toContain("DASHBOARD_CHROME");
    expect(headerSource).toContain("DASHBOARD_CHROME");
    expect(workspaceNavSource).toContain("DASHBOARD_WORKSPACE_NAV");
    expect(pageShellSource).toContain("DASHBOARD_CHROME");
    expect(`${sidebarSource}\n${headerSource}`).not.toMatch(
      /\b(?:bg|text|hover:bg|hover:text|border|ring)-(?:blue|slate|gray)-/
    );
    expect(pageShellSource).not.toMatch(/\b(?:bg-white|text-slate|hover:text-blue|border-slate)-/);
  });

  it("keeps service detail pages on the shared PageShell spacing contract", () => {
    const serviceDetailSource = fs.readFileSync(
      path.join(process.cwd(), "app/(dashboard)/dashboard/services/[id]/page.tsx"),
      "utf8"
    );

    expect(serviceDetailSource).toContain("@/components/dashboard/PageShell");
    expect(serviceDetailSource).toContain("<PageShell");
    expect(serviceDetailSource).not.toMatch(/\b(?:p-6|px-6)\s+max-w-(?:5xl|7xl)\s+mx-auto/);
  });

  it("centralizes operational status badges instead of page-level color branches", () => {
    expect(DASHBOARD_STATUS_BADGES.base).toContain("rounded-full");
    expect(dashboardStatusBadgeClass("success")).toContain(DASHBOARD_STATUS_BADGES.tones.success);

    const serviceDetailSource = fs.readFileSync(
      path.join(process.cwd(), "app/(dashboard)/dashboard/services/[id]/page.tsx"),
      "utf8"
    );
    const quoteDetailSource = fs.readFileSync(
      path.join(process.cwd(), "app/(dashboard)/dashboard/quotes/[id]/page.tsx"),
      "utf8"
    );

    expect(serviceDetailSource).toContain("dashboardStatusBadgeClass");
    expect(quoteDetailSource).toContain("dashboardStatusBadgeClass");
    expect(`${serviceDetailSource}\n${quoteDetailSource}`).not.toMatch(
      /bg-(?:green|red|orange|blue|gray)-100\s+text-(?:green|red|orange|blue|gray)-[78]00/
    );
  });

  it("centralizes repeated detail-page panels and table surfaces", () => {
    expect(DASHBOARD_DETAIL.infoCard).toContain("rounded-xl");
    expect(DASHBOARD_DETAIL.tableShell).toContain("overflow-hidden");

    const serviceDetailSource = fs.readFileSync(
      path.join(process.cwd(), "app/(dashboard)/dashboard/services/[id]/page.tsx"),
      "utf8"
    );
    const quoteDetailSource = fs.readFileSync(
      path.join(process.cwd(), "app/(dashboard)/dashboard/quotes/[id]/page.tsx"),
      "utf8"
    );

    expect(serviceDetailSource).toContain("DASHBOARD_DETAIL");
    expect(quoteDetailSource).toContain("DASHBOARD_DETAIL");
    expect(`${serviceDetailSource}\n${quoteDetailSource}`).not.toMatch(
      /bg-white\s+(?:rounded-xl\s+shadow-sm\s+border\s+border-gray-200|border\s+border-gray-200\s+rounded-xl)/
    );
    expect(`${serviceDetailSource}\n${quoteDetailSource}`).not.toMatch(
      /bg-gray-50\s+(?:px-5\s+py-4|p-5\s+flex|border-t\s+p-5)/
    );
  });

  it("centralizes detail-page table cells, notes, and summary rows", () => {
    expect(DASHBOARD_DETAIL.tableHeaderCell).toContain("px-5 py-3");
    expect(DASHBOARD_DETAIL.tableCellWide).toContain("px-6 py-4");
    expect(DASHBOARD_DETAIL.notePanel).toContain("bg-surface-container-low");
    expect(DASHBOARD_DETAIL.summaryTotalRowWide).toContain("border-t");

    const serviceDetailSource = fs.readFileSync(
      path.join(process.cwd(), "app/(dashboard)/dashboard/services/[id]/page.tsx"),
      "utf8"
    );
    const quoteDetailSource = fs.readFileSync(
      path.join(process.cwd(), "app/(dashboard)/dashboard/quotes/[id]/page.tsx"),
      "utf8"
    );
    const combinedSource = `${serviceDetailSource}\n${quoteDetailSource}`;

    expect(combinedSource).not.toMatch(/className="(?:px-5 py-3|px-6 py-4)/);
    expect(combinedSource).not.toMatch(/className="(?:hover:bg-gray-50|bg-gray-50 border|bg-blue-50 border)/);
    expect(combinedSource).not.toMatch(/className="(?:flex justify-between w-full max-w-xs|w-full max-w-sm flex justify-between)/);
  });

  it("extends detail standards to the financial invoice detail shell", () => {
    const invoiceDetailSource = fs.readFileSync(
      path.join(process.cwd(), "app/(dashboard)/dashboard/finances/invoices/[id]/InvoiceDetailClient.tsx"),
      "utf8"
    );

    expect(invoiceDetailSource).toContain("DASHBOARD_DETAIL");
    expect(invoiceDetailSource).toContain("dashboardStatusBadgeClass");
    expect(invoiceDetailSource).not.toMatch(/className:\s*"bg-(?:gray|blue|green|red)-100/);
    expect(invoiceDetailSource).not.toMatch(
      /className="(?:md:col-span-2\s+)?bg-white\s+border\s+border-gray-200\s+rounded-xl\s+shadow-sm/
    );
    expect(invoiceDetailSource).not.toMatch(/className="flex items-center gap-2 px-5 py-4 border-b bg-gray-50/);
    expect(invoiceDetailSource).not.toMatch(/className="px-5 py-10 text-center text-gray-400 text-sm/);
  });

  it("centralizes financial invoice payment form controls", () => {
    expect(DASHBOARD_FORMS.label).toContain("text-xs");
    expect(DASHBOARD_FORMS.control).toContain("bg-surface-container-low");
    expect(DASHBOARD_FORMS.primaryButton).toContain("bg-primary");

    const invoiceDetailSource = fs.readFileSync(
      path.join(process.cwd(), "app/(dashboard)/dashboard/finances/invoices/[id]/InvoiceDetailClient.tsx"),
      "utf8"
    );

    expect(invoiceDetailSource).toContain("DASHBOARD_FORMS");
    expect(invoiceDetailSource).not.toMatch(/className="block text-xs font-bold text-gray-600 mb-1/);
    expect(invoiceDetailSource).not.toMatch(/className="w-full p-2\.5 bg-gray-50 border border-gray-300/);
    expect(invoiceDetailSource).not.toMatch(/className="mb-4 p-3 bg-(?:red|green)-50 text-(?:red|green)-/);
    expect(invoiceDetailSource).not.toMatch(/type="submit" disabled=\{submitting\} className="px-6 py-2\.5 bg-blue-600/);
  });

  it("centralizes financial invoice header actions and modal chrome", () => {
    expect(DASHBOARD_ACTIONS.backLink).toContain("bg-surface-container-low");
    expect(DASHBOARD_ACTIONS.secondaryButton).toContain("border-outline-variant");
    expect(DASHBOARD_ACTIONS.primaryButton).toContain("bg-primary");
    expect(DASHBOARD_MODAL.dialog).toContain("max-w-lg");
    expect(DASHBOARD_MODAL.title).toContain("text-on-surface");

    const invoiceDetailSource = fs.readFileSync(
      path.join(process.cwd(), "app/(dashboard)/dashboard/finances/invoices/[id]/InvoiceDetailClient.tsx"),
      "utf8"
    );

    expect(invoiceDetailSource).toContain("DASHBOARD_ACTIONS");
    expect(invoiceDetailSource).toContain("DASHBOARD_MODAL");
    expect(invoiceDetailSource).not.toMatch(/className="bg-white rounded-2xl shadow-2xl/);
    expect(invoiceDetailSource).not.toMatch(/className="font-bold text-gray-900 flex items-center gap-2/);
    expect(invoiceDetailSource).not.toMatch(/className="text-sm font-bold text-gray-400 hover:text-gray-900 bg-gray-100/);
    expect(invoiceDetailSource).not.toMatch(/className="text-2xl font-bold text-gray-900/);
    expect(invoiceDetailSource).not.toMatch(/className="flex items-center gap-2 px-4 py-2 (?:border border-gray-200|bg-gray-900|bg-blue-600)/);
  });

  it("centralizes customer list and insight rail surfaces", () => {
    expect(DASHBOARD_LIST.shell).toContain("overflow-hidden");
    expect(DASHBOARD_LIST.toolbar).toContain("border-outline-variant");
    expect(DASHBOARD_INSIGHT_RAIL.heroCard).toContain("rounded-xl");
    expect(DASHBOARD_INSIGHT_RAIL.statCard).toContain("shadow-sm");

    const customersPageSource = fs.readFileSync(
      path.join(process.cwd(), "app/(dashboard)/dashboard/customers/page.tsx"),
      "utf8"
    );
    const customerTableSource = fs.readFileSync(
      path.join(process.cwd(), "components/dashboard/customers/CustomerTableClient.tsx"),
      "utf8"
    );
    const combinedSource = `${customersPageSource}\n${customerTableSource}`;

    expect(customersPageSource).toContain("DASHBOARD_INSIGHT_RAIL");
    expect(customerTableSource).toContain("DASHBOARD_LIST");
    expect(customerTableSource).toContain("DASHBOARD_ACTIONS");
    expect(customerTableSource).toContain("DASHBOARD_FORMS");
    expect(combinedSource).not.toMatch(/bg-white\s+(?:rounded-xl|p-5|rounded-2xl)/);
    expect(combinedSource).not.toMatch(/bg-primary-container text-white p-6 rounded-3xl/);
    expect(customerTableSource).not.toMatch(/bg-orange-600|bg-blue-50|bg-red-50|border-slate|text-slate|bg-slate/);
  });

  it("centralizes customer detail shell and repeated history panels", () => {
    expect(DASHBOARD_DETAIL.profileHeader).toContain("bg-surface-container-lowest");
    expect(DASHBOARD_DETAIL.profileAvatar).toContain("bg-primary/10");
    expect(DASHBOARD_DETAIL.linkListRow).toContain("hover:bg-surface-container-low");
    expect(DASHBOARD_DETAIL.financeMetricValueDanger).toContain("text-error");

    const customerDetailSource = fs.readFileSync(
      path.join(process.cwd(), "app/(dashboard)/dashboard/customers/[id]/CustomerDetailClient.tsx"),
      "utf8"
    );

    expect(customerDetailSource).toContain("DASHBOARD_DETAIL");
    expect(customerDetailSource).toContain("DASHBOARD_ACTIONS");
    expect(customerDetailSource).toContain("dashboardStatusBadgeClass");
    expect(customerDetailSource).not.toMatch(
      /bg-(?:gray|blue|orange|green|red)-100\s+text-(?:gray|blue|orange|green|red)-[78]00/
    );
    expect(customerDetailSource).not.toMatch(
      /bg-white\s+border\s+border-gray-200\s+rounded-xl\s+shadow-sm/
    );
    expect(customerDetailSource).not.toMatch(
      /className="flex items-center gap-2 px-5 py-4 border-b bg-gray-50/
    );
    expect(customerDetailSource).not.toMatch(
      /className="px-5 py-10 text-center text-gray-400 text-sm/
    );
  });

  it("centralizes customer detail edit modal and form controls", () => {
    expect(DASHBOARD_MODAL.dialogWide).toContain("max-w-2xl");
    expect(DASHBOARD_MODAL.header).toContain("border-outline-variant");
    expect(DASHBOARD_FORMS.select).toContain("bg-surface-container-low");

    const customerDetailSource = fs.readFileSync(
      path.join(process.cwd(), "app/(dashboard)/dashboard/customers/[id]/CustomerDetailClient.tsx"),
      "utf8"
    );

    expect(customerDetailSource).toContain("DASHBOARD_MODAL");
    expect(customerDetailSource).toContain("DASHBOARD_FORMS");
    expect(customerDetailSource).not.toMatch(/className="bg-white rounded-xl shadow-xl/);
    expect(customerDetailSource).not.toMatch(/className="flex items-center justify-between p-6 border-b sticky top-0 bg-white/);
    expect(customerDetailSource).not.toMatch(/className="w-full p-2\.5 bg-gray-50 border border-gray-300/);
    expect(customerDetailSource).not.toMatch(/const inputCls =\s*"w-full p-2\.5 bg-gray-50/);
    expect(customerDetailSource).not.toMatch(/className="block text-sm font-medium text-gray-700 mb-1/);
    expect(customerDetailSource).not.toMatch(/className="px-4 py-2 border border-gray-300/);
    expect(customerDetailSource).not.toMatch(/className="px-6 py-2 bg-primary text-white/);
  });

  it("centralizes vehicle detail shell, history table, and edit modal", () => {
    const vehicleDetailSource = fs.readFileSync(
      path.join(process.cwd(), "app/(dashboard)/dashboard/vehicles/[id]/VehicleDetailClient.tsx"),
      "utf8"
    );

    expect(vehicleDetailSource).toContain("DASHBOARD_DETAIL");
    expect(vehicleDetailSource).toContain("DASHBOARD_ACTIONS");
    expect(vehicleDetailSource).toContain("DASHBOARD_FORMS");
    expect(vehicleDetailSource).toContain("DASHBOARD_MODAL");
    expect(vehicleDetailSource).toContain("dashboardStatusBadgeClass");
    expect(vehicleDetailSource).not.toMatch(
      /bg-(?:gray|blue|orange|green|red)-100\s+text-(?:gray|blue|orange|green|red)-[78]00/
    );
    expect(vehicleDetailSource).not.toMatch(
      /bg-white\s+border\s+border-gray-200\s+rounded-xl\s+shadow-sm/
    );
    expect(vehicleDetailSource).not.toMatch(
      /className="flex items-center gap-2 px-5 py-4 border-b bg-gray-50/
    );
    expect(vehicleDetailSource).not.toMatch(
      /className="px-5 py-10 text-center text-gray-400 text-sm/
    );
    expect(vehicleDetailSource).not.toMatch(/className="bg-white rounded-xl shadow-xl/);
    expect(vehicleDetailSource).not.toMatch(/const inputCls =\s*"w-full p-2\.5 bg-gray-50/);
    expect(vehicleDetailSource).not.toMatch(/className="block text-sm font-medium text-gray-700 mb-1/);
  });

  it("centralizes mechanic detail, work lists, and staff form modal surfaces", () => {
    const mechanicDetailSource = fs.readFileSync(
      path.join(process.cwd(), "app/(dashboard)/dashboard/mechanics/[id]/MechanicDetailClient.tsx"),
      "utf8"
    );
    const mechanicFormSource = fs.readFileSync(
      path.join(process.cwd(), "components/dashboard/mechanics/MechanicFormModal.tsx"),
      "utf8"
    );
    const sharedModalSource = fs.readFileSync(
      path.join(process.cwd(), "components/ui/Modal.tsx"),
      "utf8"
    );
    const combinedSource = `${mechanicDetailSource}\n${mechanicFormSource}\n${sharedModalSource}`;

    expect(mechanicDetailSource).toContain("DASHBOARD_DETAIL");
    expect(mechanicDetailSource).toContain("dashboardStatusBadgeClass");
    expect(mechanicFormSource).toContain("DASHBOARD_FORMS");
    expect(mechanicFormSource).toContain("DASHBOARD_ACTIONS");
    expect(sharedModalSource).toContain("DASHBOARD_MODAL");
    expect(combinedSource).not.toMatch(/bg-white\s+rounded-(?:2xl|3xl|xl)/);
    expect(combinedSource).not.toMatch(/bg-(?:blue|green|amber|red|slate)-100\s+text-(?:blue|green|amber|red|slate)-[57]00/);
    expect(combinedSource).not.toMatch(/\b(?:bg|text|border|focus:border|hover:bg|hover:text)-(?:slate|blue|green|amber|red)-/);
    expect(mechanicFormSource).not.toMatch(/className="w-full bg-slate-50 border border-slate-200/);
    expect(mechanicFormSource).not.toMatch(/className="text-\[11px\] font-black uppercase tracking-widest text-slate-500/);
  });

  it("centralizes mechanic performance report and commission rule form surfaces", () => {
    const performanceReportSource = fs.readFileSync(
      path.join(process.cwd(), "components/dashboard/mechanics/PerformanceReport.tsx"),
      "utf8"
    );

    expect(performanceReportSource).toContain("DASHBOARD_DETAIL");
    expect(performanceReportSource).toContain("DASHBOARD_FORMS");
    expect(performanceReportSource).toContain("DASHBOARD_ACTIONS");
    expect(performanceReportSource).toContain("dashboardStatusBadgeClass");
    expect(performanceReportSource).not.toMatch(
      /bg-white\s+border\s+border-gray-200\s+rounded-xl\s+shadow-sm/
    );
    expect(performanceReportSource).not.toMatch(/const inputCls =\s*"w-full p-2\.5 bg-gray-50/);
    expect(performanceReportSource).not.toMatch(/className="block text-xs font-medium text-gray-600 mb-1/);
    expect(performanceReportSource).not.toMatch(
      /\b(?:bg|text|border|focus:ring|focus:border|hover:bg|hover:text)-(?:gray|blue|green|red|orange)-/
    );
  });
});
