# Implementation Plan: Dark/Light Theme System

## Overview

This implementation plan breaks down the dark/light theme system into discrete coding tasks across web and mobile platforms. The system provides seamless theme switching with persistence, SSR support, system preference detection, and accessibility compliance. Implementation follows a phased approach: core infrastructure → providers → UI components → styling → testing → deployment.

## Tasks

- [x] 1. Set up core theme infrastructure for web platform
  - [x] 1.1 Create theme type definitions and constants
    - Create `apps/web/lib/theme/types.ts` with ThemeMode, ThemePreference, ThemeContextValue interface
    - Define THEME_STORAGE_KEY, THEME_MODES, and THEME_PREFERENCES constants
    - _Requirements: 1.4, 1.5_
  
  - [ ]* 1.2 Write property test for theme type validation
    - **Property 2: Theme Preference Validation**
    - **Validates: Requirements 1.4, 16.5**
    - Test that only "light", "dark", "system" are accepted as valid preferences
    - _Requirements: 1.4, 16.5_
  
  - [x] 1.3 Create localStorage storage abstraction
    - Create `apps/web/lib/theme/storage.ts` with ThemeStorage interface
    - Implement LocalStorageThemeStorage class with get(), set(), remove() methods
    - Add error handling for storage unavailability
    - _Requirements: 1.1, 1.2, 16.1, 16.4_
  
  - [ ]* 1.4 Write property test for storage round-trip preservation
    - **Property 1: Storage Round-Trip Preservation**
    - **Validates: Requirements 1.2, 1.3, 1.6, 17.6**
    - Test that storing and retrieving any valid preference produces the same value
    - _Requirements: 1.2, 1.3, 1.6, 17.6_
  
  - [ ]* 1.5 Write property test for corrupted value recovery
    - **Property 9: Corrupted Value Recovery**
    - **Validates: Requirements 16.3**
    - Test that invalid storage values reset to "system" mode without crashing
    - _Requirements: 16.3, 16.4_
  
  - [x] 1.6 Create system preference detection utilities
    - Create `apps/web/lib/theme/system-preference.ts`
    - Implement getSystemPreference() using prefers-color-scheme media query
    - Implement subscribeToSystemPreference() with cleanup function
    - Add error handling for unsupported browsers
    - _Requirements: 2.1, 2.2, 2.4, 16.2_
  
  - [x] 1.7 Create theme resolution logic
    - Create `apps/web/lib/theme/resolver.ts`
    - Implement resolveTheme() function (system → use system pref, explicit → use explicit)
    - Implement validateThemePreference() function
    - _Requirements: 2.1, 2.3, 4.1, 4.2, 16.3, 16.5_
  
  - [ ]* 1.8 Write property test for theme resolution correctness
    - **Property 5: Theme Resolution Correctness**
    - **Validates: Requirements 4.1, 4.2**
    - Test that theme resolves correctly for all preference/system combinations
    - _Requirements: 4.1, 4.2_
  
  - [ ]* 1.9 Write property test for explicit preference override
    - **Property 3: Explicit Preference Overrides System**
    - **Validates: Requirements 2.3**
    - Test that explicit preferences remain constant despite system changes
    - _Requirements: 2.3_

- [x] 2. Configure dark mode CSS and Tailwind
  - [x] 2.1 Add dark mode CSS custom properties to globals.css
    - Modify `apps/web/app/globals.css`
    - Define light mode CSS variables in :root
    - Define dark mode CSS variables in .dark selector
    - Add body transition styles with prefers-reduced-motion support
    - _Requirements: 3.1, 3.6, 8.1, 8.2, 8.3, 8.4_
  
  - [x] 2.2 Configure Tailwind for dark mode
    - Modify `apps/web/tailwind.config.ts`
    - Set darkMode: ["class"]
    - Extend theme colors to use CSS custom properties
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ]* 2.3 Write unit tests for CSS custom property definitions
    - Test that all required CSS variables are defined for both themes
    - Test contrast ratios meet WCAG AA requirements (4.5:1 for text, 3:1 for UI)
    - _Requirements: 3.4, 3.5, 14.1, 14.2_

