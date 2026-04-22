import React from "react";
import { TopAppBar } from "@/components/mobile/TopAppBar";
import { BottomNavBar } from "@/components/mobile/BottomNavBar";
import { SessionProvider } from "next-auth/react";

export default function FirmaMobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="flex flex-col min-h-screen">
        <TopAppBar />
        <main className="mt-20 px-6 space-y-8 pb-24">
          {children}
        </main>
        <BottomNavBar />
      </div>
    </SessionProvider>
  );
}
