import Sidebar from "@/components/super-admin/Sidebar";
import type { Metadata } from "next";
import { Providers } from "@/components/Providers";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "BST Command Center",
  description: "Super Admin Yönetim Paneli",
};

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="text-on-surface text-sm overflow-hidden h-screen flex bg-background font-body">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          {children}
        </main>
      </div>
    </Providers>
  );
}
