import { useEffect, useRef } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Helmet } from "react-helmet-async"
import { ArrowUp, RefreshCw } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import ReviewForm from "@/features/reviews/components/ReviewForm"
import ReviewCard from "@/features/reviews/components/ReviewCard"
import { fetchReviews, setActiveCategory } from "@/features/reviews/reviewsSlice"
import { REVIEW_CATEGORIES } from "@/features/reviews/reviewsData"

export default function ReviewPage() {
  const dispatch = useDispatch()
  const { reviews, counts, activeCategory, loading, error } = useSelector(
    (state) => state.reviews || {}
  )

  const topFormRef = useRef(null)
  const firstInputRef = useRef(null)

  useEffect(() => {
    dispatch(fetchReviews({ category: activeCategory }))
  }, [dispatch, activeCategory])

  const handleCategoryChange = (catId) => {
    dispatch(setActiveCategory(catId))
  }

  const handleScrollToForm = () => {
    topFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    setTimeout(() => {
      firstInputRef.current?.focus()
    }, 500)
  }

  return (
    <div className="min-h-screen bg-transparent text-foreground pb-20">
      <Helmet>
        <title>Add a Review | Japaika</title>
        <meta
          name="description"
          content="Share your experience with Japaika Vedic Astrology and read reviews from our community."
        />
      </Helmet>

      <div className="max-w-5xl mx-auto px-6 pt-10 sm:px-10 sm:pt-14 space-y-16">
        {/* Top Section: Clean Add a Review Form */}
        <section ref={topFormRef} className="max-w-2xl scroll-mt-24">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-6">
            Add a Review
          </h1>

          <ReviewForm firstInputRef={firstInputRef} />
        </section>

        {/* Community Reviews Section */}
        <section className="pt-12 border-t border-border/60 space-y-7">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Community Reviews
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Read what others have shared about their readings on Japaika.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {REVIEW_CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id
                const count = counts?.[cat.id] ?? 0

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`flex cursor-pointer items-baseline gap-1.5 rounded-full border px-3.5 py-[7px] font-sans text-[13.5px] transition ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground font-medium shadow-xs"
                        : "border-border bg-accent/30 text-muted-foreground hover:border-primary/40 hover:text-foreground font-normal"
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className="font-mono text-[9.5px] opacity-70">
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Loading Skeletons */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-border bg-card/40 p-6 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24 rounded-md" />
                    <Skeleton className="h-3 w-16 rounded-md" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full rounded-md" />
                    <Skeleton className="h-4 w-5/6 rounded-md" />
                    <Skeleton className="h-4 w-3/4 rounded-md" />
                  </div>
                  <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                    <Skeleton className="h-4 w-28 rounded-md" />
                    <Skeleton className="h-3 w-32 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="p-8 text-center border border-border rounded-2xl bg-card/40 space-y-3">
              <p className="text-sm text-muted-foreground">{error}</p>
              <button
                type="button"
                onClick={() => dispatch(fetchReviews({ category: activeCategory }))}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-medium text-foreground hover:border-primary/40 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try again</span>
              </button>
            </div>
          )}

          {/* Reviews Grid */}
          {!loading && !error && reviews.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && reviews.length === 0 && (
            <div className="p-10 text-center border border-dashed border-border rounded-2xl">
              <p className="text-sm text-muted-foreground">
                No reviews in this category yet.
              </p>
            </div>
          )}
        </section>

        {/* Bottom Section: Add a Review Prompt */}
        <section className="rounded-2xl border border-border bg-card/40 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Have something to share?
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              We’d love to hear about your experience with Japaika.
            </p>
          </div>

          <button
            type="button"
            onClick={handleScrollToForm}
            className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-sans text-sm font-semibold px-6 py-3 transition cursor-pointer shrink-0 inline-flex items-center gap-2 shadow-xs"
          >
            <span>Add a Review</span>
            <ArrowUp className="w-4 h-4" />
          </button>
        </section>
      </div>
    </div>
  )
}
