import { redirect } from "next/navigation";

// /dashboard/staff → /dashboard/mechanics yönlendirmesi
export default function StaffPage() {
  redirect("/dashboard/mechanics");
}
