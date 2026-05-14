import * as React from "react";
import { clsx } from "clsx";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={clsx(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          "dark:focus-visible:ring-offset-gray-900 dark:focus-visible:ring-primary",
          "disabled:pointer-events-none disabled:opacity-50",
          {
            // Variants
            "bg-primary text-on-primary hover:bg-primary/90 dark:bg-primary dark:text-on-primary dark:hover:bg-primary/90": variant === "default",
            "hover:bg-surface-container-high hover:text-on-surface dark:hover:bg-gray-700 dark:hover:text-on-surface": variant === "ghost",
            "border border-outline-variant bg-transparent hover:bg-surface-container-high dark:border-gray-600 dark:hover:bg-gray-800 dark:text-on-surface": variant === "outline",
            "bg-error text-on-error hover:bg-error/90 dark:bg-error dark:text-on-error dark:hover:bg-error/90": variant === "destructive",
            
            // Sizes
            "h-10 px-4 py-2": size === "default",
            "h-9 rounded-md px-3": size === "sm",
            "h-11 rounded-md px-8": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
