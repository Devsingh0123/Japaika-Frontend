import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Sparkles, ArrowRight } from "lucide-react";

import BirthDetailsForm from "@/features/calculators/components/BirthDetailsForm";
import CalculatorHeader from "@/features/calculators/components/CalculatorHeader";
import CalculatorFaqSection from "@/features/calculators/components/CalculatorFaqSection";
import RelatedCalculatorsGrid, {
  ALL_CALCULATORS,
} from "@/features/calculators/components/RelatedCalculatorsGrid";

import NorthIndianChart from "@/features/calculators/components/NorthIndianChart";
import PlanetaryTable from "@/features/calculators/components/PlanetaryTable";
import HouseAnalysis from "@/features/calculators/components/HouseAnalysis";
import DashaTimeline from "@/features/calculators/components/DashaTimeline";
import AskJyotishPromptCard from "@/features/calculators/components/AskJyotishPromptCard";

import SadeSatiView from "@/features/calculators/components/SadeSatiView";
import MangalDoshaView from "@/features/calculators/components/MangalDoshaView";
import DashaTreeView from "@/features/calculators/components/DashaTreeView";

import {
  calculateKundli,
  calculateSaturnTimeline,
} from "@/features/calculators";

const SIDEBAR_METRICS = {
  "shani-sade-sati": {
    value: "7.5 years",
    label: "across three phases from your Moon sign",
  },
  "mangal-dosha": {
    value: "3 frames",
    label: "cross-checked from Lagna, Moon and Venus",
  },
  "vimshottari-dasha": {
    value: "120 years",
    label: "complete planetary Mahadasha timeline",
  },
  "ascendant-calculator": {
    value: "1st house",
    label: "the rising degree that anchors your entire chart",
  },
  "nakshatra-finder": {
    value: "27 mansions",
    label: "lunar star constellation determining your instincts",
  },
  "moon-sign-calculator": {
    value: "Rashi",
    label: "your inner emotional nature & transit baseline",
  },
  "sun-sign-calculator": {
    value: "Surya Rashi",
    label: "your soul vitality and public persona in Sidereal zodiac",
  },
  "kaal-sarp-dosha": {
    value: "Rahu-Ketu",
    label: "axis analysis of all 7 classical planets",
  },
  "gemstone-advisor": {
    value: "Vedic Ratna",
    label: "trikona-aligned gems for life, luck & intellect",
  },
  "numerology-calculator": {
    value: "Numbers 1-9",
    label: "Life Path, Destiny and Name vibrations",
  },
  "ashtakavarga-calculator": {
    value: "337 bindus",
    label: "numeric benefic points across all 12 houses",
  },
};

