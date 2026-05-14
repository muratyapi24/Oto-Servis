"use client";

import * as React from "react";
import { clsx } from "clsx";

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | undefined>(undefined);

function useDropdownMenu() {
  const context = React.useContext(DropdownMenuContext);
  if (!context) {
    throw new Error("Dropdown components must be used within DropdownMenu");
  }
  return context;
}

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

export const DropdownMenuTrigger = React.forwardRef<
  HTMLDivElement,
  { children: React.ReactNode; asChild?: boolean }
>(({ children, asChild = false }, ref) => {
  const { open, setOpen } = useDropdownMenu();

  const handleClick = () => {
    setOpen(!open);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: handleClick,
      "aria-expanded": open,
      "aria-haspopup": "true",
    });
  }

  return (
    <div
      ref={ref}
      onClick={handleClick}
      aria-expanded={open}
      aria-haspopup="true"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {children}
    </div>
  );
});

DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

export function DropdownMenuContent({
  children,
  align = "end",
  className,
}: {
  children: React.ReactNode;
  align?: "start" | "end" | "center";
  className?: string;
}) {
  const { open, setOpen } = useDropdownMenu();
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      className={clsx(
        "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border border-outline-variant",
        "bg-surface-container-lowest shadow-md mt-2 py-1",
        "dark:bg-gray-800 dark:border-gray-700 dark:shadow-xl",
        "animate-in fade-in-0 zoom-in-95",
        {
          "right-0": align === "end",
          "left-0": align === "start",
          "left-1/2 -translate-x-1/2": align === "center",
        },
        className
      )}
      role="menu"
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const { setOpen } = useDropdownMenu();

  const handleClick = () => {
    onClick?.();
    setOpen(false);
  };

  return (
    <div
      className={clsx(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm",
        "outline-none transition-colors",
        "hover:bg-surface-container-high focus:bg-surface-container-high",
        "dark:hover:bg-gray-700 dark:focus:bg-gray-700",
        "text-on-surface dark:text-on-surface",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-primary",
        className
      )}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      role="menuitem"
      tabIndex={0}
    >
      {children}
    </div>
  );
}
