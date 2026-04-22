import Link from "next/link"
import SuperAdminFooter from "@/components/super-admin/Footer"
import { getUserDirectory } from "@/lib/actions/superadmin.actions"
import UserFilters from "./UserFilters"
import UserStatusToggle from "./UserStatusToggle"

const roleStyles: Record<string, string> = {
  SUPER_ADMIN: "bg-primary-container text-white",
  TENANT_ADMIN: "bg-secondary text-white",
  MECHANIC: "bg-surface-container-highest text-on-surface",
  RECEPTIONIST: "bg-surface-container-highest text-on-surface",
  ACCOUNTANT: "bg-surface-container-highest text-on-surface",
  CUSTOMER: "bg-tertiary text-white",
}

export default async function UsersDirectoryPage(props: {
  searchParams?: Promise<{ filter?: string; search?: string; role?: string }>
}) {
  const searchParams = await props.searchParams
  const filter = searchParams?.filter || "all"
  const search = searchParams?.search || ""
  const role = searchParams?.role || ""

  const result = await getUserDirectory({
    search: search || undefined,
    role: role || undefined,
  })

  if ("error" in result) {
    return <div className="p-8 text-error font-mono">{result.error || "Bir hata oluştu"}</div>
  }

  const { users } = result

  // Tab filtresi (client-side, veriler zaten search/role ile filtrelenmiş)
  const filteredUsers = users.filter((u) => {
    if (filter === "admins") return u.role === "SUPER_ADMIN" || u.role === "TENANT_ADMIN"
    if (filter === "staff")
      return u.role === "MECHANIC" || u.role === "RECEPTIONIST" || u.role === "ACCOUNTANT"
    if (filter === "inactive") return !u.isActive
    return true
  })

  return (
    <>
      <header className="h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">manage_accounts</span>
            <h2 className="text-sm font-bold tracking-tight uppercase">Kullanıcı Dizini</h2>
          </div>
          <UserFilters />
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded text-[10px] font-bold uppercase hover:bg-primary/90 transition-colors">
            <span className="material-symbols-outlined text-sm">person_add</span>
            Yeni Kullanıcı
          </button>
          <div className="h-4 w-px bg-outline/20"></div>
          <button className="p-1 text-on-surface hover:bg-surface-container rounded">
            <span className="material-symbols-outlined text-xl">file_download</span>
          </button>
        </div>
      </header>

      {/* Tab Nav */}
      <div className="bg-white border-b border-outline/20 px-6 flex items-center shrink-0 gap-1 overflow-x-auto no-scrollbar">
        {[
          { id: "all", label: "Tüm Kullanıcılar" },
          { id: "admins", label: "Yöneticiler" },
          { id: "staff", label: "Servis Personeli" },
          { id: "inactive", label: "Pasif" },
        ].map((tab) => {
          const params = new URLSearchParams()
          params.set("filter", tab.id)
          if (search) params.set("search", search)
          if (role) params.set("role", role)
          return (
            <Link
              key={tab.id}
              href={`?${params.toString()}`}
              className={`px-4 py-2 text-xs transition-colors whitespace-nowrap ${
                filter === tab.id
                  ? "font-bold border-b-2 border-primary text-primary bg-primary/5"
                  : "font-semibold text-outline hover:text-on-surface border-b-2 border-transparent hover:bg-surface-container-low"
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-white border border-outline/20 rounded shadow-sm overflow-hidden flex flex-col h-full">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left dense-table">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="w-16">Kullanıcı ID</th>
                  <th>İsim</th>
                  <th>E-posta Adresi</th>
                  <th>Sistem Rolü</th>
                  <th>Firma</th>
                  <th>Son Giriş</th>
                  <th className="text-center">Durum</th>
                  <th className="text-right pr-4">İşlemler</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-outline/50">
                      Kayıtlı kullanıcı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-primary/5">
                      <td className="text-outline truncate max-w-[60px]" title={u.id}>
                        #{u.id.split("-")[0]}
                      </td>
                      <td className="font-bold text-on-surface font-body">{u.name || "İsimsiz"}</td>
                      <td className="text-primary hover:underline cursor-pointer">{u.email}</td>
                      <td>
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                            roleStyles[u.role] || "bg-surface-container-low text-on-surface"
                          }`}
                        >
                          {u.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="text-[10px] text-outline truncate max-w-[120px]">
                        {u.tenantId ? u.tenantId.slice(0, 8) + "…" : "-"}
                      </td>
                      <td className="text-outline">
                        {u.lastLoginAt
                          ? new Date(u.lastLoginAt).toLocaleString("tr-TR")
                          : "-"}
                      </td>
                      <td className="text-center">
                        <UserStatusToggle userId={u.id} isActive={u.isActive} />
                      </td>
                      <td className="text-right pr-4">
                        <span className="material-symbols-outlined text-outline cursor-pointer hover:text-primary">
                          more_vert
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 bg-surface-container-low border-t border-outline/20 flex items-center justify-between shrink-0">
            <div className="text-[10px] font-mono text-outline font-bold">
              TOPLAM {users.length} KAYITTAN {filteredUsers.length} SONUÇ GÖSTERİLİYOR
            </div>
            <div className="flex items-center gap-1">
              <button
                className="w-6 h-6 flex items-center justify-center rounded border border-outline/20 bg-white text-outline hover:text-primary hover:border-primary transition-all p-0"
                disabled
              >
                <span className="material-symbols-outlined text-sm leading-none">chevron_left</span>
              </button>
              <button className="px-2 h-6 flex items-center justify-center rounded border border-primary bg-primary text-white text-[10px] font-bold font-mono">
                1
              </button>
              <button
                className="w-6 h-6 flex items-center justify-center rounded border border-outline/20 bg-white text-outline hover:text-primary hover:border-primary transition-all p-0"
                disabled
              >
                <span className="material-symbols-outlined text-sm leading-none">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <SuperAdminFooter />
    </>
  )
}