- [x] 3. Implement web theme provider and SSR support
  - [x] 3.1 Create blocking script for SSR
    - Create `apps/web/components/theme-script.tsx`
    - Implement inline script that reads localStorage and applies theme before hydration
    - Add error handling and suppressHydrationWarning
    - _Requirements: 12.1, 12.2, 12.3, 12.5_
  
  - [x] 3.2 Create web theme provider component
    - Create `apps/web/components/theme-provider.tsx`
    - Implement ThemeContext with theme, preference, setPreference, isLoading
    - Add useEffect for storage initialization
    - Add useEffect for system preference subscription
    - Add useEffect for DOM class application
    - Implement setPreference callback with storage persistence
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  
  - [ ]* 3.3 Write property test for DOM class application
    - **Property 4: DOM Class Reflects Theme**
    - **Validates: Requirements 3.2, 3.3**
    - Test that dark theme adds "dark" class and light theme removes it
    - _Requirements: 3.2, 3.3_
  
  - [ ]* 3.4 Write property test for preference persistence
    - **Property 6: Preference Update Persists to Storage**
    - **Validates: Requirements 4.4**
    - Test that updating preference immediately stores to localStorage
    - _Requirements: 4.4_
  
  - [ ]* 3.5 Write unit tests for theme provider
    - Test context value exposure
    - Test state updates on preference changes
    - Test hydration synchronization
    - Test cleanup of system preference listeners
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 12.4_
  
  - [x] 3.6 Integrate theme provider into root layout
    - Modify `apps/web/app/layout.tsx`
    - Add ThemeScript to <head>
    - Wrap children with ThemeProvider
    - Add suppressHydrationWarning to <html> element
    - _Requirements: 4.6, 12.1, 12.2, 12.3, 12.4_

- [x] 4. Create web theme toggle component
  - [x] 4.1 Implement theme toggle UI component
    - Create `apps/web/components/ui/theme-toggle.tsx`
    - Use DropdownMenu with three options (light, dark, system)
    - Add Sun/Moon/Monitor icons from lucide-react
    - Implement icon transitions with dark: variants
    - Add ARIA labels and keyboard support
    - Use next-intl for translations
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 11.3_
  
  - [ ]* 4.2 Write property test for theme toggle cycling
    - **Property 8: Theme Toggle Cycling Sequence**
    - **Validates: Requirements 5.2**
    - Test that clicking three times cycles through all options and returns to start
    - _Requirements: 5.2_
  
  - [ ]* 4.3 Write property test for theme toggle display
    - **Property 7: Theme Toggle Display Correctness**
    - **Validates: Requirements 5.1, 5.3**
    - Test that correct icon displays for each theme state
    - _Requirements: 5.1, 5.3_
  
  - [ ]* 4.4 Write unit tests for theme toggle accessibility
    - Test keyboard navigation (Tab, Enter)
    - Test ARIA attributes
    - Test screen reader announcements
    - Test focus visibility
    - _Requirements: 5.4, 5.5, 14.3, 14.4, 14.5_

- [x] 5. Checkpoint - Verify core web theme system
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Add theme toggle to web navigation
  - [x] 6.1 Add theme toggle to dashboard header
    - Modify `apps/web/components/dashboard/header.tsx` (or equivalent navigation component)
    - Import and render ThemeToggle component
    - Position in navigation header
    - _Requirements: 6.1, 6.4, 6.5_
  
  - [x] 6.2 Add theme toggle to super admin header
    - Modify `apps/web/components/super-admin/header.tsx` (or equivalent navigation component)
    - Import and render ThemeToggle component
    - Position in navigation header
    - _Requirements: 6.2, 6.4, 6.5_
  
  - [x] 6.3 Add theme toggle to mobile web navigation
    - Modify mobile navigation menu component (under `/m/firma` and `/m/musteri`)
    - Import and render ThemeToggle component
    - Ensure responsive positioning
    - _Requirements: 6.3, 6.4, 6.5_
  
  - [x] 6.4 Add theme toggle to public pages
    - Modify login page (`apps/web/app/(auth)/login/page.tsx`)
    - Modify super admin login page (`apps/web/app/(auth)/superadmin-login/page.tsx`)
    - Modify register page (`apps/web/app/(auth)/register/page.tsx`)
    - Modify pricing page (`apps/web/app/pricing/page.tsx`)
    - Add ThemeToggle to top navigation bar
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.6_

- [x] 7. Add dark mode variants to web UI components
  - [x] 7.1 Add dark mode to generic UI primitives
    - Modify all components in `apps/web/components/ui/`
    - Add dark: Tailwind variants for backgrounds, text, borders
    - Ensure focus indicators visible in dark mode
    - Ensure form inputs have clear boundaries in dark mode
    - _Requirements: 9.1, 9.5, 9.6, 14.5_
  
  - [x] 7.2 Add dark mode to dashboard components
    - Modify all components in `apps/web/components/dashboard/`
    - Add dark: Tailwind variants for all color properties
    - Test interactive components maintain visibility
    - _Requirements: 9.3, 9.5_
  
  - [x] 7.3 Add dark mode to super admin components
    - Modify all components in `apps/web/components/super-admin/`
    - Add dark: Tailwind variants for all color properties
    - Test interactive components maintain visibility
    - _Requirements: 9.4, 9.5_
  
  - [x] 7.4 Add dark mode to shared component library
    - Modify all components in `packages/ui/`
    - Add dark: Tailwind variants for all color properties
    - Ensure components work in both themes
    - _Requirements: 9.2_
  
  - [ ]* 7.5 Write integration tests for component dark mode
    - Test that all components render correctly in dark mode
    - Test that interactive elements maintain visibility
    - Test focus indicators in both themes
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [x] 8. Add internationalization for theme labels
  - [x] 8.1 Add Turkish translations for theme
    - Modify `apps/web/messages/tr.json`
    - Add theme.toggleTheme, theme.light, theme.dark, theme.system, theme.themeSettings
    - _Requirements: 11.1, 11.3, 11.4_
  
  - [x] 8.2 Add English translations for theme
    - Modify `apps/web/messages/en.json`
    - Add theme.toggleTheme, theme.light, theme.dark, theme.system, theme.themeSettings
    - _Requirements: 11.2, 11.3, 11.4_

