import { createSlice } from "@reduxjs/toolkit";
import { FALLBACK_LEGAL_PAGES } from "./supportData";
import {
  fetchFaqs,
  fetchFaqById,
  fetchLegalPages,
  fetchLegalPageBySlug,
} from "./supportApi";

export { fetchFaqs, fetchFaqById, fetchLegalPages, fetchLegalPageBySlug };

const initialState = {
  faqs: [],
  categories: ["general", "reports", "billing", "privacy"],
  selectedFaq: null,
  faqFilters: {
    category: "all",
    search: "",
  },
  faqLoading: false,
  faqDetailLoading: false,
  faqError: null,

  legalPages: FALLBACK_LEGAL_PAGES,
  currentLegalPage: null,
  legalLoading: false,
  legalListLoading: false,
  legalError: null,
};

export const supportSlice = createSlice({
  name: "support",
  initialState,
  reducers: {
    setFaqCategoryFilter: (state, action) => {
      state.faqFilters.category = action.payload || "all";
    },
    setFaqSearchFilter: (state, action) => {
      state.faqFilters.search = action.payload || "";
    },
    resetFaqFilters: (state) => {
      state.faqFilters = {
        category: "all",
        search: "",
      };
    },
    clearSelectedFaq: (state) => {
      state.selectedFaq = null;
    },
    clearCurrentLegalPage: (state) => {
      state.currentLegalPage = null;
      state.legalError = null;
    },
  },
  extraReducers: (builder) => {
    // 1. Fetch FAQs list
    builder
      .addCase(fetchFaqs.pending, (state) => {
        state.faqLoading = true;
        state.faqError = null;
      })
      .addCase(fetchFaqs.fulfilled, (state, action) => {
        state.faqLoading = false;
        state.faqs = action.payload?.faqs || [];
        if (
          Array.isArray(action.payload?.categories) &&
          action.payload.categories.length > 0
        ) {
          state.categories = action.payload.categories;
        }
      })
      .addCase(fetchFaqs.rejected, (state, action) => {
        state.faqLoading = false;
        state.faqError =
          action.payload || "Unable to load frequently asked questions.";
      });

    // 2. Fetch Single FAQ by ID
    builder
      .addCase(fetchFaqById.pending, (state) => {
        state.faqDetailLoading = true;
      })
      .addCase(fetchFaqById.fulfilled, (state, action) => {
        state.faqDetailLoading = false;
        state.selectedFaq = action.payload || null;
      })
      .addCase(fetchFaqById.rejected, (state) => {
        state.faqDetailLoading = false;
      });

    // 3. Fetch Legal Pages list
    builder
      .addCase(fetchLegalPages.pending, (state) => {
        state.legalListLoading = true;
      })
      .addCase(fetchLegalPages.fulfilled, (state, action) => {
        state.legalListLoading = false;
        if (Array.isArray(action.payload) && action.payload.length > 0) {
          state.legalPages = action.payload;
        }
      })
      .addCase(fetchLegalPages.rejected, (state) => {
        state.legalListLoading = false;
      });

    // 4. Fetch Single Legal Page by slug
    builder
      .addCase(fetchLegalPageBySlug.pending, (state) => {
        state.legalLoading = true;
        state.legalError = null;
      })
      .addCase(fetchLegalPageBySlug.fulfilled, (state, action) => {
        state.legalLoading = false;
        state.currentLegalPage = action.payload || null;
      })
      .addCase(fetchLegalPageBySlug.rejected, (state, action) => {
        state.legalLoading = false;
        state.legalError =
          action.payload || "Unable to load the requested legal policy.";
      });
  },
});

export const {
  setFaqCategoryFilter,
  setFaqSearchFilter,
  resetFaqFilters,
  clearSelectedFaq,
  clearCurrentLegalPage,
} = supportSlice.actions;

export default supportSlice.reducer;

