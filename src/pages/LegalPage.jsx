import { useEffect, useMemo } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import {
  ShieldCheck,
  FileText,
  Scale,
  RotateCcw,
  AlertTriangle,
  Calendar,
  Share2,
  Printer,
  HelpCircle,
  ChevronRight,
  Sparkles,
  BookOpen,
} from "lucide-react";
import {
  fetchLegalPages,
  fetchLegalPageBySlug,
} from "@/features/support/supportSlice";
import {
  LEGAL_PAGE_NAVIGATION,
  normalizeLegalSlug,
} from "@/features/support/supportData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const SLUG_ICON_MAP = {
  "privacy-policy": ShieldCheck,
  terms: Scale,
  "refund-policy": RotateCcw,
  disclaimer: AlertTriangle,
};

function formatLastUpdated(dateStr) {
  if (!dateStr) return "November 2026";
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "November 2026";
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "November 2026";
  }
}

function stripHtmlTags(html = "") {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parses backend HTML content (e.g., <h2>...</h2><p>...</p><ul><li>...</li></ul>)
 * or plain text into structured sections with anchor IDs and clean editorial React elements.
 */
function parseLegalDocument(rawContent = "") {
  if (!rawContent || !String(rawContent).trim()) {
    return { sections: [], introParagraphs: [] };
  }

  const content = String(rawContent).trim();
  const hasHtmlTags = /<\/?(h1|h2|h3|p|ul|ol|li|div|blockquote)\b/i.test(
    content
  );

  if (!hasHtmlTags) {
    const paragraphs = content
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
    return {
      introParagraphs: paragraphs,
      sections: [],
    };
  }

  // Tokenize top-level HTML blocks: <h2>, <h3>, <p>, <ul>, <ol>, <blockquote>
  const blockRegex =
    /<(h2|h3|p|ul|ol|blockquote)[^>]*>([\s\S]*?)<\/\1>/gi;
  const introParagraphs = [];
  const sections = [];
  let currentSection = null;
  let match;

  while ((match = blockRegex.exec(content)) !== null) {
    const tag = match[1].toLowerCase();
    const innerHtml = match[2].trim();
    const cleanText = stripHtmlTags(innerHtml);

    if (!cleanText) continue;

    if (tag === "h2") {
      const sectionIndex = sections.length + 1;
      const anchorId = `section-${sectionIndex}`;
      currentSection = {
        id: anchorId,
        index: sectionIndex,
        title: cleanText,
        blocks: [],
      };
      sections.push(currentSection);
    } else if (tag === "h3") {
      const block = { type: "subheading", text: cleanText };
      if (currentSection) {
        currentSection.blocks.push(block);
      } else {
        introParagraphs.push(cleanText);
      }
    } else if (tag === "ul" || tag === "ol") {
      const items = [];
      const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let liMatch;
      while ((liMatch = liRegex.exec(innerHtml)) !== null) {
        const liText = stripHtmlTags(liMatch[1]);
        if (liText) items.push(liText);
      }
      if (items.length > 0) {
        const block = {
          type: tag === "ol" ? "ordered-list" : "unordered-list",
          items,
        };
        if (currentSection) {
          currentSection.blocks.push(block);
        }
      }
    } else {
      const block = { type: "paragraph", text: cleanText };
      if (currentSection) {
        currentSection.blocks.push(block);
      } else {
        introParagraphs.push(cleanText);
      }
    }
  }

  // Fallback if HTML used non-standard tags
  if (sections.length === 0 && introParagraphs.length === 0) {
    return {
      introParagraphs: [stripHtmlTags(content)],
      sections: [],
    };
  }

  return { introParagraphs, sections };
}

export default function LegalPage({ defaultSlug }) {
  const { slug: paramSlug } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();

  const {
    legalPages = [],
    currentLegalPage,
    legalLoading,
    legalError,
  } = useSelector((state) => state.support || {});

  // Resolve target slug from prop, URL param, or pathname
  const activeSlug = useMemo(() => {
    if (paramSlug) return normalizeLegalSlug(paramSlug);
    if (defaultSlug) return normalizeLegalSlug(defaultSlug);
    const pathSegment = location.pathname.replace(/^\/+/, "");
    return normalizeLegalSlug(pathSegment);
  }, [paramSlug, defaultSlug, location.pathname]);

  // Fetch legal page list once and current legal document on slug change
  useEffect(() => {
    dispatch(fetchLegalPages());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchLegalPageBySlug(activeSlug));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [dispatch, activeSlug]);

  // Resolve navigation metadata and active page object
  const activeNavMeta = useMemo(() => {
    return (
      LEGAL_PAGE_NAVIGATION.find((item) => item.slug === activeSlug) ||
      LEGAL_PAGE_NAVIGATION[0]
    );
  }, [activeSlug]);

  const pageData = useMemo(() => {
    if (
      currentLegalPage &&
      normalizeLegalSlug(currentLegalPage.slug) === activeSlug
    ) {
      return currentLegalPage;
    }
    const fromList = legalPages.find(
      (p) => normalizeLegalSlug(p.slug) === activeSlug
    );
    return (
      fromList || {
        slug: activeNavMeta.slug,
        title: activeNavMeta.title,
        content: "",
        updated_at: null,
      }
    );
  }, [currentLegalPage, legalPages, activeSlug, activeNavMeta]);

  const { introParagraphs, sections } = useMemo(
    () => parseLegalDocument(pageData?.content),
    [pageData?.content]
  );

  const ActiveIcon = SLUG_ICON_MAP[activeSlug] || FileText;

  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        toast.success("Policy link copied to clipboard");
      })
      .catch(() => {
        toast.error("Unable to copy link");
      });
  };

  const handlePrint = () => {
    window.print();
  };

  const scrollToSection = (anchorId) => {
    const el = document.getElementById(anchorId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Helmet>
        <title>{`${pageData?.title || activeNavMeta.title} | Japaika`}</title>
        <meta
          name="description"
          content={`${activeNavMeta.subtitle} — Official ${
            pageData?.title || activeNavMeta.title
          } for Japaika Vedic Astrology.`}
        />
      </Helmet>

      <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/85 p-6 sm:p-10 shadow-lg glass-card">
          <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-mono uppercase tracking-widest">
                <ActiveIcon className="w-3.5 h-3.5" />
                <span>JAPAIKA / {activeNavMeta.badge}</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                {pageData?.title || activeNavMeta.title}
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {activeNavMeta.subtitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Badge
                variant="outline"
                className="h-9 px-3.5 rounded-xl border-border/80 bg-background/70 text-xs font-mono text-muted-foreground flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>Updated {formatLastUpdated(pageData?.updated_at)}</span>
              </Badge>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="h-9 rounded-xl border-border/80 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 mr-1.5" />
                <span>Copy Link</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="h-9 rounded-xl border-border/80 cursor-pointer hidden sm:inline-flex"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                <span>Print</span>
              </Button>
            </div>
          </div>
        </section>

        {/* Mobile Quick Policy Switcher Pills */}
        <nav
          aria-label="Legal Policy Switcher"
          className="flex lg:hidden flex-wrap items-center gap-2"
        >
          {LEGAL_PAGE_NAVIGATION.map((item) => {
            const isActive = item.slug === activeSlug;
            const Icon = SLUG_ICON_MAP[item.slug] || FileText;
            return (
              <Button
                key={item.slug}
                asChild
                variant={isActive ? "default" : "outline"}
                size="sm"
                className={`rounded-full px-4 h-9 text-xs font-medium ${
                  isActive
                    ? "shadow-sm"
                    : "bg-card/70 border-border/80 text-muted-foreground"
                }`}
              >
                <Link to={item.routePath}>
                  <Icon className="w-3.5 h-3.5 mr-1.5" />
                  <span>{item.shortLabel}</span>
                </Link>
              </Button>
            );
          })}
        </nav>

        {/* 12-Column Editorial Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sticky Left Sidebar (Desktop) */}
          <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 sticky top-6 space-y-6">
            {/* Policy Navigation Card */}
            <Card className="rounded-2xl border-border/80 bg-card/80 py-5 glass-card">
              <CardContent className="space-y-3 px-4">
                <p className="px-2 text-[11px] font-mono font-semibold uppercase tracking-widest text-muted-foreground">
                  Legal Documents
                </p>
                <div className="space-y-1">
                  {LEGAL_PAGE_NAVIGATION.map((item) => {
                    const isActive = item.slug === activeSlug;
                    const Icon = SLUG_ICON_MAP[item.slug] || FileText;
                    return (
                      <Link
                        key={item.slug}
                        to={item.routePath}
                        className={`flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{item.shortLabel}</span>
                        </div>
                        <ChevronRight
                          className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                            isActive ? "translate-x-0.5" : "opacity-50"
                          }`}
                        />
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Auto-Generated Section Outline (Table of Contents) */}
            {sections.length > 0 && (
              <Card className="rounded-2xl border-border/80 bg-card/80 py-5 glass-card">
                <CardContent className="space-y-3 px-4">
                  <div className="flex items-center gap-2 px-2 text-[11px] font-mono font-semibold uppercase tracking-widest text-muted-foreground">
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                    <span>On This Page</span>
                  </div>
                  <ul className="space-y-1">
                    {sections.map((sec) => (
                      <li key={sec.id}>
                        <button
                          type="button"
                          onClick={() => scrollToSection(sec.id)}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-primary hover:bg-muted/60 transition-colors truncate cursor-pointer"
                        >
                          {sec.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Quick Help Card */}
            <Card className="rounded-2xl border-border/80 bg-card/80 py-5 glass-card">
              <CardContent className="space-y-3 px-5">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <HelpCircle className="w-4 h-4 text-primary" />
                  <span>Have a question?</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Visit our Help Center for quick answers on Kundli accuracy,
                  report credits, and account privacy.
                </p>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl border-border/80"
                >
                  <Link to="/faq">Browse FAQs</Link>
                </Button>
              </CardContent>
            </Card>
          </aside>

          {/* Main Document Content Column */}
          <main className="lg:col-span-8 xl:col-span-9">
            {legalLoading ? (
              <Card className="rounded-3xl border-border/80 bg-card/80 py-8 glass-card">
                <CardContent className="space-y-6 px-6 sm:px-10">
                  <div className="space-y-3">
                    <Skeleton className="h-7 w-2/5 rounded-md" />
                    <Skeleton className="h-4 w-full rounded-md" />
                    <Skeleton className="h-4 w-11/12 rounded-md" />
                    <Skeleton className="h-4 w-4/5 rounded-md" />
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <Skeleton className="h-7 w-1/3 rounded-md" />
                    <Skeleton className="h-4 w-full rounded-md" />
                    <Skeleton className="h-4 w-5/6 rounded-md" />
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <Skeleton className="h-7 w-1/2 rounded-md" />
                    <Skeleton className="h-4 w-full rounded-md" />
                    <Skeleton className="h-4 w-3/4 rounded-md" />
                  </div>
                </CardContent>
              </Card>
            ) : legalError ? (
              <Card className="rounded-3xl border-destructive/30 bg-destructive/5 py-12 text-center">
                <CardContent className="space-y-4 max-w-md mx-auto">
                  <p className="text-sm font-medium text-destructive">
                    {legalError}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => dispatch(fetchLegalPageBySlug(activeSlug))}
                  >
                    <RotateCcw className="w-4 h-4 mr-1.5" />
                    Retry Loading Document
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-3xl border-border/80 bg-card/85 py-8 sm:py-10 shadow-sm glass-card">
                <CardContent className="px-6 sm:px-10 space-y-8">
                  {/* Introductory Paragraphs (if any precede the first <h2>) */}
                  {introParagraphs.length > 0 && (
                    <div className="space-y-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {introParagraphs.map((para, idx) => (
                        <p key={`intro-${idx}`}>{para}</p>
                      ))}
                    </div>
                  )}

                  {/* Structured Legal Clauses */}
                  {sections.map((section, idx) => (
                    <section
                      key={section.id}
                      id={section.id}
                      className={`scroll-mt-24 space-y-4 ${
                        idx > 0 ? "pt-6 border-t border-border/60" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-1 inline-flex items-center justify-center w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 text-primary font-mono text-xs font-semibold shrink-0">
                          {String(section.index).padStart(2, "0")}
                        </span>
                        <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                          {section.title.replace(/^\d+\.\s*/, "")}
                        </h2>
                      </div>

                      <div className="space-y-3.5 pl-9 text-sm sm:text-[15px] text-muted-foreground leading-relaxed">
                        {section.blocks.map((block, bIdx) => {
                          if (block.type === "subheading") {
                            return (
                              <h3
                                key={`${section.id}-sub-${bIdx}`}
                                className="font-serif text-base sm:text-lg font-semibold text-foreground pt-2"
                              >
                                {block.text}
                              </h3>
                            );
                          }

                          if (
                            block.type === "unordered-list" ||
                            block.type === "ordered-list"
                          ) {
                            const ListTag =
                              block.type === "ordered-list" ? "ol" : "ul";
                            return (
                              <ListTag
                                key={`${section.id}-list-${bIdx}`}
                                className={`space-y-2 pl-5 ${
                                  block.type === "ordered-list"
                                    ? "list-decimal"
                                    : "list-disc"
                                }`}
                              >
                                {block.items.map((item, itemIdx) => (
                                  <li key={itemIdx}>{item}</li>
                                ))}
                              </ListTag>
                            );
                          }

                          return (
                            <p key={`${section.id}-p-${bIdx}`}>{block.text}</p>
                          );
                        })}
                      </div>
                    </section>
                  ))}

                  {/* Document Verification Footer */}
                  <div className="pt-6 border-t border-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary shrink-0" />
                      <span>
                        Official Policy Document &bull; Japaika Vedic Astrology
                      </span>
                    </div>
                    <Link
                      to="/faq"
                      className="text-primary font-medium hover:underline inline-flex items-center gap-1"
                    >
                      <span>Visit FAQ Help Center</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>

    </div>
  );
}

