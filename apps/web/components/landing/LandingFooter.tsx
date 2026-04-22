import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="bg-slate-950 px-6 pt-20 pb-10 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-2 md:col-span-1">
            <div className="text-xl font-bold text-white mb-8">ÖNCÜ</div>
            <p className="text-sm leading-relaxed mb-6">
              1985'ten bu yana otomotiv sektöründe dijital dönüşümün öncüsü.
            </p>
            <div className="flex gap-4">
              <Link
                href="#"
                className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center hover:bg-primary transition-colors"
                aria-label="Language"
              >
                <span className="material-symbols-outlined text-white text-xl">language</span>
              </Link>
              <Link
                href="#"
                className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center hover:bg-primary transition-colors"
                aria-label="Share"
              >
                <span className="material-symbols-outlined text-white text-xl">share</span>
              </Link>
            </div>
          </div>
          <div>
            <h5 className="text-white font-bold mb-6">Ürün</h5>
            <ul className="space-y-4 text-sm">
              <li>
                <Link href="/features" className="hover:text-blue-400 transition-colors">
                  Özellikler
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-blue-400 transition-colors">
                  Fiyatlandırma
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-blue-400 transition-colors">
                  Demo
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-blue-400 transition-colors">
                  Güncellemeler
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="text-white font-bold mb-6">Destek</h5>
            <ul className="space-y-4 text-sm">
              <li>
                <Link href="/contact" className="hover:text-blue-400 transition-colors">
                  Yardım Merkezi
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-blue-400 transition-colors">
                  Dokümantasyon
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-blue-400 transition-colors">
                  Video Eğitimler
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-blue-400 transition-colors">
                  Topluluk
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="text-white font-bold mb-6">Kurumsal</h5>
            <ul className="space-y-4 text-sm">
              <li>
                <Link href="/about" className="hover:text-blue-400 transition-colors">
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-blue-400 transition-colors">
                  Kariyer
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-blue-400 transition-colors">
                  Gizlilik
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-blue-400 transition-colors">
                  Koşullar
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs tracking-wider">
          <div>© 2026 ÖNCÜ. Tüm hakları saklıdır.</div>
          <div className="flex gap-8">
            <span>Türkiye'de ❤️ ile üretilmiştir.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
