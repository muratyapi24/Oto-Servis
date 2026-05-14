import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import path from "path";

const workspaceRoot = process.cwd();

const workspaceNavWrappers = [
  "components/dashboard/customers/CustomerWorkspaceNav.tsx",
  "components/dashboard/finances/FinanceWorkspaceNav.tsx",
  "components/dashboard/inventory/InventoryWorkspaceNav.tsx",
  "components/dashboard/notifications/NotificationWorkspaceNav.tsx",
  "components/dashboard/reports/ReportWorkspaceNav.tsx",
  "components/dashboard/services/ServiceWorkspaceNav.tsx",
  "components/dashboard/settings/SettingsWorkspaceNav.tsx",
  "components/dashboard/team/TeamWorkspaceNav.tsx",
];

function readAppFile(relativePath: string) {
  return readFileSync(path.join(workspaceRoot, relativePath), "utf8");
}

function listFiles(root: string, fileName: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const fullPath = path.join(root, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      return listFiles(fullPath, fileName);
    }

    return entry === fileName ? [fullPath] : [];
  });
}

describe("workspace navigation standardization", () => {
  it("centralizes workspace tab rendering in one shared dashboard component", () => {
    expect(existsSync(path.join(workspaceRoot, "components/dashboard/WorkspaceNav.tsx"))).toBe(true);

    for (const relativePath of workspaceNavWrappers) {
      const source = readAppFile(relativePath);

      expect(source).toContain("@/components/dashboard/WorkspaceNav");
      expect(source).toContain("<WorkspaceNav");
      expect(source).not.toContain("<nav className=");
      expect(source).not.toContain("rounded-xl border border-slate-200 bg-white p-2 shadow-sm");
    }
  });

  it("keeps each dashboard page owned by a single workspace navigation surface", () => {
    const dashboardPagesRoot = path.join(workspaceRoot, "app/(dashboard)/dashboard");
    const pageFiles = listFiles(dashboardPagesRoot, "page.tsx");

    for (const filePath of pageFiles) {
      const source = readFileSync(filePath, "utf8");
      const workspaceImports = source.match(/import\s+\w+WorkspaceNav\s+from/g) ?? [];

      expect(workspaceImports.length).toBeLessThanOrEqual(1);
    }
  });
});
