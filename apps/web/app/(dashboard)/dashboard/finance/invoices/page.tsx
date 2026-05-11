import { redirect } from "next/navigation";

export default function LegacyInvoicesPage() {
  redirect("/dashboard/finances/invoices");
}
