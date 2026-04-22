# Product: MS Oto Servis

MS Oto Servis is a cloud-based, multi-tenant SaaS platform for auto repair shops. It digitizes and centralizes all workshop operations.

## Core Capabilities

- **Service Management**: Service orders, work logs, mechanic assignments, inspection forms
- **Customer & Vehicle Tracking**: Customer profiles, vehicle history, loyalty transactions
- **Inventory & Parts**: Stock management, suppliers, part categories, stock movements
- **Invoicing & Finance**: Invoices, payments, quotes, commission rules
- **Appointments**: Scheduling and calendar management
- **Subscription Billing**: Tiered plans (Starter / Professional / Enterprise) via Stripe, 14-day trial
- **Notifications**: Push notifications, in-app notifications, SSE real-time updates
- **Search**: Full-text search powered by Meilisearch
- **Document Management**: PDF export, file uploads to AWS S3
- **Reporting & Analytics**: Dashboard analytics, audit logs

## User Roles

| Role | Access |
|------|--------|
| `SUPER_ADMIN` | Platform-wide admin panel (`/super-admin`) |
| `TENANT_ADMIN` | Full access to their tenant's dashboard |
| `MECHANIC` | Service orders, work logs |
| `RECEPTIONIST` | Customer intake, appointments |
| `ACCOUNTANT` | Finance, invoices, payments |
| `CUSTOMER` | Customer portal (plate + phone login) |

## Access Points

- `/login` — Tenant staff login
- `/superadmin-login` — Super admin login
- `/m/firma` — Mobile staff app
- `/m/musteri` — Mobile customer portal
- `/dashboard` — Main tenant dashboard
- `/pricing` — Public pricing page

## Language

The platform is primarily Turkish. UI strings, variable names, and comments frequently use Turkish (e.g., `musteri` = customer, `firma` = company/tenant, `servis` = service). Both Turkish and English i18n messages are maintained under `apps/web/messages/`.
