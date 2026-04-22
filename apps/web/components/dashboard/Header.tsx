"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

/*
  Şablondaki <header> bloğu birebir aktarıldı.
  material-symbols-outlined ikonları kullanıyor.
*/

export function Header() {
  const { data: session } = useSession();

  const getInitials = (name: string) => {
    return name?.substring(0, 2).toUpperCase() || "AB";
  };

  return (
    <header className="w-full sticky top-0 z-40 bg-white/80 backdrop-blur-md px-8 py-4 flex justify-between items-center ambient-shadow border-b border-outline-variant/5">
      <div className="flex items-center space-x-8">
        {/* Search */}
        <div className="relative flex items-center bg-surface-container-low px-4 py-2 rounded-full min-w-[320px]">
          <span className="material-symbols-outlined text-slate-400 text-sm mr-2">search</span>
          <input className="bg-transparent border-none focus:ring-0 text-sm w-full p-0 outline-none" placeholder="Search orders, customers, license plates..." type="text" />
        </div>
        {/* Quick Links */}
        <div className="hidden xl:flex items-center space-x-6">
          <Link href="/dashboard" className="text-blue-700 font-semibold text-sm border-b-2 border-blue-700 pb-1">Dashboard</Link>
          <Link href="/dashboard/inventory" className="text-slate-500 font-medium text-sm hover:text-blue-600 transition-colors">Inventory</Link>
          <Link href="/dashboard/customers" className="text-slate-500 font-medium text-sm hover:text-blue-600 transition-colors">Customers</Link>
          <Link href="#" className="text-slate-500 font-medium text-sm hover:text-blue-600 transition-colors">Reports</Link>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        {/* Action Buttons */}
        <div className="flex items-center space-x-2 mr-4 border-r border-outline-variant/20 pr-4">
          <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full border-2 border-white"></span>
          </button>
          <Link href="/dashboard/settings" className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
            <span className="material-symbols-outlined">settings</span>
          </Link>
        </div>
        {/* Profile */}
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-sm mr-3 ring-2 ring-blue-50">
            {getInitials(session?.user?.name || "Admin")}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-bold text-on-surface leading-none">{session?.user?.name || "Ahmet Bey"}</p>
            <p className="text-[11px] text-slate-500 font-medium">Servis Müdürü</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
