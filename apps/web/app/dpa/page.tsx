import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Veri İşleme Sözleşmesi (DPA) | BST Otoservis",
  description: "BST Otoservis veri işleyici sıfatıyla kişisel veri işleme koşulları.",
};

export default function DpaPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-12">
        <div className="mb-8">
          <Link href="/" className="text-sm text-blue-600 hover:underline">← Ana Sayfa</Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Veri İşleme Sözleşmesi</h1>
          <p className="mt-1 text-gray-600 font-medium">Data Processing Agreement (DPA)</p>
          <p className="mt-2 text-sm text-gray-500">Son güncelleme: 29 Nisan 2026</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 text-sm text-blue-800">
          Bu sözleşme, BST Otoservis platformunu kullanan işletmelerin müşterileri adına veri işlemesi sırasında taraflar arasındaki hak ve yükümlülükleri düzenler. KVKK madde 12 ve GDPR Madde 28 kapsamında hazırlanmıştır.
        </div>

        <div className="prose prose-gray max-w-none space-y-6 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Taraflar ve Tanımlar</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Veri Sorumlusu:</strong> BST Otoservis platformunu kullanan oto servis işletmesi</li>
              <li><strong>Veri İşleyici:</strong> BST Yazılım Teknolojileri</li>
              <li><strong>Veri Konusu Kişiler:</strong> Oto servis müşterileri</li>
              <li><strong>Kişisel Veriler:</strong> Müşteri kimlik, iletişim, araç ve servis verileri</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. BST'nin Veri İşleyici Yükümlülükleri</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Kişisel verileri yalnızca Veri Sorumlusunun talimatları doğrultusunda işler</li>
              <li>Verilerin gizliliğini sağlar ve yetkisiz erişime karşı korur</li>
              <li>Teknik ve idari güvenlik önlemlerini alır (şifreleme, erişim denetimi, yedekleme)</li>
              <li>Alt işlemciler ile veri aktarımı durumunda yazılı anlaşma yapar</li>
              <li>Veri ihlali durumunda Veri Sorumlusunu 72 saat içinde bilgilendirir</li>
              <li>Sözleşme sona erdiğinde verileri iade eder veya güvenli şekilde imha eder</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Alt İşlemciler</h2>
            <p>BST, aşağıdaki alt işlemcileri kullanmaktadır:</p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs mt-2">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Alt İşlemci</th>
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Amaç</th>
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Konum</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2">Vercel / Railway</td>
                    <td className="border border-gray-200 px-3 py-2">Uygulama hosting</td>
                    <td className="border border-gray-200 px-3 py-2">AB/ABD</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-3 py-2">Twilio / Netgsm</td>
                    <td className="border border-gray-200 px-3 py-2">SMS bildirimi</td>
                    <td className="border border-gray-200 px-3 py-2">Türkiye / ABD</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2">Resend</td>
                    <td className="border border-gray-200 px-3 py-2">E-posta bildirimi</td>
                    <td className="border border-gray-200 px-3 py-2">ABD</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-3 py-2">Sentry</td>
                    <td className="border border-gray-200 px-3 py-2">Hata izleme</td>
                    <td className="border border-gray-200 px-3 py-2">ABD</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Güvenlik Önlemleri</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>TLS 1.2+ ile iletimde şifreleme</li>
              <li>AES-256 ile depolamada şifreleme</li>
              <li>Rol tabanlı erişim kontrolü (RBAC)</li>
              <li>Günlük otomatik veritabanı yedeklemesi</li>
              <li>Denetim günlüğü (audit log) kaydı</li>
              <li>Penetrasyon testi ve güvenlik taraması</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Veri Saklama ve İmha</h2>
            <p>
              Aktif abonelik süresince veriler saklanır. Abonelik sona erdiğinde veriler 30 gün export için erişilebilir tutulur; ardından güvenli silme prosedürleri uygulanır.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Denetim Hakkı</h2>
            <p>
              Veri Sorumlusu, BST'den yıllık güvenlik uyumluluk raporu talep edebilir. Fiziksel denetim talepleri 30 gün önceden yazılı bildirimle yapılabilir.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. İletişim</h2>
            <p>
              DPA ve veri güvenliği konularında: <a href="mailto:kvkk@bstotoservis.com" className="text-blue-600 hover:underline">kvkk@bstotoservis.com</a>
            </p>
            <p className="mt-2">
              Daha fazla bilgi: <Link href="/kvkk" className="text-blue-600 hover:underline">KVKK Aydınlatma Metni</Link> | <Link href="/privacy" className="text-blue-600 hover:underline">Gizlilik Politikası</Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
