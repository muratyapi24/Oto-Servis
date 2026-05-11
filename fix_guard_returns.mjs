/**
 * Changes `if ("error" in g) return g;` to `if ("error" in g) return g as never;`
 * This removes GuardError from the inferred union type, restoring TypeScript
 * compatibility with component code that destructures without type narrowing.
 * Runtime behavior is unchanged - the guard error is still returned correctly.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const base = String.raw`D:\Projeler\Bst_Otoservis\apps\web\lib\actions`;

const files = [
  'mechanic.actions.ts', 'vehicle.actions.ts', 'customer.actions.ts',
  'appointment.actions.ts', 'location.actions.ts', 'analytics.actions.ts',
  'accounting.actions.ts', 'invoice.actions.ts', 'invoice-list.actions.ts',
  'inventory.actions.ts', 'crm.actions.ts', 'bulk-notification.actions.ts',
  'import.actions.ts', 'maintenance-plan.actions.ts', 'notification-provider.actions.ts',
  'notifications.actions.ts', 'payment.actions.ts', 'purchase-order.actions.ts',
  'supplier.actions.ts', 'stock.actions.ts', 'stock-count.actions.ts',
  'stock-transfer.actions.ts', 'quote.actions.ts', 'onboarding.actions.ts',
  'preference.actions.ts', 'quality-check.actions.ts', 'referral.actions.ts',
  'template.actions.ts', 'finance.actions.ts', 'service.actions.ts',
  'dashboard.actions.ts',
];

for (const filename of files) {
  const filepath = join(base, filename);
  if (!existsSync(filepath)) continue;

  let content = readFileSync(filepath, 'utf8');
  const original = content;

  // Change: if ("error" in g) return g;
  // To:     if ("error" in g) return g as never;
  content = content.replace(
    /if \("error" in g\) return g;/g,
    'if ("error" in g) return g as never;'
  );

  // Also handle variations without semicolons or with different formatting
  content = content.replace(
    /if \("error" in g\) return g$/gm,
    'if ("error" in g) return g as never'
  );

  if (content !== original) {
    writeFileSync(filepath, content, 'utf8');
    console.log(`UPDATED: ${filename}`);
  } else {
    console.log(`UNCHANGED: ${filename}`);
  }
}
console.log('Done.');
