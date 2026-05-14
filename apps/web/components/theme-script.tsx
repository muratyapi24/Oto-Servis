import { THEME_STORAGE_KEY } from "@/lib/theme/types";

/**
 * Blocking script for SSR theme support
 * 
 * This component injects an inline script that runs before React hydration
 * to prevent flash of incorrect theme (FOIT). It reads the theme preference
 * from localStorage and applies the appropriate class to the HTML element.
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.5
 */
export function ThemeScript() {
  const script = `
    (function() {
      try {
        var key = '${THEME_STORAGE_KEY}';
        var preference = localStorage.getItem(key) || 'system';
        var theme = preference;
        
        if (preference === 'system') {
          theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        }
      } catch (e) {}
    })();
  `;
  
  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}
