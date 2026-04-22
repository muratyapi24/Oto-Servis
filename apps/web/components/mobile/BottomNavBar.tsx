"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { filterNavItems, MOBILE_WEB_NAV_ITEMS } from "@/lib/permissions";

export const BottomNavBar: React.FC = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role as string | undefined;

  const accessibleNavItems = filterNavItems(userRole, MOBILE_WEB_NAV_ITEMS);

  if (pathname.endsWith("/login")) {
    return null;
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl z-50 rounded-t-3xl shadow-[0_-4px_20px_rgba(30,64,175,0.06)] border-t border-slate-200/15 dark:border-slate-800/15">
        {accessibleNavItems.map((item) => {
          const isActive = pathname === item.href;

          if (isActive) {
            return (
              <Link
                key={item.href}
                className="flex flex-col items-center justify-center bg-blue-100/50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-2xl px-5 py-2 transition-all"
                style={{ transitionTimingFunction: "cubic-bezier(0.4,0,0.2,1)", transitionDuration: "300ms"} as React.CSSProperties}
                href={item.href}
              >
                <span
                  className="material-symbols-outlined"
                  data-icon={item.icon}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {item.icon}
                </span>
                <span className="text-[11px] font-medium font-['Inter'] uppercase tracking-wider mt-1">
                  {item.name}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-5 py-2 hover:text-blue-600 dark:hover:text-blue-300 transition-all"
              style={{ transitionTimingFunction: "cubic-bezier(0.4,0,0.2,1)", transitionDuration: "300ms"} as React.CSSProperties}
              href={item.href}
            >
              <span className="material-symbols-outlined shrink-0" data-icon={item.icon}>
                {item.icon}
              </span>
              <span className="text-[11px] font-medium font-['Inter'] uppercase tracking-wider mt-1">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
      {/* FAB - Global action button like Add Service */}
      <button className="fixed bottom-28 right-6 w-14 h-14 bg-secondary-container text-white rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-transform z-40 border-none shrink-0 border-0 outline-none">
        <span
          className="material-symbols-outlined text-3xl shrink-0"
          data-icon="add"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          add
        </span>
      </button>
    </>
  );
};
