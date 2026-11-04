import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import CalculatorHeader from "@/features/calculators/components/CalculatorHeader";
import BirthDetailsForm from "@/features/calculators/components/BirthDetailsForm";
import NorthIndianChart from "@/features/calculators/components/NorthIndianChart";
import PlanetaryTable from "@/features/calculators/components/PlanetaryTable";
import HouseAnalysis from "@/features/calculators/components/HouseAnalysis";
import DashaTimeline from "@/features/calculators/components/DashaTimeline";
import CalculatorFaqSection from "@/features/calculators/components/CalculatorFaqSection";
import RelatedCalculatorsGrid from "@/features/calculators/components/RelatedCalculatorsGrid";
import Footer from "@/components/layout/Footer";

import { calculateKundli } from "@/features/calculators";

export default function FreeKundliPage() {
  const dispatch = useDispatch();
  const { kundliData, status, error, lastInput } = useSelector(
    (state) => state.calculators
  );

  const [vargaTab, setVargaTab] = useState("d1"); // "d1" | "d9" | "d10"
  const [detailsTab, setDetailsTab] = useState("planets"); // "planets" | "bhavas" | "dashas"

  const isLoading = status === "loading";
  const hasFailed = status === "failed";

  const handleFormSubmit = (payload) => {
    dispatch(calculateKundli(payload));
  };

  const getActiveChartData = () => {
    if (!kundliData) return {};
    if (vargaTab === "d9") {
      return (
        kundliData.navamsaChart ||
        kundliData.horoscope?.divisional_charts?.["D-9_navamsa"] ||
        kundliData.allDivisionalCharts?.["D-9_navamsa"] ||
        {}
      );
    }
    if (vargaTab === "d10") {
      return (
        kundliData.dasamsaChart ||
        kundliData.horoscope?.divisional_charts?.["D-10_dasamsa"] ||
        kundliData.allDivisionalCharts?.["D-10_dasamsa"] ||
        {}
      );
    }
    return (
      kundliData.rasiChart ||
      kundliData.horoscope?.divisional_charts?.["D-1_rasi"] ||
      kundliData.allDivisionalCharts?.["D-1_rasi"] ||
      {}
    );
  };

  const getActiveChartTitle = () => {
    if (vargaTab === "d9") return "D-9 Navamsha Chart";
    if (vargaTab === "d10") return "D-10 Dashamsha Chart";
    return "D-1 Rashi Janam Kundli";
  };

  const summary = kundliData?.summary || {};

  return (
    <div className="min-h-screen bg-transparent text-foreground pb-24">
      <Helmet>
        <title>Free Kundli Maker & Birth Chart Calculator | Japaika</title>
        <meta
          name="description"
          content="A Kundli, or Janam Kundali, is a birth chart mapping the position of the planets, Sun and Moon across the twelve houses at your moment of birth. Japaika generates it free."
        />
      </Helmet>

      <div className="relative px-6 pt-9 pb-20 sm:px-10 sm:pt-11 lg:px-14 xl:px-20 max-w-[1400px] mx-auto">
        {/* Calculator Header */}
        <CalculatorHeader
          category="BIRTH CHART"
          updatedDate="21 JUL 2026"
          title="Free Kundli Maker"
          toolId="free-kundli-maker"
          subtitle="A Kundli, or Janam Kundali, is a birth chart mapping the position of the planets, Sun and Moon across the twelve houses at your moment of birth. Japaika generates it free, giving you your ascendant, planetary placements, Vimshottari Dasha periods and active yogas in seconds."
          reviewerName="Dr. Vineeta Chandrashekhar Phatak"
          reviewerTitle="CHIEF ASTROLOGER · JAPAIKA"
        />

        {/* 2-Column Responsive Layout */}
        <div className="mt-8 grid grid-cols-1 items-start gap-x-8 gap-y-9 lg:grid-cols-[minmax(0,1fr)_320px] xl:gap-x-10">
          {/* Main Area (Form + Results + FAQs) */}
          <div className="min-w-0 space-y-8">
            {/* Form Console */}
            <BirthDetailsForm
              onSubmit={handleFormSubmit}
              isLoading={isLoading}
              initialValues={lastInput}
            />

            {/* Error Notice */}
            {!isLoading && hasFailed && (
              <div className="p-6 rounded-2xl border border-destructive/30 bg-destructive/10 text-left space-y-2">
                <div className="flex items-center gap-2 text-destructive font-serif text-base font-medium">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>That calculation did not come back.</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Check the date, time and place, then run it again.
                </p>
                {error && (
                  <p className="text-xs font-mono text-muted-foreground/80 mt-1">
                    Detail: {error}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => dispatch(calculateKundli(lastInput || {}))}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border/80 glass-card bg-card/60 hover:bg-accent/40 text-xs font-sans text-foreground transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try again</span>
                </button>
              </div>
            )}

            {/* Loading Skeletons */}
            {isLoading && (
              <div className="space-y-4 p-6 rounded-2xl border border-border/70 glass-card bg-card/60">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                </div>
                <div className="flex justify-center py-6">
                  <Skeleton className="h-[360px] w-full max-w-[400px] rounded-2xl" />
                </div>
              </div>
            )}

            {/* Calculation Result Display */}
            {!isLoading && kundliData && (
              <div className="space-y-6 pt-2">
                {/* 4 Summary Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl border border-primary/30 glass-card shadow-sm">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-primary block mb-0.5">
                      Ascendant (Lagna)
                    </span>
                    <span className="text-base font-serif font-semibold text-foreground block">
                      {summary.ascendantSign || "—"}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {summary.ascendantDegree !== undefined
                        ? `${Number(summary.ascendantDegree % 30).toFixed(2)}°`
                        : "—"}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border/60 glass-card shadow-sm">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-0.5">
                      Moon Sign (Rashi)
                    </span>
                    <span className="text-base font-serif font-semibold text-foreground block">
                      {summary.moonSign || "—"}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {summary.moonDegree !== undefined
                        ? `${Number(summary.moonDegree % 30).toFixed(2)}°`
                        : "—"}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border/60 glass-card shadow-sm">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-0.5">
                      Nakshatra
                    </span>
                    <span className="text-base font-serif font-semibold text-foreground block truncate">
                      {summary.nakshatra || "—"}
                    </span>
                    <span className="text-[10px] font-mono text-primary font-medium">
                      {summary.pada ? `Pada ${summary.pada}` : "—"}{summary.nakshatraLord ? ` (${summary.nakshatraLord})` : ""}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border/60 glass-card shadow-sm">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-0.5">
                      Sun Sign
                    </span>
                    <span className="text-base font-serif font-semibold text-foreground block">
                      {summary.sunSign || "—"}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      Nirayana Solar
                    </span>
                  </div>
                </div>

                {/* Varga Selector Pills */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setVargaTab("d1")}
                    className={`px-3.5 py-1.5 text-xs font-mono rounded-full border transition-all ${
                      vargaTab === "d1"
                        ? "border-primary bg-primary text-primary-foreground font-medium shadow-sm"
                        : "border-border/60 glass-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    D-1 Rashi
                  </button>
                  <button
                    type="button"
                    onClick={() => setVargaTab("d9")}
                    className={`px-3.5 py-1.5 text-xs font-mono rounded-full border transition-all ${
                      vargaTab === "d9"
                        ? "border-primary bg-primary text-primary-foreground font-medium shadow-sm"
                        : "border-border/60 glass-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    D-9 Navamsha
                  </button>
                  <button
                    type="button"
                    onClick={() => setVargaTab("d10")}
                    className={`px-3.5 py-1.5 text-xs font-mono rounded-full border transition-all ${
                      vargaTab === "d10"
                        ? "border-primary bg-primary text-primary-foreground font-medium shadow-sm"
                        : "border-border/60 glass-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    D-10 Dashamsha
                  </button>
                </div>

                {/* North Indian Diamond Kundli Chart */}
                <NorthIndianChart
                  chartData={getActiveChartData()}
                  summary={summary}
                  title={getActiveChartTitle()}
                />

                {/* Detailed Analysis Tabs */}
                <Tabs
                  value={detailsTab}
                  onValueChange={setDetailsTab}
                  className="w-full space-y-4"
                >
                  <TabsList className="w-full grid grid-cols-3 glass-card border border-border/80 h-11 p-1 rounded-xl shadow-sm">
                    <TabsTrigger
                      value="planets"
                      className="text-xs font-mono uppercase data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                      Planets
                    </TabsTrigger>
                    <TabsTrigger
                      value="bhavas"
                      className="text-xs font-mono uppercase data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                      12 Bhavas
                    </TabsTrigger>
                    <TabsTrigger
                      value="dashas"
                      className="text-xs font-mono uppercase data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                      Dashas
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="planets" className="mt-0">
                    <PlanetaryTable chartData={kundliData.rasiChart || {}} />
                  </TabsContent>

                  <TabsContent value="bhavas" className="mt-0">
                    <HouseAnalysis
                      chartData={kundliData.rasiChart || {}}
                      summary={summary}
                    />
                  </TabsContent>

                  <TabsContent value="dashas" className="mt-0">
                    <DashaTimeline
                      dashas={kundliData.dashas || {}}
                      summary={summary}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* How it works */}
            <CalculatorFaqSection toolName="Free Kundli Maker" />

            {/* Related Calculators Grid */}
            <RelatedCalculatorsGrid currentToolId="free-kundli-maker" />
          </div>

          {/* Right Complementary Sidebar (320px) */}
          <aside className="space-y-4 lg:sticky lg:top-8">
            {/* Metric Card */}
            <div className="glass-card rounded-2xl border border-border/70 p-5 text-left shadow-sm">
              <div className="font-serif text-[28px] leading-tight text-foreground font-medium">
                12 houses
              </div>
              <p className="text-muted-foreground text-xs mt-1.5">
                mapped from your exact birth moment
              </p>
            </div>

            {/* Want it interpreted? Card */}
            <div className="glass-card rounded-2xl border border-primary/30 p-5 text-left space-y-3 shadow-md">
              <div className="flex items-center gap-3">
                <span className="grid h-[34px] w-[34px] flex-none place-items-center rounded-full bg-primary/10 text-primary border border-primary/25">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div className="font-serif text-lg text-foreground font-medium leading-snug">
                  Want it interpreted?
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Jyotish reads this result against the rest of your chart, not in isolation.
              </p>

              <Link
                to="/?engine=jyotish"
                className="block w-full text-center py-2.5 rounded-full border border-border/80 glass-card text-foreground hover:bg-accent/40 font-sans text-sm font-medium transition cursor-pointer shadow-sm"
              >
                Ask Jyotish
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
