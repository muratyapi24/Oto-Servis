import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni | BST Otoservis",
  description: "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında aydınlatma metni.",
};

const LAST_UPDATED = "2026-04-29";

export default function KvkkPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-12">
        <div className="mb-8">
          <Link href="/" className="text-sm text-blue-600 hover:underline">← Ana Sayfa</Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">KVKK Aydınlatma Metni</h1>
          <p className="mt-2 text-sm text-gray-500">6698 Sayılı Kişisel Verilerin Korunması Kanunu Uyarınca</p>
          <p className="text-sm text-gray-500">Son güncelleme: {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-6 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Veri Sorumlusu</h2>
            <p>
              6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla BST Yazılım Teknolojileri ("BST") olarak kişisel verilerinizi işlemekteyiz.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. İşlenen Kişisel Veriler</h2>
            <p>Platform kapsamında aşağıdaki kişisel veriler işlenebilir:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Kimlik verileri:</strong> Ad, soyad, TC kimlik numarası (kurumsal faturalama için)</li>
              <li><strong>İletişim verileri:</strong> E-posta adresi, telefon numarası, adres</li>
              <li><strong>Araç verileri:</strong> Plaka, marka, model, yıl, şasi numarası</li>
              <li><strong>İşlem verileri:</strong> Servis geçmişi, ödeme kayıtları, faturalar</li>
              <li><strong>Teknik veriler:</strong> IP adresi, tarayıcı bilgisi, oturum verileri</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Kişisel Verilerin İşlenme Amaçları</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Servis hizmetinin sunulması ve takibi</li>
              <li>Fatura ve ödeme işlemlerinin gerçekleştirilmesi</li>
              <li>Müşteri bilgilendirmesi (SMS, e-posta, WhatsApp)</li>
              <li>Yasal yükümlülüklerin yerine getirilmesi (e-fatura, GİB)</li>
              <li>Güvenlik, dolandırıcılık önleme ve sistem güvenliği</li>
              <li>İzin varlığı halinde pazarlama ve kampanya iletişimi (IYS)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Hukuki Dayanak</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Sözleşmenin ifası (KVKK md.5/2-c)</li>
              <li>Kanuni yükümlülüklerin yerine getirilmesi (KVKK md.5/2-ç)</li>
              <li>Meşru menfaat (KVKK md.5/2-f)</li>
              <li>Açık rıza (pazarlama iletişimi için — KVKK md.5/1)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Kişisel Verilerin Aktarılması</h2>
            <p>Kişisel verileriniz aşağıdaki alıcılara aktarılabilir:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>E-fatura hizmet sağlayıcıları (Paraşüt vb.)</li>
              <li>SMS/WhatsApp servis sağlayıcıları (Twilio, Netgsm vb.)</li>
              <li>Ödeme altyapı sağlayıcıları (İyzico, PayTR vb.)</li>
              <li>Yasal zorunluluk halinde kamu kurum ve kuruluşları</li>
              <li>Bulut altyapı sağlayıcıları (veri işleme sözleşmesi kapsamında)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Veri Sahibi Hakları (KVKK md.11)</h2>
            <p>Kişisel verilerinize ilişkin aşağıdaki haklara sahipsiniz:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>İşlenmişse buna ilişkin bilgi talep etme</li>
              <li>Amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
              <li>Yurt içi veya yurt dışında aktarıldığı üçüncü kişileri öğrenme</li>
              <li>Eksik veya yanlış işlenmiş ise düzeltilmesini talep etme</li>
              <li>Silme veya yok edilmesini talep etme</li>
              <li>İtiraz etme ve tazminat talep etme</li>
            </ul>
            <p className="mt-2">
              Taleplerinizi uygulamadaki profil sayfasından veya <a href="mailto:kvkk@bstotoservis.com" className="text-blue-600 hover:underline">kvkk@bstotoservis.com</a> adresine yazılı olarak iletebilirsiniz.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Saklama Süresi</h2>
            <p>
              Kişisel veriler, hizmet sözleşmesinin sona ermesinden itibaren 10 yıl boyunca yasal yükümlülükler kapsamında saklanabilir. Pazarlama verileri ise rızanın geri alınması halinde derhal silinir.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Çerezler</h2>
            <p>
              Çerez kullanımı hakkında ayrıntılı bilgi için <Link href="/cookies" className="text-blue-600 hover:underline">Çerez Politikamızı</Link> inceleyiniz.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
