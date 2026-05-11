/**
 * Adds explicit return types to action functions so component destructuring
 * works without TypeScript errors.
 * Pattern: Promise<{ error?: string; success?: string; [dataKey]?: unknown }>
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const base = String.raw`D:\Projeler\Bst_Otoservis\apps\web\lib\actions`;

// Map of function name patterns to their return type shape
// key = function name start (prefix), value = extra properties
const RETURN_SHAPES = {
  // Mutations - simple success/error
  'create': { success: 'string' },
  'update': { success: 'string' },
  'delete': { success: 'string' },
  'cancel': { success: 'string' },
  'void': { success: 'string' },
  'toggle': { success: 'string' },
  'send': { success: 'string' },
  'save': { success: 'string' },
  'test': { success: 'string' },
  'start': { success: 'string' },
  'import': { success: 'string', imported: 'number', errors: 'unknown[]' },
  'record': { success: 'string' },
  'sync': { success: 'string' },
  'generate': { success: 'string' },
  'add': { success: 'string' },
  'remove': { success: 'string' },
  'validate': { valid: 'boolean' },
  'approve': { success: 'string' },
  'reject': { success: 'string' },
  'request': { success: 'string' },
  'calculate': { amount: 'number', breakdown: 'unknown[]' },
  'drag': { success: 'string' },
  'transfer': { success: 'string' },
};

// Per-file, per-function overrides
const FILE_OVERRIDES = {
  'mechanic.actions.ts': {
    'getMechanics': '{ error?: string; mechanics?: unknown[] }',
    'getMechanicById': '{ error?: string; mechanic?: unknown | null }',
    'getMechanicPerformance': '{ error?: string; completedCount?: number; totalLaborAmount?: number; avgDurationHours?: number; period?: string }',
    'getCommissionRules': '{ error?: string; rules?: unknown[] }',
    'calculateCommission': '{ error?: string; amount?: number; breakdown?: unknown[] }',
    'createMechanic': '{ error?: string; success?: string; mechanicId?: string }',
    'updateMechanic': '{ error?: string; success?: string }',
    'deleteMechanic': '{ error?: string; success?: string }',
    'createCommissionRule': '{ error?: string; success?: string }',
  },
  'vehicle.actions.ts': {
    'getVehicles': '{ error?: string; vehicles?: unknown[] }',
    'getVehicleDashboard': '{ error?: string; metrics?: unknown; recentRegistrations?: unknown[]; vehiclesList?: unknown[] }',
    'getVehicleById': '{ error?: string; vehicle?: unknown | null }',
    'createVehicle': '{ error?: string; success?: string; vehicleId?: string }',
    'updateVehicle': '{ error?: string; success?: string }',
    'deleteVehicle': '{ error?: string; success?: string }',
    'updateVehicleImage': '{ error?: string; success?: string }',
  },
  'customer.actions.ts': {
    'getCustomers': '{ error?: string; customers?: unknown[] }',
    'getCustomerById': '{ error?: string; customer?: unknown | null }',
    'createCustomer': '{ error?: string; success?: string; customerId?: string }',
    'updateCustomer': '{ error?: string; success?: string }',
    'deleteCustomer': '{ error?: string; success?: string }',
  },
  'appointment.actions.ts': {
    'getAppointments': '{ error?: string; appointments?: unknown[]; customers?: unknown[]; vehicles?: unknown[] }',
    'getAppointmentById': '{ error?: string; appointment?: unknown | null }',
    'getAppointmentStats': '{ error?: string; stats?: unknown }',
    'createAppointment': '{ error?: string; success?: string }',
    'updateAppointment': '{ error?: string; success?: string }',
    'updateAppointmentStatus': '{ error?: string; success?: string }',
    'dragAndDropAppointment': '{ error?: string; success?: string }',
    'deleteAppointment': '{ error?: string; success?: string }',
    'sendAppointmentReminder': '{ error?: string; success?: string }',
  },
  'location.actions.ts': {
    'getLocations': '{ error?: string; locations?: unknown[] }',
    'createLocation': '{ error?: string; success?: string; locationId?: string }',
    'updateLocation': '{ error?: string; success?: string }',
    'deleteLocation': '{ error?: string; success?: string }',
    'getConsolidatedReport': '{ error?: string; locations?: unknown[]; totals?: unknown }',
  },
  'analytics.actions.ts': {
    'getAnalyticsDashboard': '{ error?: string; dashboard?: unknown }',
    'getCustomerLifetimeValue': '{ error?: string; customers?: unknown[] }',
    'forecastNextMonthRevenue': '{ error?: string; forecast?: unknown }',
    'getVehicleBrandDistribution': '{ error?: string; distribution?: unknown[] }',
  },
  'accounting.actions.ts': {
    'getAccountingIntegration': '{ error?: string; integration?: unknown | null }',
    'saveAccountingIntegration': '{ error?: string; success?: string }',
    'testAccountingConnection': '{ error?: string; success?: string }',
  },
  'invoice.actions.ts': {
    'createInvoice': '{ error?: string; success?: string; invoiceId?: string }',
    'updateInvoice': '{ error?: string; success?: string }',
    'addInvoiceItem': '{ error?: string; success?: string }',
    'updateInvoiceItem': '{ error?: string; success?: string }',
    'deleteInvoiceItem': '{ error?: string; success?: string }',
    'getInvoice': '{ error?: string; invoice?: unknown | null }',
    'getInvoices': '{ error?: string; invoices?: unknown[] }',
    'getInvoiceById': '{ error?: string; invoice?: unknown | null }',
  },
  'invoice-list.actions.ts': {
    'getAllInvoices': '{ error?: string; invoices?: unknown[] }',
  },
  'inventory.actions.ts': {
    'createPartCategory': '{ error?: string; success?: string; categoryId?: string }',
    'getPartCategories': '{ error?: string; categories?: unknown[] }',
    'createPart': '{ error?: string; success?: string; partId?: string }',
    'getParts': '{ error?: string; parts?: unknown[] }',
    'getInventoryDashboard': '{ error?: string; dashboard?: unknown }',
  },
  'crm.actions.ts': {
    'getUpcomingMaintenances': '{ error?: string; maintenances?: unknown[] }',
    'sendMaintenanceReminderSms': '{ error?: string; success?: string }',
    'sendBulkMaintenanceReminders': '{ error?: string; success?: string; sentCount?: number; failCount?: number }',
  },
  'bulk-notification.actions.ts': {
    'createBulkCampaign': '{ error?: string; success?: string; campaignId?: string }',
    'getBulkCampaigns': '{ error?: string; campaigns?: unknown[] }',
    'getBulkCampaignById': '{ error?: string; campaign?: unknown | null }',
    'previewBulkCampaign': '{ error?: string; preview?: unknown }',
    'startBulkCampaign': '{ error?: string; success?: string }',
  },
  'import.actions.ts': {
    'importCustomers': '{ error?: string; success?: string; imported?: number; errors?: unknown[] }',
    'importVehicles': '{ error?: string; success?: string; imported?: number; errors?: unknown[] }',
  },
  'maintenance-plan.actions.ts': {
    'getMaintenancePlans': '{ error?: string; plans?: unknown[] }',
    'createMaintenancePlan': '{ error?: string; success?: string }',
    'updateMaintenancePlan': '{ error?: string; success?: string }',
    'deleteMaintenancePlan': '{ error?: string; success?: string }',
  },
  'notification-provider.actions.ts': {
    'getNotificationProviders': '{ error?: string; providers?: unknown[] }',
    'createNotificationProvider': '{ error?: string; success?: string }',
    'updateNotificationProvider': '{ error?: string; success?: string }',
    'toggleNotificationProvider': '{ error?: string; success?: string }',
    'testNotificationProvider': '{ error?: string; success?: string }',
  },
  'notifications.actions.ts': {
    'getNotificationProviders': '{ error?: string; providers?: unknown[] }',
    'saveNotificationProvider': '{ error?: string; success?: string }',
    'testSmsConnection': '{ error?: string; success?: string }',
  },
  'payment.actions.ts': {
    '_default': '{ error?: string; success?: string; payments?: unknown[] }',
  },
  'purchase-order.actions.ts': {
    '_default': '{ error?: string; success?: string; orders?: unknown[] }',
  },
  'supplier.actions.ts': {
    'getSuppliers': '{ error?: string; suppliers?: unknown[] }',
    'getSupplierById': '{ error?: string; supplier?: unknown | null }',
    'createSupplier': '{ error?: string; success?: string; supplierId?: string }',
    'updateSupplier': '{ error?: string; success?: string }',
    'deleteSupplier': '{ error?: string; success?: string }',
    '_default': '{ error?: string; success?: string }',
  },
  'stock.actions.ts': {
    '_default': '{ error?: string; success?: string; parts?: unknown[]; movements?: unknown[] }',
  },
  'stock-count.actions.ts': {
    '_default': '{ error?: string; success?: string; counts?: unknown[] }',
  },
  'stock-transfer.actions.ts': {
    '_default': '{ error?: string; success?: string; transfers?: unknown[] }',
  },
  'quote.actions.ts': {
    'getQuotes': '{ error?: string; quotes?: unknown[] }',
    'getQuoteById': '{ error?: string; quote?: unknown | null }',
    '_default': '{ error?: string; success?: string; quoteId?: string }',
  },
  'onboarding.actions.ts': {
    '_default': '{ error?: string; success?: string; status?: unknown }',
  },
  'preference.actions.ts': {
    '_default': '{ error?: string; success?: string; preferences?: unknown }',
  },
  'quality-check.actions.ts': {
    '_default': '{ error?: string; success?: string; checks?: unknown[] }',
  },
  'referral.actions.ts': {
    '_default': '{ error?: string; success?: string; referrals?: unknown[] }',
  },
  'template.actions.ts': {
    '_default': '{ error?: string; success?: string; templates?: unknown[] }',
  },
};

// Also process these files that already had guards from Faz 0:
const FAZ0_FILES = [
  'finance.actions.ts',
  'service.actions.ts',
];

const ALL_FILES = [
  ...Object.keys(FILE_OVERRIDES),
  ...FAZ0_FILES,
  'dashboard.actions.ts',
];

for (const filename of ALL_FILES) {
  const filepath = join(base, filename);
  if (!existsSync(filepath)) { console.log(`SKIP: ${filename}`); continue; }

  let content = readFileSync(filepath, 'utf8');
  const original = content;
  const overrides = FILE_OVERRIDES[filename] || {};

  // Find all export async function declarations and add return types
  content = content.replace(
    /export async function (\w+)([^)]*\))\s*(?::\s*Promise<[^>]*>)?\s*\{/g,
    (match, fnName, params) => {
      // Get return type from override
      let returnType = overrides[fnName] || overrides['_default'];

      if (!returnType) {
        // Default based on function name prefix
        if (/^(create|update|delete|cancel|void|toggle|send|save|start|record|sync|generate|add|remove|approve|reject|drag|request)/.test(fnName)) {
          returnType = '{ error?: string; success?: string }';
        } else if (/^get/.test(fnName)) {
          returnType = '{ error?: string; [key: string]: unknown }';
        } else {
          returnType = '{ error?: string; success?: string }';
        }
      }

      return `export async function ${fnName}${params}: Promise<${returnType}> {`;
    }
  );

  if (content !== original) {
    writeFileSync(filepath, content, 'utf8');
    console.log(`UPDATED: ${filename}`);
  } else {
    console.log(`UNCHANGED: ${filename}`);
  }
}

console.log('Done.');
