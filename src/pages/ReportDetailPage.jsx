import { useState, useEffect, useRef } from "react"
import { useParams, Link, useNavigate, useOutletContext } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Sparkles,
  Lock,
  Unlock,
  Check,
  X,
  MessageSquare,
  Star,
  Clock,
  Compass,
  Printer,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"
import { trackEvent } from "@/lib/analytics"
import { Button } from "@/components/ui/button"
import ReportPacksModal from "@/features/reports/components/ReportPacksModal"
import { REPORTS_CATALOG } from "@/features/reports/reportsData"
import {
  checkReportSlugStatus,
  unlockReport,
  fetchReportStatus,
  fetchReportById,
  clearActiveReport,
} from "@/features/reports/reportsSlice"
import { openAuthModal, updateUserProfile } from "@/features/auth"

export default function ReportDetailPage() {
  const { slug } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const context = useOutletContext() || {}

  const { catalog, activeSlugStatus, activeFullReport, generationState, unlocking } = useSelector(
    (state) => state.reports || {}
  )
  const { user, isAuthenticated, birthDetails } = useSelector((state) => state.auth || {})
  const { reportQuota } = useSelector((state) => state.jyotish || {})

  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false)
  const pollingRef = useRef(null)

  const realReportCredits =
    typeof user?.reportCredits === "number"
      ? user.reportCredits
      : typeof user?.report_credits === "number"
      ? user.report_credits
      : typeof reportQuota === "number"
      ? reportQuota
      : 0

  const report =
    catalog?.find((r) => r.slug === slug) ||
    REPORTS_CATALOG.find((r) => r.slug === slug) ||
    REPORTS_CATALOG[0]

  // 1. On mount / slug change, check if current user already unlocked this report
  useEffect(() => {
    if (slug) {
      if (isAuthenticated) {
        dispatch(checkReportSlugStatus(slug))
      }
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      dispatch(clearActiveReport())
    }
  }, [slug, isAuthenticated, dispatch])

  // 2. Active generation polling effect
  useEffect(() => {
    const reportId = generationState.reportId || activeSlugStatus?.reportId
    const status = generationState.status || activeSlugStatus?.status

    if (reportId && status === "generating") {
      if (pollingRef.current) clearInterval(pollingRef.current)

      pollingRef.current = setInterval(async () => {
        const actionResult = await dispatch(fetchReportStatus(reportId))
        const latestData = actionResult.payload

        if (latestData?.status === "completed") {
          clearInterval(pollingRef.current)
          pollingRef.current = null
          toast.success("Your report reading is ready!")
          dispatch(fetchReportById(reportId))
        } else if (latestData?.status === "failed") {
          clearInterval(pollingRef.current)
          pollingRef.current = null
          toast.error(latestData?.error || "Report generation failed. Your credit has been refunded.")
        }
      }, 2500)
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [generationState.reportId, generationState.status, activeSlugStatus?.reportId, activeSlugStatus?.status, dispatch])

  // 3. If slug status returned unlocked report with ID, load full reading
  useEffect(() => {
    if (activeSlugStatus?.isUnlocked && activeSlugStatus?.reportId && !activeFullReport) {
      dispatch(fetchReportById(activeSlugStatus.reportId))
    }
  }, [activeSlugStatus, activeFullReport, dispatch])

  const handleUnlockClick = async () => {
    if (!isAuthenticated) {
      if (context.onOpenAuth) {
        context.onOpenAuth()
      } else {
        dispatch(openAuthModal())
      }
      return
    }

    if (realReportCredits <= 0) {
      setIsBuyModalOpen(true)
      return
    }

    try {
      const result = await dispatch(
        unlockReport({
          slug: report.slug,
          chartId: birthDetails?.chartId || null,
        })
      ).unwrap()

      if (result?.isAlreadyUnlocked && result?.status === "completed") {
        toast.info("This report was already unlocked. Opening reading...")
        dispatch(fetchReportById(result.reportId))
      } else {
        try {
          trackEvent("report_unlocked", {
            report_slug: report?.slug || slug,
            report_title: report?.title,
            category: report?.category,
          })
        } catch {
          // Analytics non-blocking
        }
        toast.success("1 report credit applied! Generating your deep reading...")
        if (typeof result?.creditsRemaining === "number") {
          dispatch(updateUserProfile({ reportCredits: result.creditsRemaining }))
        }
      }
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Could not unlock report.")
    }
  }

  const handleAskJyotish = (customPrompt) => {
    const prompt = customPrompt || report.jyotishPrompt || `Tell me about my ${report.title}`
    navigate(`/?engine=jyotish&q=${encodeURIComponent(prompt)}`)
  }

  const isUnlocked = Boolean(
    (activeSlugStatus?.isUnlocked && activeSlugStatus?.status === "completed") ||
    (activeFullReport && activeFullReport.status === "completed")
  )

  const isGenerating = Boolean(
    generationState.status === "generating" ||
    activeSlugStatus?.status === "generating"
  )

  const progressPercent = generationState.progressPercent || activeSlugStatus?.progressPercent || 15
  const currentStage =
    generationState.currentStage ||
    "Synthesizing foundational chapters and divisional analysis..."

  const rawSections = activeFullReport?.sections
  const sections = Array.isArray(rawSections)
    ? rawSections
    : typeof rawSections === "string"
    ? (() => {
        try {
          const parsed = JSON.parse(rawSections)
          return Array.isArray(parsed) ? parsed : []
        } catch {
          return []
        }
      })()
    : []

  const rawToc = activeFullReport?.table_of_contents
  const tableOfContents = Array.isArray(rawToc)
    ? rawToc
    : typeof rawToc === "string"
    ? (() => {
        try {
          const parsed = JSON.parse(rawToc)
          return Array.isArray(parsed) ? parsed : []
        } catch {
          return []
        }
      })()
    : []

  const rawSummary = activeFullReport?.summary
  const summary =
    rawSummary && typeof rawSummary === "object"
      ? rawSummary
      : typeof rawSummary === "string"
      ? (() => {
          try {
            return JSON.parse(rawSummary)
          } catch {
            return null
          }
        })()
      : null

  const rawAstro = activeFullReport?.astrological_factors
  const astroFactors =
    rawAstro && typeof rawAstro === "object"
      ? rawAstro
      : typeof rawAstro === "string"
      ? (() => {
          try {
            return JSON.parse(rawAstro)
          } catch {
            return null
          }
        })()
      : null

  const chartMeta = activeFullReport?.chart || {}
  const lagnaSign = astroFactors?.ascendantSign || chartMeta.ascendant_sign || "Aries"
  const rashiSign = astroFactors?.moonSign || chartMeta.moon_sign || "Taurus"
  const suryaSign = astroFactors?.sunSign || chartMeta.sun_sign || "Leo"

  return (
    <div className="w-full flex-1 flex flex-col text-foreground">
      <div className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-10">
        {/* Navigation Breadcrumb */}
        <Link
          to="/reports"
          className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors cursor-pointer print:hidden"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All reports</span>
        </Link>

        {/* ============================================================== */}
        {/* CASE 1: ACTIVE GENERATION PROGRESS SCREEN                     */}
        {/* ============================================================== */}
        {isGenerating && !isUnlocked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-amber-500/30 bg-card/85 glass-card p-8 sm:p-12 text-center space-y-8 shadow-xl"
          >
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-300 text-xs font-mono">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>AI Vedic Synthesis in Progress</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-foreground tracking-tight">
                Preparing Your {report.title}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                Our engine is analyzing your D-1, D-9, and D-10 charts against classical Parashari sutras.
              </p>
            </div>

            {/* Circular Progress & Percentage */}
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="currentColor"
                    strokeWidth="7"
                    fill="transparent"
                    className="text-border"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="#f59e0b"
                    strokeWidth="7"
                    fill="transparent"
                    strokeDasharray={264}
                    strokeDashoffset={264 - (264 * progressPercent) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-serif font-bold text-foreground">{progressPercent}%</span>
                  <span className="text-[10px] font-mono text-amber-600 dark:text-amber-300 font-semibold uppercase tracking-widest">Done</span>
                </div>
              </div>

              {/* Stage Message */}
              <div className="pt-2">
                <p className="text-xs sm:text-sm font-mono text-foreground/90 animate-pulse">
                  {currentStage}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Estimated duration: ~15 seconds · You may stay on this page or return later.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ============================================================== */}
        {/* CASE 2: UNLOCKED FULL REPORT READER                            */}
        {/* ============================================================== */}
        {isUnlocked && activeFullReport && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            {/* Header with Title & Action toolbar */}
            <div className="space-y-4 border-b border-border pb-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-medium">
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Personalized Reading · Unlocked</span>
                </div>

                <div className="flex items-center gap-2 print:hidden">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      try {
                        trackEvent("report_pdf_downloaded", {
                          report_slug: report?.slug || slug,
                          report_title: report?.title,
                          action_type: "print_pdf",
                        })
                      } catch {
                        // Analytics non-blocking
                      }
                      window.print()
                    }}
                    className="h-8 px-3 rounded-lg border border-border bg-card hover:bg-accent text-xs text-foreground flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / Save PDF</span>
                  </Button>
                </div>
              </div>

              <h1 className="text-3xl sm:text-5xl font-serif font-medium text-foreground tracking-tight">
                {activeFullReport.title || report.title}
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground font-sans leading-relaxed">
                {activeFullReport.subtitle || report.subtitle}
              </p>

              {/* Astrological Factors Bar */}
              <div className="pt-2 flex flex-wrap items-center gap-2 sm:gap-3 font-mono text-xs text-muted-foreground">
                <span className="text-muted-foreground uppercase tracking-widest text-[10px]">Chart Core:</span>
                <span className="px-2.5 py-1 rounded-full bg-accent/70 border border-border text-foreground font-medium">
                  Lagna: <strong>{lagnaSign}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-full bg-accent/70 border border-border text-foreground font-medium">
                  Moon: <strong>{rashiSign}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-full bg-accent/70 border border-border text-foreground font-medium">
                  Sun: <strong>{suryaSign}</strong>
                </span>
                {chartMeta.nakshatra && (
                  <span className="px-2.5 py-1 rounded-full bg-accent/70 border border-border text-foreground font-medium">
                    Nakshatra: <strong>{chartMeta.nakshatra}</strong>
                  </span>
                )}
                {Array.isArray(astroFactors?.yogas) && astroFactors.yogas.length > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-medium">
                    {astroFactors.yogas.length} Key Yogas Active
                  </span>
                )}
              </div>
            </div>

            {/* Executive Astrological Summary Box */}
            {summary && (
              <div className="rounded-3xl border border-amber-500/30 bg-card/85 glass-card p-6 sm:p-8 space-y-6 shadow-lg print:break-inside-avoid print:shadow-none print:bg-white print:border-gray-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-foreground">
                      Executive Astrological Summary
                    </h3>
                    {summary.activeDasha && (
                      <span className="font-mono text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold">
                        Active Dasha: {summary.activeDasha}
                      </span>
                    )}
                  </div>
                </div>

                {summary.leadObservation && (
                  <p className="text-sm sm:text-base text-foreground/90 font-serif italic leading-relaxed border-l-2 border-amber-500 pl-4 py-0.5">
                    "{summary.leadObservation}"
                  </p>
                )}

                {/* Key Highlights */}
                {Array.isArray(summary.keyHighlights) && summary.keyHighlights.length > 0 && (
                  <div className="space-y-2.5 pt-2">
                    <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground block font-medium">
                      Core Revelations:
                    </span>
                    <ul className="space-y-2 text-xs sm:text-sm text-foreground/85">
                      {summary.keyHighlights.map((hl, hIdx) => (
                        <li key={hIdx} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span>{hl}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Primary Remedy Box */}
                {summary.primaryRemedy && (
                  <div className="rounded-2xl border border-border bg-accent/40 p-4 text-xs sm:text-sm text-foreground/90 flex items-start gap-3">
                    <Compass className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-600 dark:text-amber-400 block mb-0.5 font-semibold">Primary Karmic Remedy:</strong>
                      <span>{summary.primaryRemedy}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Table of Contents */}
            {tableOfContents.length > 0 && (
              <div className="rounded-2xl border border-border bg-card/80 glass-card p-6 space-y-3 print:shadow-none print:bg-white print:border-gray-200 print:break-after-page">
                <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground font-medium">
                  Reading Chapters
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                  {tableOfContents.map((toc, tIdx) => (
                    <a
                      key={tIdx}
                      href={`#chapter-${toc.chapterNumber}`}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent text-foreground/80 hover:text-foreground transition-colors"
                    >
                      <span className="font-mono text-amber-600 dark:text-amber-400 font-bold text-xs">
                        {String(toc.chapterNumber).padStart(2, "0")}
                      </span>
                      <span className="truncate">{toc.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Chapters / Sections */}
            {sections.length > 0 && (
              <div className="space-y-12 print:space-y-8">
                {sections.map((section, sIdx) => (
                  <section
                    key={sIdx}
                    id={`chapter-${section.chapterNumber}`}
                    className="rounded-3xl border border-border bg-card/85 glass-card p-6 sm:p-10 space-y-6 scroll-mt-20 shadow-sm print:break-before-page print:break-inside-auto print:shadow-none print:bg-white print:border-gray-200 print:p-6"
                  >
                    {/* Chapter Title & Astrometric Header */}
                    <div className="space-y-2 border-b border-border pb-4 print:break-after-avoid">
                      <div className="flex items-center justify-between text-xs font-mono text-amber-600 dark:text-amber-400 font-semibold">
                        <span>CHAPTER {String(section.chapterNumber).padStart(2, "0")}</span>
                        {section.timingDates && (
                          <span className="text-muted-foreground flex items-center gap-1 font-normal">
                            <Clock className="w-3 h-3" />
                            <span>{section.timingDates}</span>
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground">
                        {section.title}
                      </h2>
                      {section.astrometricSummary && (
                        <p className="text-xs font-mono text-primary font-medium">
                          {section.astrometricSummary}
                        </p>
                      )}
                    </div>

                    {/* Synthesized Paragraphs */}
                    {Array.isArray(section.paragraphs) && (
                      <div className="space-y-4 text-sm sm:text-base text-foreground/90 font-sans leading-relaxed">
                        {section.paragraphs.map((p, pIdx) => (
                          <p key={pIdx}>{p}</p>
                        ))}
                      </div>
                    )}

                    {/* Practical Remedies */}
                    {Array.isArray(section.practicalRemedies) && section.practicalRemedies.length > 0 && (
                      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/15 p-5 space-y-2 print:break-inside-avoid print:bg-amber-500/10 print:border-amber-300">
                        <span className="text-xs font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold block">
                          Recommended Actions & Upayas:
                        </span>
                        <ul className="space-y-1.5 text-xs sm:text-sm text-foreground/90">
                          {section.practicalRemedies.map((rem, rIdx) => (
                            <li key={rIdx} className="flex items-start gap-2">
                              <span className="text-amber-500 font-bold">•</span>
                              <span>{rem}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Reflection Question */}
                    {section.reflectionQuestion && (
                      <div className="rounded-2xl border border-border bg-accent/30 p-5 border-l-4 border-l-primary print:break-inside-avoid print:bg-gray-50 print:border-gray-200">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">
                          Introspective Contemplation:
                        </span>
                        <p className="text-xs sm:text-sm text-foreground/90 font-serif italic">
                          "{section.reflectionQuestion}"
                        </p>
                      </div>
                    )}

                    {/* Interactive "Ask Jyotish about this Chapter" CTA */}
                    <div className="pt-2 flex justify-end print:hidden">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleAskJyotish(
                            `Regarding chapter "${section.title}" in my ${report.title} report: ${section.astrometricSummary || ""}`
                          )
                        }
                        className="text-xs font-mono text-primary hover:text-primary hover:bg-primary/10 flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                        <span>Query Jyotish on this chapter →</span>
                      </Button>
                    </div>
                  </section>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ============================================================== */}
        {/* CASE 3: TEASER / PREVIEW SCREEN (LOCKED)                       */}
        {/* ============================================================== */}
        {!isUnlocked && !isGenerating && (
          <div className="space-y-12">
            {/* Hero Section */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-mono font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Premium Vedic Reading · {report.categoryName}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-serif font-medium text-foreground tracking-tight">
                {report.title}
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground font-sans leading-relaxed max-w-2xl">
                {report.description}
              </p>

              {/* Action CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Button
                  type="button"
                  disabled={unlocking}
                  onClick={handleUnlockClick}
                  className="h-11 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-xs tracking-wider uppercase transition-all shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-2"
                >
                  {unlocking ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Unlocking...</span>
                    </>
                  ) : realReportCredits >= 1 ? (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span>Unlock with 1 Credit ({realReportCredits} left)</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Get Report Pack to Unlock</span>
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAskJyotish()}
                  className="h-11 px-5 rounded-xl border border-border bg-card hover:bg-accent text-foreground font-medium text-xs tracking-wider uppercase transition-all cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                  <span>Ask Jyotish first</span>
                </Button>
              </div>

              <p className="text-xs font-mono text-muted-foreground">
                {realReportCredits >= 1
                  ? "You have available report credits ready to spend."
                  : "Unlock with any dynamic report pack · instant AI synthesis."}
              </p>

              {/* 4 Proof Metric Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                <div className="p-4 rounded-xl border border-border bg-card/85 glass-card text-center space-y-1 shadow-xs">
                  <div className="text-xl sm:text-2xl font-serif font-bold text-amber-600 dark:text-amber-400">
                    1L+
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground uppercase">
                    reports read
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card/85 glass-card text-center space-y-1 shadow-xs">
                  <div className="text-xl sm:text-2xl font-serif font-bold text-foreground flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>4.8</span>
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground uppercase">
                    avg rating
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card/85 glass-card text-center space-y-1 shadow-xs">
                  <div className="text-xl sm:text-2xl font-serif font-bold text-foreground flex items-center justify-center gap-1">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    <span>Minutes</span>
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground uppercase">
                    to prepare
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card/85 glass-card text-center space-y-1 shadow-xs">
                  <div className="text-xl sm:text-2xl font-serif font-bold text-foreground flex items-center justify-center gap-1">
                    <Compass className="w-4 h-4 text-primary" />
                    <span>Your chart</span>
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground uppercase">
                    not a template
                  </div>
                </div>
              </div>
            </div>

            {/* Section 1: What's inside your reading */}
            <div className="space-y-6 pt-4 border-t border-border">
              <h2 className="text-2xl sm:text-3xl font-serif font-medium text-foreground tracking-tight">
                What's inside your {report.title} reading
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl border border-border bg-card/85 glass-card space-y-2 shadow-xs">
                  <div className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">01</div>
                  <h3 className="text-base font-semibold text-foreground">Astrological depth</h3>
                  <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                    Planetary positions, strengths and transits calculated across your D1, D9 (Navamsa) and D10 charts.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-border bg-card/85 glass-card space-y-2 shadow-xs">
                  <div className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">02</div>
                  <h3 className="text-base font-semibold text-foreground">Life themes</h3>
                  <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                    What your chart reveals about this domain, explained in clear conversational language with zero fear-mongering.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-border bg-card/85 glass-card space-y-2 shadow-xs">
                  <div className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">03</div>
                  <h3 className="text-base font-semibold text-foreground">Practical remedies</h3>
                  <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                    Specific, doable behavioral and planetary steps with precise timing windows to act on them.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Why this beats a generic report */}
            <div className="space-y-6 pt-4 border-t border-border">
              <h2 className="text-2xl sm:text-3xl font-serif font-medium text-foreground tracking-tight">
                Why this beats a generic report
              </h2>

              <div className="rounded-2xl border border-border bg-card/85 glass-card overflow-hidden text-xs sm:text-sm font-sans shadow-xs">
                <div className="grid grid-cols-2 p-4 bg-accent/60 border-b border-border font-mono uppercase tracking-wider text-muted-foreground text-[11px]">
                  <div>Other reports</div>
                  <div className="text-amber-600 dark:text-amber-400 font-bold">Japaika</div>
                </div>

                <div className="divide-y divide-border/60">
                  <div className="grid grid-cols-2 p-4 items-center">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-medium">
                      <X className="w-4 h-4 shrink-0" />
                      <span>Generic, one-size predictions</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>Read from your D1, D9 and D10</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 p-4 items-center">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-medium">
                      <X className="w-4 h-4 shrink-0" />
                      <span>Future only predictions</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>Past, present and future windows</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 p-4 items-center">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-medium">
                      <X className="w-4 h-4 shrink-0" />
                      <span>Static 40-page dead PDF</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>Interactive living report you can query</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 p-4 items-center">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-medium">
                      <X className="w-4 h-4 shrink-0" />
                      <span>Expensive ritual traps</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>Objective cancellation rules & remedies</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Sample Excerpt Preview */}
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-serif font-medium text-foreground tracking-tight">
                  Sample excerpt from this reading
                </h2>
                <span className="text-[11px] font-mono font-semibold text-amber-600 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full">
                  PREVIEW
                </span>
              </div>

              <div className="p-6 rounded-2xl border border-border bg-card/85 glass-card space-y-4 font-sans text-xs sm:text-sm text-foreground/90 leading-relaxed relative overflow-hidden shadow-xs">
                <p>
                  "Your 7th house cusp is energized by Jupiter's transit while Saturn maintains discipline over the partnership axis. Rather than precipitous romantic decisions, your chart favors alliances formed through shared intellectual values and structured collaboration."
                </p>
                <p>
                  "Between mid-2026 and late-2028, your active Antardasha marks the strongest convergence of relationship yogas in your chart. Key remedies include wearing silver on Mondays and harmonizing lunar vibrations through quiet breathwork."
                </p>

                <div className="pt-2 flex items-center justify-between border-t border-border text-xs text-muted-foreground">
                  <span>Primary focus: {report.dashaFocus}</span>
                  <button
                    type="button"
                    onClick={handleUnlockClick}
                    className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 underline font-medium cursor-pointer"
                  >
                    Unlock full 10-page report →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Report Packs Purchase Modal (2-Step Flow) */}
      <ReportPacksModal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        onOpenAuth={context.onOpenAuth || context.onOpenBindModal}
        currency={user?.currency || "INR"}
        onSelectPackage={() => {
          setIsBuyModalOpen(false)
          // User now has credits, can immediately trigger unlock
          handleUnlockClick()
        }}
      />

    </div>
  )
}
