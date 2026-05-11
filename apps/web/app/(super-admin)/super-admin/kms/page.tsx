import Link from "next/link";
import SuperAdminFooter from "@/components/super-admin/Footer";
import { getKMSKeys } from "@/lib/actions/superadmin.actions";
import KMSRotateButton from "./KMSRotateButton";
import { MockPageGuard } from "@/components/super-admin/MockPageGuard";

export const metadata = { title: "KMS Yönetimi | Super Admin" };

const MOCK_ROTATION_HISTORY = [
  { key: "Database Encryption Key", rotatedAt: "2025-01-01 00:00", by: "system", status: "SUCCESS" },
  { key: "Session Secret Key", rotatedAt: "2025-02-15 00:00", by: "admin@bst.com", status: "SUCCESS" },
  { key: "S3 Encryption Key", rotatedAt: "2024-12-01 00:00", by: "system", status: "SUCCESS" },
  { key: "Legacy API Key", rotatedAt: "2024-06-01 00:00", by: "admin@bst.com", status: "SUCCESS" },
  { key: "Database Encryption Key", rotatedAt: "2024-07-01 00:00", by: "system", status: "SUCCESS" },
];

export default async function KMSPage(props: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const tab = searchParams?.tab || "keys";

  const data = await getKMSKeys();
  if ("error" in data) return <div className="p-8 text-error font-mono">{data.error}</div>;

  const TABS = [
    { id: "keys", label: "Anahtarlar" },
    { id: "history", label: "Rotasyon Geçmişi" },
  ];

  const statusBadge = (status: string) => {
    if (status === "ACTIVE") return "bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded text-[10px] font-bold";
    if (status === "ROTATING") return "bg-secondary-container/20 text-secondary-container px-2 py-0.5 rounded text-[10px] font-bold";
    return "bg-error-container text-on-error-container px-2 py-0.5 rounded text-[10px] font-bold";
  };

  return (
    <MockPageGuard title="KMS Anahtar Yönetimi" description="Şifreleme anahtarı rotasyonu ve güvenli anahtar yönetimi yakında aktif edilecektir.">
    <>
      <header className="h-12 bg-white flex shrink-0 items-center justify-between px-6 border-b border-outline/20 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">key</span>
          <h2 className="text-sm font-bold tracking-tight uppercase">KMS Yönetimi</h2>
        </div>
      </header>

      <div className="bg-white border-b border-outline/20 px-6 flex items-center shrink-0 gap-1 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`?tab=${t.id}`}
            className={
              tab === t.id
                ? "px-4 py-2 text-xs font-bold border-b-2 border-primary text-primary bg-primary/5 whitespace-nowrap"
                : "px-4 py-2 text-xs font-semibold text-outline hover:text-on-surface border-b-2 border-transparent whitespace-nowrap"
            }
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Özet Kartları */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-tertiary-fixed">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-on-tertiary-fixed-variant text-lg">lock</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Aktif</p>
            </div>
            <p className="text-3xl font-black text-on-surface">
              {data.keys.filter((k) => k.status === "ACTIVE").length}
            </p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-secondary-container">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-secondary-container text-lg">autorenew</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Rotasyonda</p>
            </div>
            <p className="text-3xl font-black text-on-surface">
              {data.keys.filter((k) => k.status === "ROTATING").length}
            </p>
          </div>
          <div className="bg-surface-container-lowest border border-outline/20 p-4 rounded shadow-sm border-l-2 border-l-error">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-error text-lg">lock_open</span>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest">Süresi Dolmuş</p>
            </div>
            <p className="text-3xl font-black text-on-surface">
              {data.keys.filter((k) => k.status === "EXPIRED").length}
            </p>
          </div>
        </div>

        {/* Anahtarlar Tab */}
        {tab === "keys" && (
          <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="dense-table w-full">
                <thead>
                  <tr>
                    <th>Anahtar Adı</th>
                    <th>Algoritma</th>
                    <th>Durum</th>
                    <th>Son Rotasyon</th>
                    <th>Sonraki Rotasyon</th>
                    <th>Eylemler</th>
                  </tr>
                </thead>
                <tbody>
                  {data.keys.map((k) => (
                    <tr key={k.id}>
                      <td className="font-bold text-on-surface">{k.name}</td>
                      <td className="font-mono text-[10px] text-outline">{k.algorithm}</td>
                      <td>
                        <span className={statusBadge(k.status)}>{k.status}</span>
                      </td>
                      <td className="text-outline font-mono text-[10px]">
                        {new Date(k.lastRotatedAt).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="text-outline font-mono text-[10px]">
                        {new Date(k.nextRotationAt).toLocaleDateString("tr-TR")}
                      </td>
                      <td>
                        <KMSRotateButton id={k.id} status={k.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Rotasyon Geçmişi Tab */}
        {tab === "history" && (
          <div className="bg-surface-container-lowest border border-outline/20 rounded shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="dense-table w-full">
                <thead>
                  <tr>
                    <th>Anahtar</th>
                    <th>Rotasyon Tarihi</th>
                    <th>Yapan</th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_ROTATION_HISTORY.map((h, i) => (
                    <tr key={i}>
                      <td className="font-medium text-on-surface">{h.key}</td>
                      <td className="text-outline font-mono text-[10px]">{h.rotatedAt}</td>
                      <td className="text-on-surface-variant text-[11px]">{h.by}</td>
                      <td>
                        <span className="bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded text-[10px] font-bold">
                          {h.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <SuperAdminFooter />
    </>
    </MockPageGuard>
  );
}
