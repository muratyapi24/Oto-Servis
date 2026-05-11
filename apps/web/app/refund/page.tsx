import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "İade ve İptal Politikası | BST Otoservis",
  description: "BST Otoservis abonelik iade ve iptal koşulları.",
};

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-12">
        <div className="mb-8">
          <Link href="/" className="text-sm text-blue-600 hover:underline">← Ana Sayfa</Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">İade ve İptal Politikası</h1>
          <p className="mt-2 text-sm text-gray-500">Son güncelleme: 29 Nisan 2026</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-6 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Deneme Süresi</h2>
            <p>
              Yeni kayıt olan müşterilere 14 günlük ücretsiz deneme süresi sunulmaktadır. Bu süre zarfında ücret alınmaz ve herhangi bir gerekçe gösterilmeksizin hesap kapatılabilir.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Aylık Abonelik İptali</h2>
            <p>
              Aylık abonelikler bir sonraki fatura döneminden önce iptal edilebilir. İptal işleminden sonra mevcut dönem sonuna kadar hizmet kullanımı devam eder; kalan süre için iade yapılmaz.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Yıllık Abonelik İptali</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>İlk 30 gün:</strong> Tam iade yapılır.</li>
              <li><strong>31-90. günler:</strong> Kalan süreyle orantılı kısmi iade yapılır.</li>
              <li><strong>90 günden sonra:</strong> İade yapılmaz; dönem sonuna kadar hizmet aktif kalır.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. İade Süreci</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>İade talepleri <a href="mailto:destek@bstotoservis.com" className="text-blue-600 hover:underline">destek@bstotoservis.com</a> adresine yazılı olarak iletilmelidir.</li>
              <li>Onaylanan iadeler 5-10 iş günü içinde ödeme yönteminize aktarılır.</li>
              <li>Teknik sorunlardan kaynaklanan hizmet kesintilerinde (SLA ihlali) orantılı hizmet kredisi uygulanır.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. İptal Sonrası Veri</h2>
            <p>
              Hesap kapatıldıktan sonra verilerinize 30 gün daha erişilebilir; bu sürede CSV/Excel formatında export talep edebilirsiniz. 30 günün sonunda veriler kalıcı olarak silinir.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. İstisna Durumlar</h2>
            <p>
              Platform kullanım şartlarını ihlal eden hesaplar askıya alınabilir ve bu durumda iade hakkı doğmaz. Detaylar için <Link href="/terms" className="text-blue-600 hover:underline">Kullanım Şartlarımızı</Link> inceleyin.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. İletişim</h2>
            <p>
              İade ve iptal konularında: <a href="mailto:destek@bstotoservis.com" className="text-blue-600 hover:underline">destek@bstotoservis.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
