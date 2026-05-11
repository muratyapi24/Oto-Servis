# Mobile Web Patterns — BST Otoservis

## Architecture

Mobile web portals live under `apps/web/app/m/`:
- `/m/firma/*` — Staff/mechanic portal (authenticated via NextAuth)
- `/m/musteri/*` — Customer portal (authenticated via plate + phone)

Layout: `apps/web/app/m/layout.tsx` — shared mobile wrapper with meta viewport.

## Staff Portal Pages (`/m/firma/`)

| Route | Purpose |
|-------|---------|
| `/m/firma/login` | Staff mobile login |
| `/m/firma/panel` | Dashboard overview |
| `/m/firma/kuyruk` | Service queue (kanban-like) |
| `/m/firma/araclar` | Vehicle list + detail |
| `/m/firma/analiz` | Analytics charts |
| `/m/firma/personel` | Staff list |
| `/m/firma/finans` | Financial overview |
| `/m/firma/stok` | Inventory management |
| `/m/firma/ayarlar` | Settings |

## Customer Portal Pages (`/m/musteri/`)

| Route | Purpose |
|-------|---------|
| `/m/musteri/giris` | Customer login (plate + phone) |
| `/m/musteri/araclarim` | My vehicles |
| `/m/musteri/arac-ekle` | Add vehicle |
| `/m/musteri/randevu` | Create appointment |
| `/m/musteri/servislerim` | My service orders |
| `/m/musteri/mesajlar` | Messages |
| `/m/musteri/belgeler` | Documents |
| `/m/musteri/profil` | Profile |

## Component Location

Mobile-specific components: `apps/web/components/mobile/`

## Design Conventions

- Touch-optimized: min 44px touch targets
- Bottom navigation bar pattern
- Card-based layouts for lists
- Pull-to-refresh pattern
- Large font sizes for readability
- Dark theme support via tenant settings

## Adding a New Mobile Page

1. Create page in `apps/web/app/m/firma/page-name/page.tsx` (or `/m/musteri/`)
2. Create mobile components in `components/mobile/`
3. Add actions in `lib/actions/mobile.actions.ts` or `musteri.actions.ts`
4. Add route to `ROLE_ACCESS_MATRIX` in `lib/permissions.ts`
5. Add to `MOBILE_WEB_NAV_ITEMS` in `lib/permissions.ts`
6. Test on mobile viewport (375px width)

## Server Actions for Mobile

- Staff: `mobile.actions.ts` (25KB) — covers all staff mobile API needs
- Customer: `musteri.actions.ts` (7.6KB) — customer-facing operations
- Customer messages: `musteri-mesaj.actions.ts`
- Customer documents: `musteri-belgeler.actions.ts`

## Native Mobile (Expo)

Location: `apps/mobile/`
- Uses Expo Router with file-based routing
- `app/(firma)/` — staff portal routes
- `app/(musteri)/` — customer portal routes
- Components: `apps/mobile/components/`
- Constants: `apps/mobile/constants/`
- Lib: `apps/mobile/lib/`

**Current status:** Beta — contains mock data that must be replaced before production.
