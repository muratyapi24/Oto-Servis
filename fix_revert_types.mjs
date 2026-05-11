// Revert explicit return types added by fix_return_types.mjs
// They're causing more TypeScript errors than they fix
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

  // Remove explicit return types added by fix_return_types.mjs
  // Pattern: ): Promise<{ ... }> {
  content = content.replace(
    /\): Promise<\{[^}]*\}>\s*\{/g,
    ') {'
  );

  // Also handle nested braces
  content = content.replace(
    /\): Promise<\{[^{}]*\{[^{}]*\}[^{}]*\}>\s*\{/g,
    ') {'
  );

  if (content !== original) {
    writeFileSync(filepath, content, 'utf8');
    console.log(`REVERTED: ${filename}`);
  } else {
    console.log(`UNCHANGED: ${filename}`);
  }
}
console.log('Done.');
