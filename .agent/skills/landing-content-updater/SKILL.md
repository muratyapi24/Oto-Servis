---
name: landing-content-updater
description: Guide for updating marketing/landing page content with product workflow information. This skill should be used when domain knowledge about application modules needs to be translated into user-facing marketing content on landing pages. Covers identifying target sections, structuring workflow data as visual components (timelines, steppers, flow diagrams), and maintaining design consistency.
---

# Landing Content Updater

This skill provides a systematic approach for translating internal product workflow knowledge into compelling marketing content on landing/product pages.

## When to Use

- When new module workflows or features need to be showcased on marketing pages
- When internal documentation about how modules relate to each other needs to be visualized for end users
- When product pages require workflow diagrams, timelines, or step-by-step explanations

## Project Structure

The landing/marketing pages in this project follow this structure:

```
app/
  landing/page.tsx     # Main landing/homepage
  urun/page.tsx        # Product features page
  fiyatlandirma/       # Pricing page
  hakkimizda/          # About us page
components/
  landing/             # Shared landing components (ScrollReveal, TypeWriter, etc.)
```

## Workflow

### Step 1: Understand the Module Workflow

Before updating any marketing content, clearly document the complete workflow:

1. Identify all modules involved in the workflow
2. Map the dependencies between modules (which module requires data from which)
3. Determine the correct sequential order
4. Note any parallel steps (e.g., Cari Hesap and Birim Fiyat can be done independently)

### Step 2: Identify Target Sections

Examine the landing pages to find the right locations for the content:

- `landing/page.tsx` - Add lightweight overview sections (stepper, "how it works")
- `urun/page.tsx` - Add detailed workflow sections with full descriptions

Key sections in the current layout:

| Page | Section | Purpose |
|------|---------|---------|
| `/landing` | FEATURES | Module card grid |
| `/landing` | HOW IT WORKS | Step-by-step workflow overview |
| `/landing` | PLATFORM VISUAL | Dashboard screenshot |
| `/urun` | Module sections | Detailed per-module descriptions |
| `/urun` | Workflow Timeline | Detailed step cards with dependencies |

### Step 3: Design the Visual Components

Use these proven patterns for workflow visualization:

#### Landing Page - Compact Stepper
- Horizontal layout on desktop, vertical on mobile
- Gradient-colored icon circles for each step
- Connection lines between steps
- Final step gets ring highlight effect
- CTA link to detailed view on `/urun` page

#### Product Page - Detailed Timeline
- 5-column grid (responsive: 1col mobile, 2col tablet, 5col desktop)
- Each step card includes: step number, Material icon, title, description, dependency badge
- Gradient connection line across the top
- Mobile connector lines between cards
- Dependency flow diagram at the bottom

### Step 4: Implement Using Existing Components

Always use the existing landing component library:

```tsx
import ScrollReveal from '@/components/landing/ScrollReveal';
```

Available shared components:
- `ScrollReveal` - Scroll-triggered reveal animations (directions: up, left, right, scale, blur)
- `TypeWriter` - Typing animation for text
- `ParticleBackground` - Animated particle effects
- `TestimonialCarousel` - Carousel for testimonials
- `LandingLayout` - Wrapper layout with header/footer

### Step 5: Follow Design Patterns

To maintain visual consistency, follow these design tokens:

```
Colors:
  - Step 1 (Proje):       from-blue-500 to-cyan-500
  - Step 2 (Cari):        from-emerald-500 to-green-500
  - Step 3 (Birim Fiyat): from-violet-500 to-purple-500
  - Step 4 (Sozlesme):    from-amber-500 to-yellow-500
  - Step 5 (Hakedis):     from-orange-500 to-red-500

Card styles:
  - glass-card, glow-border, tilt-card, shine-card classes
  - bg-white/[0.02] with border-white/[0.06]

Text:
  - Section label: text-orange-500 font-semibold text-sm uppercase tracking-widest
  - Heading: text-3xl md:text-4xl font-bold text-white
  - Body: text-slate-400 or text-slate-500

Icons:
  - Material Symbols Outlined (already loaded via CDN)
  - Common module icons: apartment, account_balance, request_quote, description, receipt_long
```

### Step 6: Verify Changes

1. Run `npm run dev` and check both `/landing` and `/urun` pages
2. Verify responsive behavior at mobile, tablet, and desktop widths
3. Ensure scroll animations trigger correctly
4. Validate all links work (e.g., CTA to `/urun#hakedis`)

## Reference: Application Module Dependencies

The core hakedis workflow follows this dependency chain:

```
1. Proje (project creation - base of everything)
2. Cari Hesap (accounts - needed for contracts)     --+
3. Birim Fiyat (unit prices - needed for discovery)  -+--> 4. Sozlesme + Kesif Cetveli
                                                     --+
4. Sozlesme + Kesif Cetveli (contract + discovery schedule)
5. Hakedis (progress payment - requires all above)
```
