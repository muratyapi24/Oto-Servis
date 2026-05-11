import { redirect } from "next/navigation";

export default function LegacyAccountingPage() {
  redirect("/dashboard/settings/e-invoice");
}
