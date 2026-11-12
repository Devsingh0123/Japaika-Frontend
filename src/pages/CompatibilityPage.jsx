import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";

import DualBirthForm from "@/features/compatibility/components/DualBirthForm";
import MatchScoreOverviewCard from "@/features/compatibility/components/MatchScoreOverviewCard";
import AshtakootBreakdownTable from "@/features/compatibility/components/AshtakootBreakdownTable";
import ManglikDoshaCard from "@/features/compatibility/components/ManglikDoshaCard";
import NadiBhakootAlert from "@/features/compatibility/components/NadiBhakootAlert";
import AskJyotishMarriageCTA from "@/features/compatibility/components/AskJyotishMarriageCTA";
import { calculateMarriageMatch } from "@/features/compatibility";
import { trackEvent } from "@/lib/analytics";

export default function CompatibilityPage() {
  const dispatch = useDispatch();
  const { matchData, status, error } = useSelector(
    (state) => state.compatibility || {}
  );

  const isLoading = status === "loading";
  const [showForm, setShowForm] = useState(!matchData);

  const handleFormSubmit = async ({ boy, girl }) => {
    const resultAction = await dispatch(
      calculateMarriageMatch({ boy, girl })
    );
    if (calculateMarriageMatch.fulfilled.match(resultAction)) {
      try {
        trackEvent("compatibility_checked", {
          total_points: resultAction.payload?.totalPoints ?? resultAction.payload?.total_points ?? resultAction.payload?.score,
          maximum_points: 36,
          is_recommended: Boolean(resultAction.payload?.isRecommended ?? resultAction.payload?.is_recommended),
        });
      } catch {
        // Analytics non-blocking
      }
      setShowForm(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleReset = () => {
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-transparent text-foreground flex flex-col justify-between">
      <Helmet>
        <title>Kundli Milan & Marriage Compatibility (36 Gunas) | Japaika</title>
        <meta
          name="description"
          content="Accurate Vedic Kundli Milan by date of birth. Calculate 36 Gunas (Ashtakoota), Mangal Dosha cancellations, Nadi & Bhakoot compatibility."
        />
        <meta
          property="og:title"
          content="Kundli Milan & Marriage Compatibility | Japaika"
        />
        <meta
          property="og:description"
          content="Ashtakoot Guna Milan out of 36, Nadi, Bhakoot and Mangal read separately on classical Vedic algorithms."
        />
      </Helmet>

      {/* Main Page Container */}
      <div className="w-full max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-8 flex-1">
        {/* Header Breadcrumbs & Title */}
        <div className="space-y-3">
          <div className="text-[11px] font-mono tracking-widest text-muted-foreground uppercase flex items-center gap-2">
            <span>JAPAIKA / COMPATIBILITY</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-primary font-medium">ASHTAKOOTA MILAN</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-normal text-foreground tracking-tight">
            Kundli Milan & Compatibility
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground font-sans max-w-2xl leading-relaxed">
            Ashtakoot Guna Milan calculated out of 36 points on classical Jyotish principles, with separate evaluation for Mangal Dosha, Nadi, and Bhakoot exceptions.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-destructive" />
            <span>{error}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {showForm || !matchData ? (
            /* Input View */
            <motion.div
              key="form-view"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <DualBirthForm onSubmit={handleFormSubmit} isLoading={isLoading} />
            </motion.div>
          ) : (
            /* Results View */
            <motion.div
              key="results-view"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="space-y-8"
            >
              {/* Score Gauge & Summary */}
              <MatchScoreOverviewCard
                matchData={matchData}
                onReset={handleReset}
              />

              {/* Nadi & Bhakoot Warning/Remedy Alert (if applicable) */}
              <NadiBhakootAlert summary={matchData.summary} />

              {/* 8 Kootas Detailed Table */}
              <AshtakootBreakdownTable kootas={matchData.kootas} />

              {/* Mangal Dosha Evaluation */}
              <ManglikDoshaCard
                summary={matchData.summary}
                partners={matchData.partners}
              />

              {/* Ask Jyotish AI & Deep Report Upsell */}
              <AskJyotishMarriageCTA
                boyName={matchData.partners.boy.name}
                girlName={matchData.partners.girl.name}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