- [x] 9. Checkpoint - Verify complete web implementation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement mobile theme infrastructure
  - [x] 10.1 Create mobile theme type definitions
    - Create `apps/mobile/lib/theme/types.ts` (same as web)
    - Define ThemeMode, ThemePreference, ThemeContextValue
    - Define constants
    - _Requirements: 1.4, 1.5_
  
  - [x] 10.2 Create SecureStore storage abstraction
    - Create `apps/mobile/lib/theme/storage.ts`
    - Implement SecureStoreThemeStorage class with async get(), set(), remove()
    - Add error handling for SecureStore failures
    - _Requirements: 7.2, 16.1, 16.4_
  
  - [x] 10.3 Create mobile system preference detection
    - Create `apps/mobile/lib/theme/system-preference.ts`
    - Implement getSystemPreference() using Appearance.getColorScheme()
    - Implement subscribeToSystemPreference() using Appearance.addChangeListener()
    - _Requirements: 7.5, 2.1, 2.2, 2.4_
  
  - [x] 10.4 Create mobile theme resolver
    - Create `apps/mobile/lib/theme/resolver.ts` (same logic as web)
    - Implement resolveTheme() and validateThemePreference()
    - _Requirements: 4.1, 4.2, 16.3, 16.5_
  
  - [ ]* 10.5 Write property tests for mobile storage
    - Reuse web property tests adapted for async SecureStore
    - Test storage round-trip, validation, corrupted value recovery
    - _Requirements: 1.2, 1.3, 1.6, 16.3, 17.6_

- [x] 11. Implement mobile theme provider
  - [x] 11.1 Create mobile theme provider component
    - Create `apps/mobile/components/theme-provider.tsx`
    - Implement ThemeContext with async storage initialization
    - Add system preference subscription
    - Implement setPreference with async storage
    - _Requirements: 7.1, 7.2, 7.5, 7.6_
  
  - [ ]* 11.2 Write unit tests for mobile theme provider
    - Test context value exposure
    - Test async storage operations
    - Test system preference integration
    - Test cleanup
    - _Requirements: 7.1, 7.2, 7.5, 7.6_
  
  - [x] 11.3 Integrate theme provider into mobile root layout
    - Modify `apps/mobile/app/_layout.tsx`
    - Wrap children with ThemeProvider
    - _Requirements: 7.1, 7.6_

- [x] 12. Create mobile theme toggle component
  - [x] 12.1 Implement mobile theme toggle UI
    - Create `apps/mobile/components/theme-toggle.tsx`
    - Create three TouchableOpacity buttons (system, light, dark)
    - Add emoji icons (💻, ☀️, 🌙)
    - Implement theme-aware styles using StyleSheet
    - Add accessibility props (accessibilityRole, accessibilityLabel, accessibilityState)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ]* 12.2 Write unit tests for mobile theme toggle
    - Test button rendering
    - Test preference updates
    - Test accessibility attributes
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 12.3 Add theme toggle to firma settings screen
    - Modify `apps/mobile/app/(firma)/settings.tsx` (or equivalent)
    - Import and render ThemeToggle component
    - _Requirements: 7.3_
  
  - [x] 12.4 Add theme toggle to musteri settings screen
    - Modify `apps/mobile/app/(musteri)/settings.tsx` (or equivalent)
    - Import and render ThemeToggle component
    - _Requirements: 7.4_

- [ ] 13. Add theme-aware styles to mobile components
  - [-] 13.1 Create theme-aware style utilities for mobile
    - Create utility functions to generate theme-aware styles
    - Use useTheme() hook to get current theme
    - Apply conditional styles based on theme.theme value
    - _Requirements: 7.6_
  
  - [-] 13.2 Update mobile component styles
    - Modify all components in `apps/mobile/components/`
    - Add theme-aware background, text, and border colors
    - Ensure visibility in both themes
    - _Requirements: 7.6_
  
  - [-] 13.3 Update mobile screen styles
    - Modify all screen files in `apps/mobile/app/`
    - Add theme-aware styles
    - Test on both iOS and Android
    - _Requirements: 7.6_

