import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const base = String.raw`D:\Projeler\Bst_Otoservis\apps\web\lib\actions`;

const files = [
  'mechanic.actions.ts',
  'appointment.actions.ts',
  'analytics.actions.ts',
  'accounting.actions.ts',
  'bulk-notification.actions.ts',
  'crm.actions.ts',
  'import.actions.ts',
  'invoice.actions.ts',
  'maintenance-plan.actions.ts',
  'notification-provider.actions.ts',
  'notifications.actions.ts',
  'onboarding.actions.ts',
  'payment.actions.ts',
  'preference.actions.ts',
  'purchase-order.actions.ts',
  'quality-check.actions.ts',
  'quote.actions.ts',
  'referral.actions.ts',
  'stock-count.actions.ts',
  'stock-transfer.actions.ts',
  'stock.actions.ts',
  'supplier.actions.ts',
  'template.actions.ts',
  'vehicle.actions.ts',
];

for (const filename of files) {
  const filepath = join(base, filename);
  if (!existsSync(filepath)) { console.log(`SKIP: ${filename}`); continue; }

  let content = readFileSync(filepath, 'utf8');
  const original = content;

  // Remove old auth import
  content = content.replace(/import \{ auth \} from "@\/auth"\n/g, '');
  content = content.replace(/import \{ auth \} from "@\/auth";\n/g, '');

  // Fix: remove duplicate guard imports
  content = content.replace(
    /(import \{ guardTenantRole, guardTenant \} from "@\/lib\/guards";\n)+/g,
    'import { guardTenantRole, guardTenant } from "@/lib/guards";\n'
  );

  // Replace common auth patterns using string replacement approach
  // We'll do multiple targeted passes

  // Pattern A: "try {\n    const session = await auth();\n    if (!session?.user?.tenantId) {\n      return { error: "..." };\n    }\n    const tenantId = session.user.tenantId;"
  // This is complex regex - let's split into lines and process
  const lines = content.split('\n');
  const newLines = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trimStart();
    const indent = line.length - trimmed.length;
    const spaces = ' '.repeat(indent);

    // Detect: "try {" followed by auth check
    if (trimmed === 'try {') {
      // Look ahead for auth pattern
      const next1 = lines[i + 1]?.trim() ?? '';
      const next2 = lines[i + 2]?.trim() ?? '';
      const next3 = lines[i + 3]?.trim() ?? '';
      const next4 = lines[i + 4]?.trim() ?? '';

      // Pattern: try { \n  const session = await auth(); \n  if (!session?.user?.tenantId) { \n    return { error: ... }; \n  } \n  const tenantId = ...
      if (next1 === 'const session = await auth();' || next1 === "const session = await auth()") {
        const hasMultiLineCheck = next2.startsWith('if (!session?.user?.tenantId)') && next2.endsWith('{');
        const hasSingleLineCheck = next2.startsWith('if (!session?.user?.tenantId)') && (next2.includes('return {') || next2.includes("return { error"));
        const hasTenantId = next3 === 'const tenantId = session.user.tenantId;' || next4 === 'const tenantId = session.user.tenantId;';

        if (hasMultiLineCheck) {
          // Multi-line if block: skip the entire pattern (try {, const session, if block, const tenantId)
          newLines.push(`${spaces}const g = await guardTenant();`);
          newLines.push(`${spaces}if ("error" in g) return g;`);
          newLines.push(`${spaces}const { tenantId } = g;`);
          newLines.push(`${spaces}try {`);
          i++; // skip "try {"
          i++; // skip "const session = await auth();"
          // skip the if block: lines until we find the closing }
          while (i < lines.length) {
            const l = lines[i].trim();
            i++;
            if (l === '}') break;
          }
          // skip const tenantId if present
          if (lines[i]?.trim() === 'const tenantId = session.user.tenantId;' ||
              lines[i]?.trim() === 'const tenantId = tenantId;') {
            i++;
          }
          continue;
        } else if (hasSingleLineCheck) {
          newLines.push(`${spaces}const g = await guardTenant();`);
          newLines.push(`${spaces}if ("error" in g) return g;`);
          newLines.push(`${spaces}const { tenantId } = g;`);
          newLines.push(`${spaces}try {`);
          i++; // skip "try {"
          i++; // skip const session
          i++; // skip single-line if
          if (lines[i]?.trim() === 'const tenantId = session.user.tenantId;') i++;
          continue;
        }
      }
    }

    // Detect: "const session = await auth();" outside try block
    if (trimmed === 'const session = await auth();' || trimmed === "const session = await auth()") {
      const next1 = lines[i + 1]?.trim() ?? '';
      const next2 = lines[i + 2]?.trim() ?? '';

      if (next1.startsWith('if (!session?.user?.tenantId)')) {
        // Generate guard
        newLines.push(`${spaces}const g = await guardTenant();`);
        i++; // skip const session
        // Skip the if line
        newLines.push(`${spaces}if ("error" in g) return g;`);
        i++; // skip if line
        // Check if next is const tenantId
        if (lines[i]?.trim() === 'const tenantId = session.user.tenantId;') {
          newLines.push(`${spaces}const { tenantId } = g;`);
          i++; // skip const tenantId
        } else {
          newLines.push(`${spaces}const { tenantId } = g;`);
        }
        continue;
      }
    }

    newLines.push(line);
    i++;
  }

  content = newLines.join('\n');

  // Replace remaining session.user.tenantId -> tenantId
  content = content.replace(/session\.user\.tenantId/g, 'tenantId');

  // Remove orphaned "const session = await auth();" lines
  content = content.replace(/^\s*const session = await auth\(\);\n/gm, '');

  if (content !== original) {
    writeFileSync(filepath, content, 'utf8');
    console.log(`UPDATED: ${filename}`);
  } else {
    console.log(`UNCHANGED: ${filename}`);
  }
}
console.log('Done.');
