---
name: mobile-app-development
description: Comprehensive guide for developing, maintaining, and extending the İnşaatYönet mobile application (/m/*). This skill should be used when creating new mobile pages, modifying existing mobile features, applying the theme system, handling photo uploads, managing PWA configuration, or debugging mobile-specific issues. Covers architecture, theming, component library, API patterns, Vercel deployment constraints, and field-tested best practices.
---

# Mobile App Development Skill

This skill encapsulates all procedural knowledge, architecture decisions, and field-tested patterns for the İnşaatYönet mobile application (`/m/*` routes). It is designed to prevent repeated discovery of non-obvious constraints and to enable consistent, high-quality mobile feature development.

## Architecture Overview

The mobile app is a **Next.js App Router** sub-application scoped under `/m`. It is a **Progressive Web App (PWA)** designed for construction field workers using mobile devices.

### Directory Structure

```
app/m/
├── layout.tsx              ← Server component: auth guard + plan feature gating
├── MobileShell.tsx         ← Client component: wraps all pages with header/nav/theme
├── page.tsx                ← Dashboard (Panel)
├── menu/page.tsx           ← Full menu + theme toggle + logout + branding
├── gunluk-rapor/           ← Daily reports (list/new/detail/edit)
│   ├── page.tsx
│   ├── yeni/page.tsx
│   └── [id]/
│       ├── page.tsx
│       └── duzenle/page.tsx
├── puantaj/page.tsx        ← Timesheet / attendance
├── onay/page.tsx           ← Approval queue
├── stok/page.tsx           ← Inventory management
├── ekipman/page.tsx        ← Equipment tracking
├── imalat/page.tsx         ← Production tracking
├── isg/page.tsx            ← OHS (İSG) audits
├── kaza/page.tsx           ← Incident reporting
└── talep/                  ← Material requests
    ├── page.tsx
    └── yeni/page.tsx

components/mobile/
├── MobileHeader.tsx        ← Sticky header with user info / back nav
├── BottomNav.tsx           ← 5-tab bottom navigation bar
├── InstallPrompt.tsx       ← PWA installation banner (iOS + Android)
├── SectionCard.tsx         ← Collapsible form section with icon
├── CounterInput.tsx        ← Stepper +/- numeric input
└── StatCard.tsx            ← Dashboard stat display card

contexts/
└── MobileThemeContext.tsx   ← Dark/light theme state + localStorage

styles/
└── mobile-theme.css         ← 30+ CSS custom properties for theming

lib/utils/
└── imageCompression.ts      ← Client-side canvas-based image compressor

public/
├── manifest.json            ← PWA manifest scoped to /m
└── sw.js                    ← Service worker (network-first API, SWR static)
```

### Component Hierarchy

```
layout.tsx (Server: auth + plan gating)
  └── SessionProvider
      └── MobileShell.tsx (Client)
          └── MobileThemeProvider (data-mobile-theme="dark|light")
              ├── MobileHeader
              ├── <main> → {children} (page content)
              ├── BottomNav
              └── InstallPrompt
```

## Authentication & Authorization

### Auth Guard (layout.tsx)

The mobile layout is a **server component** that performs two checks before rendering:

1. **Session check**: Calls `auth()` from NextAuth. Redirects to `/login` if no session exists.
2. **Plan feature check**: Reads `session.user.planFeatures.mobil_uygulama`. If the feature is disabled, redirects to `/subscription?upgrade=mobil_uygulama`. Super admins always have access.

### Session Data Available in Mobile Pages

The session object (via `useSession()`) provides:

| Field | Source | Usage |
|-------|--------|-------|
| `session.user.name` | JWT callback | Display user name in header |
| `session.user.tenantId` | JWT callback | Tenant isolation for API calls |
| `(session.user as any).tenantName` | JWT callback → `auth.config.ts` | Display company name in header |
| `(session.user as any).role` | JWT callback | Permission checks |
| `(session.user as any).planFeatures` | JWT callback | Feature gating |

> **IMPORTANT**: `tenantName` is a custom field added via JWT/session callbacks in `auth.config.ts`. It is NOT part of the default NextAuth typings and must be accessed with `(session.user as any).tenantName`.

## Theme System

### How It Works

1. `MobileThemeContext.tsx` manages a `"dark" | "light"` state persisted in `localStorage` (key: `mobile-theme`).
2. It wraps children in a `<div data-mobile-theme="dark">` or `<div data-mobile-theme="light">`.
3. `mobile-theme.css` defines all tokens under `[data-mobile-theme="dark"]` and `[data-mobile-theme="light"]` selectors.
4. All UI elements reference `var(--m-*)` tokens, so switching the attribute instantly repaints everything.

### Theme Token Reference

To style a mobile component, use **only** these CSS custom properties. Never use hardcoded hex values.

| Token | Dark Value | Light Value | Usage |
|-------|-----------|-------------|-------|
| `--m-bg` | `#111316` | `#f4f6f9` | Page background |
| `--m-surface` | `#1a1c1f` | `#ffffff` | Card/section background |
| `--m-surface-hover` | `#1e2328` | `#f0f2f5` | Hover state for surfaces |
| `--m-surface-active` | `rgba(255,255,255,0.04)` | `rgba(0,0,0,0.04)` | Active/pressed state |
| `--m-border` | `#283039` | `#dfe3e8` | Standard borders |
| `--m-border-subtle` | `rgba(255,255,255,0.06)` | `rgba(0,0,0,0.08)` | Subtle dividers |
| `--m-text` | `#e2e2e6` | `#1a1c2e` | Primary text |
| `--m-text-muted` | `#6b7b8a` | `#6b7280` | Secondary text |
| `--m-text-secondary` | `#8a919e` | `#9ca3af` | Labels, placeholders |
| `--m-text-heading` | `#c0c7d4` | `#374151` | Section headings |
| `--m-accent` | `#a2c9ff` | `#2563eb` | Accent / links |
| `--m-accent-solid` | `#3394f1` | `#1d4ed8` | Solid accent buttons |
| `--m-accent-bg` | `rgba(19,127,236,0.1)` | `rgba(37,99,235,0.08)` | Accent background |
| `--m-accent-border` | `rgba(19,127,236,0.2)` | `rgba(37,99,235,0.15)` | Accent border |
| `--m-header-bg` | `rgba(17,19,22,0.95)` | `rgba(255,255,255,0.95)` | Sticky header bg |
| `--m-nav-bg` | `rgba(17,19,22,0.9)` | `rgba(255,255,255,0.92)` | Bottom nav bg |
| `--m-input-bg` | `#0c0e11` | `#f9fafb` | Form input background |
| `--m-badge-bg` | `#333538` | `#e5e7eb` | Badge/tag background |
| `--m-icon-muted` | `#9dabb9` | `#6b7280` | Inactive icons |

**Status colors** (consistent across themes with adjusted values):

| Token | Dark | Light | Usage |
|-------|------|-------|-------|
| `--m-success` | `#7ddc7a` | `#16a34a` | Success indicators |
| `--m-warning` | `#ffb77b` | `#ea580c` | Warnings / pending |
| `--m-danger` | `#ffb4ab` | `#dc2626` | Errors / critical |
| `--m-info` | `#a2c9ff` | `#2563eb` | Informational |

Each status color has matching `*-bg` and `*-border` variants for background and border usage.

### Applying Theme to New Pages

When creating or modifying a mobile page:

1. **Never use hardcoded hex colors** in Tailwind classes. Use `bg-[var(--m-surface)]`, `text-[var(--m-text)]`, etc.
2. **Status indicators**: Use `bg-[var(--m-success-bg)] text-[var(--m-success)] border-[var(--m-success-border)]` pattern.
3. **Inputs**: Use `bg-[var(--m-input-bg)] text-[var(--m-text)] border border-[var(--m-border)] focus:border-[var(--m-accent-solid)]`.
4. **Buttons**: Use `bg-gradient-to-r from-[var(--m-accent)] to-[var(--m-accent-solid)] text-white`.
5. **Section headings**: Use `text-[var(--m-text-heading)]`.

### Bulk Color Migration Strategy

When migrating an existing page with hardcoded colors to the theme system, use a Node.js bulk replace script rather than manual editing. Create a mapping of `old hex → CSS variable` and run `string.split(old).join(new)` across all `.tsx` files. Run multiple passes to catch edge cases like opacity variants (`bg-[#46a34a]/10`).

## Component Library

### MobileHeader

Sticky header that auto-detects whether to show the dashboard view (company name + user initials) or a sub-page view (back arrow + page title).

```tsx
// Dashboard view (showBack=false): Shows initials avatar + tenant name + user name
// Sub-page view (showBack=true): Shows back arrow + page title
<MobileHeader title="Günlük Rapor" showBack backHref="/m/gunluk-rapor" />
```

### MobileShell

The shell component manages:
- Which pages use the default header vs custom headers (via `pagesWithCustomHeader` allow list)
- Dynamic page title derivation from pathname
- Service Worker registration
- Theme provider wrapping

> **IMPORTANT**: When adding a new page that renders its own `MobileHeader` with `showBack`, add its pathname prefix to the `pagesWithCustomHeader` array in `MobileShell.tsx`. Otherwise, two headers will render.

### BottomNav

5-tab fixed bottom navigation. Active tab detection uses `pathname.startsWith(href)` for sub-routes, with `exact: true` for the dashboard (`/m`). Active tabs get filled material icons via `fontVariationSettings: "'FILL' 1"`.

### SectionCard

Collapsible accordion section used in forms:

```tsx
<SectionCard
  icon="inventory_2"
  iconColor="text-[var(--m-warning)]"
  title="Saha Giren Malzemeler"
  defaultOpen
  action={<button>+ Ekle</button>}
>
  {/* form content */}
