"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function LandingNavbar() {
  const pathname = usePathname();

  const navLinks = [
    { name: "Ana Sayfa", href: "/" },
    { name: "Özellikler", href: "/features" },
    { name: "Fiyatlandırma", href: "/pricing" },
    { name: "Hakkımızda", href: "/about" },
    { name: "Blog", href: "/blog" },
    { name: "İletişim", href: "/contact" },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl shadow-xl shadow-blue-900/5 transition-all">
      <div className="flex justify-between items-center max-w-7xl mx-auto px-6 h-20">
        <div className="text-lg font-black tracking-tighter text-slate-900">
          ÖNCÜ OTO SERVİS PROGRAMI V.1.9
        </div>
        <div className="hidden md:flex gap-8 items-center">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={
                  isActive
                    ? "text-blue-600 font-bold border-b-2 border-blue-600 transition-colors"
                    : "text-slate-600 font-medium hover:text-blue-700 transition-colors"
                }
              >
                {link.name}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            href="/login"
            className="text-slate-600 font-medium hover:text-blue-700 transition-transform active:scale-90 px-4 py-2"
          >
            Giriş Yap
          </Link>
          <Link
            href="/register"
            className="bg-primary-container text-on-primary-container font-bold px-6 py-2.5 rounded-lg transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
          >
            Ücretsiz Dene
          </Link>
        </div>
      </div>
    </nav>
  );
}
