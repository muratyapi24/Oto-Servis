# UI Components

This directory contains reusable UI primitives for the MS Oto Servis web application.

## Components

### Button (`button.tsx`)

A flexible button component with multiple variants and sizes.

**Props:**
- `variant`: "default" | "ghost" | "outline" | "destructive"
- `size`: "default" | "sm" | "lg" | "icon"
- All standard HTML button attributes

**Usage:**
```tsx
import { Button } from "@/components/ui/button";

<Button variant="ghost" size="icon">
  <Icon />
</Button>
```

### DropdownMenu (`dropdown-menu.tsx`)

A dropdown menu component with keyboard navigation and accessibility support.

**Components:**
- `DropdownMenu`: Container component
- `DropdownMenuTrigger`: Trigger button (supports `asChild` prop)
- `DropdownMenuContent`: Menu content container
- `DropdownMenuItem`: Individual menu item

**Features:**
- Click outside to close
- Escape key to close
- Keyboard navigation (Tab, Enter, Space)
- Alignment options (start, end, center)

**Usage:**
```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button>Open Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={() => console.log("Item 1")}>
      Item 1
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => console.log("Item 2")}>
      Item 2
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### ThemeToggle (`theme-toggle.tsx`)

A theme switcher component that allows users to toggle between light, dark, and system themes.

**Features:**
- Three theme options: Light, Dark, System
- Smooth icon transitions with dark mode variants
- Full keyboard accessibility (Tab, Enter, Escape)
- ARIA labels for screen readers
- Internationalized labels (Turkish and English)
- Visual feedback for current selection

**Requirements Validated:**
- 5.1: Displays current active theme state
- 5.2: Cycles through theme options
- 5.3: Appropriate icons for each theme state
- 5.4: Keyboard navigation support
- 5.5: ARIA labels for accessibility
- 5.6: Visual feedback during transitions
- 11.3: Internationalized labels

**Usage:**
```tsx
import { ThemeToggle } from "@/components/ui/theme-toggle";

// In your navigation header
<ThemeToggle />
```

**Dependencies:**
- `@/components/theme-provider`: For theme state management
- `lucide-react`: For Sun, Moon, and Monitor icons
- `next-intl`: For translations

**Translations Required:**
The component uses the following translation keys from the `theme` namespace:
- `toggleTheme`: Button aria-label
- `light`: Light mode label
- `dark`: Dark mode label
- `system`: System theme label

## Styling

All components use Tailwind CSS with the project's design system tokens:
- Color tokens from `globals.css` (e.g., `surface-container-lowest`, `on-surface`)
- Dark mode support via `.dark` class
- Smooth transitions with `prefers-reduced-motion` support

## Accessibility

All components follow WCAG AA accessibility guidelines:
- Keyboard navigation support
- ARIA attributes for screen readers
- Focus indicators
- Semantic HTML
- Color contrast ratios meet WCAG requirements
