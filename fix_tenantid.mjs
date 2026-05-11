/**
 * Finds functions that use `const session = await auth()` and use bare `tenantId`
 * but don't have `const tenantId = session.user.tenantId;` - adds it back.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { readdirSync } from 'fs';

const base = String.raw`D:\Projeler\Bst_Otoservis\apps\web\lib\actions`;

const files = readdirSync(base).filter(f => f.endsWith('.ts'));

for (const filename of files) {
  const filepath = join(base, filename);
  let content = readFileSync(filepath, 'utf8');
  const original = content;

  // Pattern: after `if (!session?.user?.tenantId) return ...` or similar auth check,
  // if `tenantId` is used but `const tenantId` is not declared in the same function,
  // add `const tenantId = session.user.tenantId;`

  // We'll do a simpler approach: find functions that have:
  // 1. `const session = await auth()`
  // 2. No `const tenantId = ` declaration
  // 3. But use `tenantId` (not as part of session.user.tenantId)
  // And add `const tenantId = session.user.tenantId;` after the auth check line

  // Process line by line to find these patterns within function bodies
  const lines = content.split('\n');
  const newLines = [];

  let inFunction = false;
  let hasSessionAuth = false;
  let hasTenantIdDecl = false;
  let sessionCheckLineIdx = -1;
  let functionStartIdx = -1;
  let braceDepth = 0;

  // Simple approach: find patterns like:
  // `const session = await auth();`
  // followed by optional if check
  // then add `const tenantId = session.user.tenantId;` if not already present

  // Look for patterns like:
  // `    const session = await auth();`
  // `    if (!session?.user?.tenantId) ...`
  // We want to add `    const tenantId = session.user.tenantId;` after the if check

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const indent = line.match(/^(\s*)/)?.[1] ?? '';

    // Detect `const session = await auth();`
    if (trimmed.startsWith('const session = await auth()')) {
      // Look ahead: find the if check line
      let j = i + 1;
      while (j < lines.length && j < i + 5) {
        const nextTrimmed = lines[j].trim();
        if (nextTrimmed.startsWith('if (!session?.user?.tenantId)')) {
          // Check if there's already a `const tenantId` after this block
          // Look ahead a few more lines
          let hasTenantId = false;
          // Check the surrounding context for existing tenantId declaration
          for (let k = i - 5; k < Math.min(i + 15, lines.length); k++) {
            if (k >= 0 && lines[k].includes('const tenantId =')) {
              hasTenantId = true;
              break;
            }
          }

          if (!hasTenantId) {
            // Add tenantId declaration after the if check line
            // First, find where the if check block ends
            let ifEndLine = j;
            const ifLine = lines[j];

            if (ifLine.includes('{')) {
              // Multi-line if block - find closing }
              let depth = (ifLine.match(/\{/g) || []).length - (ifLine.match(/\}/g) || []).length;
              let k = j + 1;
              while (k < lines.length && depth > 0) {
                depth += (lines[k].match(/\{/g) || []).length;
                depth -= (lines[k].match(/\}/g) || []).length;
                if (depth <= 0) { ifEndLine = k; break; }
                k++;
              }
            }
            // Single-line if: the if check itself is the end

            // Mark to insert after ifEndLine
            newLines.push(line);
            // Continue adding lines until ifEndLine
            while (j <= ifEndLine) {
              newLines.push(lines[j]);
              j++;
            }
            i = j - 1;
            // Insert the tenantId declaration
            newLines.push(`${indent}const tenantId = session.user.tenantId;`);
            continue;
          }
          break;
        }
        j++;
      }
    }

    newLines.push(line);
  }

  content = newLines.join('\n');

  if (content !== original) {
    writeFileSync(filepath, content, 'utf8');
    console.log(`UPDATED: ${filename}`);
  } else {
    // console.log(`UNCHANGED: ${filename}`);
  }
}
console.log('Done.');
