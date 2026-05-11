/**
 * Bulk-migrate action files from raw auth() to guardTenant() pattern.
 *
 * Replaces:
 *   const session = await auth();
 *   if (!session?.user?.tenantId) return { error: "..." };
 *   const tenantId = session.user.tenantId;
 * With:
 *   const g = await guardTenant();
 *   if ("error" in g) return g as never;
 *   const { tenantId } = g;
 *
 * For files that also use session.user.id, extracts session too:
 *   const { tenantId, session } = g;
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const base = String.raw`D:\Projeler\Bst_Otoservis\apps\web\lib\actions`;

const targets = [
  'accounting.actions.ts',
  'approval.actions.ts',
  'bulk-notification.actions.ts',
  'customer.actions.ts',
  'e-invoice.actions.ts',
  'finance.actions.ts',
  'inventory.actions.ts',
  'invoice.actions.ts',
  'maintenance-plan.actions.ts',
  'notification-provider.actions.ts',
  'notifications.actions.ts',
  'parasut.actions.ts',
  'payment.actions.ts',
  'preference.actions.ts',
  'purchase-order.actions.ts',
  'quality-check.actions.ts',
  'quote.actions.ts',
  'service.actions.ts',
  'stock-count.actions.ts',
  'stock-transfer.actions.ts',
  'stock.actions.ts',
  'supplier.actions.ts',
  'template.actions.ts',
  'tenant.actions.ts',
];

// Files that use session.user.id need to extract session from guard
const needsSession = new Set([
  'bulk-notification.actions.ts',
  'invoice.actions.ts',
  'payment.actions.ts',
  'purchase-order.actions.ts',
  'stock-count.actions.ts',
  'stock-transfer.actions.ts',
]);

let totalFixed = 0;

for (const filename of targets) {
  const filepath = join(base, filename);
  let content;
  try {
    content = readFileSync(filepath, 'utf8');
  } catch {
    console.log(`SKIP (not found): ${filename}`);
    continue;
  }

  const original = content;
  const withSession = needsSession.has(filename);
  const destructure = withSession ? 'const { tenantId, session } = g;' : 'const { tenantId } = g;';

  // Pattern 1: 3-line block (session + check + tenantId)
  // Handles various error message variants
  content = content.replace(
    /(\s+)const session = await auth\(\);\n(\s+)if \(!session\?\.user\?\.tenantId\) return \{ error: "([^"]*)" \};\n(\s+)const tenantId = session\.user\.tenantId;/g,
    (_, indent1) =>
      `${indent1}const g = await guardTenant();\n${indent1}if ("error" in g) return g as never;\n${indent1}${destructure}`
  );

  // Pattern 2: 3-line block with period-terminated error + tenantId
  content = content.replace(
    /(\s+)const session = await auth\(\);\n(\s+)if \(!session\?\.user\?\.tenantId\) return \{ error: "([^"]*)\." \};\n(\s+)const tenantId = session\.user\.tenantId;/g,
    (_, indent1) =>
      `${indent1}const g = await guardTenant();\n${indent1}if ("error" in g) return g as never;\n${indent1}${destructure}`
  );

  // Pattern 3: 2-line (session + check, no tenantId extraction right after)
  content = content.replace(
    /(\s+)const session = await auth\(\);\n(\s+)if \(!session\?\.user\?\.tenantId\) return \{ error: "([^"]*)" \};\n/g,
    (_, indent1) =>
      `${indent1}const g = await guardTenant();\n${indent1}if ("error" in g) return g as never;\n${indent1}${destructure}\n`
  );

  // Pattern 4: Multi-line if block variant
  content = content.replace(
    /(\s+)const session = await auth\(\);\n(\s+)if \(!session\?\.user\?\.tenantId\) \{\n(\s+)return \{ error: "([^"]*)" \};\n(\s+)\}\n(\s+)const tenantId = session\.user\.tenantId;/g,
    (_, indent1) =>
      `${indent1}const g = await guardTenant();\n${indent1}if ("error" in g) return g as never;\n${indent1}${destructure}`
  );

  // Also replace remaining direct session.user.tenantId references
  // (e.g. when tenantId wasn't extracted in a 2-line pattern above)
  if (!withSession) {
    content = content.replace(/session\.user\.tenantId/g, 'tenantId');
  }

  // Remove now-unused auth import if guardTenant import exists
  // First, add guardTenant import if missing
  if (content.includes('guardTenant') && !content.includes('from "@/lib/guards"')) {
    content = content.replace(
      /^("use server";\n)/m,
      '$1\nimport { guardTenant } from "@/lib/guards";'
    );
  } else if (content.includes('guardTenant') && content.includes('from "@/lib/guards"')) {
    // Import already present — ensure guardTenant is in the import list
    content = content.replace(
      /import \{ ([^}]+) \} from "@\/lib\/guards"/,
      (match, imports) => {
        if (imports.includes('guardTenant')) return match;
        return `import { ${imports.trim()}, guardTenant } from "@/lib/guards"`;
      }
    );
  }

  // Remove `import { auth } from "@/auth"` if auth is no longer used
  if (!content.match(/\bauth\s*\(/)) {
    content = content.replace(/^import \{ auth \} from "@\/auth";\n/m, '');
  }

  if (content !== original) {
    writeFileSync(filepath, content, 'utf8');
    console.log(`FIXED: ${filename}`);
    totalFixed++;
  } else {
    console.log(`SKIP (no change): ${filename}`);
  }
}

console.log(`\nTotal files fixed: ${totalFixed}`);
