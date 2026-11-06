import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Compass,
  RefreshCw,
  Printer,
  ChevronRight,
  ShieldCheck,
  User,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import NorthIndianChart from "@/features/calculators/components/NorthIndianChart";
import PlanetaryTable from "@/features/calculators/components/PlanetaryTable";
import HouseAnalysis from "@/features/calculators/components/HouseAnalysis";
import DashaTimeline from "@/features/calculators/components/DashaTimeline";
import AskJyotishPromptCard from "@/features/calculators/components/AskJyotishPromptCard";

import { fetchUserChart } from "@/features/calculators";

// Sanskrit & elemental lookup for 12 Signs
const ZODIAC_METADATA = {
  aries: { sanskrit: "Mesha", lord: "Mars", element: "Fire" },
  taurus: { sanskrit: "Vrishabha", lord: "Venus", element: "Earth" },
  gemini: { sanskrit: "Mithuna", lord: "Mercury", element: "Air" },
  cancer: { sanskrit: "Karka", lord: "Moon", element: "Water" },
  leo: { sanskrit: "Simha", lord: "Sun", element: "Fire" },
  virgo: { sanskrit: "Kanya", lord: "Mercury", element: "Earth" },
  libra: { sanskrit: "Tula", lord: "Venus", element: "Air" },
  scorpio: { sanskrit: "Vrischika", lord: "Mars", element: "Water" },
  sagittarius: { sanskrit: "Dhanu", lord: "Jupiter", element: "Fire" },
  capricorn: { sanskrit: "Makara", lord: "Saturn", element: "Earth" },
  aquarius: { sanskrit: "Kumbha", lord: "Saturn", element: "Air" },
  pisces: { sanskrit: "Meena", lord: "Jupiter", element: "Water" },
};

function formatDegree(deg) {
  if (deg === undefined || deg === null) return "0° 00'";
  const degInSign = deg % 30;
  const d = Math.floor(degInSign);
  const m = Math.floor((degInSign - d) * 60);
  return `${d}° ${String(m).padStart(2, "0")}'`;
}

