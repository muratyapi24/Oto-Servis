import type { Metadata } from "next";
import { ImportWizard } from "./ImportWizard";

export const metadata: Metadata = {
  title: "Toplu Müşteri & Araç Aktarımı | BST Otoservis",
};

export default function ImportPage() {
  return (
    <div className="flex flex-col h-full">
      <header className="h-12 bg-white flex shrink-0 items-center gap-3 px-6 border-b border-outline/20">
        <span className="material-symbols-outlined text-primary text-xl">upload_file</span>
        <h2 className="text-sm font-bold tracking-tight uppercase text-on-surface">
          Toplu Veri Aktarımı (CSV / Excel)
        </h2>
      </header>
      <div className="flex-1 overflow-y-auto p-6">
        <ImportWizard />
      </div>
    </div>
  );
}
