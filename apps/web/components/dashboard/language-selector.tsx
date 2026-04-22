"use client";

import { useEffect, useState } from "react";

const LOCALES = [
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
] as const;

export function LanguageSelector() {
  const [current, setCurrent] = useState("tr");

  useEffect(() => {
    const match = document.cookie.match(/locale=([^;]+)/);
    if (match?.[1]) setCurrent(match[1]);
  }, []);

  function handleChange(code: string) {
    // Cookie'yi güncelle ve sayfayı yenile
    document.cookie = `locale=${code}; max-age=${60 * 60 * 24 * 365}; path=/; samesite=lax`;
    setCurrent(code);
    window.location.reload();
  }

  const currentLocale = LOCALES.find((l) => l.code === current) ?? LOCALES[0];

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 text-sm transition-colors"
        aria-label="Dil seç"
      >
        <span>{currentLocale.flag}</span>
        <span className="hidden sm:inline text-gray-600">{currentLocale.label}</span>
        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 min-w-[130px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        {LOCALES.map((locale) => (
          <button
            key={locale.code}
            onClick={() => handleChange(locale.code)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
              current === locale.code ? "text-blue-600 font-medium" : "text-gray-700"
            }`}
          >
            <span>{locale.flag}</span>
            <span>{locale.label}</span>
            {current === locale.code && (
              <svg className="w-3.5 h-3.5 ml-auto text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
