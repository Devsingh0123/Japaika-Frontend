import { Star } from "lucide-react"

export default function ReviewCard({ review }) {
  return (
    <article className="rounded-2xl border border-border bg-card/50 p-6 flex flex-col justify-between gap-5 transition-colors hover:border-primary/40">
      <div className="space-y-4">
        {/* Top Row: Stars & Category */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < review.rating
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/25"
                }`}
              />
            ))}
          </div>

          {review.category && (
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted-foreground">
              {review.category}
            </span>
          )}
        </div>

        {/* Review Content */}
        <p className="text-[14.5px] text-foreground/90 font-sans leading-relaxed">
          {review.content}
        </p>
      </div>

      {/* Author & Location */}
      <div className="pt-3 border-t border-border/60 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-foreground">
          {review.author}
        </span>
        <span className="text-xs text-muted-foreground">
          {review.location}
          {review.date ? ` · ${review.date}` : ""}
        </span>
      </div>
    </article>
  )
}
