import { readFileSync } from "node:fs";
import path from "node:path";

function readProjectFile(...segments: string[]) {
  return readFileSync(path.join(process.cwd(), ...segments), "utf8");
}

describe("runtime performance contract", () => {
  it("serves the maintained Next landing page at root instead of the Tailwind CDN HTML export", () => {
    const nextConfig = readProjectFile("next.config.js");

    expect(nextConfig).not.toMatch(
      /source:\s*["']\/["'][\s\S]*?destination:\s*["']\/landing\/index\.html["']/,
    );
  });

  it("keeps the dev server on Turbopack like the faster SaaS workspace", () => {
    const packageJson = JSON.parse(readProjectFile("package.json")) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts.dev).toContain("--turbo");
  });

  it("keeps middleware off public marketing routes and out of Sentry's edge bundle", () => {
    const middleware = readProjectFile("middleware.ts");

    expect(middleware).not.toContain("@sentry/nextjs");
    expect(middleware).not.toContain("/((?!_next/static|_next/image|.*\\\\.png$).*)");
    expect(middleware).toContain("/dashboard/:path*");
    expect(middleware).toContain("/m/:path*");
    expect(middleware).toContain("/super-admin/:path*");
    expect(middleware).toContain("/api/((?!auth");
    expect(middleware).not.toContain("/api/:path*");
  });

  it("does not eagerly bundle Sentry on local builds when no DSN is configured", () => {
    const eagerSentryEntrypoints = [
      ["instrumentation.ts"],
      ["lib", "actions", "payment.actions.ts"],
      ["app", "api", "webhooks", "iyzico-subscription", "route.ts"],
    ];

    for (const entrypoint of eagerSentryEntrypoints) {
      const source = readProjectFile(...entrypoint);
      expect(source).not.toContain('import * as Sentry from "@sentry/nextjs"');
    }

    expect(readProjectFile("instrumentation.ts")).toContain(
      "if (!process.env.SENTRY_DSN) return;",
    );
  });

  it("trusts the local/proxy host so session bootstrap does not fail during first load", () => {
    const authConfig = readProjectFile("auth.config.ts");

    expect(authConfig).toContain("trustHost: true");
  });

  it("does not create optional Redis clients during server bootstrap", () => {
    const stockReorderCheck = readProjectFile(
      "lib",
      "inngest",
      "functions",
      "stock-reorder-check.ts",
    );

    expect(stockReorderCheck).not.toContain('import { Redis } from "@upstash/redis"');
    expect(stockReorderCheck).not.toContain("const redis = new Redis");
    expect(stockReorderCheck).toContain("async function getRedis()");
  });

  it("lazy-loads export libraries only when the user downloads a report", () => {
    const reportExport = readProjectFile("lib", "report-export.ts");

    expect(reportExport).not.toMatch(/^import\s+.*["']jspdf["']/m);
    expect(reportExport).not.toMatch(/^import\s+["']jspdf-autotable["']/m);
    expect(reportExport).not.toMatch(/^import\s+.*["']xlsx["']/m);
    expect(reportExport).toContain('await import("jspdf")');
    expect(reportExport).toContain('await import("jspdf-autotable")');
    expect(reportExport).toContain('await import("xlsx")');
  });

  it("keeps shared PDF capture libraries out of the initial dashboard client chunks", () => {
    const pdfUtils = readProjectFile("lib", "pdf-utils.ts");

    expect(pdfUtils).not.toMatch(/^import\s+.*["']jspdf["']/m);
    expect(pdfUtils).not.toMatch(/^import\s+.*["']html-to-image["']/m);
    expect(pdfUtils).toContain('await import("jspdf")');
    expect(pdfUtils).toContain('await import("html-to-image")');
  });

  it("splits tab panels and print-only layouts away from the default dashboard route payload", () => {
    const reportsTabs = readProjectFile(
      "app",
      "(dashboard)",
      "dashboard",
      "inventory",
      "reports",
      "ReportsTabs.tsx",
    );
    const servicePrintActions = readProjectFile(
      "app",
      "(dashboard)",
      "dashboard",
      "services",
      "[id]",
      "ServicePrintActions.tsx",
    );

    expect(reportsTabs).toContain('from "next/dynamic"');
    expect(reportsTabs).not.toMatch(/^import\s+StockValueReport/m);
    expect(reportsTabs).not.toMatch(/^import\s+MovementHistoryReport/m);
    expect(reportsTabs).not.toMatch(/^import\s+TopUsedPartsReport/m);
    expect(reportsTabs).not.toMatch(/^import\s+CriticalStockReport/m);

    expect(servicePrintActions).not.toContain('from "@/lib/pdf-utils"');
    expect(servicePrintActions).not.toContain('from "./PrintLayouts"');
    expect(servicePrintActions).toContain('await import("@/lib/pdf-utils")');
    expect(servicePrintActions).toContain("dynamic(");
  });

  it("does not ship Framer Motion on the login and registration entrypoints", () => {
    const authPages = [
      ["app", "login", "page.tsx"],
      ["app", "register", "page.tsx"],
      ["app", "m", "firma", "login", "page.tsx"],
      ["app", "m", "musteri", "login", "page.tsx"],
      ["app", "superadmin-login", "page.tsx"],
    ];

    for (const authPage of authPages) {
      const source = readProjectFile(...authPage);
      expect(source).not.toContain("framer-motion");
      expect(source).not.toContain("<motion.");
      expect(source).not.toContain("<AnimatePresence");
    }
  });

  it("keeps the shared dashboard modal free of animation bundles on first load", () => {
    const modal = readProjectFile("components", "ui", "Modal.tsx");

    expect(modal).not.toContain("framer-motion");
    expect(modal).not.toContain("AnimatePresence");
    expect(modal).not.toContain("motion.");
  });

  it("lazy-loads heavy form modals from dashboard board and list entrypoints", () => {
    const entrypoints: Array<[string[], string[]]> = [
      [
        ["components", "dashboard", "appointments", "AppointmentBoardClient.tsx"],
        ["AppointmentFormModal"],
      ],
      [
        ["components", "dashboard", "services", "ServiceBoardClient.tsx"],
        ["ServiceOrderFormModal"],
      ],
      [
        ["components", "dashboard", "customers", "CustomerTableClient.tsx"],
        ["CustomerFormModal"],
      ],
      [
        ["components", "dashboard", "mechanics", "MechanicListClient.tsx"],
        ["MechanicFormModal"],
      ],
      [
        ["components", "dashboard", "finances", "FinanceBoardClient.tsx"],
        ["PaymentFormModal", "InvoiceFormModal"],
      ],
      [
        ["components", "dashboard", "finances", "InvoiceListClient.tsx"],
        ["InvoiceFormModal"],
      ],
      [
        ["components", "dashboard", "vehicles", "VehicleListClient.tsx"],
        ["VehicleFormModal"],
      ],
      [
        ["components", "dashboard", "quotes", "QuoteBoardClient.tsx"],
        ["QuoteFormModal"],
      ],
    ];

    for (const [entrypoint, modals] of entrypoints) {
      const source = readProjectFile(...entrypoint);
      expect(source).toContain('from "next/dynamic"');

      for (const modalName of modals) {
        expect(source).not.toMatch(
          new RegExp(`^import\\s+${modalName}\\s+from`, "m"),
        );
        expect(source).toContain(`const ${modalName} = dynamic(`);
      }
    }
  });
});
