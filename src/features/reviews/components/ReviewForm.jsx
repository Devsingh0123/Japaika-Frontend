import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Star, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createReview } from "../reviewsSlice"
import { REVIEW_CATEGORIES } from "../reviewsData"

export default function ReviewForm({ firstInputRef }) {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth || {})
  const { submitting } = useSelector((state) => state.reviews || {})

  const defaultFirst = user?.name ? user.name.split(" ")[0] : ""
  const defaultLast = user?.name ? user.name.split(" ").slice(1).join(" ") : ""

  const [firstName, setFirstName] = useState(defaultFirst)
  const [lastName, setLastName] = useState(defaultLast)
  const [location, setLocation] = useState("")
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [categoryId, setCategoryId] = useState("jyotish")
  const [content, setContent] = useState("")

  // Sync user's name if auth profile loads after mount
  useEffect(() => {
    if (user?.name && !firstName) {
      const parts = user.name.trim().split(" ")
      setFirstName(parts[0] || "")
      setLastName(parts.slice(1).join(" ") || "")
    }
  }, [user?.name, firstName])

  const activeRating = hoverRating || rating
  const selectableCategories = REVIEW_CATEGORIES.filter((c) => c.id !== "all")

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!firstName.trim()) {
      toast.error("Please enter your first name.")
      return
    }

    if (!content.trim() || content.trim().length < 10) {
      toast.error("Please write at least 10 characters for your review.")
      return
    }

    try {
      await dispatch(
        createReview({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          location: location.trim(),
          rating,
          category: categoryId,
          content: content.trim(),
        })
      ).unwrap()

      setContent("")
      toast.success("Thank you for sharing your review.")
    } catch (errMessage) {
      toast.error(errMessage || "Failed to submit review. Please try again.")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Rating & Topic Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
        {/* Star Rating Picker */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Rating</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((val) => {
              const isFilled = val <= activeRating
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setRating(val)}
                  onMouseEnter={() => setHoverRating(val)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`Rate ${val} out of 5 stars`}
                  className="p-1 cursor-pointer transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`w-5 h-5 transition-colors ${
                      isFilled
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/35 hover:text-muted-foreground/60"
                    }`}
                  />
                </button>
              )
            })}
          </div>
        </div>

        {/* Clean Topic Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {selectableCategories.map((cat) => {
            const isSelected = categoryId === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-sans border transition cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground font-medium"
                    : "border-border bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* First Name & Last Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          ref={firstInputRef}
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First Name"
          maxLength={40}
          required
          disabled={submitting}
          className="w-full rounded-xl border border-border bg-card/40 px-4 py-3.5 font-sans text-[15px] text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:bg-card outline-none transition disabled:opacity-60"
        />
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last Name"
          maxLength={40}
          disabled={submitting}
          className="w-full rounded-xl border border-border bg-card/40 px-4 py-3.5 font-sans text-[15px] text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:bg-card outline-none transition disabled:opacity-60"
        />
      </div>

      {/* Location */}
      <div>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location"
          maxLength={60}
          disabled={submitting}
          className="w-full rounded-xl border border-border bg-card/40 px-4 py-3.5 font-sans text-[15px] text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:bg-card outline-none transition disabled:opacity-60"
        />
      </div>

      {/* Message Textarea */}
      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing your review here..."
          rows={5}
          maxLength={600}
          required
          disabled={submitting}
          className="w-full rounded-xl border border-border bg-card/40 p-4 font-sans text-[15px] text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:bg-card outline-none transition resize-y leading-relaxed disabled:opacity-60"
        />
      </div>

      {/* Submit Row */}
      <div className="pt-2 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-sans text-sm font-semibold px-7 py-3 transition cursor-pointer shadow-xs disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <span>Submit</span>
          )}
        </button>

        <span className="text-xs sm:text-[13px] text-muted-foreground">
          Your review will be shared publicly on this page.
        </span>
      </div>
    </form>
  )
}