export default function CalculatorRunnerPage() {
  const { toolName = "free-kundli-maker" } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // If kundli-milan is visited under calculators, redirect to /compatibility
  useEffect(() => {
    if (toolName === "kundli-milan") {
      navigate("/compatibility", { replace: true });
    }
  }, [toolName, navigate]);

  const {
    kundliData,
    status: kundliStatus,
    error: kundliError,
    saturnTimelineData,
    saturnTimelineStatus,
    saturnTimelineError,
  } = useSelector((state) => state.calculators || {});

  const currentCalc =
    ALL_CALCULATORS.find((c) => c.id === toolName) || {
      id: toolName,
      title: toolName.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      desc: "Vedic precision calculations synthesized from your birth chart.",
      tag: "Vedic Tool",
    };

  const isSadeSati = toolName === "shani-sade-sati";
  const isMangalDosha = toolName === "mangal-dosha";
  const isDasha = toolName === "vimshottari-dasha";

  const isSpecialized = isSadeSati || isMangalDosha || isDasha;
  const activeData = isSadeSati ? saturnTimelineData : kundliData;
  const isLoading = isSadeSati ? saturnTimelineStatus === "loading" : kundliStatus === "loading";
  const activeError = isSadeSati ? saturnTimelineError : kundliError;

  const [showForm, setShowForm] = useState(!activeData);

  const sidebarMetric = SIDEBAR_METRICS[toolName] || {
    value: "12 houses",
    label: "mapped from your exact birth moment",
  };

  const handleFormSubmit = async (formData) => {
    if (isSadeSati) {
      const res = await dispatch(calculateSaturnTimeline(formData));
      if (calculateSaturnTimeline.fulfilled.match(res)) {
        setShowForm(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      const res = await dispatch(calculateKundli(formData));
      if (calculateKundli.fulfilled.match(res)) {
        setShowForm(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-foreground flex flex-col justify-between">
      <Helmet>
        <title>{currentCalc.title} | Japaika Vedic Calculators</title>
        <meta name="description" content={currentCalc.desc} />
        <meta property="og:title" content={`${currentCalc.title} | Japaika`} />
        <meta property="og:description" content={currentCalc.desc} />
      </Helmet>

      <div className="relative px-6 pt-9 pb-20 sm:px-10 sm:pt-11 lg:px-14 xl:px-20 max-w-[1400px] mx-auto w-full flex-1">
        {/* Header Section */}
        <CalculatorHeader
          toolId={toolName}
          title={currentCalc.title}
          subtitle={currentCalc.desc}
          category={currentCalc.tag}
          onReset={() => setShowForm(true)}
          hasData={Boolean(activeData && !showForm)}
        />

        {activeError && (
          <div className="mb-6 p-4 rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-destructive" />
            <span>{activeError}</span>
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div className="mt-8 grid grid-cols-1 items-start gap-x-8 gap-y-9 lg:grid-cols-[minmax(0,1fr)_320px] xl:gap-x-10">
          {/* Main Area (Form + Results + FAQs + Related) */}
          <div className="min-w-0 space-y-8">

        <AnimatePresence mode="wait">
          {showForm || !activeData ? (
            /* Birth Input Form */
            <motion.div
              key="form-view"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <BirthDetailsForm
                onSubmit={handleFormSubmit}
                isLoading={isLoading}
              />
            </motion.div>
          ) : (
            /* Results View */
            <motion.div
              key="result-view"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="space-y-8"
            >
              {/* Specialized Views */}
              {isSadeSati && (
                <SadeSatiView
                  data={saturnTimelineData}
                  onReset={() => setShowForm(true)}
                />
              )}

              {isMangalDosha && (
                <MangalDoshaView
                  kundliData={kundliData}
                  onReset={() => setShowForm(true)}
                />
              )}

              {isDasha && (
                <DashaTreeView
                  kundliData={kundliData}
                  onReset={() => setShowForm(true)}
                />
              )}

              {/* Standard Full Kundli Analysis (for free-kundli-maker and general calculators) */}
              {!isSpecialized && (
                <div className="space-y-8">
                  {/* Chart and Table side-by-side on desktop */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-6 w-full flex justify-center">
                      <NorthIndianChart
                        chartData={kundliData?.rasiChart}
                        summary={kundliData?.summary}
                      />
                    </div>
                    <div className="lg:col-span-6 w-full">
                      <PlanetaryTable chartData={kundliData?.rasiChart} />
                    </div>
                  </div>

                  {/* House placements */}
                  <HouseAnalysis
                    chartData={kundliData?.rasiChart}
                    summary={kundliData?.summary}
                  />

                  {/* Dasha timeline summary */}
                  <DashaTimeline
                    dashas={kundliData?.dashas}
                    summary={kundliData?.summary}
                  />

                  {/* Ask Jyotish AI CTA */}
                  <AskJyotishPromptCard />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAQs */}
        <CalculatorFaqSection toolName={currentCalc.title} />

        {/* Other Calculators Carousel/Grid */}
        <RelatedCalculatorsGrid currentToolId={toolName} />
      </div>

      {/* Right Column: Sticky Sidebar */}
      <aside className="space-y-6 lg:sticky lg:top-24">
        {/* Calculator Metric Highlight Card */}
        <div className="glass-card rounded-2xl border border-border/80 bg-card/85 p-6 shadow-md dark:bg-card/70 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-xs font-mono font-medium uppercase tracking-wider text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Vedic Computation</span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-serif font-semibold text-foreground">
              {sidebarMetric.value}
            </span>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              {sidebarMetric.label}
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-mono">Engine</span>
            <span className="font-medium text-foreground">Lahiri · 3-tier Shastra</span>
          </div>
        </div>

        {/* Jyotish AI Interpret CTA Card */}
        <div className="glass-card rounded-2xl border border-primary/20 bg-primary/5 p-6 shadow-md dark:bg-primary/10 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-xs font-mono font-medium uppercase tracking-wider text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Need Personalized Guidance?</span>
          </div>
          <h4 className="mt-2 text-base font-serif font-medium text-foreground">
            Want this interpreted for your life events?
          </h4>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            Consult Jyotish AI for an instant, contextual consultation based on your chart and dashas.
          </p>
          <Link
            to="/jyotish"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            <span>Ask Jyotish AI</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </aside>
    </div>
  </div>

</div>
  );
}
