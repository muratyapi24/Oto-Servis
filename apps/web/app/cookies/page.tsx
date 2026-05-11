import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Çerez Politikası | BST Otoservis",
  description: "BST Otoservis platformunun çerez kullanımı hakkında bilgi.",
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-12">
        <div className="mb-8">
          <Link href="/" className="text-sm text-blue-600 hover:underline">← Ana Sayfa</Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Çerez Politikası</h1>
          <p className="mt-2 text-sm text-gray-500">Son güncelleme: 29 Nisan 2026</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-6 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Çerez Nedir?</h2>
            <p>
              Çerezler, web sitemizi ziyaret ettiğinizde tarayıcınız aracılığıyla cihazınıza yerleştirilen küçük metin dosyalarıdır. Oturum yönetimi, tercih kaydı ve analitik amaçlarla kullanılırlar.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Kullandığımız Çerez Türleri</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Çerez Adı</th>
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Tür</th>
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Amaç</th>
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Süre</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2 font-mono">next-auth.session-token</td>
                    <td className="border border-gray-200 px-3 py-2">Zorunlu</td>
                    <td className="border border-gray-200 px-3 py-2">Kullanıcı oturumu</td>
                    <td className="border border-gray-200 px-3 py-2">30 gün</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-200 px-3 py-2 font-mono">locale</td>
                    <td className="border border-gray-200 px-3 py-2">Fonksiyonel</td>
                    <td className="border border-gray-200 px-3 py-2">Dil tercihi</td>
                    <td className="border border-gray-200 px-3 py-2">1 yıl</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2 font-mono">__Secure-next-auth.callback-url</td>
                    <td className="border border-gray-200 px-3 py-2">Zorunlu</td>
                    <td className="border border-gray-200 px-3 py-2">Giriş sonrası yönlendirme</td>
                    <td className="border border-gray-200 px-3 py-2">Oturum</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Çerezleri Yönetme</h2>
            <p>
              Tarayıcı ayarlarınızdan çerezleri reddedebilir veya silebilirsiniz. Ancak zorunlu çerezleri devre dışı bırakmanız durumunda platforma giriş yapamayabilirsiniz.
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Chrome</a></li>
              <li><a href="https://support.mozilla.org/tr/kb/cerezleri-silme-web-sitelerinin-bilgisayariniza-yerlestirdigi-verileri-kaldirma" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Mozilla Firefox</a></li>
              <li><a href="https://support.apple.com/tr-tr/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Safari</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">İletişim</h2>
            <p>
              Çerez politikamız hakkında sorularınız için: <a href="mailto:destek@bstotoservis.com" className="text-blue-600 hover:underline">destek@bstotoservis.com</a>
            </p>
            <p className="mt-2">
              Kişisel verileriniz hakkında daha fazla bilgi için <Link href="/kvkk" className="text-blue-600 hover:underline">KVKK Aydınlatma Metnimizi</Link> inceleyin.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
