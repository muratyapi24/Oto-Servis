# New Module Checklist — BST Otoservis

Follow this step-by-step checklist when adding a new dashboard module to the platform.

## Step 1: Database Schema

- [ ] Add new model(s) to `packages/database/prisma/schema.prisma`
- [ ] Include `tenantId String` field with `@@index([tenantId])`
- [ ] Add `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`
- [ ] Add `deletedAt DateTime?` for soft delete (if applicable)
- [ ] Use `@db.Decimal(15,2)` for monetary fields
- [ ] Use `@db.VarChar(N)` for bounded strings, `@db.Text` for unbounded
- [ ] Define enums at schema level if needed
- [ ] Add relation to `Tenant` model
- [ ] Add relations to other models if needed
- [ ] Run `pnpm --filter database db:generate`
- [ ] Run `pnpm --filter database db:push`

## Step 2: Validation Schema (Zod)

- [ ] Create `apps/web/lib/validations/module-name.ts`
- [ ] Define `createSchema` and `updateSchema` with Zod
- [ ] Export TypeScript types: `type CreateInput = z.infer<typeof createSchema>`
- [ ] Use Turkish locale error messages for user-facing validations

**Template:**
```typescript
import * as z from "zod";

export const createModuleSchema = z.object({
  name: z.string().min(2, "Ad en az 2 karakter olmalıdır"),
  description: z.string().optional(),
  amount: z.number().min(0, "Tutar negatif olamaz"),
});

export type CreateModuleInput = z.infer<typeof createModuleSchema>;
```

## Step 3: Server Actions

- [ ] Create `apps/web/lib/actions/module-name.actions.ts`
- [ ] Add `"use server"` directive at top
- [ ] Implement CRUD operations following guard pattern:
  - `createModule(data)` — guardTenant + validate + create
  - `getModules()` — guardTenant + findMany + serialize Decimals
  - `getModuleById(id)` — guardTenant + findFirst + serialize
  - `updateModule(id, data)` — guardTenant + validate + update
  - `deleteModule(id)` — guardTenant + soft delete
  - `getModuleDashboard()` — consolidated fetch with lookups
- [ ] Include Sentry error tracking
- [ ] Include `revalidatePath()` after mutations
- [ ] Serialize all Decimal fields with `Number(field.toString())`

## Step 4: Dashboard Page (Server Component)

- [ ] Create `apps/web/app/(dashboard)/dashboard/module-name/page.tsx`
- [ ] Implement as Server Component that calls dashboard action
- [ ] Pass data to Client Component

**Template:**
```tsx
import { getModuleDashboard } from "@/lib/actions/module-name.actions";
import ModuleBoardClient from "@/components/dashboard/module-name/ModuleBoardClient";

export default async function ModulePage() {
  const data = await getModuleDashboard();
  if ("error" in data) {
    return <div className="p-6 text-red-500">{data.error}</div>;
  }
  return <ModuleBoardClient initialData={data} />;
}
```

## Step 5: Client Components

- [ ] Create `apps/web/components/dashboard/module-name/` directory
- [ ] `ModuleBoardClient.tsx` — Main listing (table or kanban)
- [ ] `ModuleDialog.tsx` — Create/Edit modal dialog
- [ ] Additional components as needed (cards, filters, etc.)
- [ ] Use React Hook Form for forms
- [ ] Use Framer Motion for animations
- [ ] Include loading states and error handling
- [ ] Make responsive for different screen sizes

## Step 6: Detail/Edit Page (optional)

- [ ] Create `apps/web/app/(dashboard)/dashboard/module-name/[id]/page.tsx`
- [ ] Fetch single record with `getModuleById(id)`
- [ ] Create detail client component

## Step 7: Navigation & Permissions

- [ ] Add menu item to `components/dashboard/Sidebar.tsx`
- [ ] Add routes to `ROLE_ACCESS_MATRIX` in `lib/permissions.ts`
  - Decide which roles can access this module
- [ ] Add icon for sidebar navigation
- [ ] Test navigation with different roles

## Step 8: Subscription Integration (if feature-gated)

- [ ] Add feature key to `PlanFeatures` interface in `lib/subscription-guard.ts`
- [ ] Add feature label to `featureLabels` map
- [ ] Update plan seeds in `packages/database/prisma/seed-plans.ts`
- [ ] Add `requireFeature()` or `checkFeature()` calls in actions

## Step 9: Tests

- [ ] Create `apps/web/__tests__/module-name.test.ts`
- [ ] Test CRUD operations
- [ ] Test tenant isolation (cross-tenant access prevention)
- [ ] Test role-based access (unauthorized roles cannot call actions)
- [ ] Test edge cases and validation errors

## Step 10: i18n (if needed)

- [ ] Add translation keys to `apps/web/messages/tr.json`
- [ ] Add translation keys to `apps/web/messages/en.json`
- [ ] Use `useTranslations()` in client components

## Step 11: Mobile Web (if applicable)

- [ ] Add mobile web page in `apps/web/app/m/firma/module-name/page.tsx`
- [ ] Add touch-optimized components in `components/mobile/`
- [ ] Add route to `MOBILE_WEB_NAV_ITEMS` in `lib/permissions.ts`
- [ ] Test on mobile viewport

## Step 12: Seed Data

- [ ] Update seed scripts to include sample data for the new module
- [ ] Add to both `seed.ts` and `seed-demo.ts`
- [ ] Ensure demo tenant has representative sample data
