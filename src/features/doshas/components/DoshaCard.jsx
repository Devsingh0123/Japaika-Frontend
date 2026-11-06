import { Link } from "react-router-dom";
import { ArrowRight, Flame, Sparkles, Orbit, Star, HeartHandshake, Eye } from "lucide-react";

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

export default function DoshaCard({ dosha }) {
  if (!dosha) return null;

  const severity = SEVERITY_CONFIG[dosha.severity?.toLowerCase()] || SEVERITY_CONFIG.medium;
  const category = CATEGORY_CONFIG[dosha.category?.toLowerCase()] || CATEGORY_CONFIG.general;
  const CategoryIcon = category.icon;

  const planets = Array.isArray(dosha.affected_planets) ? dosha.affected_planets : [];
  const houses = Array.isArray(dosha.affected_houses) ? dosha.affected_houses : [];

  return (
    <article className="group rounded-3xl border border-border/80 bg-card/70 hover:bg-card/95 backdrop-blur-xl transition-all duration-300 hover:border-primary/40 hover:shadow-xl flex flex-col justify-between overflow-hidden shadow-xs">
      <div>
        {/* Featured Image with Aspect Ratio & Subtle Zoom */}
        <Link to={`/doshas/${dosha.slug}`} className="block relative h-48 sm:h-52 w-full overflow-hidden bg-accent/40 cursor-pointer">
          {dosha.featured_image ? (
            <img
              src={dosha.featured_image}
              alt={dosha.title || dosha.name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-accent/30 to-background">
              <Flame className="w-12 h-12 text-primary/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

          {/* Badges on Image */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider backdrop-blur-md border ${severity.badgeClass}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${severity.dotClass} animate-pulse`} />
              {severity.label}
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono text-white/90 bg-black/40 backdrop-blur-md border border-white/20">
              <CategoryIcon className="w-3 h-3 text-amber-300" />
              <span>{category.label}</span>
            </span>
          </div>

          {/* Sanskrit Name on lower edge of image */}
          {dosha.sanskrit_name && (
            <div className="absolute bottom-3 left-4 right-4">
              <span className="font-serif text-sm sm:text-base font-normal text-amber-200/90 tracking-wide drop-shadow-md">
                {dosha.sanskrit_name}
              </span>
            </div>
          )}
        </Link>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-3">
          <div>
            <h3 className="font-serif text-xl sm:text-[22px] font-semibold text-foreground tracking-tight leading-snug group-hover:text-primary transition-colors">
              <Link to={`/doshas/${dosha.slug}`} className="hover:underline cursor-pointer">
                {dosha.name}
              </Link>
            </h3>
            {dosha.subtitle && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1 font-sans">
                {dosha.subtitle}
              </p>
            )}
          </div>

          <p className="text-xs sm:text-sm text-foreground/80 line-clamp-3 leading-relaxed font-sans">
            {dosha.excerpt || dosha.description}
          </p>

          {/* Affected Factors (Planets & Houses) */}
          {(planets.length > 0 || houses.length > 0) && (
            <div className="pt-2 flex flex-wrap items-center gap-1.5">
              {planets.map((planet) => (
                <span
                  key={planet}
                  className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-accent/60 border border-border/80 text-foreground/80"
                >
                  <Orbit className="w-2.5 h-2.5 text-primary shrink-0" />
                  <span>{planet}</span>
                </span>
              ))}
              {houses.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-accent/40 border border-border/70 text-muted-foreground">
                  <span>H: {houses.join(", ")}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-5 sm:px-6 py-4 border-t border-border/60 bg-accent/15 flex items-center justify-between text-xs">
        <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
          {typeof dosha.views_count === "number" && (
            <>
              <Eye className="w-3.5 h-3.5 text-muted-foreground/80" />
              <span>{dosha.views_count.toLocaleString()} views</span>
            </>
          )}
        </span>

        <Link
          to={`/doshas/${dosha.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors group-hover:translate-x-0.5 transition-transform cursor-pointer font-sans"
        >
          <span>Read Guide</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </article>
  );
}
