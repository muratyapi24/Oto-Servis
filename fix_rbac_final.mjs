/**
 * Final RBAC guard cleanup.
 * Normalizes CRLF to LF, applies patterns, restores CRLF if original had it.
 * Handles all remaining auth() → guardTenant() replacements.
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const base = 'apps/web/lib/actions';
const files = readdirSync(base).filter(f => f.endsWith('.actions.ts'));

let totalFixed = 0;

for (const filename of files) {
  const fp = join(base, filename);
  const raw = readFileSync(fp, 'utf8');

  // Detect CRLF
  const hasCRLF = raw.includes('\r\n');
  // Work with LF only
  let content = hasCRLF ? raw.replace(/\r\n/g, '\n') : raw;
  const original = content;

  // Skip files that don't use raw auth() anymore
  if (!content.includes('const session = await auth()')) {
    continue;
  }

  // Determine destructure: does this file use session.user.id?
  const usesUserId = /session\.user\.id\b/.test(content);
  const destructure = usesUserId ? 'const { tenantId, session } = g;' : 'const { tenantId } = g;';

  // Replace ALL remaining auth() patterns with guardTenant:
  // Pattern A: single-line guard + tenantId extraction (may have blank lines between)
  content = content.replace(
    /( +)const session = await auth\(\);\n +if \(!session\?\.user\?\.tenantId\)[^}]+?\}[^\n]*\n( +)const tenantId = session\.user\.tenantId;/g,
    (_, indent) => `${indent}const g = await guardTenant();\n${indent}if ("error" in g) return g as never;\n${indent}${destructure}`
  );

  // Pattern B: single-line return (no tenantId line after)
  content = content.replace(
    /( +)const session = await auth\(\);\n +if \(!session\?\.user\?\.tenantId\) return \{[^}]+\};/g,
    (_, indent) => `${indent}const g = await guardTenant();\n${indent}if ("error" in g) return g as never;\n${indent}${destructure}`
  );

  // Pattern C: multi-line if block (no tenantId line after)
  content = content.replace(
    /( +)const session = await auth\(\);\n +if \(!session\?\.user\?\.tenantId\) \{\n +return \{[^}]+\};\n +\}/g,
    (_, indent) => `${indent}const g = await guardTenant();\n${indent}if ("error" in g) return g as never;\n${indent}${destructure}`
  );

  // Pattern D: multi-line if block + tenantId after (with optional blank lines)
  content = content.replace(
    /( +)const session = await auth\(\);\n +if \(!session\?\.user\?\.tenantId\) \{\n +return \{[^}]+\};\n +\}\n+( +)const tenantId = session\.user\.tenantId;/g,
    (_, indent) => `${indent}const g = await guardTenant();\n${indent}if ("error" in g) return g as never;\n${indent}${destructure}`
  );

  // Pattern E: combined role + tenantId check
  content = content.replace(
    /( +)const session = await auth\(\);\n +if \(!session\?\.user\?\.tenantId[^)]*\)\s*\{?\s*\n +return \{[^}]+\};\s*\n? +\}?/g,
    (_, indent) => `${indent}const g = await guardTenant();\n${indent}if ("error" in g) return g as never;\n${indent}${destructure}`
  );

  // Remove any remaining session.user.tenantId references (replace with extracted tenantId)
  if (!usesUserId) {
    content = content.replace(/\bsession\.user\.tenantId\b/g, 'tenantId');
  } else {
    // For files with session.user.id, we still need tenantId from session.user.tenantId
    // But session is available via destructure
    content = content.replace(/\bsession\.user\.tenantId\b/g, 'tenantId');
  }

  // Remove auth import if no longer used
  if (!content.match(/\bauth\s*\(/)) {
    content = content.replace(/^import \{ auth \} from "@\/auth";\n/m, '');
  }

  // Add guardTenant import if needed but missing
  if (content.includes('guardTenant') && !content.includes('from "@/lib/guards"')) {
    content = content.replace(
      /^("use server";\n)/m,
      `$1\nimport { guardTenant } from "@/lib/guards";\n`
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

  if (content !== original) {
    // Restore CRLF if original had it
    const out = hasCRLF ? content.replace(/\n/g, '\r\n') : content;
    writeFileSync(fp, out, 'utf8');
    console.log('FIXED:', filename);
    totalFixed++;
  }
}

console.log('\nTotal files fixed:', totalFixed);
