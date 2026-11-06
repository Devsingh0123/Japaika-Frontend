import { useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Helmet } from "react-helmet-async";
import { Flame, Sparkles, AlertCircle, RefreshCw, Compass, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchDoshas,
  setCategoryFilter,
  setSeverityFilter,
  setSearchFilter,
  resetFilters,
} from "@/features/doshas/doshasSlice";
import DoshaCard from "@/features/doshas/components/DoshaCard";
import DoshaFilters from "@/features/doshas/components/DoshaFilters";
import DoshasGridSkeleton from "@/features/doshas/components/DoshaSkeleton";
import AskJyotishDoshaBanner from "@/features/doshas/components/AskJyotishDoshaBanner";

export default function DoshasListingPage() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const { doshas, total, loading, error, filters } = useSelector(
    (state) => state.doshas || {}
  );

  // Synchronize URL query params with Redux filters
  useEffect(() => {
    const urlCategory = searchParams.get("category") || "all";
    const urlSeverity = searchParams.get("severity") || "all";
    const urlSearch = searchParams.get("search") || "";

    if (urlCategory !== filters.category) dispatch(setCategoryFilter(urlCategory));
    if (urlSeverity !== filters.severity) dispatch(setSeverityFilter(urlSeverity));
    if (urlSearch !== filters.search) dispatch(setSearchFilter(urlSearch));
  }, [searchParams, dispatch, filters.category, filters.severity, filters.search]);

  const updateUrlParams = useCallback(
    (newParams) => {
      const current = Object.fromEntries(searchParams.entries());
      const merged = { ...current, ...newParams };

      if (merged.category === "all") delete merged.category;
      if (merged.severity === "all") delete merged.severity;
      if (!merged.search) delete merged.search;

      setSearchParams(merged);
    },
    [searchParams, setSearchParams]
  );

  // Fetch doshas whenever active filters change
  useEffect(() => {
    dispatch(
      fetchDoshas({
        category: filters.category,
        severity: filters.severity,
        search: filters.search,
      })
    );
  }, [dispatch, filters.category, filters.severity, filters.search]);

  const handleCategoryChange = (catId) => {
    dispatch(setCategoryFilter(catId));
    updateUrlParams({ category: catId });
  };

  const handleSeverityChange = (sevId) => {
    dispatch(setSeverityFilter(sevId));
    updateUrlParams({ severity: sevId });
  };

  const handleSearchChange = (query) => {
    dispatch(setSearchFilter(query));
    updateUrlParams({ search: query });
  };

  const handleReset = () => {
    dispatch(resetFilters());
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Vedic Dosha Guides & Nivaran Remedies | Japaika</title>
        <meta
          name="description"
          content="Explore authoritative guides to classical Vedic astrological Doshas (Mangal, Kala Sarpa, Pitru, Guru Chandal). Understand causes, classical cancellation rules, and authentic remedies."
        />
        <meta
          name="keywords"
          content="vedic doshas, mangal dosha, manglik, kala sarpa dosha, pitru dosha, guru chandal dosha, ganda moola dosha, nivaran, vedic remedies, astrology dosha"
        />
        <link rel="canonical" href="https://japaika.com/doshas" />
      </Helmet>

      <div className="max-w-7xl mx-auto space-y-10 sm:space-y-12">
        {/* Header & Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono uppercase tracking-[0.2em] bg-accent/70 border border-border/80 text-foreground/80 shadow-xs">
            <Flame className="w-3.5 h-3.5 text-primary" />
            <span>Classical Shastra Knowledge Base</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-normal text-foreground tracking-tight leading-tight">
            Vedic Doshas & Classical Nivaran
          </h1>

          <p className="text-xs sm:text-base text-muted-foreground font-sans leading-relaxed">
            In Vedic astrology, a Dosha represents a planetary misalignment or karmic imbalance. Classical texts reveal that every affliction has precise cancellation rules (Nivaran) and actionable Upayas.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs font-mono text-muted-foreground">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Authentic Nivaran Rules</span>
            </span>
            <span className="text-border">•</span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Actionable Vedic Upayas</span>
            </span>
            <span className="text-border">•</span>
            <span className="flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-sky-500" />
              <span>Brihat Parasara Principles</span>
            </span>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="p-4 sm:p-6 rounded-3xl border border-border/70 bg-card/60 backdrop-blur-xl shadow-xs">
          <DoshaFilters
            filters={filters}
            onCategoryChange={handleCategoryChange}
            onSeverityChange={handleSeverityChange}
            onSearchChange={handleSearchChange}
            onReset={handleReset}
            totalResults={total}
          />
        </div>

        {/* Main Content: Loading, Error, Empty, or Cards Grid */}
        <div>
          {loading && <DoshasGridSkeleton count={6} />}

          {!loading && error && (
            <div className="rounded-3xl border border-destructive/20 bg-destructive/10 p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4">
              <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
              <h3 className="font-serif text-lg font-medium text-foreground">
                Unable to load Dosha guides
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground font-sans">{error}</p>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  dispatch(
                    fetchDoshas({
                      category: filters.category,
                      severity: filters.severity,
                      search: filters.search,
                    })
                  )
                }
                className="rounded-full border-border/80 text-foreground hover:bg-accent cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-2" />
                <span>Try Again</span>
              </Button>
            </div>
          )}

          {!loading && !error && doshas.length === 0 && (
            <div className="rounded-3xl border border-border/70 bg-card/40 p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4">
              <Flame className="w-10 h-10 text-muted-foreground/50 mx-auto" />
              <h3 className="font-serif text-lg sm:text-xl font-medium text-foreground">
                No matching Dosha guides found
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground font-sans">
                No astrological guides matched your current category or intensity filters.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="rounded-full border-border/80 text-foreground hover:bg-accent cursor-pointer text-xs"
              >
                Reset All Filters
              </Button>
            </div>
          )}

          {!loading && !error && doshas.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {doshas.map((dosha) => (
                <DoshaCard key={dosha.id || dosha.slug} dosha={dosha} />
              ))}
            </div>
          )}
        </div>

        {/* Bottom Banner: Ask Jyotish AI Verification */}
        <AskJyotishDoshaBanner doshaName="Vedic Doshas" />
      </div>
    </div>
  );
}