</SectionCard>
```

### CounterInput

Stepper with `+` / `-` buttons for numeric fields (e.g., personnel counts):

```tsx
<CounterInput label="Usta" subtitle="Kalıp, Demir ve Beton" value={usta} onChange={setUsta} />
```

### StatCard

Simple dashboard statistic display card.

## Photo Upload & Vercel Payload Limits

### The Problem

Vercel serverless functions enforce a **4.5MB request body limit**. Mobile phone cameras produce 3-8MB JPEG files. Uploading 2-3 photos easily exceeds this limit, causing a `413 Request Entity Too Large` error with `FUNCTION_PAYLOAD_TOO_LARGE`.

### The Solution: Client-Side Image Compression

Always use `compressImage()` from `lib/utils/imageCompression.ts` before uploading:

```tsx
import { compressImage } from "@/lib/utils/imageCompression";

const handlePhotoAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const compressedFiles = await Promise.all(
        files.map(async (file) => await compressImage(file))
    );
    setPhotos(prev => [...prev, ...compressedFiles]);
};
```

The compressor:
- Resizes to max 1920×1920 pixels (preserving aspect ratio)
- Converts to JPEG at 0.7 quality
- Reduces a typical 5MB photo to ~200-400KB
- Falls back to the original file on any error

### File Upload API Pattern

Mobile forms use `FormData` with a `payload` JSON string + separate `photos` files:

```tsx
const formData = new FormData();
formData.append("payload", JSON.stringify(payload));