- [~] 14. Checkpoint - Verify complete mobile implementation
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Implement cross-platform testing
  - [ ]* 15.1 Write integration tests for theme persistence
    - Test localStorage persistence across page navigations (web)
    - Test SecureStore persistence across app restarts (mobile)
    - Test theme synchronization across multiple tabs (web)
    - _Requirements: 13.1, 13.2, 13.3, 13.4_
  
  - [ ]* 15.2 Write accessibility tests
    - Test WCAG AA contrast ratios for all color combinations
    - Test keyboard navigation through theme toggle
    - Test screen reader announcements
    - Test focus visibility in both themes
    - Test reduced motion preference handling
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_
  
  - [ ]* 15.3 Write property test for theme switch performance
    - **Property 10: Theme Switch Performance**
    - **Validates: Requirements 4.5, 15.1, 15.5**
    - Test that median time over 100 theme switches is <50ms
    - _Requirements: 4.5, 15.1, 15.2, 15.3, 15.4, 15.5_
  
  - [ ]* 15.4 Write integration tests for SSR synchronization
    - Test that blocking script prevents FOIT
    - Test that server and client themes match
    - Test no hydration errors
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 16. Final testing and quality assurance
  - [ ]* 16.1 Run complete test suite
    - Run all unit tests and verify >90% coverage
    - Run all property tests with 100 iterations each
    - Run all integration tests
    - Fix any failing tests
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_
  
  - [ ]* 16.2 Perform manual QA testing
    - Test on Chrome, Firefox, Safari, Edge
    - Test on iOS Safari and Chrome Mobile
    - Test on different screen sizes
    - Test on iOS and Android devices
    - Verify all user flows work correctly
    - _Requirements: All requirements_
  
  - [ ]* 16.3 Perform accessibility audit
    - Run axe-core automated tests
    - Manual testing with NVDA/JAWS/VoiceOver
    - Keyboard-only navigation testing
    - Color contrast verification
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_
  
  - [ ]* 16.4 Perform performance testing
    - Measure theme switch time (target <50ms)
    - Measure blocking script execution (target <10ms)
    - Monitor memory usage
    - Check bundle size impact
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 12.5_

- [~] 17. Final checkpoint - Production readiness
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties from the design
- Unit tests validate specific examples and edge cases
- The design uses TypeScript, so all implementation will be in TypeScript
- Web platform uses localStorage, mobile uses SecureStore for theme persistence
- Dark mode uses Tailwind's class-based approach with CSS custom properties
- SSR support requires blocking script to prevent flash of incorrect theme
- All color combinations must meet WCAG AA contrast requirements
- Theme system has minimal bundle size impact (~3.5KB gzipped)
- No new dependencies required - all functionality uses existing packages

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": ["1.1", "2.1"]
    },
    {
      "id": 1,
      "tasks": ["1.2", "1.3", "1.6", "1.7", "2.2"]
    },
    {
      "id": 2,
      "tasks": ["1.4", "1.5", "1.8", "1.9", "2.3", "3.1"]
    },
    {
      "id": 3,
      "tasks": ["3.2"]
    },
    {
      "id": 4,
      "tasks": ["3.3", "3.4", "3.5", "3.6"]
    },
    {
      "id": 5,
      "tasks": ["4.1"]
    },
    {
      "id": 6,
      "tasks": ["4.2", "4.3", "4.4"]
    },
    {
      "id": 7,
      "tasks": ["6.1", "6.2", "6.3", "6.4"]
    },
    {
      "id": 8,
      "tasks": ["7.1", "7.2", "7.3", "7.4", "8.1", "8.2"]
    },
    {
      "id": 9,
      "tasks": ["7.5"]
    },
    {
      "id": 10,
      "tasks": ["10.1", "10.2", "10.3", "10.4"]
    },
    {
      "id": 11,
      "tasks": ["10.5", "11.1"]
    },
    {
      "id": 12,
      "tasks": ["11.2", "11.3"]
    },
    {
      "id": 13,
      "tasks": ["12.1"]
    },
    {
      "id": 14,
      "tasks": ["12.2", "12.3", "12.4"]
    },
    {
      "id": 15,
      "tasks": ["13.1"]
    },
    {
      "id": 16,
      "tasks": ["13.2", "13.3"]
    },
    {
      "id": 17,
      "tasks": ["15.1", "15.2", "15.3", "15.4"]
    },
    {
      "id": 18,
      "tasks": ["16.1", "16.2", "16.3", "16.4"]
    }
  ]
}
```
