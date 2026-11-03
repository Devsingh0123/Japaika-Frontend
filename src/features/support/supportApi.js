import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiClient } from "@/lib/api-client";
import {
  FALLBACK_FAQS,
  FALLBACK_LEGAL_PAGES,
  normalizeLegalSlug,
} from "./supportData";

/**
 * Helper: Filter fallback FAQs locally when backend is unreachable
 */
function filterFallbackFaqs({ category = "all", search = "" } = {}) {
  let list = [...FALLBACK_FAQS];

  if (category && category !== "all") {
    const cleanCat = category.trim().toLowerCase();
    list = list.filter(
      (item) => (item.category || "general").toLowerCase() === cleanCat
    );
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q)
    );
  }

  const categories = Array.from(
    new Set(FALLBACK_FAQS.map((item) => item.category || "general"))
  );

  return {
    faqs: list,
    categories,
  };
}

/**
 * 1. Fetch active FAQs from GET /api/v1/faqs
 * Supports optional ?category= and ?search= query parameters
 */
export const fetchFaqs = createAsyncThunk(
  "support/fetchFaqs",
  async ({ category = "all", search = "" } = {}) => {
    try {
      const params = {};
      if (category && category !== "all") {
        params.category = category;
      }
      if (search && search.trim()) {
        params.search = search.trim();
      }

      const response = await apiClient.get("/faqs", { params });
      if (response.data?.success && response.data?.data) {
        const { faqs = [], categories = [] } = response.data.data;

        // If backend returned data or user actively filtered, return backend response
        if (
          faqs.length > 0 ||
          categories.length > 0 ||
          (category && category !== "all") ||
          (search && search.trim())
        ) {
          return {
            faqs,
            categories,
          };
        }
      }
      return filterFallbackFaqs({ category, search });
    } catch {
      return filterFallbackFaqs({ category, search });
    }
  }
);

/**
 * 2. Fetch single FAQ by ID from GET /api/v1/faqs/:id
 */
export const fetchFaqById = createAsyncThunk(
  "support/fetchFaqById",
  async (id, { rejectWithValue }) => {
    if (!id) return rejectWithValue("FAQ ID is required.");
    try {
      const response = await apiClient.get(`/faqs/${id}`);
      if (response.data?.success && response.data?.data?.faq) {
        return response.data.data.faq;
      }
    } catch {
      // Fall back to local lookup if available
    }

    const fallback = FALLBACK_FAQS.find((item) => item.id === id);
    if (fallback) {
      return fallback;
    }
    return rejectWithValue("FAQ not found.");
  }
);

/**
 * 3. Fetch all active legal pages from GET /api/v1/legal-pages
 */
export const fetchLegalPages = createAsyncThunk(
  "support/fetchLegalPages",
  async () => {
    try {
      const response = await apiClient.get("/legal-pages");
      if (
        response.data?.success &&
        Array.isArray(response.data?.data?.legalPages) &&
        response.data.data.legalPages.length > 0
      ) {
        return response.data.data.legalPages;
      }
    } catch {
      // Graceful fallback below
    }
    return FALLBACK_LEGAL_PAGES;
  }
);

/**
 * 4. Fetch a single legal page by slug from GET /api/v1/legal-pages/:slug
 */
export const fetchLegalPageBySlug = createAsyncThunk(
  "support/fetchLegalPageBySlug",
  async (rawSlug, { rejectWithValue }) => {
    const normalizedSlug = normalizeLegalSlug(rawSlug);
    try {
      const response = await apiClient.get(`/legal-pages/${normalizedSlug}`);
      if (response.data?.success && response.data?.data?.legalPage) {
        return response.data.data.legalPage;
      }
    } catch {
      // Check fallback legal pages before rejecting
    }

    const fallback = FALLBACK_LEGAL_PAGES.find(
      (page) => page.slug === normalizedSlug
    );
    if (fallback) {
      return fallback;
    }

    return rejectWithValue(
      `Legal document "${rawSlug}" was not found or is currently unavailable.`
    );
  }
);

