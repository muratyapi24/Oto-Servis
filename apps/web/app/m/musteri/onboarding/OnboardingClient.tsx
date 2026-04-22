"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Car, Calendar, CreditCard, FileText, ChevronRight, CheckCircle2 } from "lucide-react";

const SLIDES = [
  {
    icon: Car,
    color: "bg-[#00236f]",
    title: "Servis Takibi",
    desc: "Aracınızın servis sürecini gerçek zamanlı olarak takip edin. İlerleme durumunu, atanan ustayı ve tahmini teslim tarihini görün.",
  },
  {
    icon: Calendar,
    color: "bg-[#006c49]",
    title: "Kolay Randevu",
    desc: "Birkaç adımda servis randevusu alın. Araç seçin, hizmet türünü belirleyin ve size uygun tarihi seçin.",
  },
  {
    icon: CreditCard,
    color: "bg-purple-600",
    title: "Güvenli Ödeme",
    desc: "Faturalarınızı güvenle ödeyin. Nakit, kart veya havale seçenekleriyle ödeme yapın, makbuzunuzu indirin.",
  },
  {
    icon: FileText,
    color: "bg-orange-500",
    title: "Dijital Belgeler",
    desc: "Tüm servis belgelerinize, faturalarınıza ve makbuzlarınıza dilediğiniz zaman erişin.",
  },
];

const ONBOARDING_KEY = "musteri_onboarding_done";

export default function OnboardingClient() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Daha önce tamamlandıysa panele yönlendir
    if (typeof window !== "undefined") {
      const done = localStorage.getItem(ONBOARDING_KEY);
      if (done === "true") {
        router.replace("/m/musteri/panel");
      } else {
        setChecked(true);
      }
    }
  }, [router]);

  function handleNext() {
    if (current < SLIDES.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      handleFinish();
    }
  }

  function handleFinish() {
    if (typeof window !== "undefined") {
      localStorage.setItem(ONBOARDING_KEY, "true");
    }
    router.push("/m/musteri/panel");
  }

  if (!checked) return null;

  const slide = SLIDES[current] ?? SLIDES[0]!;
  const Icon = slide.icon;
  const isLast = current === SLIDES.length - 1;

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)] pb-8">
      {/* Slayt */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 space-y-8">
        {/* İkon */}
        <div className={`w-24 h-24 ${slide.color} rounded-3xl flex items-center justify-center shadow-lg`}>
          <Icon className="w-12 h-12 text-white" />
        </div>

        {/* İçerik */}
        <div className="space-y-3 max-w-sm">
          <h2 className="text-2xl font-black text-gray-900">{slide.title}</h2>
          <p className="text-gray-500 leading-relaxed">{slide.desc}</p>
        </div>

        {/* Nokta Göstergesi */}
        <div className="flex items-center gap-2">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`rounded-full transition-all ${
                idx === current
                  ? "w-6 h-2.5 bg-[#00236f]"
                  : "w-2.5 h-2.5 bg-gray-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Butonlar */}
      <div className="space-y-3 px-4">
        <button
          onClick={handleNext}
          className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-500 to-[#1e3a8a] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-lg"
        >
          {isLast ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Başla
            </>
          ) : (
            <>
              Devam Et
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
        {!isLast && (
          <button
            onClick={handleFinish}
            className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors py-2"
          >
            Atla
          </button>
        )}
      </div>
    </div>
  );
}