photos.forEach(file => {
    formData.append("photos", file);
});

const res = await fetch("/api/saha/gunluk-rapor", {
    method: "POST",
    body: formData,
});
```

Server-side, the API endpoint parses this:

```ts
if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const body = JSON.parse(formData.get('payload') as string);
    const photos = formData.getAll('photos') as File[];
}
```

### Storage Limitation

Currently, uploaded files are saved to `public/uploads/` on the filesystem. This **only works in development** and on self-hosted servers. On **Vercel**, the filesystem is read-only. Migration to a cloud storage provider (Vercel Blob, AWS S3, etc.) is required for production photo uploads.

## PWA Configuration

### manifest.json

- Scoped to `/m` (`start_url` and `scope`)
- Display mode: `standalone` (no browser chrome)
- Orientation: `portrait-primary`
- Icons: `/apple-icon.png` (192x192) and `/icon.png` (512x512)

> **CRITICAL**: The icon files MUST exist at the specified paths. Missing icons cause 404 errors that break PWA installation. Verify icon existence after any public directory cleanup.

### Service Worker (sw.js)

Three caching strategies:

1. **Pre-cache on install**: `/m` page and `manifest.json`
2. **Network-first for API** (`/api/*`): Tries network, caches successful responses, falls back to cache when offline
3. **Stale-while-revalidate for static assets**: Returns cached version immediately while refreshing in background

### InstallPrompt Component

Smart detection of device type:

- **Android/Chrome**: Intercepts `beforeinstallprompt` event, shows "Şimdi Yükle" button
- **iOS/Safari**: Shows manual instructions ("Share → Add to Home Screen")
- **Already installed**: Does not render (checks `display-mode: standalone`)
- **Dismissed**: Remembers dismissal for 7 days via `localStorage`

## Creating a New Mobile Page

Follow this checklist when adding a new module:

1. **Create the page file** at `app/m/<module-name>/page.tsx`
2. **Add "use client"** directive at the top (all mobile pages are client components)
3. **Use ONLY CSS variables** for all colors — reference the theme token table above
4. **Add the module to `MobileShell.tsx`**:
   - Add pathname to `pagesWithCustomHeader` array if the page renders its own header
   - Add a title mapping in `getPageTitle()` function
5. **Add navigation entry** to `BottomNav.tsx` (if primary) or `menu/page.tsx` (if secondary)
6. **Apply standard layout patterns**:
   - Outer: `<div className="space-y-4 pb-20">`
   - Form inputs: Use `SectionCard` for grouping
   - Counters: Use `CounterInput` for numeric steppers
   - Photos: Use `compressImage()` in the file input handler
   - Submit: Use sticky bottom button pattern
7. **For photo uploads**: Always compress client-side before sending
8. **Test both themes**: Toggle dark/light in Menu and verify all elements are readable

## Common Patterns & Gotchas

### Sticky Bottom Submit Button

```tsx
<div className="sticky bottom-0 left-0 right-0 py-4 z-40 bg-[var(--m-bg)]/90 backdrop-blur-xl border-t border-[var(--m-border-subtle)] mt-8">
    <button className="w-full h-13 bg-gradient-to-r from-[var(--m-accent)] to-[var(--m-accent-solid)] text-white font-bold text-sm uppercase tracking-[0.1em] rounded-xl active:scale-[0.98] transition-transform duration-150 disabled:opacity-50 flex items-center justify-center gap-2 py-3.5">
        Kaydet
    </button>
</div>
```

### Loading Spinner

```tsx
<div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
    <span className="material-symbols-outlined animate-spin text-3xl text-[var(--m-accent-solid)]">progress_activity</span>
    <p className="text-[var(--m-text-muted)] text-sm font-medium">Yükleniyor...</p>
</div>
```

### Empty State

```tsx
<div className="text-center py-12">
    <span className="material-symbols-outlined text-5xl text-[var(--m-border)] mb-3">inventory_2</span>
    <p className="text-[var(--m-text-muted)] text-sm">Henüz kayıt bulunmamaktadır.</p>
</div>
```

### Status Badges

```tsx
// Success
<span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-[var(--m-success-bg)] text-[var(--m-success)] border border-[var(--m-success-border)]">
    Onaylı
</span>

// Warning
<span className="... bg-[var(--m-warning-bg)] text-[var(--m-warning)] border border-[var(--m-warning-border)]">
    Bekliyor
</span>

// Danger
<span className="... bg-[var(--m-danger-bg)] text-[var(--m-danger)] border border-[var(--m-danger-border)]">
    Reddedildi
</span>
```

### Form Input

```tsx
<input
    className="w-full bg-[var(--m-input-bg)] text-[var(--m-text)] border border-[var(--m-border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--m-accent-solid)] placeholder:text-[var(--m-icon-muted)]"
    placeholder="Değer girin"
/>
```

### Card with Left Border Accent

```tsx
<div className="bg-[var(--m-surface)] p-3 rounded-xl border-l-4 border-l-[var(--m-success)]">
    <p className="text-[var(--m-text-muted)] text-[10px] uppercase font-bold">Toplam</p>
    <h3 className="text-xl font-extrabold text-[var(--m-text)]">{count}</h3>
</div>
```

### Material Symbols Icons

The project uses **Google Material Symbols (Outlined)** font. The font is loaded globally. Use icons like:

```tsx
<span className="material-symbols-outlined">assignment</span>
```

For filled variants on active states:

```tsx
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>assignment</span>
```

## Vercel Deployment Constraints

| Constraint | Limit | Mitigation |
|-----------|-------|------------|
| Serverless function payload | 4.5 MB | Client-side image compression |
| Serverless function timeout | 10s (Hobby) / 60s (Pro) | Prisma query optimization |
| Filesystem writes | Read-only in production | Cloud storage for uploads |
| Edge functions | Limited Node.js API | Use standard serverless for Prisma |

## API Endpoint Conventions

All mobile API endpoints live under `/api/saha/` or shared endpoints. They follow this pattern:

1. Extract `tenantId` from session for tenant isolation
2. Parse `FormData` or JSON body
3. Validate required fields
4. Perform Prisma operations within tenant scope
5. Return JSON response

> **CRITICAL**: Always filter by `tenantId` in all database queries to maintain strict multi-tenant data isolation.

## Prisma Considerations

- Run `npx prisma generate` after any schema change, followed by a dev server restart
- Use `npx prisma db push` for development schema sync
- The Prisma client may need regeneration after `node_modules` reinstall
- Transaction timeouts can occur with large batch operations — use explicit timeout configuration:

```ts
await prisma.$transaction(async (tx) => { ... }, { timeout: 30000 });
```

## Testing Checklist

Before deploying a mobile feature change:

1. ☐ Verify both dark and light themes render correctly
2. ☐ Test on actual mobile device (not just browser devtools)
3. ☐ Verify photo upload with multiple large images (compression works)
4. ☐ Check bottom navigation active states
5. ☐ Verify sticky headers and footers don't overlap content
6. ☐ Test PWA installation flow (if manifest/SW changed)
7. ☐ Confirm no hardcoded hex colors remain (grep for `#[0-9a-fA-F]` in mobile files)
8. ☐ Verify `tenantId` isolation in any new API endpoints
