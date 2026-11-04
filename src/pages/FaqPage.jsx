import { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import {
  Sparkles,
  Search,
  X,
  HelpCircle,
  BookOpen,
  CreditCard,
  ShieldCheck,
  Compass,
  RotateCcw,
  Share2,
  MessageSquareText,
  FileText,
  ArrowRight,
} from "lucide-react";
import {
  fetchFaqs,
  fetchFaqById,
  setFaqCategoryFilter,
  setFaqSearchFilter,
  resetFaqFilters,
} from "@/features/support/supportSlice";
import {
  FAQ_CATEGORY_META,
  FAQ_SEARCH_SUGGESTIONS,
} from "@/features/support/supportData";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Footer from "@/components/layout/Footer";

const CATEGORY_ICON_MAP = {
  all: Sparkles,
  general: Compass,
  reports: BookOpen,
  billing: CreditCard,
  privacy: ShieldCheck,
};

function formatCategoryLabel(cat = "") {
  const key = String(cat || "").toLowerCase();
  if (FAQ_CATEGORY_META[key]) {
    return FAQ_CATEGORY_META[key].label;
  }
  return key
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function FaqPage() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    faqs = [],
    categories = [],
    selectedFaq,
    faqFilters,
    faqLoading,
    faqError,
  } = useSelector((state) => state.support || {});

  const [localSearch, setLocalSearch] = useState(
    searchParams.get("search") || ""
  );
  const [openItems, setOpenItems] = useState([]);

  const updateUrlParams = useCallback(
    (next) => {
      const current = Object.fromEntries(searchParams.entries());
      const merged = { ...current, ...next };

      if (!merged.category || merged.category === "all") {
        delete merged.category;
      }
      if (!merged.search || !merged.search.trim()) {
        delete merged.search;
      }
      if (!merged.id) {
        delete merged.id;
      }

      setSearchParams(merged);
    },
    [searchParams, setSearchParams]
  );

  // Sync URL query params into Redux state
  useEffect(() => {
    const urlCategory = searchParams.get("category") || "all";
    const urlSearch = searchParams.get("search") || "";
    const urlId = searchParams.get("id") || "";

    if (urlCategory !== faqFilters.category) {
      dispatch(setFaqCategoryFilter(urlCategory));
    }
    if (urlSearch !== faqFilters.search) {
      dispatch(setFaqSearchFilter(urlSearch));
      setLocalSearch(urlSearch);
    }
    if (urlId) {
      dispatch(fetchFaqById(urlId));
      setOpenItems((prev) => (prev.includes(urlId) ? prev : [...prev, urlId]));
    }
  }, [
    searchParams,
    dispatch,
    faqFilters.category,
    faqFilters.search,
  ]);

  // Fetch FAQs whenever category or search filter changes
  useEffect(() => {
    dispatch(
      fetchFaqs({
        category: faqFilters.category,
        search: faqFilters.search,
      })
    );
  }, [dispatch, faqFilters.category, faqFilters.search]);

  // Auto-open the first FAQ when initial results arrive and no item is expanded yet
  useEffect(() => {
    if (faqs.length > 0 && openItems.length === 0) {
      const highlightedId = searchParams.get("id");
      setOpenItems([highlightedId || String(faqs[0].id)]);
    }
  }, [faqs, openItems.length, searchParams]);

  // Debounce local search input into URL & Redux
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== faqFilters.search) {
        updateUrlParams({ search: localSearch });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, faqFilters.search, updateUrlParams]);

  // Build ordered category list ("all" + distinct backend categories)
  const categoryPills = useMemo(() => {
    const uniqueCats = Array.from(
      new Set([
        "general",
        "reports",
        "billing",
        "privacy",
        ...(Array.isArray(categories) ? categories : []),
      ])
    ).filter(Boolean);

    return ["all", ...uniqueCats];
  }, [categories]);

  // Ensure a deep-linked FAQ via ?id= is included in display list if not already present
  const displayedFaqs = useMemo(() => {
    if (!selectedFaq) return faqs;
    const exists = faqs.some((item) => String(item.id) === String(selectedFaq.id));
    if (exists || faqFilters.search || faqFilters.category !== "all") {
      return faqs;
    }
    return [selectedFaq, ...faqs];
  }, [faqs, selectedFaq, faqFilters.search, faqFilters.category]);

  const handleSelectCategory = (cat) => {
    updateUrlParams({ category: cat });
  };

  const handleClearAll = () => {
    setLocalSearch("");
    dispatch(resetFaqFilters());
    setSearchParams({});
  };

  const handleCopyFaqLink = (e, faqId) => {
    e.stopPropagation();
    const url = `${window.location.origin}/faq?id=${encodeURIComponent(faqId)}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        toast.success("Direct link copied to clipboard");
      })
      .catch(() => {
        toast.error("Could not copy link");
      });
  };

  const hasActiveFilters =
    faqFilters.category !== "all" || Boolean(faqFilters.search?.trim());

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Helmet>
        <title>Frequently Asked Questions (FAQs) | Japaika</title>
        <meta
          name="description"
          content="Find clear answers to common questions about Japaika Vedic astrology calculations, Kundli charts, personalized reports, billing credits, and data privacy."
        />
      </Helmet>

      {/* Main Content Container */}
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
        {/* Hero Header & Search Section */}
        <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/85 p-6 sm:p-10 md:p-12 shadow-lg glass-card">
          {/* Subtle Ambient Glow */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />

          <div className="relative z-10 max-w-2xl mx-auto text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-mono uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>JAPAIKA / HELP CENTER</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Frequently Asked{" "}
              <span className="cosmic-gradient font-extrabold">Questions</span>
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Everything you need to know about our Kundli
              calculations, Jyotish &amp; Shastra AI modes, personalized life
              reports, and credit protection.
            </p>

            {/* Live Debounced Search Input */}
            <div className="pt-2">
              <div className="relative flex items-center max-w-xl mx-auto">
                <Search className="w-4 h-4 text-muted-foreground absolute left-4 pointer-events-none" />
                <Input
                  type="search"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Search questions by keyword (e.g., Kundli accuracy, credits, refund)..."
                  aria-label="Search frequently asked questions"
                  className="h-12 pl-11 pr-11 rounded-2xl bg-background/90 border-border/80 text-sm shadow-xs focus-visible:border-primary/60"
                />
                {localSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocalSearch("");
                      updateUrlParams({ search: "" });
                    }}
                    aria-label="Clear search query"
                    className="absolute right-3.5 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Reflowable Category Filter Pills (UI/UX Pro Max: flex-wrap chip collection) */}
        <section aria-label="FAQ Categories" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {categoryPills.map((cat) => {
                const isActive = faqFilters.category === cat;
                const IconComponent = CATEGORY_ICON_MAP[cat] || HelpCircle;
                return (
                  <Button
                    key={cat}
                    type="button"
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSelectCategory(cat)}
                    className={`rounded-full px-4 h-9 text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? "shadow-sm"
                        : "bg-card/70 hover:bg-card border-border/80 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5 mr-1.5" />
                    <span>{formatCategoryLabel(cat)}</span>
                  </Button>
                );
              })}
            </div>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-primary cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Reset Filters
              </Button>
            )}
          </div>

          {/* Active Results Summary Bar */}
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              Showing{" "}
              <strong className="text-foreground font-semibold">
                {displayedFaqs.length}
              </strong>{" "}
              {displayedFaqs.length === 1 ? "question" : "questions"}
              {faqFilters.category !== "all" && (
                <>
                  {" "}
                  in{" "}
                  <span className="text-primary font-medium">
                    {formatCategoryLabel(faqFilters.category)}
                  </span>
                </>
              )}
              {faqFilters.search && (
                <>
                  {" "}
                  matching{" "}
                  <span className="text-primary font-medium">
                    &ldquo;{faqFilters.search}&rdquo;
                  </span>
                </>
              )}
            </span>

            {displayedFaqs.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setOpenItems(
                    openItems.length === displayedFaqs.length
                      ? []
                      : displayedFaqs.map((item) => String(item.id))
                  )
                }
                className="font-mono text-[11px] uppercase tracking-wider text-primary hover:underline cursor-pointer"
              >
                {openItems.length === displayedFaqs.length
                  ? "Collapse All"
                  : "Expand All"}
              </button>
            )}
          </div>
        </section>

        {/* FAQ Accordion List / Loading / Empty States */}
        <section aria-live="polite">
          {faqLoading ? (
            <div className="space-y-3.5">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Card
                  key={idx}
                  className="rounded-2xl border-border/80 bg-card/70 py-5"
                >
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <Skeleton className="h-5 w-3/4 rounded-md" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-1/2 rounded-md" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : faqError ? (
            <Card className="rounded-3xl border-destructive/30 bg-destructive/5 py-10 text-center">
              <CardContent className="space-y-4 max-w-md mx-auto">
                <p className="text-sm font-medium text-destructive">
                  {faqError}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    dispatch(
                      fetchFaqs({
                        category: faqFilters.category,
                        search: faqFilters.search,
                      })
                    )
                  }
                >
                  <RotateCcw className="w-4 h-4 mr-1.5" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : displayedFaqs.length === 0 ? (
            /* Helpful No-Results State with Search Suggestions (UI/UX Pro Max) */
            <Card className="rounded-3xl border-border/80 bg-card/80 py-12 text-center glass-card">
              <CardContent className="max-w-lg mx-auto space-y-5">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
                  <HelpCircle className="w-6 h-6" />
                </div>

                <div className="space-y-1.5">
                  <h2 className="font-serif text-xl font-bold text-foreground">
                    No matching questions found
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    We couldn&apos;t find any FAQs matching your current search.
                    Try one of these popular topics instead:
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  {FAQ_SEARCH_SUGGESTIONS.map((suggestion) => (
                    <Badge
                      key={suggestion}
                      variant="secondary"
                      onClick={() => {
                        setLocalSearch(suggestion);
                        updateUrlParams({ category: "all", search: suggestion });
                      }}
                      className="cursor-pointer px-3 py-1 text-xs hover:bg-primary/15 hover:text-primary transition-colors"
                    >
                      {suggestion}
                    </Badge>
                  ))}
                </div>

                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    className="rounded-xl cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    Show All FAQs
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Accordion
              type="multiple"
              value={openItems}
              onValueChange={setOpenItems}
              className="space-y-3.5"
            >
              {displayedFaqs.map((faq, idx) => {
                const itemValue = String(faq.id);
                const isHighlighted = searchParams.get("id") === itemValue;

                return (
                  <AccordionItem
                    key={itemValue}
                    value={itemValue}
                    className={`rounded-2xl border px-5 sm:px-6 transition-all glass-card ${
                      isHighlighted
                        ? "border-primary/60 bg-primary/5 shadow-md"
                        : "border-border/80 bg-card/80 hover:border-primary/35"
                    }`}
                  >
                    <AccordionTrigger className="py-5 hover:no-underline group">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2.5 pr-3 text-left">
                        <div className="flex items-start gap-3.5">
                          <span className="mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 text-primary font-mono text-[11px] font-semibold shrink-0">
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                          <span className="font-serif text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                            {faq.question}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 pl-9 sm:pl-0 shrink-0">
                          <Badge
                            variant="outline"
                            className="font-mono text-[10px] uppercase tracking-wider border-border/80 text-muted-foreground"
                          >
                            {formatCategoryLabel(faq.category || "general")}
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="pt-1 pb-5 pl-9 sm:pl-9 pr-2">
                      <div className="space-y-4 text-sm sm:text-[15px] text-muted-foreground leading-relaxed border-t border-border/60 pt-4">
                        <p className="whitespace-pre-line">{faq.answer}</p>

                        <div className="flex items-center justify-between pt-2">
                          <span className="text-[11px] font-mono text-muted-foreground/80">
                            Topic: {formatCategoryLabel(faq.category || "general")}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyFaqLink(e, faq.id)}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Share answer</span>
                          </button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </section>

        {/* Bottom Support & Legal Quick-Navigation CTA */}
        <section className="rounded-3xl border border-border/80 bg-card/85 p-6 sm:p-8 glass-card">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-primary">
                <MessageSquareText className="w-4 h-4" />
                <span>STILL HAVE QUESTIONS?</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-foreground">
                Ask Jyotish AI or Review Our Policies
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Start a live Vedic consultation directly from the home dashboard
                or inspect our transparent legal, privacy, and refund policies.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button asChild size="lg" className="rounded-xl px-5">
                <Link to="/">
                  <span>Ask Jyotish AI</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-xl px-5 border-border/80"
              >
                <Link to="/privacy-policy">
                  <FileText className="w-4 h-4 mr-1.5" />
                  <span>Legal &amp; Policies</span>
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}

