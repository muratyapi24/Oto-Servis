import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kullanım Şartları | BST Otoservis",
  description: "BST Otoservis SaaS platformunun kullanım şartları ve koşulları.",
};

const LAST_UPDATED = "2026-04-29";
const VERSION = "1.0";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-12">
        <div className="mb-8">
          <Link href="/" className="text-sm text-blue-600 hover:underline">← Ana Sayfa</Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Kullanım Şartları</h1>
          <p className="mt-2 text-sm text-gray-500">Son güncelleme: {LAST_UPDATED} | Versiyon: {VERSION}</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-6 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Taraflar</h2>
            <p>
              Bu Kullanım Şartları ("Sözleşme"), BST Yazılım Teknolojileri ("BST" veya "Biz") ile BST Otoservis platformunu kullanan gerçek veya tüzel kişi ("Kullanıcı" veya "Müşteri") arasında akdedilmiştir. Platforma erişerek veya kullanarak bu şartları kabul etmiş sayılırsınız.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Hizmetin Kapsamı</h2>
            <p>
              BST Otoservis, oto servis firmalarına yönelik bulut tabanlı SaaS (Software as a Service) bir yönetim platformudur. Hizmet; servis emri yönetimi, müşteri/araç takibi, stok yönetimi, faturalama, randevu yönetimi ve raporlama işlevlerini kapsar.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Abonelik ve Ödeme</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Abonelik ücretleri seçilen pakete ve ödeme dönemine göre belirlenir.</li>
              <li>Ücretler, fatura dönemi başında peşin olarak tahsil edilir.</li>
              <li>Ödeme başarısız olduğunda hizmet 7 gün içinde askıya alınabilir.</li>
              <li>Yıllık abonelikte iptal politikası için <Link href="/refund" className="text-blue-600 hover:underline">İade Politikamızı</Link> inceleyin.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Kullanım Kısıtlamaları</h2>
            <p>Kullanıcı aşağıdaki eylemlerde bulunamaz:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Platformu yasadışı amaçlar için kullanmak</li>
              <li>Sistemi veya altyapıyı bozmaya yönelik girişimlerde bulunmak</li>
              <li>Diğer kiracıların verilerine yetkisiz erişim sağlamak</li>
              <li>Platform üzerinden spam veya yanıltıcı içerik yaymak</li>
              <li>Kaynak kodunu tersine mühendislik uygulamak veya kopyalamak</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Veri ve Gizlilik</h2>
            <p>
              Kişisel verilerin işlenmesi <Link href="/kvkk" className="text-blue-600 hover:underline">KVKK Aydınlatma Metnimize</Link> ve <Link href="/privacy" className="text-blue-600 hover:underline">Gizlilik Politikamıza</Link> tabidir. Veri İşleme Sözleşmesi için <Link href="/dpa" className="text-blue-600 hover:underline">DPA sayfamızı</Link> ziyaret ediniz.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Hizmet Seviyesi (SLA)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Aylık %99,5 uptime hedeflenmektedir.</li>
              <li>Planlı bakım süresi 72 saat önceden bildirilir.</li>
              <li>Veri yedekleme: günlük otomatik, 30 gün saklama.</li>
              <li>Destek yanıt süreleri seçilen pakete göre değişir.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Fikri Mülkiyet</h2>
            <p>
              Platform yazılımı, tasarımı ve içeriği BST'ye aittir ve telif hukuku kapsamında korunmaktadır. Kullanıcıya yalnızca sınırlı, devredilemez ve alt lisanslanamaz kullanım hakkı tanınır. Kullanıcıya ait veriler kullanıcının mülkiyetindedir.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Sorumluluk Sınırlaması</h2>
            <p>
              BST'nin sorumluluğu, her koşulda ilgili fatura döneminde ödenen abonelik ücretiyle sınırlıdır. BST, platformun kesintisiz veya hatasız çalışacağını garanti etmez; mücbir sebepler nedeniyle oluşan zararlardan sorumlu tutulamaz.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Fesih</h2>
            <p>
              Her iki taraf da bu sözleşmeyi yazılı bildirimle feshedebilir. BST, şartların ihlali durumunda hesabı derhal askıya alabilir veya silebilir. Fesih sonrası veri erişimi ve ihracat süreci için destek ekibiyle iletişime geçin.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">10. Uygulanacak Hukuk</h2>
            <p>
              Bu Sözleşme Türk Hukuku'na tabidir. Anlaşmazlıklarda İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">11. İletişim</h2>
            <p>
              Sorularınız için: <a href="mailto:destek@bstotoservis.com" className="text-blue-600 hover:underline">destek@bstotoservis.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
