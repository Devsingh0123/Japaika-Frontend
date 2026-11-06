import { useState, useEffect } from "react"
import { Link, useOutletContext } from "react-router-dom"
import { useSelector } from "react-redux"
import { Helmet } from "react-helmet-async"
import {
  FileText,
  Printer,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Receipt,
  X,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { fetchUserInvoices } from "@/features/billing"
import { formatCurrency, normalizeCurrency } from "@/lib/utils"

export default function InvoicesPage() {
  const context = useOutletContext() || {}
  const onOpenBuyModal = context.onOpenBuyModal || (() => {})

  const { user } = useSelector((state) => state.auth || {})
  const { questionQuota, reportQuota } = useSelector((state) => state.jyotish || {})

  const realQuestionsCount =
    typeof questionQuota === "number"
      ? questionQuota
      : typeof user?.creditBalance === "number"
      ? user.creditBalance
      : typeof user?.credit_balance === "number"
      ? user.credit_balance
      : 0

  const realReportsCount =
    typeof reportQuota === "number"
      ? reportQuota
      : typeof user?.reportCredits === "number"
      ? user.reportCredits
      : typeof user?.report_credits === "number"
      ? user.report_credits
      : 0

  const [invoices, setInvoices] = useState([])
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [filterType, setFilterType] = useState("all") // "all" | "questions" | "report"

  useEffect(() => {
    const loadInvoices = async () => {
      // 1. Initial load from localStorage for fast render
      try {
        const stored = localStorage.getItem("japaika_invoices")
        if (stored) {
          setInvoices(JSON.parse(stored))
        }
      } catch (e) {
        console.error("Failed to load local invoices:", e)
      }

      // 2. Fetch authenticated user invoices from backend
      if (user?.id) {
        try {
          const res = await fetchUserInvoices()
          const serverInvoices = res?.data || res?.invoices
          if (Array.isArray(serverInvoices) && serverInvoices.length > 0) {
            setInvoices(serverInvoices)
            localStorage.setItem("japaika_invoices", JSON.stringify(serverInvoices))
          }
        } catch {
          // Keep existing local invoices on error
        }
      }
    }

    loadInvoices()
    const handleStorageChange = () => {
      try {
        const stored = localStorage.getItem("japaika_invoices")
        if (stored) setInvoices(JSON.parse(stored))
      } catch (e) {
        console.error(e)
      }
    }
    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [user?.id])

  const filteredInvoices = invoices.filter((inv) => {
    if (filterType === "all") return true
    if (filterType === "questions") return inv.itemType === "questions"
    if (filterType === "report") return inv.itemType === "report_pack" || inv.itemType === "report"
    return true
  })

  const inrInvoices = invoices.filter((i) => normalizeCurrency(i.currency) === "INR")
  const usdInvoices = invoices.filter((i) => normalizeCurrency(i.currency) === "USD")
  const totalSpentINR = inrInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0)
  const totalSpentUSD = usdInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0)

  const handlePrintInvoice = () => {
    window.print()
  }

  const handleDownloadReceipt = (inv) => {
    setSelectedInvoice(inv)
    setTimeout(() => {
      window.print()
    }, 400)
  }

  const formatDate = (isoString) => {
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    } catch {
      return isoString || "Recent"
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#0d0a14] text-white font-sans">
      <Helmet>
        <title>Payments & Invoices | Japaika</title>
        <meta
          name="description"
          content="View and download all your past purchases and official GST tax invoices for question packs and astrology reports on Japaika."
        />
      </Helmet>

      {/* Main Container */}
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-white/50">
          <Link to="/" className="hover:text-white transition-colors">
            JAPAIKA
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-white/30" />
          <span className="text-amber-300/90 font-semibold">INVOICES</span>
        </div>

        {/* Page Header */}
        <div className="space-y-2 border-b border-white/10 pb-6">
          <h1 className="font-serif text-3xl sm:text-4xl text-white font-normal tracking-tight">
            Payments & invoices
          </h1>
          <p className="text-xs sm:text-sm text-white/60 leading-relaxed max-w-3xl font-sans">
            Every purchase on this account, newest first. Each one carries its own official tax invoice, issued by Astroverse Technologies Pvt Ltd.
          </p>
        </div>

        {/* Account Balances & Quick Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 font-sans">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-white/50">Total Purchases</span>
            <div className="mt-2 text-2xl font-mono font-bold text-white">{invoices.length}</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-white/50">Total Paid</span>
            <div className="mt-2 text-xl sm:text-2xl font-mono font-bold text-emerald-400 truncate">
              {totalSpentUSD > 0
                ? totalSpentINR > 0
                  ? `₹${totalSpentINR.toLocaleString("en-IN")} + $${totalSpentUSD.toFixed(2)}`
                  : `$${totalSpentUSD.toFixed(2)}`
                : `₹${totalSpentINR.toLocaleString("en-IN")}`}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-white/50">Jyotish Questions Left</span>
            <div className="mt-2 text-2xl font-mono font-bold text-amber-300">{realQuestionsCount}</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-white/50">Available Reports</span>
            <div className="mt-2 text-2xl font-mono font-bold text-mlh-plum-300">{realReportsCount}</div>
          </div>
        </div>

        {/* Filter Chips Bar */}
        {invoices.length > 0 && (
          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 text-xs font-mono">
              <button
                type="button"
                onClick={() => setFilterType("all")}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  filterType === "all" ? "bg-white/15 text-white font-semibold" : "text-white/60 hover:text-white"
                }`}
              >
                All Purchases ({invoices.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("questions")}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  filterType === "questions" ? "bg-white/15 text-white font-semibold" : "text-white/60 hover:text-white"
                }`}
              >
                Questions
              </button>
              <button
                type="button"
                onClick={() => setFilterType("report")}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  filterType === "report" ? "bg-white/15 text-white font-semibold" : "text-white/60 hover:text-white"
                }`}
              >
                Reports
              </button>
            </div>

            <div className="text-xs text-white/40 hidden sm:flex items-center gap-1.5 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>GST Compliant Invoices</span>
            </div>
          </div>
        )}

        {/* ================= EMPTY STATE ================= */}
        {filteredInvoices.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-[#14101e]/70 p-8 sm:p-14 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-300">
              <Receipt className="w-6 h-6 stroke-[1.5]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-serif text-xl sm:text-2xl font-normal text-white">
                No purchases yet
              </h3>
              <p className="text-xs sm:text-sm text-white/50 max-w-md mx-auto font-sans leading-relaxed">
                Question packs and report credits will be listed here the moment you buy one.
              </p>
            </div>

            <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
              <Button
                type="button"
                onClick={() => onOpenBuyModal()}
                className="bg-gradient-to-r from-[#9b1c5c] to-[#b32b6e] hover:from-[#a82064] hover:to-[#c23277] text-white px-6 py-2.5 rounded-xl font-medium text-xs shadow-md cursor-pointer"
              >
                Buy question packs
              </Button>
              <Link to="/reports">
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/15 text-white hover:bg-white/10 text-xs px-6 py-2.5 rounded-xl cursor-pointer"
                >
                  Browse reports
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* ================= INVOICE CARDS LIST ================= */
          <div className="space-y-4">
            {filteredInvoices.map((inv) => (
              <div
                key={inv.id}
                className="rounded-2xl border border-white/10 bg-[#161222]/80 hover:border-white/20 transition-all p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 group"
              >
                {/* Left Side: Order Identifiers & Item */}
                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-white bg-white/10 px-2.5 py-0.5 rounded-md border border-white/10">
                      {inv.id}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                      <span>{inv.status || "PAID"}</span>
                    </span>
                    <span className="text-xs font-mono text-white/40">·</span>
                    <span className="text-xs text-white/50 font-mono">{formatDate(inv.date)}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-300 shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-white group-hover:text-amber-200 transition-colors">
                        {inv.itemTitle || "Vedic Astrology Pack"}
                      </h4>
                      <div className="text-[11px] text-white/40 font-mono mt-0.5 flex flex-wrap items-center gap-2">
                        <span>Place of supply: {inv.billingState || "Delhi"}</span>
                        <span>·</span>
                        <span>Gateway: {inv.method || "Razorpay Standard"}</span>
                        {inv.paymentId && (
                          <>
                            <span>·</span>
                            <span className="text-white/60">{inv.paymentId}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Middle: Financials Breakdown */}
                <div className="md:text-right border-t md:border-t-0 md:border-l border-white/10 pt-3 md:pt-0 md:pl-6 space-y-0.5 shrink-0">
                  <div className="text-xl sm:text-2xl font-mono font-bold text-white tracking-tight">
                    {formatCurrency(inv.total, inv.currency)}
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400">
                    {inv.couponCode && inv.couponCode !== "NONE"
                      ? `${inv.couponCode} applied (−${formatCurrency(inv.discount || 0, inv.currency)})`
                      : "Standard Pricing"}
                  </div>
                  <div className="text-[10px] font-mono text-white/40">
                    {normalizeCurrency(inv.currency) === "USD"
                      ? "International (0% GST)"
                      : `Incl. 18% GST (${formatCurrency(inv.taxAmount || Math.round((Number(inv.total) * 18) / 118), "INR")})`}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex md:flex-col gap-2 shrink-0 pt-2 md:pt-0">
                  <Button
                    type="button"
                    onClick={() => setSelectedInvoice(inv)}
                    className="flex-1 md:flex-initial bg-white/10 hover:bg-white/20 text-white text-xs px-4 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-300" />
                    <span>View Tax Invoice</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDownloadReceipt(inv)}
                    className="flex-1 md:flex-initial border-white/10 text-white/70 hover:text-white hover:bg-white/5 text-xs px-4 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print PDF</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= OFFICIAL GST TAX INVOICE MODAL ================= */}
      {selectedInvoice && (
        <Dialog open={Boolean(selectedInvoice)} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
          <DialogContent
            showCloseButton={false}
            className="sm:max-w-[760px] w-[95vw] p-0 overflow-hidden bg-white text-black rounded-2xl shadow-2xl font-sans"
          >
            {/* Modal Actions Bar (Invisible on print) */}
            <div className="print:hidden bg-[#161220] px-6 py-3 border-b border-white/10 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-300" />
                <span className="text-xs font-mono font-medium">Official Tax Invoice · {selectedInvoice.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  type="button"
                  onClick={handlePrintInvoice}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg px-3 py-1 flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </Button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Tax Invoice Paper Layout */}
            <div className="p-6 sm:p-10 space-y-6 text-xs text-neutral-800 leading-relaxed max-h-[85vh] overflow-y-auto">
              {/* Top Row: Seller Header & Invoice Label */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-neutral-300 pb-6">
                <div className="flex items-start gap-3.5">
                  <img
                    src="/japaikaLogo.svg"
                    alt="Japaika"
                    className="w-12 h-12 object-contain shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold font-serif text-neutral-900 tracking-tight">
                        VELTEX SERVICES PRIVATE LIMITED
                      </h2>
                      <span className="text-[10px] font-mono bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded border border-neutral-300">
                        Japaika
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-600 mt-1 font-sans space-y-0.5">
                      <div>711, Plot A09, ITL Towers, Netaji Subhash Place, Pitampura</div>
                      <div>North West Delhi, Delhi 110034, India</div>
                      <div className="font-mono pt-1">
                        <span className="font-semibold text-neutral-800">GSTIN: </span>07AAGCK6574Q1ZO
                        <span className="mx-2 text-neutral-400">·</span>
                        <span className="font-semibold text-neutral-800">PAN: </span>AAGCK6574Q
                      </div>
                      <div className="font-mono">
                        <span className="font-semibold text-neutral-800">CIN: </span>U72900DL2017PTC319827
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sm:text-right bg-neutral-100 p-3 rounded-xl border border-neutral-200">
                  <span className="text-xs font-mono font-bold tracking-widest uppercase bg-neutral-900 text-white px-2 py-0.5 rounded">
                    TAX INVOICE
                  </span>
                  <div className="mt-2 font-mono text-[11px] text-neutral-700 space-y-0.5">
                    <div>
                      <span className="font-semibold">Invoice No: </span>
                      {selectedInvoice.id}
                    </div>
                    <div>
                      <span className="font-semibold">Date: </span>
                      {formatDate(selectedInvoice.date)}
                    </div>
                    <div>
                      <span className="font-semibold">Place of Supply: </span>
                      {normalizeCurrency(selectedInvoice.currency) === "USD"
                        ? "International (Export of Service)"
                        : `${selectedInvoice.billingState || "Delhi"} (07)`}
                    </div>
                    <div>
                      <span className="font-semibold">Reverse Charge: </span>No
                    </div>
                  </div>
                </div>
              </div>

              {/* Billed To / Buyer Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-[11px]">
                <div>
                  <span className="font-mono font-bold text-neutral-500 uppercase tracking-wider text-[10px] block mb-1">
                    BILLED TO (BUYER)
                  </span>
                  <div className="font-bold text-neutral-900 text-sm">
                    {selectedInvoice.userName || user?.name || "Customer"}
                  </div>
                  <div className="text-neutral-600 font-mono mt-0.5">
                    {selectedInvoice.userEmail || user?.email || ""}
                  </div>
                  <div className="text-neutral-600 mt-0.5">
                    {normalizeCurrency(selectedInvoice.currency) === "USD"
                      ? "Region: International (USD)"
                      : `State: ${selectedInvoice.billingState || "Delhi"}, India`}
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className="font-mono font-bold text-neutral-500 uppercase tracking-wider text-[10px] block mb-1">
                    PAYMENT REFERENCE
                  </span>
                  <div className="font-mono text-neutral-800 space-y-0.5">
                    <div>
                      <span className="font-semibold">Payment ID: </span>
                      {selectedInvoice.paymentId || "N/A"}
                    </div>
                    <div>
                      <span className="font-semibold">Order ID: </span>
                      {selectedInvoice.orderId || "N/A"}
                    </div>
                    <div>
                      <span className="font-semibold">Gateway: </span>
                      {selectedInvoice.method || "Razorpay Standard"}
                    </div>
                    <div className="text-emerald-700 font-bold">Status: Fully Paid</div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-neutral-200 text-xs">
                  <thead>
                    <tr className="bg-neutral-100 font-mono text-[11px] text-neutral-700">
                      <th className="p-2.5 border border-neutral-200">#</th>
                      <th className="p-2.5 border border-neutral-200">Description of Service</th>
                      <th className="p-2.5 border border-neutral-200">SAC Code</th>
                      <th className="p-2.5 border border-neutral-200 text-right">
                        Gross ({normalizeCurrency(selectedInvoice.currency) === "USD" ? "$" : "₹"})
                      </th>
                      <th className="p-2.5 border border-neutral-200 text-right">
                        Discount ({normalizeCurrency(selectedInvoice.currency) === "USD" ? "$" : "₹"})
                      </th>
                      <th className="p-2.5 border border-neutral-200 text-right">
                        Taxable Val ({normalizeCurrency(selectedInvoice.currency) === "USD" ? "$" : "₹"})
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2.5 border border-neutral-200 font-mono">1</td>
                      <td className="p-2.5 border border-neutral-200">
                        <div className="font-semibold text-neutral-900">{selectedInvoice.itemTitle}</div>
                        <div className="text-[10px] text-neutral-500">
                          Digital Astrological Consultation & Vedic Chart Analysis Services
                        </div>
                      </td>
                      <td className="p-2.5 border border-neutral-200 font-mono">998431</td>
                      <td className="p-2.5 border border-neutral-200 text-right font-mono">
                        {Number(selectedInvoice.subtotal || selectedInvoice.total).toFixed(2)}
                      </td>
                      <td className="p-2.5 border border-neutral-200 text-right font-mono text-emerald-700">
                        −{Number(selectedInvoice.discount || 0).toFixed(2)}
                      </td>
                      <td className="p-2.5 border border-neutral-200 text-right font-mono font-semibold">
                        {normalizeCurrency(selectedInvoice.currency) === "USD"
                          ? Number(selectedInvoice.total).toFixed(2)
                          : (Number(selectedInvoice.total) / 1.18).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* GST Tax Summary Calculation */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
                <div className="space-y-1 text-[11px] text-neutral-600 max-w-sm">
                  <div className="font-mono text-[10px] uppercase font-bold text-neutral-700">Tax Breakdown</div>
                  {normalizeCurrency(selectedInvoice.currency) === "USD" ? (
                    <>
                      <div>Export of Services under LUT (0% GST / Zero-Rated)</div>
                      <div className="text-[10px] text-neutral-500">Supply meant for export under Letter of Undertaking without payment of IGST.</div>
                    </>
                  ) : (
                    <>
                      <div>Central GST (CGST) @ 9%: ₹{((Number(selectedInvoice.total) * 0.09) / 1.18).toFixed(2)}</div>
                      <div>State GST (SGST) @ 9%: ₹{((Number(selectedInvoice.total) * 0.09) / 1.18).toFixed(2)}</div>
                      <div>Total Tax (18% GST): ₹{selectedInvoice.taxAmount || ((Number(selectedInvoice.total) * 0.18) / 1.18).toFixed(2)}</div>
                    </>
                  )}
                </div>

                <div className="w-full sm:w-64 space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-neutral-600">
                    <span>Taxable Amount:</span>
                    <span>
                      {normalizeCurrency(selectedInvoice.currency) === "USD"
                        ? `$${Number(selectedInvoice.total).toFixed(2)}`
                        : `₹${(Number(selectedInvoice.total) / 1.18).toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Total GST:</span>
                    <span>
                      {normalizeCurrency(selectedInvoice.currency) === "USD"
                        ? "$0.00"
                        : `₹${selectedInvoice.taxAmount || ((Number(selectedInvoice.total) * 0.18) / 1.18).toFixed(2)}`}
                    </span>
                  </div>
                  <div className="border-t border-neutral-300 pt-1.5 flex justify-between font-bold text-base text-neutral-900">
                    <span>Invoice Total:</span>
                    <span className="text-emerald-700">
                      {normalizeCurrency(selectedInvoice.currency) === "USD"
                        ? `$${Number(selectedInvoice.total).toFixed(2)}`
                        : `₹${Number(selectedInvoice.total).toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Notice */}
              <div className="border-t border-neutral-200 pt-4 text-[10px] text-neutral-500 font-mono text-center space-y-0.5">
                <div>This is a computer generated invoice and does not require a physical signature.</div>
                <div>Thank you for trusting Japaika for your Vedic astrological guidance.</div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>
  )
}
