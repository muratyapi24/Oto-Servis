import Link from "next/link";
import { TrendingUp, Wrench, Package, ChevronRight, FileText } from "lucide-react";

export const metadata = { title: "Raporlar | MS Oto Servis" };

const REPORTS = [
  {
    title: "Gelir Raporu",
    desc: "Aylık gelir dağılımı — İşçilik, Parça, Diğer",
    href: "/m/firma/gelir-raporu",
    icon: TrendingUp,
    color: "bg-blue-50 text-[#00236f]",
    border: "border-blue-200",
  },
  {
    title: "Servis Raporu",
    desc: "Operasyon metrikleri, statüs dağılımı, müşteri puanı",
    href: "/m/firma/servis-raporu",
    icon: Wrench,
    color: "bg-green-50 text-[#006c49]",
    border: "border-green-200",
  },
  {
    title: "Stok Hareketleri",
    desc: "Tüm giriş, çıkış ve düzeltme hareketleri",
    href: "/m/firma/stok-hareketler",
    icon: Package,
    color: "bg-orange-50 text-orange-700",
    border: "border-orange-200",
  },
];

export default function RaporlarPage() {
  return (
    <div className="space-y-5 pb-8">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-black text-[#00236f]">Raporlar</h1>
        <p className="text-sm text-gray-500 mt-0.5">İndirilebilir rapor ve analizler</p>
      </div>

      {/* Rapor Listesi */}
      <div className="space-y-3">
        {REPORTS.map((report) => {
          const Icon = report.icon;
          return (
            <Link
              key={report.href}
              href={report.href}
              className={`flex items-center gap-4 bg-white rounded-2xl border ${report.border} p-4 hover:shadow-sm transition-all group`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${report.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">{report.title}</p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{report.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-600 transition-colors shrink-0" />
            </Link>
          );
        })}
      </div>

      {/* Bilgi Notu */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <FileText className="w-5 h-5 text-[#00236f] shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 leading-relaxed">
          Gelir ve servis raporlarında PDF indirme özelliği mevcuttur. Rapor sayfasına giderek
          "PDF İndir" butonunu kullanabilirsiniz.
        </p>
      </div>
    </div>
  );
}
