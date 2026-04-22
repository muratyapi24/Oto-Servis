# Project Structure

## Monorepo Layout

```
/
├── apps/
│   ├── web/          # Next.js 15 web application
│   └── mobile/       # Expo React Native app
├── packages/
│   ├── database/     # Prisma schema, client, seed scripts
│   ├── ui/           # Shared React component library
│   ├── eslint-config/
│   └── typescript-config/
├── Docs/             # Project documentation, credentials, seed guides
└── .kiro/            # Kiro specs and steering files
```

## Web App (`apps/web`)

```
apps/web/
├── app/
│   ├── (auth)/           # Login, register route group
│   ├── (dashboard)/      # Tenant dashboard (protected)
│   │   └── dashboard/    # All dashboard sub-pages
│   ├── (super-admin)/    # Super admin panel (protected)
│   ├── api/              # API route handlers
│   ├── m/                # Mobile web views
│   │   ├── firma/        # Staff mobile web
│   │   └── musteri/      # Customer portal
│   ├── login/            # Tenant login page
│   ├── superadmin-login/ # Super admin login page
│   ├── pricing/          # Public pricing page
│   ├── register/         # Tenant registration
│   ├── onay/             # Approval flow
│   └── offline/          # PWA offline page
├── components/
│   ├── dashboard/        # Dashboard-specific components
│   ├── landing/          # Landing page components
│   ├── mobile/           # Mobile web components
│   ├── super-admin/      # Super admin components
│   └── ui/               # Generic UI primitives
├── lib/
│   ├── actions/          # Next.js Server Actions (*.actions.ts)
│   ├── validations/      # Zod schemas
│   ├── inngest/          # Background job functions
│   ├── notifications/    # Push/notification helpers
│   ├── api.ts            # API client utilities
│   ├── cache.ts          # Redis caching helpers
│   ├── search.ts         # Meilisearch integration
│   ├── storage.ts        # AWS S3 helpers
│   ├── stripe.ts         # Stripe helpers
│   ├── sse.ts            # Server-Sent Events
│   ├── rate-limit.ts     # Upstash rate limiting
│   ├── totp.ts           # 2FA/TOTP helpers
│   ├── pdf-utils.ts      # PDF generation
│   └── utils.ts          # General utilities
├── messages/
│   ├── tr.json           # Turkish translations
│   └── en.json           # English translations
├── auth.ts               # NextAuth configuration (server)
├── auth.config.ts        # NextAuth config (edge-safe)
├── middleware.ts          # Auth + rate limit + locale middleware
└── i18n.ts               # next-intl setup
```

## Mobile App (`apps/mobile`)

```
apps/mobile/
├── app/
│   ├── (auth)/       # Auth screens
│   ├── (firma)/      # Staff/mechanic screens
│   └── (musteri)/    # Customer screens
├── components/       # Shared mobile components
└── lib/              # API client, biometrics, notifications, offline store
```

## Database Package (`packages/database`)

```
packages/database/
├── prisma/
│   ├── schema.prisma   # Single source of truth for all models
│   └── seed.ts         # Database seeding
├── src/
│   └── index.ts        # Prisma client export
└── add-superadmin.ts   # Utility to create super admin
```

## Key Conventions

### API Routes
- Located in `apps/web/app/api/`
- Always return `NextResponse.json()`
- Authenticate via `auth()` from `@/auth`
- Always check `session?.user?.tenantId` for tenant isolation

### Server Actions
- Located in `apps/web/lib/actions/*.actions.ts`
- Named with `"use server"` directive
- Validate input with Zod before any DB call
- Always scope queries with `tenantId` from session

### Components
- Shared primitives go in `packages/ui/`
- App-specific components go in `apps/web/components/`
- Use `clsx` + `tailwind-merge` for conditional classes

### Database Queries
- Always import `prisma` from `@repo/database`
- All multi-tenant models include `tenantId` — always filter by it
- Use `deletedAt` soft-delete pattern where present

### Routing
- Route groups `(auth)`, `(dashboard)`, `(super-admin)` control layouts without affecting URL paths
- Mobile web routes live under `/m/`
- Turkish path segments are intentional (e.g., `/m/musteri`, `/onay`)
