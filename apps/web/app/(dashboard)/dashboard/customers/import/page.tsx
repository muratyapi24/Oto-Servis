import type { Metadata } from "next";
import PageShell from "@/components/dashboard/PageShell";
import CustomerWorkspaceNav from "@/components/dashboard/customers/CustomerWorkspaceNav";
import { ImportWizard } from "./ImportWizard";

export const metadata: Metadata = {
  title: "Toplu Müşteri & Araç Aktarımı | BST Otoservis",
};

export default function ImportPage() {
  return (
    <PageShell
      title="Toplu Veri Aktarımı"
      subtitle="Müşteri ve araç kayıtlarını CSV veya Excel dosyasıyla içe aktarın."
      sectionLabel="Müşteri & Araç"
    >
      <CustomerWorkspaceNav />
      <ImportWizard />
    </PageShell>
  );
}
