import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "MS Oto Servis Mobil",
  description: "Oto Servis Yönetimi Mobil Uygulaması",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
  themeColor: "#f8f9ff",
};

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      <style>{`.material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }`}</style>
      <div className="light bg-surface text-on-surface min-h-screen antialiased selection:bg-primary/20 selection:text-primary font-body">
        {children}
      </div>
    </>
  );
}
