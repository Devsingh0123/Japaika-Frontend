import { Search, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

const CATEGORIES = [
  { id: "all", label: "All Categories" },
  { id: "marriage", label: "Marriage" },
  { id: "karmic", label: "Karmic & Ancestral" },
  { id: "planetary", label: "Planetary" },
  { id: "nakshatra", label: "Nakshatra" },
];

const SEVERITIES = [
  { id: "all", label: "All Intensities" },
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
  { id: "severe", label: "Severe" },
];

export default function DoshaFilters({
  filters,
  onCategoryChange,
  onSeverityChange,
  onSearchChange,
  onReset,
  totalResults = 0,
}) {
  const isFiltered =
    filters.category !== "all" ||
    filters.severity !== "all" ||
    Boolean(filters.search && filters.search.trim());

  return (
    <div className="space-y-4">
      {/* Top Row: Search Input + Severity Selector + Reset */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search || ""}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search dosha by name, planet, or manifestation (e.g. Manglik, Mars, Rahu)..."
            className="w-full rounded-2xl border border-border/80 bg-card/80 pl-10 pr-10 py-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-sans shadow-xs"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Severity Segmented Filter */}
        <div className="flex items-center gap-1 p-1 bg-accent/40 border border-border/70 rounded-2xl overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-2 hidden lg:inline">
            Intensity:
          </span>
          {SEVERITIES.map((sev) => {
            const isActive = (filters.severity || "all") === sev.id;
            return (
              <button
                key={sev.id}
                type="button"
                onClick={() => onSeverityChange(sev.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                }`}
              >
                {sev.label}
              </button>
            );
          })}
        </div>

        {/* Reset Filter Button */}
        {isFiltered && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReset}
            className="h-10 px-3.5 rounded-2xl border-border/80 text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </Button>
        )}
      </div>

      {/* Bottom Row: Category Horizontal Pills */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {CATEGORIES.map((cat) => {
            const isActive = (filters.category || "all") === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onCategoryChange(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-sans transition-all cursor-pointer shrink-0 border ${
                  isActive
                    ? "bg-foreground text-background border-foreground font-medium shadow-xs"
                    : "bg-card/70 hover:bg-accent text-foreground/80 border-border/70 hover:border-border"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Result Counter */}
        <span className="text-xs font-mono text-muted-foreground shrink-0 hidden sm:inline">
          Showing {totalResults} {totalResults === 1 ? "guide" : "guides"}
        </span>
      </div>
    </div>
  );
}