export default function KundliDisplayPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, birthDetails } = useSelector(
    (state) => state.auth || {}
  );
  const { userKundli, userKundliStatus, userKundliError } = useSelector(
    (state) => state.calculators || {}
  );

  const [activeVarga, setActiveVarga] = useState("d1"); // "d1" | "d9" | "d10"
  const [activeTab, setActiveTab] = useState("chart"); // "chart" | "bhavas" | "dashas"

  const isLoading = userKundliStatus === "loading";
  const hasFailed = userKundliStatus === "failed";

  // Load authentic user chart upon mount or when birthDetails become available
  useEffect(() => {
    if (!birthDetails) {
      navigate("/onboarding", { replace: true });
      return;
    }
    if (!userKundli && userKundliStatus !== "loading") {
      dispatch(
        fetchUserChart({
          chartId: birthDetails.chartId,
          birthDetails: birthDetails,
        })
      );
    }
  }, [dispatch, userKundli, userKundliStatus, birthDetails, navigate]);

  const handlePrint = () => {
    window.print();
  };

  const handleRefresh = () => {
    if (!birthDetails) return;
    dispatch(
      fetchUserChart({
        chartId: birthDetails.chartId,
        birthDetails: birthDetails,
      })
    );
  };

  // Derive active chart data based on divisional selection
  const getActiveChart = () => {
    if (!userKundli) return {};
    if (activeVarga === "d9") {
      return (
        userKundli.navamsaChart ||
        userKundli.horoscope?.divisional_charts?.["D-9_navamsa"] ||
        userKundli.raw?.allDivisionalCharts?.["D-9_navamsa"] ||
        {}
      );
    }
    if (activeVarga === "d10") {
      return (
        userKundli.dasamsaChart ||
        userKundli.horoscope?.divisional_charts?.["D-10_dasamsa"] ||
        userKundli.raw?.allDivisionalCharts?.["D-10_dasamsa"] ||
        {}
      );
    }
    return (
      userKundli.rasiChart ||
      userKundli.horoscope?.divisional_charts?.["D-1_rasi"] ||
      userKundli.raw?.rasiChart ||
      userKundli.raw?.allDivisionalCharts?.["D-1_rasi"] ||
      {}
    );
  };

  const activeChartData = getActiveChart();
  const summary = userKundli?.summary || birthDetails?.chartSummary || {};

  const ascSign = summary.ascendantSign || "—";
  const moonSign = summary.moonSign || "—";
  const sunSign = summary.sunSign || "—";
  const nakshatra = summary.nakshatra || "—";
  const pada = summary.pada || "—";

  const ascMeta = ZODIAC_METADATA[ascSign?.toLowerCase()] || {
    sanskrit: "—",
    lord: "—",
    element: "—",
  };
  const moonMeta = ZODIAC_METADATA[moonSign?.toLowerCase()] || {
    sanskrit: "—",
    lord: "—",
    element: "—",
  };
  const sunMeta = ZODIAC_METADATA[sunSign?.toLowerCase()] || {
    sanskrit: "—",
    lord: "—",
    element: "—",
  };

  // Person details from real birthDetails or chart
  const displayName =
    birthDetails?.fullName ||
    userKundli?.name ||
    user?.name ||
    user?.email?.split("@")[0] ||
    "User";
  const displayDob =
    birthDetails?.dateOfBirth || userKundli?.dob || "—";
  const displayTob = birthDetails?.isTimeUnknown
    ? "Time Unknown"
    : (birthDetails?.timeOfBirth || userKundli?.tob || "—");
  const displayCity =
    birthDetails?.birthCity ||
    userKundli?.city ||
    "—";

  return (
    <div className="min-h-screen bg-transparent text-foreground pb-24">
      <Helmet>
        <title>{displayName}'s Janam Kundli | Japaika Vedic Astrology</title>
        <meta
          name="description"
          content={`Explore the authentic Vedic birth chart (Janam Kundli) for ${displayName}. Discover your Lagna in ${ascSign}, Moon in ${moonSign}, Nakshatra ${nakshatra}, 12 Bhavas, and planetary alignments.`}
        />
      </Helmet>

      {/* Main Container */}
      <div className="relative px-4 sm:px-8 lg:px-12 xl:px-16 pt-6 sm:pt-8 max-w-[1440px] mx-auto space-y-8">
        {/* ================= 1. BREADCRUMBS & TOP BAR ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
          <nav className="flex items-center gap-2 text-xs font-mono text-muted-foreground uppercase tracking-wider">
            <Link
              to="/"
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <span>Dashboard</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
            <span className="text-primary font-medium">My Janam Kundli</span>
          </nav>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-9 px-3.5 rounded-xl border border-border/70 glass-card hover:bg-accent/40 text-xs font-mono text-foreground flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-primary" : ""}`}
              />
              <span className="hidden sm:inline">Refresh Chart</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-9 px-3.5 rounded-xl border border-border/70 glass-card hover:bg-accent/40 text-xs font-mono text-foreground flex items-center gap-2 cursor-pointer print:hidden shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / PDF</span>
            </Button>

            <Link to="/?engine=jyotish">
              <Button
                size="sm"
                className="h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs font-mono tracking-wider flex items-center gap-2 shadow-lg shadow-primary/20 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask Jyotish</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* ================= 2. PROFILE & CALCULATION HEADER ================= */}
        <div className="relative rounded-3xl border border-border/80 glass-card p-6 sm:p-8 shadow-xl backdrop-blur-2xl overflow-hidden">
          {/* Subtle celestial background orb */}
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-[11px] font-mono tracking-wider uppercase font-medium">
                <Compass className="w-3.5 h-3.5 text-primary" />
                <span>Authentic Vedic Janam Kundli</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-medium text-foreground tracking-tight">
                {displayName}'s Birth Chart
              </h1>

              {/* Birth coordinates metadata row */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-muted-foreground font-sans">
                <span className="flex items-center gap-1.5 text-foreground font-medium">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>{displayDob}</span>
                </span>

                <span className="flex items-center gap-1.5 text-foreground font-medium">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>{displayTob}</span>
                </span>

                <span className="flex items-center gap-1.5 text-foreground font-medium">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>{displayCity}</span>
                </span>
              </div>
            </div>

            {/* Ephemeris & System Badges */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-2 shrink-0 pt-2 lg:pt-0">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-accent/40 border border-border/60 text-[11px] font-mono text-foreground/90">
                  Ayanamsha: <strong className="text-primary font-semibold">Lahiri (Chitra Paksha)</strong>
                </span>
                
              </div>

              <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Verified Nirayana Planetary Longitudes</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 3. FOUR CELESTIAL PILLARS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pillar 1: Lagna (Ascendant) */}
          <div className="relative rounded-2xl border border-primary/40 glass-card p-5 shadow-lg hover:border-primary/70 transition-all group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-medium">
                Ascendant (Lagna)
              </span>
              <span className="text-sm font-serif text-primary">✦</span>
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl font-serif font-medium text-foreground">
                {ascSign}
              </h2>
              <span className="text-xs font-mono text-muted-foreground">
                ({ascMeta.sanskrit})
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-mono">
              <span className="text-muted-foreground">Degree: {formatDegree(summary.ascendantDegree)}</span>
              <span className="text-primary font-semibold">Lord: {ascMeta.lord}</span>
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground/80">
              House 1 · Dharma Trikona ({ascMeta.element} Element)
            </div>
          </div>

          {/* Pillar 2: Moon Sign (Chandra Rashi) */}
          <div className="relative rounded-2xl border border-border/70 glass-card p-5 shadow-lg hover:border-primary/40 transition-all group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-medium">
                Moon Sign (Janma Rashi)
              </span>
              <span className="text-base text-primary">☽</span>
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl font-serif font-medium text-foreground">
                {moonSign}
              </h2>
              <span className="text-xs font-mono text-muted-foreground">
                ({moonMeta.sanskrit})
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-mono">
              <span className="text-muted-foreground">Degree: {formatDegree(summary.moonDegree)}</span>
              <span className="text-primary font-semibold">Lord: {moonMeta.lord}</span>
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground/80">
              Governs Emotions, Mind & Intuition
            </div>
          </div>

          {/* Pillar 3: Nakshatra & Pada */}
          <div className="relative rounded-2xl border border-border/70 glass-card p-5 shadow-lg hover:border-primary/40 transition-all group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-medium">
                Birth Star (Nakshatra)
              </span>
              <span className="text-sm font-serif text-primary">✧</span>
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl font-serif font-medium text-foreground truncate">
                {nakshatra}
              </h2>
              <Badge
                variant="outline"
                className="border-primary/40 text-primary bg-primary/10 text-[10px] font-mono font-medium"
              >
                Pada {pada}
              </Badge>
            </div>
            <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-mono">
              <span className="text-muted-foreground">Lord: {summary.nakshatraLord || "Moon"}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Vimsottari Ruler</span>
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground/80">
              Lunar Constellation of Soul Receptivity
            </div>
          </div>

          {/* Pillar 4: Sun Sign (Surya Rashi) */}
          <div className="relative rounded-2xl border border-border/70 glass-card p-5 shadow-lg hover:border-primary/40 transition-all group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-medium">
                Sun Sign (Surya Rashi)
              </span>
              <span className="text-base text-amber-500">☉</span>
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl font-serif font-medium text-foreground">
                {sunSign}
              </h2>
              <span className="text-xs font-mono text-muted-foreground">
                ({sunMeta.sanskrit})
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-mono">
              <span className="text-muted-foreground">System: Nirayana</span>
              <span className="text-primary font-semibold">Lord: {sunMeta.lord}</span>
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground/80">
              Core Vitality, Dharma & Soul Purpose
            </div>
          </div>
        </div>

        {/* ================= 4. LOADING SKELETON ================= */}
        {(isLoading || (!userKundli && !hasFailed)) && (
          <div className="p-8 rounded-3xl border border-border/60 glass-card space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <div className="space-y-1">
                <Skeleton className="h-5 w-48 rounded-md" />
                <p className="text-xs text-muted-foreground font-mono">
                  Calculating planetary positions...
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center justify-center">
              <Skeleton className="h-[420px] w-full max-w-[460px] mx-auto rounded-3xl" />
              <Skeleton className="h-[420px] w-full rounded-2xl" />
            </div>
          </div>
        )}

        {/* ================= ERROR STATE ================= */}
        {hasFailed && !userKundli && !isLoading && (
          <div className="p-8 sm:p-12 rounded-3xl border border-destructive/30 glass-card text-center space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-xl font-serif font-medium text-foreground">
                Unable to Calculate Kundli
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground font-sans">
                {userKundliError ||
                  "We encountered an issue calculating your high-precision Vedic birth chart. Please verify your birth details or try refreshing."}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                onClick={handleRefresh}
                className="h-10 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs font-mono tracking-wider flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Calculation</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/onboarding")}
                className="h-10 px-5 rounded-xl border border-border/70 glass-card hover:bg-accent/40 text-xs font-mono text-foreground flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <User className="w-3.5 h-3.5 text-primary" />
                <span>Update Birth Details</span>
              </Button>
            </div>
          </div>
        )}

        {/* ================= 5. CHART VISUALIZATION & DATA SECTION ================= */}
        {!isLoading && userKundli && (
          <div className="space-y-8">
            {/* Varga Divisional Selector Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-border/80 glass-card shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground mr-1 hidden sm:inline">
                  Divisional Chart:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveVarga("d1")}
                    className={`px-3.5 py-1.5 text-xs font-mono rounded-xl border transition-all cursor-pointer ${
                      activeVarga === "d1"
                        ? "border-primary bg-primary text-primary-foreground font-semibold shadow-sm"
                        : "border-border/60 glass-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    D-1 Rashi (Natal)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveVarga("d9")}
                    className={`px-3.5 py-1.5 text-xs font-mono rounded-xl border transition-all cursor-pointer ${
                      activeVarga === "d9"
                        ? "border-primary bg-primary text-primary-foreground font-semibold shadow-sm"
                        : "border-border/60 glass-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    D-9 Navamsha
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveVarga("d10")}
                    className={`px-3.5 py-1.5 text-xs font-mono rounded-xl border transition-all cursor-pointer ${
                      activeVarga === "d10"
                        ? "border-primary bg-primary text-primary-foreground font-semibold shadow-sm"
                        : "border-border/60 glass-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    D-10 Dashamsha
                  </button>
                </div>
              </div>

              {/* View Switcher Tabs (Chart Grid vs Detailed Bhavas vs Dashas) */}
              <div className="flex items-center gap-1 border-t sm:border-t-0 pt-3 sm:pt-0 border-border/40">
                <button
                  type="button"
                  onClick={() => setActiveTab("chart")}
                  className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                    activeTab === "chart"
                      ? "bg-primary/15 text-primary border border-primary/25 font-medium shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Kundli & Planets
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("bhavas")}
                  className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                    activeTab === "bhavas"
                      ? "bg-primary/15 text-primary border border-primary/25 font-medium shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  12 Bhavas
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("dashas")}
                  className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                    activeTab === "dashas"
                      ? "bg-primary/15 text-primary border border-primary/25 font-medium shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Dasha Timeline
                </button>
              </div>
            </div>

            {/* TAB CONTENT 1: Primary North Indian Diamond Chart + Planetary Table */}
            {activeTab === "chart" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* 12-Box North Indian Diamond Chart (5 cols on desktop) */}
                <div className="lg:col-span-5 flex flex-col items-center">
                  <div className="w-full max-w-[460px]">
                    <NorthIndianChart
                      chartData={activeChartData}
                      summary={summary}
                      title={
                        activeVarga === "d9"
                          ? "D-9 Navamsha Chart"
                          : activeVarga === "d10"
                          ? "D-10 Dashamsha Chart"
                          : "D-1 Rashi Janam Kundli"
                      }
                    />

                    {/* Chart Legend */}
                    <div className="mt-3 px-3.5 py-2 glass-card rounded-xl border border-border/60 flex flex-wrap items-center justify-between text-[11px] font-mono text-muted-foreground shadow-sm">
                      <span>• Roman numerals: Signs</span>
                      <span>• (R): Retrograde</span>
                      <span className="text-primary font-semibold">Asc: Ascendant</span>
                    </div>
                  </div>
                </div>

                {/* Planetary Positions Table (Graha Sphutas) (7 cols on desktop) */}
                <div className="lg:col-span-7">
                  <PlanetaryTable
                    chartData={
                      userKundli?.rasiChart ||
                      activeChartData ||
                      {}
                    }
                  />
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: 12 Bhavas Breakdown */}
            {activeTab === "bhavas" && (
              <div className="animate-in fade-in duration-300">
                <HouseAnalysis
                  chartData={userKundli?.rasiChart || activeChartData}
                  summary={summary}
                />
              </div>
            )}

            {/* TAB CONTENT 3: Vimshottari Dasha Periods */}
            {activeTab === "dashas" && (
              <div className="animate-in fade-in duration-300">
                <DashaTimeline
                  dashas={userKundli?.dashas || userKundli?.raw?.dashas}
                  summary={summary}
                />
              </div>
            )}

            {/* ================= 6. ASK JYOTISH CARD ================= */}
            <div className="pt-4">
              <AskJyotishPromptCard chartSummary={summary} />
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
