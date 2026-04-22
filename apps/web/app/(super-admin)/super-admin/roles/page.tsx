import Link from "next/link"
import SuperAdminFooter from "@/components/super-admin/Footer"
import { getRolesAndPermissions } from "@/lib/actions/superadmin.actions"
import RoleEditDialog from "./RoleEditDialog"

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Süper Admin",
  TENANT_ADMIN: "Firma Yöneticisi",
  MECHANIC: "Teknisyen",
  RECEPTIONIST: "Resepsiyonist",
  ACCOUNTANT: "Muhasebeci",
}

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-primary-container text-white",
  TENANT_ADMIN: "bg-secondary text-white",
  MECHANIC: "bg-surface-container-highest text-on-surface",
  RECEPTIONIST: "bg-surface-container-highest text-on-surface",
  ACCOUNTANT: "bg-surface-container-highest text-on-surface",
}

const ALL_ROLES = ["SUPER_ADMIN", "TENANT_ADMIN", "MECHANIC", "RECEPTIONIST", "ACCOUNTANT"]

export default async function RolesPage(props: {
  searchParams?: Promise<{ tab?: string }>
}) {
  const searchParams = await props.searchParams
  const tab = searchParams?.tab || "roles"

  const result = await getRolesAndPermissions()

  if ("error" in result) {
    return <div className="p-8 text-error font-mono">{result.error || "Bir hata oluştu"}</div>
  }

  const { roles } = result

  // Tüm benzersiz izinleri topla
  const allPermissions = Array.from(
    new Set(roles.flatMap((r) => r.permissions))
  ).sort()

  // Rol bazlı izin haritası
  const rolePermMap = new Map(roles.map((r) => [r.name, new Set(r.permissions)]))

  const TABS = [
    { id: "roles", label: "Rol Listesi" },
    { id: "matrix", label: "İzin Matrisi" },
    { id: "distribution", label: "Kullanıcı Dağılımı" },
  ]

  return (
    <>
      {/* Header */}
      <header className="h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">admin_panel_settings</span>
          <h2 className="text-sm font-bold tracking-tight uppercase">Yetki ve Rol Yönetimi</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-outline">
            {roles.length} ROL · {allPermissions.length} İZİN
          </span>
        </div>
      </header>

      {/* Tab Nav */}
      <nav className="bg-white border-b border-outline/20 px-6 flex items-center shrink-0 gap-1">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`?tab=${t.id}`}
            className={
              tab === t.id
                ? "px-4 py-2 text-xs font-bold border-b-2 border-primary text-primary bg-primary/5"
                : "px-4 py-2 text-xs font-semibold text-outline hover:text-on-surface border-b-2 border-transparent hover:bg-surface-container-low"
            }
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Rol Özet Kartları */}
        <div className="grid grid-cols-3 xl:grid-cols-5 gap-3">
          {roles.map((role) => (
            <div
              key={role.name}
              className="data-widget border-l-2 border-primary"
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                    ROLE_COLORS[role.name] || "bg-surface-container-low text-on-surface"
                  }`}
                >
                  {ROLE_LABELS[role.name] || role.name}
                </span>
                <span className="material-symbols-outlined text-outline text-base">
                  shield_person
                </span>
              </div>
              <div className="text-2xl font-bold font-mono text-on-surface">
                {role.permissions.length}
              </div>
              <div className="text-[10px] text-outline mt-0.5">izin tanımlı</div>
            </div>
          ))}
        </div>

        {/* Tab: Rol Listesi */}
        {tab === "roles" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {roles.map((role) => (
              <div
                key={role.name}
                className="bg-white border border-outline/20 rounded shadow-sm p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">
                      manage_accounts
                    </span>
                    <div>
                      <div className="text-sm font-bold text-on-surface">
                        {ROLE_LABELS[role.name] || role.name}
                      </div>
                      <div className="text-[10px] font-mono text-outline">{role.name}</div>
                    </div>
                  </div>
                  <RoleEditDialog
                    roleName={role.name}
                    permissions={role.permissions}
                    allPermissions={allPermissions}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {role.permissions.map((perm) => (
                    <span
                      key={perm}
                      className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-primary/10 text-primary rounded"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab: İzin Matrisi */}
        {tab === "matrix" && (
          <div className="bg-white border border-outline/20 rounded shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left dense-table">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th className="min-w-[200px]">İzin</th>
                    {ALL_ROLES.map((r) => (
                      <th key={r} className="text-center min-w-[120px]">
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                            ROLE_COLORS[r] || "bg-surface-container-low text-on-surface"
                          }`}
                        >
                          {ROLE_LABELS[r] || r}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {allPermissions.map((perm) => (
                    <tr key={perm} className="hover:bg-primary/5">
                      <td className="text-[11px] font-mono text-on-surface font-bold">{perm}</td>
                      {ALL_ROLES.map((r) => {
                        const hasPermission = rolePermMap.get(r)?.has(perm) ?? false
                        return (
                          <td key={r} className="text-center">
                            {hasPermission ? (
                              <span className="material-symbols-outlined text-tertiary-fixed text-base">
                                check_circle
                              </span>
                            ) : (
                              <span className="text-outline text-sm">—</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Kullanıcı Dağılımı */}
        {tab === "distribution" && (
          <div className="bg-white border border-outline/20 rounded shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-xl">bar_chart</span>
              <h3 className="text-sm font-bold text-on-surface">Rol Bazlı Kullanıcı Dağılımı</h3>
            </div>
            <div className="space-y-3">
              {roles.map((role) => (
                <div key={role.name} className="flex items-center gap-4">
                  <div className="w-36 shrink-0">
                    <span
                      className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                        ROLE_COLORS[role.name] || "bg-surface-container-low text-on-surface"
                      }`}
                    >
                      {ROLE_LABELS[role.name] || role.name}
                    </span>
                  </div>
                  <div className="flex-1 bg-surface-container-low rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (role.permissions.length / allPermissions.length) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="w-20 text-right text-[10px] font-mono text-outline">
                    {role.permissions.length} izin
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-outline mt-4 font-mono">
              * Kullanıcı sayısı verileri için veritabanı entegrasyonu gereklidir.
            </p>
          </div>
        )}
      </div>

      <SuperAdminFooter />
    </>
  )
}
