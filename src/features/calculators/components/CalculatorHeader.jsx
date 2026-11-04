import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import CalculatorIcon from "./CalculatorIcon";

export default function CalculatorHeader({
  category = "BIRTH CHART",
  updatedDate = "21 JUL 2026",
  title = "Free Kundli Maker",
  toolId = "free-kundli-maker",
  subtitle = "A Kundli, or Janam Kundali, is a birth chart mapping the position of the planets, Sun and Moon across the twelve houses at your moment of birth. Japaika generates it free using astronomical algorithms, giving you your ascendant, planetary placements, Vimshottari Dasha periods and active yogas in seconds.",
  reviewerName = "Dr. Vineeta Chandrashekhar Phatak",
  reviewerTitle = "CHIEF ASTROLOGER · JAPAIKA",
  backUrl = "/calculators",
  backLabel = "All calculators",
}) {
  return (
    <div className="space-y-4 mb-7">
      {/* Top Breadcrumb Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-1 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-muted-foreground/80 text-[10px] tracking-[0.22em] uppercase">
          <Link
            to="/calculators"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            CALCULATORS
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{title.toUpperCase()}</span>
        </div>

        <Link
          to={backUrl}
          className="inline-flex items-center gap-1.5 text-primary hover:text-foreground text-[12px] font-sans transition-colors shrink-0 group"
        >
          <span className="font-mono text-xs transition-transform group-hover:-translate-x-0.5">
            ←
          </span>
          <span>{backLabel}</span>
        </Link>
      </div>

      {/* Header with Left Plate Icon + Title */}
      <div className="flex items-start gap-4 sm:gap-5 pt-2">
        <CalculatorIcon toolId={toolId} size="lg" />

        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-[32px] leading-tight text-foreground sm:text-[38px] tracking-tight">
            {title}
          </h1>

          <div className="mt-1 flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
            <span>{category}</span>
            <span>·</span>
            <span>UPDATED {updatedDate}</span>
          </div>
        </div>
      </div>

      {/* Description Subtitle */}
      <p className="text-muted-foreground mt-3 max-w-[700px] text-[15px] leading-relaxed">
        {subtitle}
      </p>

      {/* Astrologer Reviewer Pill */}
      {reviewerName && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border/60 glass-card px-3.5 py-1.5 text-xs text-foreground/80 shadow-sm">
          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>
            Reviewed by{" "}
            <strong className="text-foreground font-medium">{reviewerName}</strong>
            <span className="text-muted-foreground/60 mx-1.5">·</span>
            <span className="font-mono text-[9.5px] text-primary tracking-wider uppercase font-medium">
              {reviewerTitle}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
