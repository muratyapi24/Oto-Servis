import type { Metadata } from "next";
import Link from "next/link";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";

export const metadata: Metadata = {
  title: "Gizlilik Politikası ve KVKK Aydınlatma Metni",
  description:
    "MS Oto Servis'in kişisel verilerin korunması kanunu (KVKK) kapsamındaki aydınlatma metni ve gizlilik politikası.",
};

export default function PrivacyPage() {
  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex flex-col">
      <LandingNavbar />

      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-6">
          {/* Hero */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6">
              <span className="material-symbols-outlined text-4xl">shield_person</span>
            </div>
            <h1 className="text-4xl font-black text-on-surface tracking-tighter mb-3">
              Gizlilik Politikası & KVKK Aydınlatma Metni
            </h1>
            <p className="text-on-surface-variant font-medium">
              Son güncelleme: Nisan 2025 · Versiyon 1.0
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-outline-variant/10 p-8 md:p-12 space-y-10">

            {/* 1. Veri Sorumlusu */}
            <section>
              <h2 className="text-xl font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-black flex items-center justify-center">1</span>
                Veri Sorumlusu
              </h2>
              <p className="text-on-surface-variant leading-relaxed">
                6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla
                kişisel verileriniz <strong>BST Teknoloji Yazılım A.Ş.</strong> tarafından işlenmektedir.
                Başvuru ve talepleriniz için:{" "}
                <a href="mailto:kvkk@bstotoservis.com" className="text-primary hover:underline font-semibold">
                  kvkk@bstotoservis.com
                </a>
              </p>
            </section>

            {/* 2. İşlenen Kişisel Veriler */}
            <section>
              <h2 className="text-xl font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-black flex items-center justify-center">2</span>
                İşlenen Kişisel Veri Kategorileri
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-surface-dim">
                      <th className="text-left p-3 rounded-tl-lg font-bold text-on-surface">Kategori</th>
                      <th className="text-left p-3 font-bold text-on-surface">Veriler</th>
                      <th className="text-left p-3 rounded-tr-lg font-bold text-on-surface">Amaç</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    <tr className="hover:bg-surface-dim/50">
                      <td className="p-3 font-semibold text-on-surface">Kimlik</td>
                      <td className="p-3 text-on-surface-variant">Ad, soyad, TC kimlik numarası</td>
                      <td className="p-3 text-on-surface-variant">Hesap yönetimi, sözleşme</td>
                    </tr>
                    <tr className="hover:bg-surface-dim/50">
                      <td className="p-3 font-semibold text-on-surface">İletişim</td>
                      <td className="p-3 text-on-surface-variant">E-posta, telefon, adres</td>
                      <td className="p-3 text-on-surface-variant">Servis bildirimleri, fatura</td>
                    </tr>
                    <tr className="hover:bg-surface-dim/50">
                      <td className="p-3 font-semibold text-on-surface">Araç</td>
                      <td className="p-3 text-on-surface-variant">Plaka, VIN, marka, model, km</td>
                      <td className="p-3 text-on-surface-variant">Servis takibi, bakım planı</td>
                    </tr>
                    <tr className="hover:bg-surface-dim/50">
                      <td className="p-3 font-semibold text-on-surface">Finansal</td>
                      <td className="p-3 text-on-surface-variant">Ödeme geçmişi, fatura bilgisi</td>
                      <td className="p-3 text-on-surface-variant">Muhasebe, vergi uyumu</td>
                    </tr>
                    <tr className="hover:bg-surface-dim/50">
                      <td className="p-3 font-semibold text-on-surface">Log</td>
                      <td className="p-3 text-on-surface-variant">IP adresi, giriş kayıtları</td>
                      <td className="p-3 text-on-surface-variant">Güvenlik, denetim</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 3. İşleme Amaçları ve Hukuki Sebepleri */}
            <section>
              <h2 className="text-xl font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-black flex items-center justify-center">3</span>
                İşleme Amaçları ve Hukuki Dayanaklar
              </h2>
              <ul className="space-y-3 text-on-surface-variant">
                <li className="flex gap-3">
                  <span className="material-symbols-outlined text-primary mt-0.5 text-lg flex-shrink-0">check_circle</span>
                  <span><strong className="text-on-surface">Sözleşme ifası</strong> — Hizmet sözleşmenizin kurulması ve yürütülmesi için zorunlu işlemler (KVKK m.5/2-c)</span>
                </li>
                <li className="flex gap-3">
                  <span className="material-symbols-outlined text-primary mt-0.5 text-lg flex-shrink-0">check_circle</span>
                  <span><strong className="text-on-surface">Hukuki yükümlülük</strong> — Vergi mevzuatı, e-Fatura zorunlulukları (KVKK m.5/2-ç)</span>
                </li>
                <li className="flex gap-3">
                  <span className="material-symbols-outlined text-primary mt-0.5 text-lg flex-shrink-0">check_circle</span>
                  <span><strong className="text-on-surface">Meşru menfaat</strong> — Platform güvenliği, dolandırıcılık önleme (KVKK m.5/2-f)</span>
                </li>
                <li className="flex gap-3">
                  <span className="material-symbols-outlined text-secondary mt-0.5 text-lg flex-shrink-0">check_circle</span>
                  <span><strong className="text-on-surface">Açık rıza</strong> — Pazarlama iletişimleri, SMS/WhatsApp kampanyaları (KVKK m.5/1)</span>
                </li>
              </ul>
            </section>

            {/* 4. Saklama Süreleri */}
            <section>
              <h2 className="text-xl font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-black flex items-center justify-center">4</span>
                Saklama Süreleri
              </h2>
              <ul className="space-y-2 text-on-surface-variant">
                <li className="flex justify-between border-b border-outline-variant/10 pb-2">
                  <span>Müşteri ve araç kayıtları</span>
                  <span className="font-semibold text-on-surface">Sözleşme sonu + 10 yıl</span>
                </li>
                <li className="flex justify-between border-b border-outline-variant/10 pb-2">
                  <span>Fatura ve ödeme kayıtları</span>
                  <span className="font-semibold text-on-surface">10 yıl (VUK)</span>
                </li>
                <li className="flex justify-between border-b border-outline-variant/10 pb-2">
                  <span>Güvenlik logları</span>
                  <span className="font-semibold text-on-surface">2 yıl</span>
                </li>
                <li className="flex justify-between border-b border-outline-variant/10 pb-2">
                  <span>Pazarlama rızası</span>
                  <span className="font-semibold text-on-surface">Rıza geri alınıncaya kadar</span>
                </li>
                <li className="flex justify-between">
                  <span>Hesap silme sonrası</span>
                  <span className="font-semibold text-on-surface">30 gün (yedek) → tamamen silinir</span>
                </li>
              </ul>
            </section>

            {/* 5. Veri Aktarımı */}
            <section>
              <h2 className="text-xl font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-black flex items-center justify-center">5</span>
                Kişisel Verilerin Aktarıldığı Taraflar
              </h2>
              <p className="text-on-surface-variant mb-3 leading-relaxed">
                Kişisel verileriniz yalnızca aşağıdaki amaçlarla ve gerekli ölçüde üçüncü taraflarla paylaşılmaktadır:
              </p>
              <ul className="space-y-2 text-on-surface-variant">
                <li className="flex gap-2"><span className="text-primary font-bold">›</span><span><strong>SMS/WhatsApp sağlayıcıları</strong> (NetGSM, İleti Merkezi) — bildirim iletimi</span></li>
                <li className="flex gap-2"><span className="text-primary font-bold">›</span><span><strong>Muhasebe yazılımı</strong> (Paraşüt) — e-Fatura entegrasyonu</span></li>
                <li className="flex gap-2"><span className="text-primary font-bold">›</span><span><strong>Ödeme alt yapısı</strong> (İyzico, PayTR) — güvenli ödeme işlemleri</span></li>
                <li className="flex gap-2"><span className="text-primary font-bold">›</span><span><strong>Bulut altyapısı</strong> (AWS) — veri depolama (Türkiye bölgesi)</span></li>
                <li className="flex gap-2"><span className="text-primary font-bold">›</span><span><strong>Hukuki zorunluluk</strong> — yetkili kamu kurumları talepleri halinde</span></li>
              </ul>
            </section>

            {/* 6. Veri Sahibi Hakları */}
            <section>
              <h2 className="text-xl font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-black flex items-center justify-center">6</span>
                KVKK Madde 11 Kapsamındaki Haklarınız
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: "help", right: "Bilgi talep etme", desc: "Verilerinizin işlenip işlenmediğini öğrenme" },
                  { icon: "download", right: "Veri kopyası alma", desc: "İşlenen verilerinizin kopyasını talep etme" },
                  { icon: "edit", right: "Düzeltme", desc: "Eksik veya yanlış verilerin güncellenmesi" },
                  { icon: "delete", right: "Silme talebi", desc: "Yasal zorunluluk yoksa verilerin silinmesi" },
                  { icon: "block", right: "İşleme itiraz", desc: "Meşru menfaat kapsamındaki işlemlere itiraz" },
                  { icon: "cancel", right: "Rıza geri alma", desc: "Pazarlama rızanızı istediğiniz an iptal etme" },
                ].map((item) => (
                  <div key={item.right} className="flex gap-3 p-4 rounded-xl bg-surface-dim/50">
                    <span className="material-symbols-outlined text-primary text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
                    <div>
                      <div className="font-semibold text-on-surface text-sm">{item.right}</div>
                      <div className="text-on-surface-variant text-xs mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/10">
                <p className="text-sm text-on-surface-variant">
                  <strong className="text-on-surface">Başvuru kanalı:</strong> Haklarınızı kullanmak için{" "}
                  <a href="mailto:kvkk@bstotoservis.com" className="text-primary hover:underline font-semibold">
                    kvkk@bstotoservis.com
                  </a>{" "}
                  adresine yazılı başvurabilir ya da müşteri panelinizden "Verilerimi Yönet" bölümünü kullanabilirsiniz.
                  Başvurular <strong>30 gün</strong> içinde sonuçlandırılır.
                </p>
              </div>
            </section>

            {/* 7. Çerezler */}
            <section>
              <h2 className="text-xl font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-black flex items-center justify-center">7</span>
                Çerezler (Cookies)
              </h2>
              <p className="text-on-surface-variant leading-relaxed">
                Platformumuz yalnızca zorunlu teknik çerezler kullanmaktadır. Oturum yönetimi için güvenli
                HTTP-only çerezler kullanılır; üçüncü taraf izleme çerezi kullanılmamaktadır.
              </p>
            </section>

            {/* 8. Değişiklikler */}
            <section>
              <h2 className="text-xl font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-black flex items-center justify-center">8</span>
                Politika Değişiklikleri
              </h2>
              <p className="text-on-surface-variant leading-relaxed">
                Bu politika güncellendiğinde kayıtlı e-posta adresinize bildirim gönderilir. Önemli değişiklikler
                için platform girişinde onayınız talep edilebilir. Güncel versiyona her zaman bu sayfadan ulaşabilirsiniz.
              </p>
            </section>
          </div>

          {/* CTA */}
          <div className="mt-8 text-center">
            <Link href="/register" className="inline-flex items-center gap-2 text-primary hover:underline font-semibold">
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Kayıt sayfasına dön
            </Link>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
