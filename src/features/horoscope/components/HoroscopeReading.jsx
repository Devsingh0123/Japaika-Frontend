import React from "react"
import {
  Briefcase,
  Heart,
  Activity,
  Coins,
  Sparkles,
  Compass,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"

export default function HoroscopeReading({ forecast, timeframe = "daily" }) {
  if (!forecast) return null

  const { headline, summary, scores, categories, keyTransits } = forecast

  const scoreItems = scores
    ? [
        { label: "Overall Potency", score: scores.overall, color: "text-amber-500" },
        { label: "Career & Ambition", score: scores.career, color: "text-amber-500" },
        { label: "Love & Harmony", score: scores.love, color: "text-pink-500" },
        { label: "Wealth & Fortune", score: scores.wealth, color: "text-emerald-500" },
        { label: "Vitality & Health", score: scores.health, color: "text-cyan-500" },
      ].filter((item) => item.score !== undefined && item.score !== null)
    : []

  return (
    <section className="space-y-8">
      {/* Author Credential Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-sm font-bold text-primary font-serif">
          ✦
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Japaika Vedic Astronomy Engine
          </h3>
          <p className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase">
            NIRAYANA LAHIRI AYANAMSHA
          </p>
        </div>
      </div>

      {/* Main Headline & Summary Card */}
      <div className="rounded-3xl border border-border/80 bg-card/90 dark:bg-card/80 p-6 sm:p-8 space-y-4 shadow-xl glass-card backdrop-blur-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-mono tracking-wider uppercase">
          <Compass className="w-3.5 h-3.5 text-amber-500" />
          <span>{timeframe} Vedic Forecast</span>
        </div>

        {headline && (
          <h2 className="text-2xl sm:text-3xl font-serif text-foreground tracking-tight leading-snug">
            {headline}
          </h2>
        )}

        {summary && (
          <p className="text-sm sm:text-base text-muted-foreground font-sans leading-relaxed">
            {summary}
          </p>
        )}
      </div>

      {/* Astrological Potency Scores Grid */}
      {scoreItems.length > 0 && (
        <div className="rounded-2xl border border-border/80 bg-card/75 p-6 space-y-5 shadow-sm glass-card">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Cosmic Potency Index</span>
            </h3>
            {scores?.overall !== undefined && (
              <span className="text-[11px] font-mono text-emerald-500 font-semibold">
                {scores.overall}% Alignment
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {scoreItems.map((item) => (
              <div
                key={item.label}
                className="p-3.5 rounded-xl border border-border/60 bg-accent/30 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">{item.label}</span>
                  <span className={`font-mono font-bold ${item.color}`}>
                    {item.score}%
                  </span>
                </div>
                <Progress value={Math.min(item.score, 100)} className="h-1.5 bg-accent" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4 Life Pillars: Career, Love, Wealth, Health */}
      {categories && (
        <div className="space-y-4">
          <h3 className="text-lg font-serif font-medium text-foreground tracking-tight">
            Life Spheres & Karmic Influences
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. CAREER */}
            {categories.career && (
              <div className="rounded-2xl border border-border/80 bg-card/80 hover:bg-card hover:border-amber-500/40 p-5 space-y-2.5 transition-all shadow-sm glass-card">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-amber-500" />
                  <span className="text-[11px] font-mono font-bold tracking-widest text-amber-500 uppercase">
                    CAREER & DHARMA
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-sans">
                  {categories.career}
                </p>
              </div>
            )}

            {/* 2. LOVE */}
            {categories.love && (
              <div className="rounded-2xl border border-border/80 bg-card/80 hover:bg-card hover:border-pink-500/40 p-5 space-y-2.5 transition-all shadow-sm glass-card">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-500" />
                  <span className="text-[11px] font-mono font-bold tracking-widest text-pink-500 uppercase">
                    LOVE & PARTNERSHIPS
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-sans">
                  {categories.love}
                </p>
              </div>
            )}

            {/* 3. WEALTH */}
            {categories.wealth && (
              <div className="rounded-2xl border border-border/80 bg-card/80 hover:bg-card hover:border-emerald-500/40 p-5 space-y-2.5 transition-all shadow-sm glass-card">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-500" />
                  <span className="text-[11px] font-mono font-bold tracking-widest text-emerald-500 uppercase">
                    WEALTH & FINANCES
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-sans">
                  {categories.wealth}
                </p>
              </div>
            )}

            {/* 4. HEALTH */}
            {categories.health && (
              <div className="rounded-2xl border border-border/80 bg-card/80 hover:bg-card hover:border-cyan-500/40 p-5 space-y-2.5 transition-all shadow-sm glass-card">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-500" />
                  <span className="text-[11px] font-mono font-bold tracking-widest text-cyan-500 uppercase">
                    VITALITY & WELL-BEING
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-sans">
                  {categories.health}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Key Gochara Transits Section */}
      {Array.isArray(keyTransits) && keyTransits.length > 0 && (
        <div className="rounded-2xl border border-border/80 bg-card/80 p-6 space-y-4 shadow-sm glass-card">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <h3 className="text-xs font-mono font-bold tracking-widest text-primary uppercase flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Key Planetary Transits (Gochara)</span>
            </h3>
            <span className="text-[10.5px] font-mono text-muted-foreground">
              Calculated from Natal Moon
            </span>
          </div>

          <div className="space-y-2.5">
            {keyTransits.map((transit, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-border/60 bg-accent/30 flex items-start gap-3 hover:border-primary/40 transition-colors"
              >
                <span className="w-5 h-5 rounded-full bg-primary/15 text-primary border border-primary/25 font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  {idx + 1}
                </span>
                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans">
                  {transit}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
