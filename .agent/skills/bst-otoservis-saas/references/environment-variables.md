# Environment Variables — BST Otoservis

## Required (Core)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | JWT signing secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | App URL (dev: `http://localhost:3000`) |
| `ADMIN_EMAIL` | Super admin notification email |

## Demo

| Variable | Purpose |
|----------|---------|
| `DEMO_TENANT_SLUG` | Demo tenant slug (`demo-oto`) |
| `DEMO_EMAIL` | Demo login email |
| `DEMO_PASSWORD` | Demo login password |

## Stripe (Payments)

`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

## Resend (Email)

`RESEND_API_KEY`

## Twilio (SMS/WhatsApp)

`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

## AWS S3 (File Storage)

`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`, `AWS_REGION`

## Upstash Redis (Cache/Rate Limit)

`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

## Sentry (Error Tracking)

`SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`

## Meilisearch (Search)

`MEILISEARCH_HOST`, `MEILISEARCH_API_KEY`

## Inngest (Background Jobs)

`INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`

## Paraşüt (Accounting)

`PARASUT_CLIENT_ID`, `PARASUT_CLIENT_SECRET`

## KVKK/IYS (Compliance)

`IYS_API_KEY`, `IYS_BRAND_CODE`

## Notes

- Dev config: `apps/web/.env.local` (gitignored)
- Root `.env`: only `DATABASE_URL` for Prisma CLI
- Template: `apps/web/.env.example`
