import { createAsyncThunk } from "@reduxjs/toolkit"
import { apiClient } from "@/lib/api-client"

/**
 * 1. Fetch approved customer reviews
 * Supports optional query parameters: category, page, limit
 */
export const fetchReviews = createAsyncThunk(
  "reviews/fetchReviews",
  async (params = {}, { rejectWithValue }) => {
    try {
      const cleanParams = {}
      if (params.category && params.category !== "all") {
        cleanParams.category = params.category
      }
      if (params.page) {
        cleanParams.page = params.page
      }
      if (params.limit) {
        cleanParams.limit = params.limit
      }

      const response = await apiClient.get("/reviews", { params: cleanParams })
      if (response.data && response.data.success && response.data.data) {
        return response.data.data
      }
      return {
        reviews: [],
        counts: { all: 0, jyotish: 0, reports: 0, kundli: 0, compatibility: 0, shastra: 0 },
        pagination: { total: 0, page: 1, limit: 20, totalPages: 1 },
      }
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || err?.message || "Failed to load reviews."
      )
    }
  }
)

/**
 * 2. Submit a new customer review
 */
export const createReview = createAsyncThunk(
  "reviews/createReview",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/reviews", payload)
      if (response.data && response.data.success && response.data.data?.review) {
        return response.data.data.review
      }
      return rejectWithValue("Failed to submit review.")
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || err?.message || "Failed to submit review."
      )
    }
  }
)

