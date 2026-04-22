---
name: mobile-template-integration
description: Complete workflow for converting standalone HTML/CSS mobile templates into production-ready Next.js mobile modules, performing cross-module UI/UX consistency audits, eliminating mock data in favor of real API integration, and maintaining design system coherence. This skill should be used when integrating new HTML templates into the mobile app, auditing existing modules for visual inconsistencies, removing hardcoded/mock data, or adding new mobile feature modules to the construction management platform.
---

# Mobile Template Integration & Consistency Audit Skill

This skill documents the complete workflow for converting standalone HTML template files into production-ready Next.js mobile modules, and for performing systematic consistency audits across the entire mobile application. It captures critical procedural knowledge about template analysis, theme variable mapping, mock data identification, real API hookup, and cross-module standardization.

## When to Use This Skill

- Converting a standalone HTML/CSS template file into a Next.js mobile page component
- Auditing existing mobile modules for visual or structural inconsistencies
- Removing mock/hardcoded data and replacing with real API calls
- Adding a new module to the mobile app navigation and layout system
- Performing bulk color/font/spacing migrations across multiple files
- Standardizing form patterns, status badges, or layout containers

## Template-to-Module Conversion Workflow

### Phase 1: Template Analysis

Before writing any code, thoroughly analyze the source HTML template:

1. **Open and read the HTML file** completely. Identify:
   - Page structure (hero sections, card grids, form blocks, timeline elements)
   - Color palette used (hex codes, gradients, opacity values)
   - Typography (font sizes, weights, letter-spacing, text-transform)
   - Icon system (Material Symbols, Font Awesome, SVG, etc.)
   - Interactive elements (toggles, accordions, checkboxes, file uploads)
   - Data patterns (static text, repeated card structures, list items)

2. **Create a mental mapping** from template elements to theme variables:

   | Template Pattern | Theme Variable |
   |-----------------|----------------|
   | Dark background (`#111316`, `#1a1c1f`) | `var(--m-bg)`, `var(--m-surface)` |
   | Card backgrounds | `var(--m-surface)`, `var(--m-surface-hover)` |
   | Primary brand color | `var(--m-accent)`, `var(--m-accent-solid)` |
   | Gradient buttons | `from-[var(--m-accent)] to-[var(--m-accent-solid)]` |
   | Muted/secondary text | `var(--m-text-secondary)`, `var(--m-text-muted)` |
   | Success/Warning/Danger | `var(--m-success)`, `var(--m-warning)`, `var(--m-danger)` |
   | Status badge backgrounds | `var(--m-success-bg)`, `var(--m-warning-bg)`, `var(--m-danger-bg)` |
   | Status badge borders | `var(--m-success-border)`, `var(--m-warning-border)`, `var(--m-danger-border)` |
   | Input backgrounds | `var(--m-input-bg)` |
   | Border/dividers | `var(--m-border)`, `var(--m-border-subtle)` |

3. **Identify the corresponding existing module** in the mobile app. Check:
   - `app/m/menu/page.tsx` for the menu entry and route
   - `app/m/MobileShell.tsx` for header registration
   - `app/api/saha/` for existing API endpoints

### Phase 2: Component Conversion

Convert the HTML template into a React/Next.js component following these rules:

1. **File header**: Always start with `"use client";` for interactive mobile pages

2. **State management**: Convert static HTML data into React state:
   - Identify what data should come from API calls (`useState` + `useEffect` + `fetch`)
   - Identify what data is user input (`useState` for form fields)
   - Identify what data is static configuration (constants outside component)

3. **Replace ALL hardcoded colors** with CSS variables:
   ```tsx
   // BAD - hardcoded hex
   className="bg-[#1a1c1f] text-[#e2e2e6] border-[#283039]"
   
   // GOOD - theme variables
   className="bg-[var(--m-surface)] text-[var(--m-text)] border-[var(--m-border)]"
   ```

4. **Convert HTML class names** to Tailwind equivalents:
   - `style="font-size: 10px"` -> `text-[10px]`
   - `style="letter-spacing: 0.12em"` -> `tracking-[0.12em]`
   - `style="gap: 12px"` -> `gap-3`
   - `onclick="..."` -> `onClick={() => ...}`

5. **API integration pattern** - every module should follow this structure:
   ```tsx
   const [data, setData] = useState<DataType[]>([]);
   const [loading, setLoading] = useState(true);
   
   useEffect(() => { fetchData(); }, []);
   
   async function fetchData() {
       try {
           const res = await fetch('/api/saha/<endpoint>');
           if (res.ok) {
               const data = await res.json();
               setData(Array.isArray(data) ? data : []);
           }
       } catch (err) {
           console.error('<context> alinamadi:', err);
       } finally {
           setLoading(false);
       }
   }
   ```

6. **Standard page layout**:
   ```tsx
   return (
       <div className="space-y-6 pb-8">
           {/* Hero/Header Section */}
           {/* Stats/Summary Section */}
           {/* Content List/Form */}
           {/* Actions */}
       </div>
   );
   ```

### Phase 3: Registration

After creating the page component, register it in the navigation system:

