export type Role = "SUPER_ADMIN" | "TENANT_ADMIN" | "MECHANIC" | "RECEPTIONIST" | "ACCOUNTANT" | "CUSTOMER";

export { MOBILE_WEB_NAV_ITEMS } from "./dashboard-navigation";

export const ROLE_ACCESS_MATRIX = {
  TENANT_ADMIN: [
    "/dashboard",
    // Servis
    "/dashboard/services",
    "/dashboard/quotes",
    "/dashboard/appointments",
    // Müşteri & Araç
    "/dashboard/customers",
    "/dashboard/vehicles",
    // Personel
    "/dashboard/mechanics",
    // Stok & Tedarik
    "/dashboard/inventory",
    "/dashboard/suppliers",
    // Finans
    "/dashboard/finances",
    // Analitik
    "/dashboard/analytics",
    "/dashboard/analytics/mechanics",
    // Yönetim
    "/dashboard/notifications",
    "/dashboard/settings",
    // Mobil
    "/m/firma/panel",
    "/m/firma/kuyruk",
    "/m/firma/araclar",
    "/m/firma/analiz",
    "/m/firma/personel",
    "/m/firma/ayarlar",
    "/m/firma/finans",
    "/m/firma/stok"
  ],
  MECHANIC: [
    "/dashboard",
    "/dashboard/services",
    "/dashboard/vehicles",
    "/dashboard/inventory",
    "/m/firma/panel",
    "/m/firma/kuyruk",
    "/m/firma/araclar",
    "/m/firma/stok"
  ],
  RECEPTIONIST: [
    "/dashboard",
    "/dashboard/services",
    "/dashboard/quotes",
    "/dashboard/appointments",
    "/dashboard/customers",
    "/dashboard/vehicles",
    "/dashboard/notifications",
    "/m/firma/panel",
    "/m/firma/kuyruk",
    "/m/firma/araclar"
  ],
  ACCOUNTANT: [
    "/dashboard",
    "/dashboard/inventory",
    "/dashboard/suppliers",
    "/dashboard/finances",
    "/dashboard/analytics",
    "/m/firma/panel",
    "/m/firma/finans",
    "/m/firma/stok"
  ]
};

const EXACT_ACCESS_HREFS = new Set(["/dashboard", "/dashboard/analytics"]);

const LEGACY_ROUTE_ALIASES: Array<{ from: string; to: string }> = [
  { from: "/dashboard/finance/accounting/e-invoice", to: "/dashboard/settings/e-invoice" },
  { from: "/dashboard/finance/accounting/parasut", to: "/dashboard/settings/parasut" },
  { from: "/dashboard/finance/accounting", to: "/dashboard/settings/e-invoice" },
  { from: "/dashboard/finance/invoices/new", to: "/dashboard/finances/invoices" },
  { from: "/dashboard/finance/invoices", to: "/dashboard/finances/invoices" },
  { from: "/dashboard/finance/payments/checks", to: "/dashboard/finances/payments/checks" },
  { from: "/dashboard/finance/payments/new", to: "/dashboard/finances/payments/new" },
  { from: "/dashboard/finance/payments", to: "/dashboard/finances/payments" },
  { from: "/dashboard/finance", to: "/dashboard/finances" },
  { from: "/dashboard/crm", to: "/dashboard/customers/maintenance" },
  { from: "/dashboard/staff", to: "/dashboard/mechanics" },
  { from: "/dashboard/locations", to: "/dashboard/settings/locations" },
];

export function normalizeRouteHref(href: string): string {
  const alias = LEGACY_ROUTE_ALIASES.find(
    ({ from }) => href === from || href.startsWith(`${from}/`)
  );

  if (!alias) return href;
  return `${alias.to}${href.slice(alias.from.length)}`;
}

export function canAccess(role: string | undefined | null, href: string): boolean {
  if (!role) return false;
  if (role === "SUPER_ADMIN") return true; 

  // Müşterilerin firma alanlarına girmesini önle, ama kendi alanlarına izin ver (auth config hallediyor genelde ama buraya da koyalım)
  if (role === "CUSTOMER") {
    return href.startsWith("/m/musteri") && !href.startsWith("/m/firma") && !href.startsWith("/dashboard");
  }

  const normalizedHref = normalizeRouteHref(href);
  const accessList = ROLE_ACCESS_MATRIX[role as keyof typeof ROLE_ACCESS_MATRIX];
  if (!accessList) return false;

  return accessList.some((allowedHref) => {
    if (EXACT_ACCESS_HREFS.has(allowedHref)) {
      return normalizedHref === allowedHref;
    }
    return normalizedHref === allowedHref || normalizedHref.startsWith(`${allowedHref}/`);
  });
}

type FilterableNavItem = {
  href?: string;
  name?: string;
  relatedHrefs?: string[];
};

function getFilterableHrefs(item: FilterableNavItem): string[] {
  return Array.from(new Set([item.href, ...(item.relatedHrefs ?? [])].filter(Boolean) as string[]));
}

export function resolveNavItemHref<TItem extends FilterableNavItem>(
  role: string | null | undefined,
  item: TItem
): string {
  const hrefs = getFilterableHrefs(item);
  const fallbackHref = item.href ?? hrefs[0] ?? "#";

  if (!role || role === "SUPER_ADMIN") return fallbackHref;

  return hrefs.find((href) => canAccess(role, href)) ?? fallbackHref;
}

export function filterNavItems<TItem extends FilterableNavItem>(
  role: string | null | undefined,
  items: TItem[]
): TItem[] {
  if (!role) return [];
  if (role === "SUPER_ADMIN") return items; // SA her şeyi görebilir (teknik olarak firma menüsünde de)
  
  return items.filter(item => {
    // Mobil Web Navbar'ında href bazlı kontrol
    if (item.href) {
       return getFilterableHrefs(item).some((href) => canAccess(role, href));
    }
    // Expo Mobil uygulamasında "name" kullanıyoruz (routes)
    if (item.name) {
       // Expo'daki route'lara karşılık gelen web href'lerini simüle ederek yetki kontrolü yapıyoruz
       const simHref = `/m/firma/${item.name}`;
       return canAccess(role, simHref);
    }
    
    return false;
  });
}
