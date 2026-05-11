import { redirect } from "next/navigation";

export default function LegacyChecksPage() {
  redirect("/dashboard/finances/payments/checks");
}
