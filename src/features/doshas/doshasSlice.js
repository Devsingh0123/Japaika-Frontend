import { createSlice } from "@reduxjs/toolkit";
import { fetchDoshas, fetchDoshaBySlug } from "./doshasApi";

const initialState = {
  doshas: [],
  total: 0,
  currentDosha: null,
  loading: false,
  detailLoading: false,
  error: null,
  detailError: null,
  filters: {
    category: "all",
    severity: "all",
    search: "",
  },
};

const doshasSlice = createSlice({
  name: "doshas",
  initialState,
  reducers: {
    setCategoryFilter(state, action) {
      state.filters.category = action.payload || "all";
    },
    setSeverityFilter(state, action) {
      state.filters.severity = action.payload || "all";
    },
    setSearchFilter(state, action) {
      state.filters.search = action.payload || "";
    },
    resetFilters(state) {
      state.filters = {
        category: "all",
        severity: "all",
        search: "",
      };
    },
    clearCurrentDosha(state) {
      state.currentDosha = null;
      state.detailError = null;
    },
  },
  extraReducers: (builder) => {
    // 1. Fetch Doshas List
    builder
      .addCase(fetchDoshas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDoshas.fulfilled, (state, action) => {
        state.loading = false;
        state.doshas = Array.isArray(action.payload?.doshas) ? action.payload.doshas : [];
        state.total = typeof action.payload?.total === "number" ? action.payload.total : state.doshas.length;
        state.error = null;
      })
      .addCase(fetchDoshas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unable to load doshas.";
      });

    // 2. Fetch Single Dosha By Slug
    builder
      .addCase(fetchDoshaBySlug.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(fetchDoshaBySlug.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.currentDosha = action.payload;
        state.detailError = null;
      })
      .addCase(fetchDoshaBySlug.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload || "Dosha guide not found.";
      });
  },
});

export const {
  setCategoryFilter,
  setSeverityFilter,
  setSearchFilter,
  resetFilters,
  clearCurrentDosha,
} = doshasSlice.actions;

export { fetchDoshas, fetchDoshaBySlug };

export default doshasSlice.reducer;
