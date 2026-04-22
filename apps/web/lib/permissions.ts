export type Role = "SUPER_ADMIN" | "TENANT_ADMIN" | "MECHANIC" | "RECEPTIONIST" | "ACCOUNTANT" | "CUSTOMER";

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
    "/dashboard/crm",
    // Personel
    "/dashboard/mechanics",
    "/dashboard/staff",
    // Stok & Tedarik
    "/dashboard/inventory",
    "/dashboard/suppliers",
    // Finans
    "/dashboard/finances",
    "/dashboard/finance/accounting",
    "/dashboard/finance/invoices",
    "/dashboard/finance/payments",
    // Analitik
    "/dashboard/analytics",
    // Yönetim
    "/dashboard/notifications",
    "/dashboard/locations",
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
    "/dashboard/crm",
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
    "/dashboard/finance/accounting",
    "/dashboard/finance/invoices",
    "/dashboard/finance/payments",
    "/dashboard/analytics",
    "/m/firma/panel",
    "/m/firma/finans",
    "/m/firma/stok"
  ]
};

// Mobil web (m/firma) özelindeki menüler ve ikonları
export const MOBILE_WEB_NAV_ITEMS = [
  { name: "Dashboard", href: "/m/firma/panel", icon: "dashboard" },
  { name: "Kuyruk", href: "/m/firma/kuyruk", icon: "garage" },
  { name: "Araçlar", href: "/m/firma/araclar", icon: "directions_car" },
  { name: "Analiz", href: "/m/firma/analiz", icon: "insights" },
  { name: "Personel", href: "/m/firma/personel", icon: "group" },
  { name: "Finans", href: "/m/firma/finans", icon: "payments" },
  { name: "Stok", href: "/m/firma/stok", icon: "inventory_2" },
  { name: "Ayarlar", href: "/m/firma/ayarlar", icon: "settings" },
];

export function canAccess(role: string | undefined | null, href: string): boolean {
  if (!role) return false;
  if (role === "SUPER_ADMIN") return true; 

  // Müşterilerin firma alanlarına girmesini önle, ama kendi alanlarına izin ver (auth config hallediyor genelde ama buraya da koyalım)
  if (role === "CUSTOMER") {
    return href.startsWith("/m/musteri") && !href.startsWith("/m/firma") && !href.startsWith("/dashboard");
  }

  const accessList = ROLE_ACCESS_MATRIX[role as keyof typeof ROLE_ACCESS_MATRIX];
  if (!accessList) return false;

  // Tam eşleşme arıyoruz
  return accessList.includes(href);
}

export function filterNavItems(role: string | null | undefined, items: any[]): any[] {
  if (!role) return [];
  if (role === "SUPER_ADMIN") return items; // SA her şeyi görebilir (teknik olarak firma menüsünde de)
  
  return items.filter(item => {
    // Mobil Web Navbar'ında href bazlı kontrol
    if (item.href) {
       return canAccess(role, item.href);
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
