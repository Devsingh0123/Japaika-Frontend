import { useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Helmet } from "react-helmet-async";
import {
  Flame,
  Sparkles,
  Orbit,
  Star,
  HeartHandshake,
  Eye,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchDoshaBySlug, fetchDoshas, clearCurrentDosha } from "@/features/doshas/doshasSlice";
import { DoshaDetailSkeleton } from "@/features/doshas/components/DoshaSkeleton";
import DoshaRemediesList from "@/features/doshas/components/DoshaRemediesList";
import DoshaCancellationsCard from "@/features/doshas/components/DoshaCancellationsCard";
import AskJyotishDoshaBanner from "@/features/doshas/components/AskJyotishDoshaBanner";
import DoshaCard from "@/features/doshas/components/DoshaCard";

const SEVERITY_CONFIG = {
  low: {
    label: "Low Intensity",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    dotClass: "bg-emerald-500",
  },
  medium: {
    label: "Medium Intensity",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    dotClass: "bg-amber-500",
  },
  high: {
    label: "High Intensity",
    badgeClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
    dotClass: "bg-orange-500",
  },
  severe: {
    label: "Severe Intensity",
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
    dotClass: "bg-rose-500",
  },
};

const CATEGORY_CONFIG = {
  marriage: { label: "Marriage & Vivah", icon: HeartHandshake },
  karmic: { label: "Karmic & Ancestral", icon: Sparkles },
  planetary: { label: "Planetary Affliction", icon: Orbit },
  nakshatra: { label: "Nakshatra Sandhi", icon: Star },
  general: { label: "General Vedic", icon: Flame },
};

