import { redirect } from "next/navigation";

export default function LegacyNewInvoicePage() {
  redirect("/dashboard/finances/invoices");
}
