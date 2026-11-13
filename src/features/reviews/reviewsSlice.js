import { createSlice } from "@reduxjs/toolkit"
import { fetchReviews, createReview } from "./reviewsApi"

const initialState = {
  reviews: [],
  counts: {
    all: 0,
    jyotish: 0,
    reports: 0,
    kundli: 0,
    compatibility: 0,
    shastra: 0,
  },
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  },
  activeCategory: "all",
  loading: false,
  submitting: false,
  error: null,
  submitError: null,
}

const reviewsSlice = createSlice({
  name: "reviews",
  initialState,
  reducers: {
    setActiveCategory(state, action) {
      state.activeCategory = action.payload || "all"
    },
  },
  extraReducers: (builder) => {
    // 1. Fetch Reviews
    builder
      .addCase(fetchReviews.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.loading = false
        state.reviews = Array.isArray(action.payload?.reviews)
          ? action.payload.reviews
          : []
        if (action.payload?.counts) {
          state.counts = {
            ...state.counts,
            ...action.payload.counts,
          }
        }
        if (action.payload?.pagination) {
          state.pagination = {
            ...state.pagination,
            ...action.payload.pagination,
          }
        }
        state.error = null
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || "Unable to load reviews."
      })

    // 2. Create Review
    builder
      .addCase(createReview.pending, (state) => {
        state.submitting = true
        state.submitError = null
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.submitting = false
        const newReview = action.payload
        if (newReview) {
          const catKey = newReview.categoryId || newReview.category?.toLowerCase()
          if (state.activeCategory === "all" || state.activeCategory === catKey) {
            state.reviews = [newReview, ...state.reviews]
          }
          state.counts.all = (state.counts.all || 0) + 1
          if (catKey && typeof state.counts[catKey] === "number") {
            state.counts[catKey] += 1
          }
        }
        state.submitError = null
      })
      .addCase(createReview.rejected, (state, action) => {
        state.submitting = false
        state.submitError = action.payload || "Failed to submit review."
      })
  },
})

export const { setActiveCategory } = reviewsSlice.actions
export { fetchReviews, createReview }
export default reviewsSlice.reducer

