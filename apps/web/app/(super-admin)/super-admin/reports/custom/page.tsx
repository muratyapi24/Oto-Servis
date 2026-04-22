import Link from "next/link"
import SuperAdminFooter from "@/components/super-admin/Footer"
import CustomReportBuilder from "./CustomReportBuilder"

export const metadata = { title: "Özel Rapor Oluşturucu | Super Admin" }

export default async function CustomReportPage() {
  return (
    <>
      <header className="h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Link
            href="/super-admin/reports"
            className="material-symbols-outlined text-outline text-xl hover:text-primary transition-colors"
          >
            arrow_back
          </Link>
          <span className="material-symbols-outlined text-primary text-xl">edit_note</span>
          <h2 className="text-sm font-bold tracking-tight uppercase">Özel Rapor Oluşturucu</h2>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <CustomReportBuilder />
      </div>

      <SuperAdminFooter />
    </>
  )
}
