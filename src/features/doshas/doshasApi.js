import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiClient } from "@/lib/api-client";

/**
 * 1. Async Thunk: Fetch published Vedic Doshas list
 * Supports optional filters: category, severity, search
 */
export const fetchDoshas = createAsyncThunk(
  "doshas/fetchDoshas",
  async (params = {}, { rejectWithValue }) => {
    try {
      const cleanParams = {};
      if (params.category && params.category !== "all") {
        cleanParams.category = params.category;
      }
      if (params.severity && params.severity !== "all") {
        cleanParams.severity = params.severity;
      }
      if (params.search && params.search.trim()) {
        cleanParams.search = params.search.trim();
      }

      const response = await apiClient.get("/doshas", { params: cleanParams });
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      }
      return { doshas: [], total: 0 };
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || err?.message || "Failed to load doshas list."
      );
    }
  }
);

/**
 * 2. Async Thunk: Fetch a single Dosha guide by slug
 */
export const fetchDoshaBySlug = createAsyncThunk(
  "doshas/fetchDoshaBySlug",
  async (slug, { rejectWithValue }) => {
    try {
      if (!slug) {
        return rejectWithValue("Dosha slug is required.");
      }
      const response = await apiClient.get(`/doshas/${slug}`);
      if (response.data && response.data.success && response.data.data?.dosha) {
        return response.data.data.dosha;
      }
      return rejectWithValue("Dosha guide not found.");
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || err?.message || "Failed to load dosha guide."
      );
    }
  }
);

