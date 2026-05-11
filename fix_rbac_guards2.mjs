/**
 * Second-pass RBAC guard migration for files using { success: false, error: "..." } pattern.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const base = String.raw`D:\Projeler\Bst_Otoservis\apps\web\lib\actions`;

const targets = [
  'bulk-notification.actions.ts',
  'invoice.actions.ts',
  'payment.actions.ts',
  'purchase-order.actions.ts',
  'stock-count.actions.ts',
  'stock-transfer.actions.ts',
];

// Files that use session.user.id
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
  const destructure = withSession
    ? 'const { tenantId, session } = g;'
    : 'const { tenantId } = g;';

  // Pattern: multi-line if with { success: false, error: "..." } + optional tenantId extraction
  // Variant A: followed by const tenantId line
  content = content.replace(
    /(\s+)const session = await auth\(\);\n(\s+)if \(!session\?\.user\?\.tenantId\) \{\n(\s+)return \{ success: false, error: "[^"]*" \};\n(\s+)\}\n(\s+)const tenantId = session\.user\.tenantId;/g,
    (_, indent) =>
      `${indent}const g = await guardTenant();\n${indent}if ("error" in g) return g as never;\n${indent}${destructure}`
  );

  // Variant B: no tenantId extraction line after (tenantId used as session.user.tenantId later)
  content = content.replace(
    /(\s+)const session = await auth\(\);\n(\s+)if \(!session\?\.user\?\.tenantId\) \{\n(\s+)return \{ success: false, error: "[^"]*" \};\n(\s+)\}\n/g,
    (_, indent) =>
      `${indent}const g = await guardTenant();\n${indent}if ("error" in g) return g as never;\n${indent}${destructure}\n`
  );

  // Replace remaining direct session.user.tenantId
  content = content.replace(/\bsession\.user\.tenantId\b/g, 'tenantId');

  // Add guardTenant import if needed
  if (content.includes('guardTenant') && !content.includes('from "@/lib/guards"')) {
    content = content.replace(
      /^("use server";\n)/m,
      '$1\nimport { guardTenant } from "@/lib/guards";\n'
    );
  } else if (content.includes('guardTenant') && content.includes('from "@/lib/guards"')) {
    content = content.replace(
      /import \{ ([^}]+) \} from "@\/lib\/guards"/,
      (match, imports) => {
        if (imports.includes('guardTenant')) return match;
        return `import { ${imports.trim()}, guardTenant } from "@/lib/guards"`;
      }
    );
  }

  // Remove auth import if auth() is no longer called
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
