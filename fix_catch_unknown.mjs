/**
 * Fix TypeScript errors from removing `: any` on catch parameters.
 * Changes `error.message` access patterns to use type-safe alternatives.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { readdirSync, statSync } from 'fs';

const base = String.raw`D:\Projeler\Bst_Otoservis\apps\web`;

function getAllFiles(dir, results = []) {
  try {
    const items = readdirSync(dir);
    for (const item of items) {
      if (item === 'node_modules' || item === '.next' || item === '__tests__') continue;
      const fullPath = join(dir, item);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) getAllFiles(fullPath, results);
        else if (item.endsWith('.ts') || item.endsWith('.tsx')) results.push(fullPath);
      } catch {}
    }
  } catch {}
  return results;
}

const files = getAllFiles(base);
let totalFixed = 0;

for (const filepath of files) {
  let content;
  try { content = readFileSync(filepath, 'utf8'); } catch { continue; }
  const original = content;

  // Fix 1: error.message || "..." → (error instanceof Error ? error.message : String(error)) || "..."
  // But simpler: just cast to Error where .message is accessed

  // Pattern: } catch (error) { ... error.message ... }
  // Fix: Add type annotation back but use unknown-safe access

  // Most common pattern in catch blocks: return { error: "..." + error.message }
  // Replace: error.message → (error instanceof Error ? error.message : String(error))
  content = content.replace(
    /\berror\.message\b/g,
    '(error instanceof Error ? error.message : String(error))'
  );

  content = content.replace(
    /\berr\.message\b/g,
    '(err instanceof Error ? err.message : String(err))'
  );

  // Fix 2: error.name === "ZodError" → (error as any).name === "ZodError"
  // Actually use: error instanceof Error && error.name === "ZodError"
  content = content.replace(
    /error\.name === "ZodError"/g,
    'error instanceof Error && error.name === "ZodError"'
  );

  // Fix 3: error?.type, error?.digest in auth.actions.ts (Next.js specific)
  // Use (error as Record<string, unknown>)?.type
  content = content.replace(
    /error(\?\.)type(\s*===|\.includes)/g,
    '(error as Record<string, unknown>)$1type$2'
  );
  content = content.replace(
    /error(\?\.)digest(\s*===|\.includes)/g,
    '(error as Record<string, unknown>)$1digest$2'
  );

  // Fix 4: err?.message → (err instanceof Error ? err.message : String(err))
  content = content.replace(
    /err\?\.(message)\b/g,
    '(err instanceof Error ? err.message : String(err))'
  );

  if (content !== original) {
    writeFileSync(filepath, content, 'utf8');
    totalFixed++;
  }
}

console.log(`Fixed ${totalFixed} files.`);
