import { Quote } from "lucide-react";
import type { Review } from "@/types";
import { Stars } from "../ui/Stars";

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="card card-hover flex h-full flex-col p-6">
      <div className="flex items-start justify-between">
        <Stars value={review.rating} />
        <Quote className="text-orange-200" size={30} />
      </div>

      <p className="mt-3 flex-1 leading-relaxed text-navy-600">“{review.text}”</p>

      <div className="mt-5 flex items-center gap-3 border-t border-cream-200 pt-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-100 font-display text-sm font-bold text-orange-600">
          {initials(review.name)}
        </div>
        <div>
          <p className="font-bold text-navy-700">{review.name}</p>
          {review.petName && (
            <p className="text-xs text-navy-400">Tutor(a) do {review.petName}</p>
          )}
        </div>
      </div>
    </div>
  );
}
