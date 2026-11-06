import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  FileText,
  ArrowRight,
  Printer,
  Loader2,
  BookOpen,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ReportPacksModal from "@/features/reports/components/ReportPacksModal";
import { fetchMyReports } from "@/features/reports/reportsSlice";

export default function MyReportsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);

  const { user, isAuthenticated } = useSelector((state) => state.auth || {});
  const { reportQuota } = useSelector((state) => state.jyotish || {});
  const { myReports = [], loading } = useSelector((state) => state.reports || {});

  const realReportCredits =
    typeof user?.reportCredits === "number"
      ? user.reportCredits
      : typeof user?.report_credits === "number"
      ? user.report_credits
      : typeof reportQuota === "number"
      ? reportQuota
      : 0;

  // Fetch unlocked reports on mount
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchMyReports());
    }
  }, [dispatch, isAuthenticated]);

  // Auto-poll if any report is still generating
  useEffect(() => {
    const hasGenerating = myReports.some((r) => r.status === "generating");
    if (!hasGenerating) return;

    const timer = setInterval(() => {
      dispatch(fetchMyReports());
    }, 3500);

    return () => clearInterval(timer);
  }, [myReports, dispatch]);

  const formatDate = (isoStr) => {
    if (!isoStr) return "Recently Unlocked";
    try {
      return new Date(isoStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Recently Unlocked";
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0914] text-foreground flex flex-col justify-between">
      <Helmet>
        <title>My Unlocked Reports | Japaika</title>
        <meta
          name="description"
          content="Access and download your permanent library of personalized 10-page executive Vedic astrology reports."
        />
      </Helmet>

      <div className="w-full max-w-6xl mx-auto px-4 py-8 sm:py-12 space-y-8 flex-1">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-white/10">
          <div className="space-y-2">
            <div className="text-[11px] font-mono tracking-widest text-mlh-muted uppercase flex items-center gap-2">
              <span>JAPAIKA / USER</span>
              <span className="text-white/20">·</span>
              <span className="text-mlh-plum-300">LIBRARY</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif text-white tracking-tight">
              My Unlocked Reports
            </h1>
            <p className="text-xs sm:text-sm text-mlh-muted max-w-xl leading-relaxed">
              Your permanent library of personalized, 10-page executive astrological readings synthesized from your birth chart.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <Button
              onClick={() => navigate("/reports")}
              variant="outline"
              size="sm"
              className="border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-mono rounded-xl cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 mr-1.5" />
              <span>Browse Catalog</span>
            </Button>

            <Button
              onClick={() => setIsBuyModalOpen(true)}
              size="sm"
              className="bg-mlh-plum hover:bg-mlh-plum-400 text-white text-xs font-mono rounded-xl cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buy Report Credits ({realReportCredits})</span>
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && myReports.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="w-7 h-7 text-mlh-plum-400 animate-spin" />
            <p className="text-xs font-mono text-mlh-muted">
              Loading your unlocked reports library...
            </p>
          </div>
        ) : myReports.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#1b1220]/80 via-[#15121e]/80 to-[#0e0c14]/80 p-8 sm:p-12 text-center space-y-5 shadow-xl max-w-2xl mx-auto my-8"
          >
            <div className="w-16 h-16 rounded-2xl bg-mlh-plum-500/10 border border-mlh-plum-500/20 flex items-center justify-center text-mlh-plum-400 mx-auto">
              <FileText className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-serif text-white">
                Your Report Library is Empty
              </h3>
              <p className="text-xs text-mlh-muted max-w-md mx-auto leading-relaxed">
                You haven't unlocked any deep Vedic reports yet. Each report is a personalized 10-page master blueprint covering career, marriage, wealth, or personal growth.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={() => navigate("/reports")}
                className="w-full sm:w-auto px-6 py-5 rounded-xl bg-mlh-plum hover:bg-mlh-plum-400 text-white text-xs font-semibold cursor-pointer shadow-lg flex items-center gap-2"
              >
                <span>Browse 8 Reports Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        ) : (
          /* Reports Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myReports.map((report) => {
              const isCompleted = report.status === "completed";
              const isGenerating = report.status === "generating";
              const slug = report.report_slug || report.slug || "career";
              const progress = report.progress_percent || report.progressPercent || 50;

              return (
                <motion.div
                  key={report.id || slug}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl border border-white/10 bg-[#16121f]/90 backdrop-blur-xl p-5 sm:p-6 flex flex-col justify-between space-y-4 hover:border-mlh-plum-400/30 transition-all shadow-xl group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono uppercase tracking-wider rounded-full px-2.5 py-0.5 ${
                          isCompleted
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                            : isGenerating
                            ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                            : "border-rose-500/40 bg-rose-500/10 text-rose-300"
                        }`}
                      >
                        {isCompleted
                          ? "Ready to Read"
                          : isGenerating
                          ? "Generating..."
                          : "Processing"}
                      </Badge>

                      <span className="text-[11px] font-mono text-mlh-muted">
                        {formatDate(report.created_at)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-white group-hover:text-amber-200 transition-colors">
                        {report.title}
                      </h3>
                      <p className="text-xs text-mlh-muted line-clamp-2 leading-relaxed">
                        {report.subtitle || "Comprehensive Vedic astrological reading synthesized from your birth chart."}
                      </p>
                    </div>

                    {/* Progress Bar for Generating State */}
                    {isGenerating && (
                      <div className="space-y-1.5 pt-2">
                        <div className="flex items-center justify-between text-[10px] font-mono text-amber-300">
                          <span>Synthesizing chapters...</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5 bg-white/10" />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    {isCompleted ? (
                      <>
                        <Link
                          to={`/reports/${slug}`}
                          className="flex-1 py-2 px-3 rounded-xl bg-mlh-plum hover:bg-mlh-plum-400 text-white text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1.5"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Read Full Report</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => window.open(`/reports/${slug}`, "_blank")}
                          title="Print or export PDF"
                          className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <div className="w-full py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-amber-300 text-xs font-mono text-center flex items-center justify-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>AI Synthesizing reading</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Report Packs Modal for Purchasing Credits */}
      <ReportPacksModal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
      />

    </div>
  );
}