1. **MobileShell.tsx** - Add pathname to `pagesWithCustomHeader` array if page uses its own header. Add title mapping in `getPageTitle()`:
   ```tsx
   if (p.startsWith('/m/yeni-modul')) return 'Yeni Modul';
   ```

2. **menu/page.tsx** - Add module to the appropriate category in the menu grid:
   ```tsx
   { icon: 'module_icon', label: 'Modul Adi', href: '/m/yeni-modul', color: 'text-[var(--m-accent)]' }
   ```

3. **BottomNav.tsx** - Only add here if the module is a primary navigation item (max 5 tabs)

### Phase 4: API Verification

Verify that the required API endpoints exist:

1. Check `app/api/saha/` for the relevant endpoint
2. If missing, check the Prisma schema (`prisma/schema.prisma`) for the data model
3. Create the API endpoint following the tenant-isolated pattern:
   ```tsx
   const session = await auth();
   const tenantId = (session?.user as { tenantId?: string })?.tenantId;
   if (!tenantId) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 });
   ```

## Consistency Audit Workflow

### Step 1: Inventory All Mobile Pages

List all mobile page files to audit:
```
app/m/*/page.tsx
app/m/*/*/page.tsx
```

### Step 2: Automated Hardcoded Color Detection

Run grep searches to find hardcoded hex colors:
```bash
grep -rn "#[0-9a-fA-F]\{3,8\}" app/m/ --include="*.tsx"
```

Common violations to look for:
- `bg-white` or `bg-[#ffffff]` -> `bg-[var(--m-surface)]`
- `text-white/5` or `bg-white/10` -> `bg-[var(--m-badge-bg)]` or `bg-[var(--m-surface-hover)]`
- `bg-[#1e2023]` or similar dark grays -> `var(--m-surface)` or `var(--m-surface-hover)`
- `colorScheme: 'dark'` on inputs -> Remove (breaks light mode)
- Inline `style={{ color: '#xxx' }}` -> Use Tailwind with CSS variable

### Step 3: Layout Spacing Standardization

Verify all pages use consistent container spacing:
- Outer container: `space-y-6 pb-8` (standard for all modules)
- Form sections: `space-y-4` or `space-y-6`
- Card gaps: `gap-3` for grid layouts
- Section headers: `mb-4` or `mb-5` for spacing below headers

### Step 4: Mock Data Identification

Search for mock/hardcoded data patterns:

1. **Static data arrays** at module level (outside component):
   ```tsx
   // RED FLAG: Hardcoded data array
   const VEHICLES: Vehicle[] = [
       { plate: "34 ABC 123", driver: "Mehmet Yilmaz" },
   ];
   ```

2. **Simulated API responses**: Search for:
   - `alert('...(simulasyon)...')`
   - `alert('...(API entegrasyonu tamamlanana kadar)...')`
   - `// mock`, `// simulated`, `// static data`
   - `setTimeout` used to simulate loading

3. **Hardcoded display values in JSX**:
   - Static numbers in stat cards that should come from API
   - Hardcoded names, dates, or locations
   - `idx < N` patterns that artificially set visual states

4. **Static checklist/timeline items** that never change regardless of data

### Step 5: Mock Data Replacement Strategy

For each mock data instance found:

| Mock Pattern | Replacement |
|-------------|-------------|
| Hardcoded data array (VEHICLES, ITEMS) | `useState` + `useEffect` + API fetch |
| `alert('...simulated...')` | Real `fetch()` POST call with error handling |
| Static stat numbers ("14 aktif arac") | Dynamic count from API response (`data.filter(x => x.status === 'active').length`) |
| Hardcoded checklist check state (`idx < 2`) | Neutral unchecked state OR derive from real audit data |
| `// mock progress` comments | Fix comment to reflect real calculation |

### Step 6: Cross-Module Pattern Verification

Verify these patterns are consistent across ALL modules:

1. **Loading states**: Spinner with text below
   ```tsx
   <div className="flex flex-col items-center justify-center py-20">
       <div className="w-8 h-8 border-2 border-[var(--m-accent)] border-t-transparent rounded-full animate-spin mb-3" />
       <p className="text-[var(--m-text-muted)] text-sm">Yukleniyor...</p>
   </div>
   ```

2. **Empty states**: Icon + title + subtitle
   ```tsx
   <div className="flex flex-col items-center justify-center py-20">
       <div className="w-16 h-16 rounded-2xl bg-[var(--m-accent-bg)] flex items-center justify-center mb-4">
           <span className="material-symbols-outlined text-4xl text-[var(--m-accent)]">icon_name</span>
       </div>
       <p className="text-[var(--m-text)] font-bold text-base mb-1">Baslik</p>
       <p className="text-[var(--m-text-muted)] text-sm text-center px-8">Aciklama</p>
   </div>
   ```

3. **Status badges**: Consistent sizing and styling
   ```tsx
   className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg border"
   ```

4. **Form inputs**: Consistent height, padding, and border styling
   ```tsx
   className="w-full bg-[var(--m-surface)] border border-[var(--m-border)] rounded-lg px-4 py-3 text-[var(--m-text)] focus:border-[var(--m-accent)] focus:ring-0 text-sm"
   ```

