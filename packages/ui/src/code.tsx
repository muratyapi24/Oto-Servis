import { type JSX } from "react";

export function Code({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): JSX.Element {
  const baseClasses = "inline-block px-2 py-1 rounded bg-gray-100 text-gray-800 font-mono text-sm border border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700";
  
  return <code className={className ? `${baseClasses} ${className}` : baseClasses}>{children}</code>;
}
