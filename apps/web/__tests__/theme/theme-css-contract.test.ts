import fs from "node:fs";
import path from "node:path";

describe("theme CSS contract", () => {
  const globalsCss = fs.readFileSync(
    path.join(process.cwd(), "app/globals.css"),
    "utf8"
  );

  it("binds Tailwind dark variants to the html dark class", () => {
    expect(globalsCss).toContain(
      "@custom-variant dark (&:where(.dark, .dark *));"
    );
  });

  it("keeps the document body on theme tokens instead of fixed light colors", () => {
    const bodyRule = globalsCss.match(/body\s*\{(?<body>[\s\S]*?)\}/)?.groups
      ?.body;

    expect(bodyRule).toContain("background-color: var(--color-background)");
    expect(bodyRule).toContain("color: var(--color-on-background)");
    expect(bodyRule).not.toContain("background-color: #f8f9ff");
    expect(bodyRule).not.toContain("color: #0b1c30");
  });

  it("keeps the dashboard live ticker on a dark-safe container color", () => {
    const dashboardSource = fs.readFileSync(
      path.join(
        process.cwd(),
        "components/dashboard/overview/DashboardBoardClient.tsx"
      ),
      "utf8"
    );

    expect(dashboardSource).toContain("bg-primary-container");
    expect(dashboardSource).not.toContain("dark:bg-primary/90");
  });

  it("keeps notification history surfaces on dark-safe dashboard tokens", () => {
    const notificationsPageSource = fs.readFileSync(
      path.join(process.cwd(), "app/(dashboard)/dashboard/notifications/page.tsx"),
      "utf8"
    );
    const notificationListSource = fs.readFileSync(
      path.join(
        process.cwd(),
        "app/(dashboard)/dashboard/notifications/NotificationListClient.tsx"
      ),
      "utf8"
    );
    const bulkNotificationSource = fs.readFileSync(
      path.join(
        process.cwd(),
        "app/(dashboard)/dashboard/notifications/bulk/BulkNotificationClient.tsx"
      ),
      "utf8"
    );
    const templateNotificationSource = fs.readFileSync(
      path.join(
        process.cwd(),
        "app/(dashboard)/dashboard/notifications/templates/TemplatesClient.tsx"
      ),
      "utf8"
    );
    const dashboardStandardsSource = fs.readFileSync(
      path.join(process.cwd(), "lib/dashboard-ui-standards.ts"),
      "utf8"
    );
    const clientSources = [
      notificationListSource,
      bulkNotificationSource,
      templateNotificationSource,
    ];
    const combinedNotificationsSource = [
      notificationsPageSource,
      ...clientSources,
    ].join("\n");

    expect(notificationsPageSource).toContain("DASHBOARD_SURFACES");
    for (const source of clientSources) {
      expect(source).toContain("DASHBOARD_LIST");
      expect(source).toContain("DASHBOARD_FORMS");
      expect(source).toContain("DASHBOARD_SURFACES");
    }
    expect(combinedNotificationsSource).not.toMatch(
      /\b(?:bg-white|bg-slate-50|border-slate-100|divide-slate-100|text-slate-900)\b/
    );
    expect(dashboardStandardsSource).toMatch(
      /amber:\s*\{\s*active:\s*"[^"]*\bdark:bg-/
    );
  });

  it("keeps the service board on dark-safe dashboard tokens", () => {
    const serviceBoardSource = fs.readFileSync(
      path.join(process.cwd(), "components/dashboard/services/ServiceBoardClient.tsx"),
      "utf8"
    );

    expect(serviceBoardSource).toContain("DASHBOARD_SURFACES");
    expect(serviceBoardSource).toContain("DASHBOARD_FORMS");
    expect(serviceBoardSource).toContain("DASHBOARD_LIST");
    expect(serviceBoardSource).not.toMatch(
      /\b(?:bg-white|bg-slate-50|border-slate-100|divide-slate-100|text-slate-900|text-slate-800)\b/
    );
    expect(serviceBoardSource).not.toContain("dark:bg-gray-800/50/50");
  });
});
