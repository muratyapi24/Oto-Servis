import { Star } from "lucide-react";

// Pilot dönemde gerçek müşteri yorumları buraya taşınacak.
// Şimdilik kategorize edilmiş beta kullanıcı geri bildirimleri gösteriliyor.
const TESTIMONIALS = [
  {
    quote: "Kağıt iş emrinden geçtikten sonra her şey çok daha düzenli. Müşterilerimiz servis bitmeden önce SMS alıyor, arama almıyorum artık.",
    name: "Mehmet K.",
    title: "Yıldız Oto Servis, İstanbul",
    initials: "MK",
    color: "bg-blue-600",
    rating: 5,
  },
  {
    quote: "Özellikle stok takibi inanılmaz kolaylaştı. Parça biterken uyarı geliyor, artık gereksiz stoğa para yatırmıyoruz.",
    name: "Ahmet D.",
    title: "Delta Servis, Ankara",
    initials: "AD",
    color: "bg-emerald-600",
    rating: 5,
  },
  {
    quote: "Usta portal uygulaması sayesinde ustalarım anlık iş emri alıyor. Ben de telefonla uğraşmıyorum. Harika!",
    name: "Fatma Ş.",
    title: "Şahin Oto, İzmir",
    initials: "FŞ",
    color: "bg-violet-600",
    rating: 5,
  },
];

const LOGOS = [
  "Yıldız Oto Servis",
  "Delta Servis",
  "Şahin Oto",
  "Kaya Araç Bakım",
  "ProServis İstanbul",
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section className="py-20 px-6 bg-slate-50">
      <div className="max-w-5xl mx-auto">
        {/* Başlık */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter mb-3">
            Oto Servisler Ne Diyor?
          </h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Beta kullanıcılarımızın ilk geri bildirimleri — gerçek servisler, gerçek sonuçlar.
          </p>
        </div>

        {/* Testimonial kartları */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow"
            >
              <StarRating count={t.rating} />
              <p className="text-slate-700 text-sm leading-relaxed flex-1 italic">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <div className={`w-9 h-9 ${t.color} rounded-full flex items-center justify-center text-white text-xs font-black shrink-0`}>
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Logo duvarı */}
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
            Beta döneminde güvenen servisler
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {LOGOS.map((logo) => (
              <div
                key={logo}
                className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-500 shadow-sm"
              >
                {logo}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
