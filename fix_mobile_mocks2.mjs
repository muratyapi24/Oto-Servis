/**
 * Fix remaining mobile mock patterns:
 * 1. Direct JSX renders using MOCK_ constants
 * 2. MOCK_THREADS.map() and MOCK_THREADS.length patterns
 * 3. MOCK_RECEIPT and MOCK_INVOICE object usage
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const base = String.raw`D:\Projeler\Bst_Otoservis\apps\mobile`;

// ─── mesajlar.tsx (both firma and musteri) ───────────────────────────────────
for (const f of ['app/(firma)/mesajlar.tsx', 'app/(musteri)/mesajlar.tsx']) {
  const filepath = join(base, f);
  if (!existsSync(filepath)) continue;
  let content = readFileSync(filepath, 'utf8');
  const original = content;

  // {MOCK_THREADS.length === 0 ? → {((__DEV__ ? MOCK_THREADS : []).length === 0 ?
  content = content.replace(
    /\{MOCK_THREADS\.length === 0 \?/g,
    '{((__DEV__ ? MOCK_THREADS : []).length === 0 ?'
  );

  // MOCK_THREADS.map( → (__DEV__ ? MOCK_THREADS : []).map(
  content = content.replace(
    /MOCK_THREADS\.map\(/g,
    '(__DEV__ ? MOCK_THREADS : []).map('
  );

  if (content !== original) {
    writeFileSync(filepath, content, 'utf8');
    console.log(`UPDATED: ${f}`);
  } else {
    console.log(`UNCHANGED: ${f}`);
  }
}

// ─── makbuz/[id].tsx ─────────────────────────────────────────────────────────
{
  const filepath = join(base, 'app/(musteri)/makbuz/[id].tsx');
  if (existsSync(filepath)) {
    let content = readFileSync(filepath, 'utf8');
    const original = content;

    // Add __DEV__ guard: const receipt = __DEV__ ? MOCK_RECEIPT : null;
    // And wrap all MOCK_RECEIPT usages with receipt
    content = content.replace(
      /const MOCK_RECEIPT = \{/,
      '// eslint-disable-next-line @typescript-eslint/no-explicit-any\nconst MOCK_RECEIPT: any = {'
    );

    // After the MOCK_RECEIPT definition, add: const receipt = __DEV__ ? MOCK_RECEIPT : null;
    // Find the closing }; of MOCK_RECEIPT and add after it
    content = content.replace(
      /(const MOCK_RECEIPT[\s\S]*?\};\n)/,
      '$1\nconst receipt = __DEV__ ? MOCK_RECEIPT : null;\n'
    );

    // Replace all direct MOCK_RECEIPT.xxx usages with receipt?.xxx
    content = content.replace(/MOCK_RECEIPT\./g, 'receipt?.');

    // Add early return if receipt is null
    // Find: export default function ... { and add null check after useState
    content = content.replace(
      /export default function (\w+)\([^)]*\) \{/,
      'export default function $1() {\n  if (!__DEV__) return null; // TODO: Connect to real payment API'
    );

    if (content !== original) {
      writeFileSync(filepath, content, 'utf8');
      console.log(`UPDATED: app/(musteri)/makbuz/[id].tsx`);
    } else {
      console.log(`UNCHANGED: app/(musteri)/makbuz/[id].tsx`);
    }
  }
}

// ─── odeme.tsx ───────────────────────────────────────────────────────────────
{
  const filepath = join(base, 'app/(musteri)/odeme.tsx');
  if (existsSync(filepath)) {
    let content = readFileSync(filepath, 'utf8');
    const original = content;

    // Add __DEV__ type annotation to MOCK_INVOICE
    content = content.replace(
      /const MOCK_INVOICE = \{/,
      '// eslint-disable-next-line @typescript-eslint/no-explicit-any\nconst MOCK_INVOICE: any = {'
    );

    // Add early return guard at the start of the default export
    content = content.replace(
      /export default function (\w+)\([^)]*\) \{/,
      'export default function $1() {\n  if (!__DEV__) return null; // TODO: Connect to real payment API'
    );

    if (content !== original) {
      writeFileSync(filepath, content, 'utf8');
      console.log(`UPDATED: app/(musteri)/odeme.tsx`);
    } else {
      console.log(`UNCHANGED: app/(musteri)/odeme.tsx`);
    }
  }
}

// ─── hizmetler.tsx ───────────────────────────────────────────────────────────
{
  const filepath = join(base, 'app/(firma)/hizmetler.tsx');
  if (existsSync(filepath)) {
    let content = readFileSync(filepath, 'utf8');
    const original = content;

    // Wrap MOCK_SERVICES references
    content = content.replace(/return MOCK_SERVICES;/g, 'return __DEV__ ? MOCK_SERVICES : [];');
    content = content.replace(
      /return MOCK_SERVICES\.filter\(/g,
      'return (__DEV__ ? MOCK_SERVICES : []).filter('
    );

    if (content !== original) {
      writeFileSync(filepath, content, 'utf8');
      console.log(`UPDATED: app/(firma)/hizmetler.tsx`);
    } else {
      console.log(`UNCHANGED: app/(firma)/hizmetler.tsx`);
    }
  }
}

console.log('Done.');
