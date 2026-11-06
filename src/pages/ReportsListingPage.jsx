import { useEffect } from "react"
import { Link, useOutletContext } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { motion } from "framer-motion"
import { FileText, ArrowRight, Unlock, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchReportsCatalog, fetchMyReports } from "@/features/reports"

export default function ReportsListingPage() {
  const dispatch = useDispatch()
  const { catalog, categories, myReports } = useSelector((state) => state.reports || {})
  const { user } = useSelector((state) => state.auth || {})
  const { reportQuota } = useSelector((state) => state.jyotish || {})
  const context = useOutletContext() || {}
  const handleOpenAuth = context.onOpenBindModal || context.onOpenAuthModal

  useEffect(() => {
    dispatch(fetchReportsCatalog())
    if (user) {
      dispatch(fetchMyReports())
    }
  }, [dispatch, user])

  const realReportCredits =
    typeof user?.reportCredits === "number"
      ? user.reportCredits
      : typeof user?.report_credits === "number"
      ? user.report_credits
      : typeof reportQuota === "number"
      ? reportQuota
      : 0

  return (
    <div className="flex-1 flex flex-col justify-between min-h-screen bg-transparent text-foreground">
      <div className="w-full max-w-6xl mx-auto px-4 py-8 sm:py-12 space-y-10">
        {/* Page Breadcrumb & Header */}
        <div className="space-y-3">
          <div className="text-[11px] font-mono tracking-widest text-muted-foreground uppercase">
            JAPAIKA / REPORTS
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-normal text-foreground tracking-tight">
            Deep Vedic Reports
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground font-sans max-w-2xl leading-relaxed">
            Personalized, 10-page executive astrological readings synthesized from your complete birth chart.
          </p>
        </div>

        {/* Credit Quota Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border glass-card p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${realReportCredits > 0 ? "bg-emerald-500" : "bg-amber-500"}`} />
              <span className="text-sm sm:text-base font-semibold text-foreground">
                {realReportCredits === 0
                  ? "No report credits available"
                  : `${realReportCredits} report credit${realReportCredits > 1 ? "s" : ""} available`}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Each credit unlocks one full 10-page comprehensive report synthesized from your verified chart.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link to="/reports/career" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto text-xs font-mono tracking-wider border-border hover:bg-accent text-foreground cursor-pointer"
              >
                <span>View Sample</span>
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={() => {
                if (!user) {
                  if (handleOpenAuth) handleOpenAuth(true)
                } else if (context.onOpenBuyReportsModal) {
                  context.onOpenBuyReportsModal()
                }
              }}
              className="w-full sm:w-auto text-xs font-mono tracking-wider uppercase bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              <span>Get Credits</span>
            </Button>
          </div>
        </motion.div>

        {/* Reports Grouped by Categories */}
        <div className="space-y-12">
          {categories.map((category) => {
            const reports = catalog.filter((r) => r.category === category.id)
            if (reports.length === 0) return null

            return (
              <div key={category.id} className="space-y-5">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl sm:text-2xl font-serif font-medium text-foreground tracking-tight">
                    {category.name}
                  </h2>
                  <div className="flex-1 h-[1px] bg-border" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reports.map((report) => {
                    const isUnlocked = myReports.some(
                      (r) =>
                        (r.report_slug === report.slug || r.slug === report.slug) &&
                        r.status === "completed"
                    )

                    return (
                      <Link
                        key={report.slug}
                        to={`/reports/${report.slug}`}
                        className={`group rounded-2xl border p-5 transition-all duration-300 flex flex-col justify-between gap-4 shadow-sm relative overflow-hidden glass-card ${
                          isUnlocked
                            ? "border-emerald-500/40 hover:border-emerald-500"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {/* Badge if present or Unlocked status */}
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                          {isUnlocked ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 flex items-center gap-1">
                              <Unlock className="w-2.5 h-2.5" />
                              <span>Unlocked</span>
                            </span>
                          ) : (
                            report.badge && (
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase ${
                                  report.badge.toLowerCase().includes("popular")
                                    ? "bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-300"
                                    : "bg-primary/15 border border-primary/30 text-primary"
                                }`}
                              >
                                {report.badge}
                              </span>
                            )
                          )}
                        </div>

                        <div className="space-y-3 pr-16">
                          <div className="w-10 h-10 rounded-xl bg-accent border border-border flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-serif font-bold text-lg text-foreground group-hover:text-primary transition-colors leading-snug">
                              {report.title}
                            </h3>
                            <p className="text-xs font-mono text-muted-foreground tracking-wider mt-0.5">
                              {report.tagline || "Vedic Astrological Report"}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground font-sans line-clamp-3 leading-relaxed">
                            {report.description}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-border flex items-center justify-between text-xs font-mono">
                          <span className="text-muted-foreground">
                            {report.pages || 10} PAGES · PDF
                          </span>
                          <span className="text-primary font-semibold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                            <span>{isUnlocked ? "Read Report" : "Explore"}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
