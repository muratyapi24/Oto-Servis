# Tech Stack

## Monorepo & Build

- **Package Manager**: pnpm 9
- **Build System**: Turborepo 2
- **Language**: TypeScript 5 (strict, throughout all packages)
- **Node**: >=18 required

## Web App (`apps/web`)

- **Framework**: Next.js 15 (App Router)
- **UI**: React 18, Tailwind CSS 4, Framer Motion, Lucide React
- **Auth**: NextAuth v5 (beta) — credentials provider, JWT sessions, 2FA/TOTP via `otplib`
- **Database**: PostgreSQL via Prisma ORM (`@repo/database`)
- **Validation**: Zod + React Hook Form (`@hookform/resolvers`)
- **Background Jobs**: Inngest
- **Search**: Meilisearch
- **Cache / Rate Limiting**: Upstash Redis
- **Payments**: Stripe
- **Storage**: AWS S3 (`@aws-sdk/client-s3`)
- **Email**: Resend
- **SMS**: Twilio
- **Push Notifications**: Web Push
- **Error Monitoring**: Sentry (`@sentry/nextjs`)
- **i18n**: next-intl (tr / en), locale stored in cookie
- **PDF**: jsPDF + html2canvas
- **Date**: dayjs, date-fns
- **Real-time**: Server-Sent Events (SSE)
- **Testing**: Jest + ts-jest, fast-check (property-based testing)

## Mobile App (`apps/mobile`)

- **Framework**: Expo ~52 + Expo Router ~4
- **Language**: React Native 0.76 + TypeScript
- **State**: Zustand 5
- **Data Fetching**: TanStack React Query 5
- **HTTP**: Axios
- **Native**: expo-camera, expo-local-authentication (biometrics), expo-notifications, expo-secure-store
- **Build**: EAS Build (iOS & Android)

## Shared Packages

| Package | Purpose |
|---------|---------|
| `@repo/database` | Prisma client + schema, seed scripts |
| `@repo/ui` | Shared React component library |
| `@repo/eslint-config` | Shared ESLint config |
| `@repo/typescript-config` | Shared tsconfig bases |

## Common Commands

```bash
# Root (runs across all workspaces via Turborepo)
pnpm build          # Build all apps and packages
pnpm dev            # Start all apps in dev mode
pnpm lint           # Lint all workspaces
pnpm check-types    # Type-check all workspaces
pnpm format         # Prettier format all TS/TSX/MD files

# Web app only
pnpm --filter web dev       # Next.js dev server on :3000
pnpm --filter web build     # Production build
pnpm --filter web lint      # ESLint (0 warnings allowed)

# Mobile app only
pnpm --filter bst-mobile start          # Expo dev server
pnpm --filter bst-mobile android        # Android
pnpm --filter bst-mobile ios            # iOS
pnpm --filter bst-mobile build:android  # EAS Android build
pnpm --filter bst-mobile build:ios      # EAS iOS build

# Database
npx tsx packages/database/prisma/seed.ts       # Seed database
npx tsx packages/database/add-superadmin.ts    # Add super admin user
npx prisma migrate dev --schema packages/database/prisma/schema.prisma
npx prisma studio --schema packages/database/prisma/schema.prisma

# Tests (web)
pnpm --filter web test          # Run Jest tests (watch mode)
pnpm --filter web test --run    # Single run (CI)
```

## Environment Variables

- Root `.env` — shared secrets
- `apps/web/.env.local` — Next.js app secrets (DATABASE_URL, NEXTAUTH_SECRET, STRIPE_*, SENTRY_*, AWS_*, UPSTASH_*, RESEND_*, TWILIO_*, MEILISEARCH_*)
- `packages/database/.env` — DATABASE_URL for Prisma CLI
