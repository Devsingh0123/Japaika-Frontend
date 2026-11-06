import { useMemo } from "react"
import { Helmet } from "react-helmet-async"
import { Link, useOutletContext } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { Search, Sparkles, Moon, ArrowRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  setTimeframe,
  setSearchQuery,
  ElementGroupSection,
} from "@/features/horoscope"

const TIMEFRAMES = [
  { id: "Daily", label: "Daily" },
  { id: "Monthly", label: "Monthly" },
  { id: "Yearly", label: "Yearly" },
]

export default function HoroscopesListingPage() {
  const dispatch = useDispatch()
  const { elementGrouping, elementGroups: legacyGroups, timeframe, searchQuery, signs } = useSelector(
    (state) => state.horoscope || {}
  )
  const elementGroups = elementGrouping || legacyGroups
  const context = useOutletContext() || {}
  const handleOpenAuth = context.onOpenBindModal || context.onOpenAuthModal

  // Enrich groups with sign objects from signs dictionary
  const enrichedGroups = useMemo(() => {
    if (!elementGroups) return []
    return elementGroups.map((grp) => {
      const list = grp.signsList || (grp.signs || []).map((id) => signs?.[id] || { id, slug: id, latin: id, name: id })
      return {
        ...grp,
        signsList: list,
      }
    })
  }, [elementGroups, signs])

  // Filter signs based on search query
  const filteredGroups = useMemo(() => {
    if (!enrichedGroups) return []
    const q = (searchQuery || "").trim().toLowerCase()
    if (!q) return enrichedGroups

    return enrichedGroups
      .map((group) => {
        const matchingSigns = (group.signsList || []).filter((sign) => {
          const latin = (sign.latin || sign.name || "").toLowerCase()
          const vedic = (sign.vedic || sign.sanskrit || "").toLowerCase()
          return latin.includes(q) || vedic.includes(q)
        })
        return {
          ...group,
          signsList: matchingSigns,
        }
      })
      .filter((group) => group.signsList.length > 0)
  }, [searchQuery, enrichedGroups])

  return (
    <div className="min-h-full flex flex-col bg-transparent text-foreground">
      <Helmet>
        <title>Vedic Horoscopes by Moon Sign (Rashi) | Japaika</title>
        <meta
          name="description"
          content="Explore daily, monthly and yearly Vedic horoscopes computed through authentic Nirayana astronomy and live Gochara planetary transits across all 12 Rashis."
        />
      </Helmet>

      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 space-y-10">
        {/* Top Breadcrumb */}
        <nav className="flex items-center gap-2 text-[11px] font-mono tracking-widest text-muted-foreground uppercase">
          <Link to="/" className="hover:text-foreground transition-colors">
            Japaika
          </Link>
          <span className="text-border">/</span>
          <span className="text-primary font-semibold">Horoscopes</span>
        </nav>

        {/* Page Hero Header */}
        <div className="space-y-3">
          <h1 className="font-serif font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight text-foreground">
            Horoscopes
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground font-sans max-w-2xl leading-relaxed">
            Daily, monthly and yearly readings by Rashi, the Moon&apos;s placement at birth, computed through
            authentic Vedic astronomy and live Gochara planetary transits.
          </p>
        </div>

        {/* Controls Bar: Timeframe Pills & Live Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
          {/* Segmented Timeframe Switcher */}
          <div className="inline-flex items-center rounded-xl border border-border bg-card/80 p-1 shadow-xs">
            {TIMEFRAMES.map((tf) => {
              const isActive = (timeframe || "daily").toLowerCase() === tf.id.toLowerCase()
              const tab = tf.label
              return (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => dispatch(setTimeframe(tf.id))}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              )
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search a sign or Rashi..."
              value={searchQuery}
              onChange={(e) => dispatch(setSearchQuery(e.target.value))}
              className="pl-9 h-10 bg-card border-border text-xs text-foreground placeholder:text-muted-foreground rounded-xl focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>

        {/* Vedic Rashi Explanation Banner with Glass Card */}
        <div className="rounded-2xl border border-border glass-card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent border border-border flex items-center justify-center shrink-0 text-primary">
              <Moon className="w-4 h-4" />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Japaika reads by your Rashi</span>, where the
              Moon sat at your birth.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleOpenAuth && handleOpenAuth(true)}
            className="text-xs text-primary hover:text-foreground hover:bg-accent font-semibold px-3 py-2 rounded-lg transition-colors inline-flex items-center gap-1.5 shrink-0 self-end sm:self-center cursor-pointer"
          >
            <span>Find my Rashi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* 4 Element Groups with Rashi Cards */}
        <div className="space-y-12 pt-2">
          {filteredGroups.map((group) => (
            <ElementGroupSection
              key={group.element || group.name}
              group={group}
              timeframe={timeframe}
            />
          ))}

          {filteredGroups.length === 0 && (
            <div className="text-center py-16 text-muted-foreground space-y-3">
              <Sparkles className="w-8 h-8 text-primary/50 mx-auto" />
              <p className="text-sm">No zodiac signs matched your query &ldquo;{searchQuery}&rdquo;.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => dispatch(setSearchQuery(""))}
                className="text-xs border-border cursor-pointer"
              >
                Clear filter
              </Button>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
