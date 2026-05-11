/**
 * Replaces useState(MOCK_XXX) with useState(__DEV__ ? MOCK_XXX : [])
 * and direct MOCK_ renders with conditional renders.
 * This prevents mock data from appearing in production builds.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const base = String.raw`D:\Projeler\Bst_Otoservis\apps\mobile`;

const files = [
  'app/(firma)/bildirimler.tsx',
  'app/(firma)/mesajlar.tsx',
  'app/(musteri)/bildirimler.tsx',
  'app/(musteri)/mesajlar.tsx',
  'app/(musteri)/belgeler/[id].tsx',
  'app/(musteri)/makbuz/[id].tsx',
  'app/(musteri)/odeme.tsx',
  'app/(musteri)/odemeler.tsx',
];

for (const filename of files) {
  const filepath = join(base, filename);
  if (!existsSync(filepath)) { console.log(`SKIP: ${filename}`); continue; }

  let content = readFileSync(filepath, 'utf8');
  const original = content;

  // 1. useState(MOCK_XXX) → useState(__DEV__ ? MOCK_XXX : [])
  content = content.replace(
    /useState<[^>]+>\(MOCK_(\w+)\)/g,
    (match, name) => {
      // Replace the full useState call with __DEV__ guard
      return match.replace(`MOCK_${name}`, `(__DEV__ ? MOCK_${name} : [] as Parameters<typeof useState>[0])`);
    }
  );

  // Simpler pattern without type param: useState(MOCK_XXX)
  content = content.replace(
    /useState\(MOCK_(\w+)\)/g,
    'useState(__DEV__ ? MOCK_$1 : [])'
  );

  // 2. {MOCK_THREADS.map(...)} → {(__DEV__ ? MOCK_THREADS : []).map(...)}
  content = content.replace(
    /\{MOCK_(\w+)\.map\(/g,
    '{(__DEV__ ? MOCK_$1 : []).map('
  );

  // 3. {MOCK_XXX.length === 0 ? ...} → {(MOCK_XXX.length === 0 || !__DEV__) ? ...}
  // Skip this - too risky

  // 4. return MOCK_SERVICES.filter(...) → return (__DEV__ ? MOCK_SERVICES : []).filter(...)
  content = content.replace(
    /return MOCK_(\w+)\.(filter|find|map)\(/g,
    'return (__DEV__ ? MOCK_$1 : []).$2('
  );

  if (content !== original) {
    writeFileSync(filepath, content, 'utf8');
    console.log(`UPDATED: ${filename}`);
  } else {
    console.log(`UNCHANGED: ${filename}`);
  }
}
console.log('Done.');
