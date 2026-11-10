import { createSlice } from "@reduxjs/toolkit";
import { REPORT_CATEGORIES, REPORTS_CATALOG } from "./reportsData";
import {
  fetchReportsCatalog,
  fetchMyReports,
  checkReportSlugStatus,
  unlockReport,
  fetchReportStatus,
  fetchReportById,
} from "./reportsApi";

export {
  fetchReportsCatalog,
  fetchMyReports,
  checkReportSlugStatus,
  unlockReport,
  fetchReportStatus,
  fetchReportById,
};

export const normalizeReport = (report) => {
  if (!report) return report;
  const parse = (val, fallback) => {
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        return parsed !== null && parsed !== undefined ? parsed : fallback;
      } catch {
        return fallback;
      }
    }
    return val !== null && val !== undefined ? val : fallback;
  };

  return {
    ...report,
    summary: parse(report.summary, {}),
    table_of_contents: parse(report.table_of_contents, []),
    sections: parse(report.sections, []),
    astrological_factors: parse(report.astrological_factors, {}),
  };
};

const initialState = {
  categories: REPORT_CATEGORIES,
  catalog: REPORTS_CATALOG,
  myReports: [],
  selectedCategory: "all",
  activeSlugStatus: null,
  activeFullReport: null,
  generationState: {
    reportId: null,
    status: null, // 'generating' | 'completed' | 'failed'
    progressPercent: 0,
    currentStage: "",
    error: null,
  },
  loading: false,
  unlocking: false,
  error: null,
};

export const reportsSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    setActiveFullReport: (state, action) => {
      state.activeFullReport = action.payload;
    },
    clearActiveReport: (state) => {
      state.activeFullReport = null;
      state.activeSlugStatus = null;
      state.generationState = {
        reportId: null,
        status: null,
        progressPercent: 0,
        currentStage: "",
        error: null,
      };
    },
    updateGenerationProgress: (state, action) => {
      state.generationState = {
        ...state.generationState,
        ...action.payload,
      };
    },
  },
  extraReducers: (builder) => {
    // 1. Catalog
    builder
      .addCase(fetchReportsCatalog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReportsCatalog.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.reports) {
          state.catalog = action.payload.reports;
        }
        if (action.payload?.categories) {
          state.categories = action.payload.categories;
        }
      })
      .addCase(fetchReportsCatalog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load reports catalog.";
      });

    // 2. My Reports
    builder.addCase(fetchMyReports.fulfilled, (state, action) => {
      state.myReports = Array.isArray(action.payload)
        ? action.payload.map(normalizeReport)
        : [];
    });

    // 3. Check Slug Status
    builder.addCase(checkReportSlugStatus.fulfilled, (state, action) => {
      state.activeSlugStatus = action.payload;
      if (action.payload?.isUnlocked && action.payload?.report) {
        state.activeFullReport = normalizeReport(action.payload.report);
      }
      if (action.payload?.status === "generating" && action.payload?.reportId) {
        state.generationState.reportId = action.payload.reportId;
        state.generationState.status = "generating";
        state.generationState.progressPercent = action.payload.progressPercent || 15;
      }
    });

    // 4. Unlock Report
    builder
      .addCase(unlockReport.pending, (state) => {
        state.unlocking = true;
        state.error = null;
      })
      .addCase(unlockReport.fulfilled, (state, action) => {
        state.unlocking = false;
        const res = action.payload;
        if (res?.reportId) {
          state.generationState.reportId = res.reportId;
          state.generationState.status = res.status || "generating";
          state.generationState.progressPercent = res.progressPercent || 15;
          state.generationState.currentStage = "Initiating deep chart calculations...";
        }
        if (res?.isAlreadyUnlocked && res?.status === "completed") {
          state.activeSlugStatus = {
            isUnlocked: true,
            status: "completed",
            reportId: res.reportId,
          };
        }
      })
      .addCase(unlockReport.rejected, (state, action) => {
        state.unlocking = false;
        state.error = action.payload || "Failed to unlock report.";
      });

    // 5. Poll Status
    builder.addCase(fetchReportStatus.fulfilled, (state, action) => {
      const data = action.payload;
      if (data) {
        state.generationState.status = data.status;
        state.generationState.progressPercent = data.progressPercent || 0;
        state.generationState.currentStage = data.currentStage || "";
        state.generationState.error = data.error || null;
      }
    });

    // 6. Get Full Report By ID
    builder.addCase(fetchReportById.fulfilled, (state, action) => {
      state.activeFullReport = normalizeReport(action.payload);
    });
  },
});

export const {
  setSelectedCategory,
  setActiveFullReport,
  clearActiveReport,
  updateGenerationProgress,
} = reportsSlice.actions;

export default reportsSlice.reducer;