export default function DoshaDetailPage() {
  const { slug } = useParams();
  const dispatch = useDispatch();

  const { currentDosha, detailLoading, detailError, doshas } = useSelector(
    (state) => state.doshas || {}
  );

  useEffect(() => {
    if (slug) {
      dispatch(fetchDoshaBySlug(slug));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    return () => {
      dispatch(clearCurrentDosha());
    };
  }, [slug, dispatch]);

  // Load other doshas for related recommendations if not already present
  useEffect(() => {
    if (!doshas || doshas.length === 0) {
      dispatch(fetchDoshas());
    }
  }, [dispatch, doshas]);

  const relatedDoshas = useMemo(() => {
    if (!Array.isArray(doshas)) return [];
    return doshas.filter((d) => d.slug !== slug).slice(0, 3);
  }, [doshas, slug]);

  if (detailLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8">
        <DoshaDetailSkeleton />
      </div>
    );
  }

  if (detailError || !currentDosha) {
    return (
      <div className="min-h-screen bg-background text-foreground py-16 px-4 flex items-center justify-center">
        <div className="rounded-3xl border border-border/80 bg-card/70 p-8 sm:p-12 text-center max-w-md mx-auto space-y-4 shadow-xl">
          <Flame className="w-12 h-12 text-muted-foreground/40 mx-auto" />
          <h2 className="font-serif text-2xl font-semibold text-foreground">
            Dosha Guide Not Found
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground font-sans">
            {detailError || "The astrological guide you are looking for does not exist or has been moved."}
          </p>
          <div className="pt-2">
            <Button asChild className="rounded-full px-6 py-2.5 cursor-pointer">
              <Link to="/doshas">Browse All Dosha Guides</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const severity = SEVERITY_CONFIG[currentDosha.severity?.toLowerCase()] || SEVERITY_CONFIG.medium;
  const category = CATEGORY_CONFIG[currentDosha.category?.toLowerCase()] || CATEGORY_CONFIG.general;
  const CategoryIcon = category.icon;

  const planets = Array.isArray(currentDosha.affected_planets) ? currentDosha.affected_planets : [];
  const houses = Array.isArray(currentDosha.affected_houses) ? currentDosha.affected_houses : [];

  return (
    <div className="min-h-screen bg-background text-foreground py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>{currentDosha.meta_title || `${currentDosha.name} Guide: Nivaran & Remedies | Japaika`}</title>
        <meta
          name="description"
          content={
            currentDosha.meta_description ||
            currentDosha.excerpt ||
            `Learn about ${currentDosha.name}, its astrological formation, life effects, classical cancellations, and Vedic remedies.`
          }
        />
        <meta
          name="keywords"
          content={
            currentDosha.meta_keywords ||
            `${currentDosha.name.toLowerCase()}, vedic remedies, nivaran, astrology dosha`
          }
        />
        <link
          rel="canonical"
          href={currentDosha.canonical_url || `https://japaika.com/doshas/${currentDosha.slug}`}
        />
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-8 sm:space-y-10">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-mono text-muted-foreground flex-wrap">
          <Link to="/" className="hover:text-foreground transition-colors cursor-pointer">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/doshas" className="hover:text-foreground transition-colors cursor-pointer">
            Vedic Doshas
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-semibold truncate max-w-[200px]">
            {currentDosha.name}
          </span>
        </nav>

        {/* Hero Header Card */}
        <header className="rounded-3xl border border-border/80 bg-card/80 backdrop-blur-xl p-6 sm:p-10 shadow-lg space-y-6 relative overflow-hidden">
          {/* Subtle Celestial Background Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          {/* Badges & Meta */}
          <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider border ${severity.badgeClass}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${severity.dotClass} animate-pulse`} />
                {severity.label}
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-accent/60 border border-border/80 text-foreground/80">
                <CategoryIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{category.label}</span>
              </span>
            </div>

            {typeof currentDosha.views_count === "number" && (
              <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-muted-foreground/80" />
                <span>{currentDosha.views_count.toLocaleString()} views</span>
              </span>
            )}
          </div>

          {/* Titles */}
          <div className="space-y-2 relative z-10">
            {currentDosha.sanskrit_name && (
              <div className="text-sm sm:text-base font-serif font-normal text-amber-600 dark:text-amber-400 tracking-wide">
                {currentDosha.sanskrit_name}
              </div>
            )}
            <h1 className="font-serif text-2xl sm:text-4xl lg:text-[42px] font-normal text-foreground tracking-tight leading-tight">
              {currentDosha.title || currentDosha.name}
            </h1>
            {currentDosha.subtitle && (
              <p className="text-xs sm:text-base text-muted-foreground font-sans leading-relaxed pt-1">
                {currentDosha.subtitle}
              </p>
            )}
          </div>

          {/* Astrological Parameters Pill Bar */}
          <div className="pt-2 border-t border-border/60 flex flex-wrap items-center gap-4 text-xs font-sans relative z-10">
            {planets.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-muted-foreground text-[11px] uppercase tracking-wider">
                  Planets:
                </span>
                <div className="flex flex-wrap gap-1">
                  {planets.map((planet) => (
                    <span
                      key={planet}
                      className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary font-semibold"
                    >
                      <Orbit className="w-2.5 h-2.5 shrink-0" />
                      <span>{planet}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {houses.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-muted-foreground text-[11px] uppercase tracking-wider">
                  Afflicted Houses:
                </span>
                <span className="font-mono text-foreground font-semibold">
                  {houses.join(", ")}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Featured Banner Image (if available) */}
        {currentDosha.featured_image && (
          <div className="rounded-3xl overflow-hidden border border-border/80 shadow-md h-64 sm:h-80 md:h-96 w-full relative bg-accent/30">
            <img
              src={currentDosha.featured_image}
              alt={currentDosha.title || currentDosha.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          </div>
        )}

        {/* Content Section 1: Astrological Foundation & Formation */}
        {currentDosha.description && (
          <section className="rounded-3xl border border-border/70 bg-card/70 backdrop-blur-xl p-6 sm:p-9 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2 className="font-serif text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
                Astrological Formation & Classical Context
              </h2>
            </div>
            <div className="text-xs sm:text-base text-foreground/90 font-sans leading-relaxed whitespace-pre-line space-y-3">
              {currentDosha.description}
            </div>
          </section>
        )}

        {/* Content Section 2: Manifestations & Life Effects */}
        {currentDosha.effects && (
          <section className="rounded-3xl border border-border/70 bg-card/70 backdrop-blur-xl p-6 sm:p-9 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <h2 className="font-serif text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
                Key Manifestations & Life Impact
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground font-sans">
              Depending on the native's active Mahadasha and planetary strengths, {currentDosha.name} can manifest in the following ways:
            </p>
            <div className="text-xs sm:text-base text-foreground/90 font-sans leading-relaxed whitespace-pre-line bg-accent/20 rounded-2xl p-4 sm:p-6 border border-border/60">
              {currentDosha.effects}
            </div>
          </section>
        )}

        {/* Content Section 3: Classical Nivaran & Neutralization */}
        {currentDosha.cancellations && (
          <DoshaCancellationsCard
            cancellations={currentDosha.cancellations}
            doshaName={currentDosha.name}
          />
        )}

        {/* Content Section 4: Prescribed Vedic Upayas & Remedies */}
        {Array.isArray(currentDosha.remedies) && currentDosha.remedies.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary font-semibold block leading-tight">
                  AUTHENTIC SHASTRA PROTOCOLS
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
                  Prescribed Vedic Remedies (Upayas)
                </h2>
              </div>
              <span className="text-xs font-mono text-muted-foreground hidden sm:inline">
                {currentDosha.remedies.length} Classical Upayas
              </span>
            </div>

            <DoshaRemediesList remedies={currentDosha.remedies} />
          </section>
        )}

        {/* Contextual AI Verification Banner */}
        <AskJyotishDoshaBanner doshaName={currentDosha.name} />

        {/* Related Doshas Section */}
        {relatedDoshas.length > 0 && (
          <section className="pt-8 border-t border-border/60 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
                Explore Other Vedic Dosha Guides
              </h3>
              <Button asChild variant="ghost" size="sm" className="text-xs font-mono text-primary cursor-pointer">
                <Link to="/doshas">View All &gt;</Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {relatedDoshas.map((dosha) => (
                <DoshaCard key={dosha.id || dosha.slug} dosha={dosha} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
