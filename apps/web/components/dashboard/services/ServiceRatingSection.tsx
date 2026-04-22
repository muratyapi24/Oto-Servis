"use client";

import { Star } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/tr";

interface ServiceRatingSectionProps {
  rating: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
  } | null;
}

export default function ServiceRatingSection({ rating }: ServiceRatingSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2 mb-4 flex items-center gap-2">
        <Star className="w-4 h-4" /> Müşteri Değerlendirmesi
      </h3>

      {rating ? (
        <div className="space-y-3">
          {/* Yıldızlar */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= rating.rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-200"
                }`}
              />
            ))}
            <span className="ml-2 text-sm font-bold text-gray-700">{rating.rating}/5</span>
          </div>

          {/* Yorum */}
          {rating.comment && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 leading-relaxed italic">
              "{rating.comment}"
            </div>
          )}

          {/* Tarih */}
          <p className="text-xs text-gray-400">
            {dayjs(rating.createdAt).locale("tr").format("DD MMM YYYY HH:mm")}
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic">Henüz değerlendirme yapılmadı.</p>
      )}
    </div>
  );
}
