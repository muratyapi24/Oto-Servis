"use client";

/**
 * Theme Toggle Component
 * 
 * Provides a dropdown menu for switching between light, dark, and system themes.
 * Uses lucide-react icons with smooth transitions and full accessibility support.
 * 
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 11.3**
 */

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * ThemeToggle Component
 * 
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 11.3**
 * 
 * Displays a button with theme-appropriate icon that opens a dropdown menu
 * with three theme options: Light, Dark, and System.
 * 
 * Features:
 * - Icon transitions with dark: variants (Requirement 5.3)
 * - Keyboard navigation support (Tab, Enter, Escape) (Requirement 5.4)
 * - ARIA labels for screen readers (Requirement 5.5)
 * - Fallback labels when i18n not available (Requirement 11.3)
 * - Visual feedback during theme transitions (Requirement 5.6)
 * 
 * @returns Theme toggle dropdown component
 */
export function ThemeToggle() {
  const { preference, setPreference } = useTheme();
  
  // Fallback labels (can be replaced with i18n when available in context)
  const labels = {
    toggleTheme: "Tema Değiştir",
    light: "Açık",
    dark: "Koyu",
    system: "Sistem",
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          aria-label={labels.toggleTheme}
          className="relative"
        >
          {/* Sun icon for light mode - visible in light, hidden in dark */}
          <Sun 
            className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" 
            aria-hidden="true"
          />
          {/* Moon icon for dark mode - hidden in light, visible in dark */}
          <Moon 
            className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" 
            aria-hidden="true"
          />
          {/* Screen reader only text */}
          <span className="sr-only">{labels.toggleTheme}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Light mode option */}
        <DropdownMenuItem
          onClick={() => setPreference("light")}
          className={preference === "light" ? "bg-surface-container-high" : ""}
          aria-current={preference === "light" ? "true" : undefined}
        >
          <Sun className="mr-2 h-4 w-4" aria-hidden="true" />
          <span>{labels.light}</span>
        </DropdownMenuItem>
        
        {/* Dark mode option */}
        <DropdownMenuItem
          onClick={() => setPreference("dark")}
          className={preference === "dark" ? "bg-surface-container-high" : ""}
          aria-current={preference === "dark" ? "true" : undefined}
        >
          <Moon className="mr-2 h-4 w-4" aria-hidden="true" />
          <span>{labels.dark}</span>
        </DropdownMenuItem>
        
        {/* System mode option */}
        <DropdownMenuItem
          onClick={() => setPreference("system")}
          className={preference === "system" ? "bg-surface-container-high" : ""}
          aria-current={preference === "system" ? "true" : undefined}
        >
          <Monitor className="mr-2 h-4 w-4" aria-hidden="true" />
          <span>{labels.system}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
