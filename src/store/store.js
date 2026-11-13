import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/authSlice";
import jyotishReducer from "@/features/jyotish/jyotishSlice";
import calculatorReducer from "@/features/calculators/calculatorSlice";
import horoscopeReducer from "@/features/horoscope/horoscopeSlice";
import reportsReducer from "@/features/reports/reportsSlice";
import blogsReducer from "@/features/blogs/blogsSlice";
import compatibilityReducer from "@/features/compatibility/compatibilitySlice";
import supportReducer from "@/features/support/supportSlice";
import doshasReducer from "@/features/doshas/doshasSlice";
import reviewsReducer from "@/features/reviews/reviewsSlice";

/**
 * Japaika Independent Global Redux Store Configuration
 * Assembles all modular feature slices from their respective feature directories:
 * - @/features/auth/authSlice
 * - @/features/jyotish/jyotishSlice
 * - @/features/calculators/calculatorSlice
 * - @/features/horoscope/horoscopeSlice
 * - @/features/reports/reportsSlice
 * - @/features/blogs/blogsSlice
 * - @/features/compatibility/compatibilitySlice
 * - @/features/support/supportSlice
 */
export const store = configureStore({
  reducer: {
    app: (state = { ready: true }) => state,
    auth: authReducer,
    jyotish: jyotishReducer,
    calculators: calculatorReducer,
    horoscope: horoscopeReducer,
    reports: reportsReducer,
    blogs: blogsReducer,
    compatibility: compatibilityReducer,
    support: supportReducer,
    doshas: doshasReducer,
    reviews: reviewsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  devTools: process.env.NODE_ENV !== "production",
});

export default store;