5. **Section labels**: Consistent uppercase pattern
   ```tsx
   className="text-xs font-semibold text-[var(--m-text-secondary)] mb-2 uppercase tracking-wider"
   ```

6. **Submit buttons**: Gradient with active scale
   ```tsx
   className="w-full py-4 bg-gradient-to-r from-[var(--m-accent)] to-[var(--m-accent-solid)] text-white font-bold tracking-wide rounded-xl shadow-xl active:scale-[0.98] transition-all"
   ```

## Common Pitfalls and Lessons Learned

### Color Pitfalls

1. **Never use `bg-white`** in mobile components. It breaks dark mode. Use `bg-[var(--m-surface)]`.
2. **Never use `colorScheme: 'dark'`** on individual inputs. It forces dark chrome on date pickers regardless of theme.
3. **Opacity with hex colors** (e.g., `bg-[#46a34a]/10`) must be converted to the matching theme variable with its `-bg` variant (e.g., `bg-[var(--m-success-bg)]`).
4. **Gradient backgrounds** using hardcoded colors must use `from-[var(--m-accent)] to-[var(--m-accent-solid)]`.

### Data Pitfalls

1. **Static arrays outside components** are the #1 source of mock data. Always check for `const ITEMS = [...]` at the top of files.
2. **Progress calculations from dates** are NOT mock data if they use real API dates. Check the data source before flagging.
3. **Standard checklist templates** (e.g., ISG safety checklist items) are acceptable as static data — they define the form structure, not the form data.
4. **Form submission alerts** that say "simulated" or "API integration pending" must be replaced with real `fetch()` calls.

### API Patterns

1. **Always use the existing `/api/saha/ekipman` endpoint** for equipment/vehicle data instead of creating fake vehicle arrays.
2. **Equipment model fields**: `id`, `code`, `name`, `type`, `plateNumber`, `status` (active/maintenance/out_of_order), `hourlyRate`, `project` (relation).
3. **ISG audit endpoint**: `/api/saha/isg/denetim` (GET list, POST new audit)
4. **ISG incident endpoint**: `/api/saha/isg/olaylar` (GET list, POST new incident with FormData for photos)
5. **Projects endpoint**: `/api/projects` (returns `id`, `name`, `location`, `status`, `startDate`, `endDate`, `budget`, `actualCost`, `_count`)

### Navigation Pitfalls

1. **All 13 mobile modules** must be registered in `MobileShell.tsx` AND have menu entries in `menu/page.tsx`.
2. **The module list**: Panel, Rapor, Puantaj, Onay, Menu, Stok, Ekipman, Imalat, Projeler, Talep, ISG, Kaza, Lojistik, Kalite Kontrol, Gunluk Rapor.
3. **Pages with their own header** must be in the `pagesWithCustomHeader` array to avoid double headers.

## Reference: Module-to-API Mapping

| Module | Route | API Endpoint | Prisma Model |
|--------|-------|-------------|--------------|
| Lojistik | `/m/lojistik` | `/api/saha/ekipman` | Equipment |
| ISG Denetim | `/m/isg` | `/api/saha/isg/denetim` | IsgAudit |
| Kaza Rapor | `/m/kaza` | `/api/saha/isg/olaylar` | IsgIncident |
| Imalat | `/m/imalat` | `/api/sozlesme` | Sozlesme, HakedisKalem |
| Projeler | `/m/projeler` | `/api/projects` | Project |
| Gunluk Rapor | `/m/gunluk-rapor` | `/api/saha/gunluk-rapor` | DailyReport |
| Puantaj | `/m/puantaj` | `/api/saha/gunluk-rapor` | Timesheet |
| Stok | `/m/stok` | `/api/saha/stok` | StockMovement, Material |
| Ekipman | `/m/ekipman` | `/api/saha/ekipman` | Equipment |
| Talep | `/m/talep` | `/api/satinalma` | PurchaseRequest |
| Onay | `/m/onay` | `/api/satinalma` | PurchaseRequest |
| Kalite Kontrol | `/m/kalite-kontrol` | `/api/saha/kalite-kontrol` | QualityControl |

## Reference: Complete Theme Variable List

Refer to `styles/mobile-theme.css` for the authoritative list of CSS custom properties. The file defines tokens under both `[data-mobile-theme="dark"]` and `[data-mobile-theme="light"]` selectors. All mobile page styles must exclusively use `var(--m-*)` tokens — grep for any hardcoded hex values as a final verification step.

## Quick Audit Command Sequence

To perform a rapid consistency check on all mobile pages:

```bash
# Find hardcoded colors
grep -rn "bg-white\|bg-\[#\|text-\[#\|border-\[#\|colorScheme" app/m/ --include="*.tsx"

# Find mock data patterns
grep -rn "mock\|simul\|fake\|hardcoded\|static data\|placeholder" app/m/ --include="*.tsx" -i

# Find all page files
find app/m -name "page.tsx" -type f

# Check container spacing consistency
grep -n "space-y-" app/m/*/page.tsx | head -30
```
