import { useState, useEffect, useCallback, useMemo } from "react"
import { useSelector, useDispatch } from "react-redux"
import {
  ArrowLeft,
  X,
  Check,
  Lock,
  ChevronDown,
  Sparkles,
  Tag,
  AlertCircle,
  RefreshCw,
  Search,
} from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { openAuthModal, updateUserProfile } from "@/features/auth"
import { addReportQuota, setReportQuota } from "@/features/jyotish"
import {
  fetchBillingCatalog,
  validateCoupon,
  createRazorpayOrder,
  verifyRazorpayPayment,
  recordPaymentFailure,
} from "@/features/billing/billingApi"
import { openRazorpayCheckout } from "@/lib/razorpay"
import { INDIAN_GST_STATES, SUPPORTED_CURRENCIES } from "@/lib/constants"
import { formatCurrency, getPackPricing, normalizeCurrency } from "@/lib/utils"

function getApplicableProducts(coupon) {
  const raw = coupon?.applicable_products
  if (Array.isArray(raw)) return raw
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

function doesCouponMatchPack(coupon, pkg) {
  if (!coupon || coupon.is_active === false || !pkg) return false
  const applicable = getApplicableProducts(coupon)
  if (applicable.length === 0) return true
  return (
    applicable.includes(pkg.id) ||
    applicable.includes(pkg.code) ||
    applicable.includes(pkg.packDbId)
  )
}

export default function ReportPacksModal({
  isOpen,
  onClose,
  onOpenAuth,
  onSelectPackage,
  initialPromoCode,
  initialPackId,
  currency = "INR",
}) {
  const dispatch = useDispatch()
  const { isAuthenticated, user } = useSelector((state) => state.auth)

  const [activeCurrency, setActiveCurrency] = useState(normalizeCurrency(currency))
  const [supportedCurrencies, setSupportedCurrencies] = useState(SUPPORTED_CURRENCIES)
  const [packs, setPacks] = useState([])
  const [coupons, setCoupons] = useState([])
  const [isLoadingPacks, setIsLoadingPacks] = useState(false)
  const [packsError, setPacksError] = useState(null)

  const [step, setStep] = useState(1)
  const [selectedPackId, setSelectedPackId] = useState(initialPackId || "")
  const [billingState, setBillingState] = useState("Delhi")
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false)
  const [stateSearch, setStateSearch] = useState("")

  const [appliedPromo, setAppliedPromo] = useState(initialPromoCode || "")
  const [promoInput, setPromoInput] = useState("")
  const [isPromoInputVisible, setIsPromoInputVisible] = useState(false)
  const [isCouponsModalOpen, setIsCouponsModalOpen] = useState(false)
  const [isInitiating, setIsInitiating] = useState(false)
  const [serverBreakdown, setServerBreakdown] = useState(null)

  const filteredBillingStates = useMemo(() => {
    const q = stateSearch.trim().toLowerCase()
    if (!q) return INDIAN_GST_STATES
    return INDIAN_GST_STATES.filter((st) => st.toLowerCase().includes(q))
  }, [stateSearch])

  const getCouponsForPack = useCallback(
    (packOrId) => {
      if (!packOrId || !coupons.length) return []
      const targetPack =
        typeof packOrId === "object"
          ? packOrId
          : packs.find(
              (p) =>
                p.id === packOrId ||
                p.code === packOrId ||
                p.packDbId === packOrId
            )
      if (!targetPack) return []
      return coupons.filter((coupon) => doesCouponMatchPack(coupon, targetPack))
    },
    [coupons, packs]
  )

  const getDefaultPromoForPack = useCallback(
    (packId) => {
      const pack = packs.find(
        (p) => p.id === packId || p.code === packId || p.packDbId === packId
      )
      if (pack?.defaultPromoCode) return pack.defaultPromoCode
      return getCouponsForPack(pack)[0]?.code || ""
    },
    [getCouponsForPack, packs]
  )

  const loadCatalog = useCallback(
    async (targetCurr) => {
      setIsLoadingPacks(true)
      setPacksError(null)

      try {
        const response = await fetchBillingCatalog(targetCurr)
        const catalogData = response?.data || response
        const reportPacks = catalogData?.reportPacks || []
        const availableCoupons = catalogData?.coupons || []
        const backendCurrency = normalizeCurrency(catalogData?.currency || targetCurr)
        const rawCurrencies = catalogData?.supportedCurrencies || SUPPORTED_CURRENCIES
        const availableCurrencies = Array.isArray(rawCurrencies)
          ? rawCurrencies.filter((c) => SUPPORTED_CURRENCIES.includes(c))
          : SUPPORTED_CURRENCIES

        setActiveCurrency(backendCurrency)
        setSupportedCurrencies(availableCurrencies.length > 0 ? availableCurrencies : SUPPORTED_CURRENCIES)
        setPacks(reportPacks)
        setCoupons(availableCoupons)

        const defaultPack =
          reportPacks.find(
            (p) =>
              p.id === initialPackId ||
              p.code === initialPackId ||
              p.packDbId === initialPackId
          ) ||
          reportPacks.find((p) => p.tier === "diamond" || p.code?.includes("diamond")) ||
          reportPacks.find((p) => p.tier === "gold" || p.code?.includes("gold")) ||
          reportPacks[0]

        if (defaultPack) {
          setSelectedPackId(defaultPack.code || defaultPack.id || defaultPack.packDbId)

          if (initialPromoCode) {
            setAppliedPromo(initialPromoCode)
          } else if (defaultPack.defaultPromoCode) {
            setAppliedPromo(defaultPack.defaultPromoCode)
          } else {
            const matching = availableCoupons.filter((c) =>
              doesCouponMatchPack(c, defaultPack)
            )
            setAppliedPromo(matching[0]?.code || "")
          }
        }
      } catch (err) {
        setPacksError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load report packages from server."
        )
      } finally {
        setIsLoadingPacks(false)
      }
    },
    [initialPackId, initialPromoCode]
  )

  useEffect(() => {
    if (isOpen) {
      const initialCurr = normalizeCurrency(currency)
      setActiveCurrency(initialCurr)
      setStep(1)
      loadCatalog(initialCurr)
    }
  }, [isOpen, currency, loadCatalog])

  const handleCurrencyChange = (newCurrency) => {
    const safeCurr = normalizeCurrency(newCurrency)
    if (safeCurr === activeCurrency || isLoadingPacks) return
    setActiveCurrency(safeCurr)
    setServerBreakdown(null)
    loadCatalog(safeCurr)
  }

  const handleModalClose = () => {
    setStep(1)
    setIsStateDropdownOpen(false)
    setStateSearch("")
    setIsPromoInputVisible(false)
    setIsCouponsModalOpen(false)
    setServerBreakdown(null)
    onClose()
  }

  const selectedPack =
    packs.find(
      (p) =>
        p.id === selectedPackId ||
        p.code === selectedPackId ||
        p.packDbId === selectedPackId
    ) ||
    packs[0] ||
    null

  const selectedPricing = getPackPricing(selectedPack, activeCurrency)

  const getBadgeForPack = (pkg) => {
    if (pkg.tier === "diamond" || pkg.code?.includes("diamond") || pkg.credits >= 4) {
      return "BEST VALUE"
    }
    if (pkg.tier === "gold" || pkg.code?.includes("gold") || pkg.credits === 2) {
      return "POPULAR"
    }
    return null
  }

  const activeCoupon = coupons.find(
    (c) => c.code?.toUpperCase() === appliedPromo?.trim().toUpperCase()
  )

  const isPromoApplicable = Boolean(
    activeCoupon && selectedPack && doesCouponMatchPack(activeCoupon, selectedPack)
  )

  const subtotal = selectedPricing.originalPrice
  const offerPrice = selectedPricing.offerPrice

  const isServerBreakdownFresh =
    serverBreakdown &&
    (serverBreakdown.packId === selectedPack?.id ||
      serverBreakdown.packId === selectedPack?.code ||
      serverBreakdown.packId === selectedPack?.packDbId) &&
    serverBreakdown.couponCode === appliedPromo &&
    serverBreakdown.currency === selectedPricing.currency &&
    serverBreakdown.billingState ===
      (selectedPricing.currency === "INR" ? billingState : "International")

  const discount = isServerBreakdownFresh
    ? serverBreakdown.discountAmount
    : isPromoApplicable
    ? Math.max(0, subtotal - offerPrice)
    : 0

  const finalPrice = isServerBreakdownFresh
    ? serverBreakdown.totalAmount
    : Math.max(0, subtotal - discount)

  const handleSelectPack = (pkg) => {
    if (!pkg) return
    const packKey = pkg.code || pkg.id || pkg.packDbId
    setSelectedPackId(packKey)
    setServerBreakdown(null)

    const packCoupons = getCouponsForPack(pkg)
    const isCurrentStillValid = packCoupons.some(
      (c) => c.code?.toUpperCase() === appliedPromo?.toUpperCase()
    )
    if (!isCurrentStillValid) {
      setAppliedPromo(pkg.defaultPromoCode || packCoupons[0]?.code || "")
    }
  }

  const handleApplyPromo = async (codeToApply) => {
    const code = (codeToApply || promoInput).trim().toUpperCase()
    if (!code) return

    const matchedCoupon = coupons.find((c) => c.code?.toUpperCase() === code)
    if (!matchedCoupon) {
      toast.error(`Invalid coupon code "${code}".`)
      return
    }

    if (!doesCouponMatchPack(matchedCoupon, selectedPack)) {
      toast.error(`Coupon "${code}" is not valid for ${selectedPack.name} Pack.`)
      return
    }

    setAppliedPromo(code)
    setIsPromoInputVisible(false)
    setIsCouponsModalOpen(false)
    setPromoInput("")
    toast.success(`Coupon code ${code} applied successfully!`)

    if (isAuthenticated && selectedPack) {
      try {
        const breakdownRes = await validateCoupon({
          packId: selectedPack.code || selectedPack.id,
          couponCode: code,
          currency: selectedPricing.currency,
          billingState:
            selectedPricing.currency === "INR" ? billingState : "International",
        })
        if (breakdownRes?.data) {
          setServerBreakdown(breakdownRes.data)
        }
      } catch {
        // Client-side pricing fallback remains active
      }
    }
  }

  const handleRemovePromo = () => {
    setAppliedPromo("")
    setServerBreakdown(null)
    toast.info("Coupon code removed.")
  }

  const handleProceedToRazorpay = async () => {
    if (!selectedPack) return

    if (!isAuthenticated) {
      if (onOpenAuth) {
        onOpenAuth(() => setStep(2))
      } else {
        dispatch(openAuthModal())
      }
      return
    }

    setIsInitiating(true)

    try {
      const orderRes = await createRazorpayOrder({
        packId: selectedPack.code || selectedPack.id,
        itemType: "report_pack",
        currency: selectedPricing.currency,
        couponCode: isPromoApplicable ? appliedPromo : undefined,
        billingState: selectedPricing.currency === "INR" ? billingState : "International",
      })

      const orderData = orderRes?.data || orderRes
      const backendKeyId = orderData?.keyId
      const backendOrderId = orderData?.orderId
      const amountSubunits = orderData?.amountSubunits
      const finalAmount = orderData?.amount ?? finalPrice
      const orderCurrency = orderData?.currency || selectedPricing.currency

      if (!backendKeyId) {
        throw new Error("Razorpay Key ID was not returned by the server.")
      }

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
      handleModalClose()

      setTimeout(() => {
        openRazorpayCheckout({
          keyId: backendKeyId,
          orderId: backendOrderId,
          amountSubunits,
          amount: finalAmount,
          currency: orderCurrency,
          name: "Japaika",
          description: `${selectedPack.name} Report Pack (${selectedPack.credits} reports)`,
          user: {
            name: user?.name,
            email: user?.email,
            phone: user?.phone,
          },
          onSuccess: async (paymentResponse) => {
            try {
              const verifyRes = await verifyRazorpayPayment({
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                method: "standard",
              })

              const creditsRemaining =
                verifyRes?.data?.reportCreditsRemaining ??
                verifyRes?.data?.creditsRemaining
              if (typeof creditsRemaining === "number") {
                dispatch(setReportQuota(creditsRemaining))
                dispatch(updateUserProfile({ reportCredits: creditsRemaining }))
              } else {
                dispatch(addReportQuota(selectedPack.credits))
                dispatch(
                  updateUserProfile({
                    reportCredits: (user?.reportCredits || 0) + selectedPack.credits,
                  })
                )
              }

              toast.success(
                `Payment successful! ${selectedPack.credits} report credits added to your account.`
              )
              if (typeof onSelectPackage === "function") {
                onSelectPackage(selectedPack)
              }
              handleModalClose()
            } catch (verifyErr) {
              toast.error(
                verifyErr?.response?.data?.message ||
                  "Payment was successful, but server verification failed. Please contact support."
              )
            }
          },
          onFailure: (err) => {
            recordPaymentFailure({
              razorpay_order_id: backendOrderId,
              status: "failed",
              reason: err?.description || err?.message || "Payment failed",
            })
            toast.error(err?.description || "Payment failed. Please try again.")
          },
          onDismiss: () => {
            recordPaymentFailure({
              razorpay_order_id: backendOrderId,
              status: "cancelled",
              reason: "User closed Razorpay modal",
            })
            toast.info("Payment cancelled.")
          },
        })
      }, 150)
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Could not initiate payment gateway. Please try again."
      )
    } finally {
      setIsInitiating(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleModalClose()}>
        <DialogContent
          showCloseButton={false}
          className="w-[96vw] sm:max-w-[860px] md:max-w-[920px] lg:max-w-[980px] max-h-[92vh] flex flex-col p-0 overflow-hidden border border-border/80 bg-card/90 backdrop-blur-2xl text-foreground rounded-2xl sm:rounded-3xl shadow-2xl"
          aria-describedby={undefined}
        >
          {/* ================= STEP 1: PACK SELECTION ================= */}
          {step === 1 && (
            <div className="flex flex-col h-full max-h-[92vh]">
              <div className="shrink-0 pt-6 sm:pt-7 px-5 sm:px-8 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/80">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary block font-semibold">
                    DEEP VEDIC REPORTS
                  </span>
                  <h2 className="font-serif text-2xl sm:text-[30px] font-normal text-foreground mt-0.5 tracking-tight">
                    Choose a report pack
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-sans">
                    Deep multi-chapter Vedic analyses compiled directly from your chart · Never expires
                  </p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <div className="flex items-center bg-accent/40 rounded-full p-1 border border-border/80">
                    {supportedCurrencies.map((curr) => {
                      const isCurrActive = activeCurrency === curr
                      const label = curr === "INR" ? "₹ INR" : "$ USD"
                      return (
                        <button
                          key={curr}
                          type="button"
                          onClick={() => handleCurrencyChange(curr)}
                          disabled={isLoadingPacks}
                          className={`px-2.5 py-1 text-[11px] font-mono rounded-full transition cursor-pointer disabled:opacity-50 ${
                            isCurrActive
                              ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent"
                          }`}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={handleModalClose}
                    className="w-9 h-9 rounded-full bg-accent/40 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition cursor-pointer shrink-0 border border-border/80"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 sm:py-6">
                {isLoadingPacks && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                    {[1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl p-6 sm:p-7 border border-border/80 bg-accent/30 flex flex-col justify-between min-h-[340px]"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-16 bg-accent" />
                            <Skeleton className="h-5 w-5 rounded-full bg-accent" />
                          </div>
                          <div className="mt-5 space-y-2">
                            <Skeleton className="h-12 w-20 bg-accent" />
                            <Skeleton className="h-4 w-28 bg-accent/60" />
                          </div>
                          <div className="mt-6 space-y-2">
                            <Skeleton className="h-3 w-36 bg-accent/60" />
                            <Skeleton className="h-3 w-40 bg-accent/60" />
                            <Skeleton className="h-3 w-32 bg-accent/60" />
                          </div>
                        </div>
                        <div>
                          <div className="border-t border-border/80 my-4" />
                          <Skeleton className="h-8 w-32 bg-accent" />
                          <Skeleton className="h-4 w-24 bg-accent/60 mt-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!isLoadingPacks && packsError && (
                  <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-8 text-center flex flex-col items-center justify-center gap-3">
                    <AlertCircle className="w-8 h-8 text-destructive" />
                    <h3 className="text-foreground font-medium text-base">Unable to load report packages</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm max-w-md">{packsError}</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => loadCatalog(activeCurrency)}
                      className="mt-2 border-border/80 text-foreground hover:bg-accent flex items-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Loading</span>
                    </Button>
                  </div>
                )}

                {!isLoadingPacks && !packsError && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                    {packs.map((pkg) => {
                      const isSelected =
                        selectedPackId === pkg.id ||
                        selectedPackId === pkg.code ||
                        selectedPackId === pkg.packDbId
                      const badge = getBadgeForPack(pkg)
                      const pkgPricing = getPackPricing(pkg, activeCurrency)
                      const unitPriceNum =
                        Number(pkgPricing.offerPrice || 0) / Number(pkg.credits || 1)
                      const defaultPromo =
                        pkg.defaultPromoCode || getDefaultPromoForPack(pkg.id || pkg.code)

                      return (
                        <div
                          key={pkg.packDbId || pkg.code || pkg.id}
                          onClick={() => handleSelectPack(pkg)}
                          className={`relative rounded-2xl p-5 sm:p-6 lg:p-7 border cursor-pointer transition-all duration-200 flex flex-col justify-between min-h-[350px] ${
                            isSelected
                              ? "border-2 border-primary bg-primary/10 ring-1 ring-primary/40 shadow-xl"
                              : "border-border/80 bg-accent/30 hover:border-primary/50 hover:bg-accent/50"
                          }`}
                        >
                          {badge && (
                            <span className="absolute -top-3 left-6 bg-primary text-primary-foreground font-bold text-[10px] font-mono uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md">
                              {badge}
                            </span>
                          )}

                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/80 font-semibold">
                                {pkg.name || pkg.tier}
                              </span>
                              <div
                                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                  isSelected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border/80 bg-transparent"
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                            </div>

                            <div className="mt-3.5">
                              <div className="flex items-baseline gap-2">
                                <span className="font-serif text-4xl sm:text-5xl font-light text-foreground tracking-tight leading-none">
                                  {pkg.credits}
                                </span>
                                <span className="text-sm sm:text-base font-sans text-muted-foreground">
                                  {pkg.credits === 1 ? "Deep Report" : "Deep Reports"}
                                </span>
                              </div>
                              {pkg.subtitle && (
                                <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 font-sans">
                                  {pkg.subtitle}
                                </p>
                              )}
                            </div>

                            {Array.isArray(pkg.features) && pkg.features.length > 0 && (
                              <div className="mt-4 pt-3.5 border-t border-border/80">
                                <ul className="space-y-1.5 text-xs text-foreground/80">
                                  {pkg.features.map((feat, fIdx) => (
                                    <li key={fIdx} className="flex items-center gap-1.5">
                                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                                      <span>{feat}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          <div className="mt-5 pt-4 border-t border-border/80">
                            <div className="flex items-baseline gap-2">
                              <span className="font-mono text-2xl sm:text-[28px] font-bold text-foreground tracking-tight">
                                {formatCurrency(pkgPricing.offerPrice, pkgPricing.currency)}
                              </span>
                              {pkgPricing.originalPrice > pkgPricing.offerPrice && (
                                <span className="font-mono text-xs text-muted-foreground line-through">
                                  {formatCurrency(pkgPricing.originalPrice, pkgPricing.currency)}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-primary font-mono">
                                {formatCurrency(unitPriceNum, pkgPricing.currency)} / report
                              </span>
                              {defaultPromo && (
                                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                  CODE: {defaultPromo}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="shrink-0 bg-accent/40 px-5 sm:px-8 py-4 sm:py-5 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-muted-foreground text-center sm:left">
                  SECURE PAYMENT · {selectedPricing.currency === "INR" ? "GST INVOICE" : "TAX INVOICE"} · INSTANT UNLOCK
                </span>

                <Button
                  type="button"
                  disabled={!selectedPack || isLoadingPacks}
                  onClick={() => setStep(2)}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3.5 rounded-full font-medium shadow-md transition flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer disabled:opacity-50"
                >
                  {selectedPack ? (
                    <>
                      <span>
                        Continue with {selectedPack.credits}{" "}
                        {selectedPack.credits === 1 ? "report" : "reports"}
                      </span>
                      <span className="opacity-40">·</span>
                      <span>
                        {formatCurrency(selectedPricing.offerPrice, selectedPricing.currency)}
                      </span>
                      <span className="text-base">→</span>
                    </>
                  ) : (
                    <span>Select a Package</span>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ================= STEP 2: PAYMENT SUMMARY ================= */}
          {step === 2 && selectedPack && (
            <div className="flex flex-col h-full max-h-[92vh]">
              <div className="shrink-0 pt-6 sm:pt-7 px-5 sm:px-8 pb-4 flex items-center justify-between border-b border-border/80">
                <div className="flex items-center gap-3.5">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-9 h-9 rounded-full border border-border/80 bg-accent/40 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition cursor-pointer"
                    aria-label="Back to packages"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground block leading-tight mb-0.5">
                      STEP 2 OF 2
                    </span>
                    <h2 className="font-serif text-2xl sm:text-[28px] font-normal text-foreground">
                      Payment summary
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleModalClose}
                  className="w-9 h-9 rounded-full bg-accent/40 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition cursor-pointer border border-border/80"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 sm:py-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
                  <div className="md:col-span-7 space-y-5">
                    {/* 1. YOUR PACK & QUICK SWITCH */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                          SELECT REPORT PACK
                        </span>
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="text-[11px] font-mono uppercase tracking-[0.15em] text-primary hover:underline transition cursor-pointer"
                        >
                          CHANGE SELECTION &gt;
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {packs.map((pkg) => {
                          const isSelected =
                            selectedPackId === pkg.id ||
                            selectedPackId === pkg.code ||
                            selectedPackId === pkg.packDbId
                          const badge = getBadgeForPack(pkg)
                          const pPricing = getPackPricing(pkg, activeCurrency)
                          return (
                            <div
                              key={pkg.packDbId || pkg.code || pkg.id}
                              onClick={() => handleSelectPack(pkg)}
                              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                                isSelected
                                  ? "border-primary bg-primary/10 ring-1 ring-primary/40 shadow-md"
                                  : "border-border/80 bg-accent/30 hover:border-primary/50 hover:bg-accent/50"
                              }`}
                            >
                              {badge && (
                                <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase bg-primary text-primary-foreground">
                                  {badge}
                                </span>
                              )}
                              <div className="flex items-center justify-between w-full">
                                <span
                                  className={`text-[11px] font-mono uppercase tracking-wider font-semibold ${
                                    isSelected ? "text-primary" : "text-foreground/80"
                                  }`}
                                >
                                  {pkg.name}
                                </span>
                                <div
                                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                    isSelected
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-border/80 bg-transparent"
                                  }`}
                                >
                                  {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </div>
                              </div>
                              <div className="mt-2">
                                <div className="font-serif text-lg sm:text-xl font-light text-foreground leading-tight">
                                  {pkg.credits}{" "}
                                  <span className="text-xs font-sans text-muted-foreground">
                                    {pkg.credits === 1 ? "Report" : "Reports"}
                                  </span>
                                </div>
                                <div className="font-mono text-xs text-foreground/90 font-medium mt-1">
                                  {formatCurrency(pPricing.offerPrice, pPricing.currency)}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-2 font-sans flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-primary shrink-0" />
                        <span>
                          {selectedPack.name} Pack ({selectedPack.credits} reports) · instant AI synthesis · never expires
                        </span>
                      </div>
                    </div>

                    {/* 2. BILLING STATE / REGION */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                          {selectedPricing.currency === "INR" ? "BILLING STATE" : "BILLING REGION"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {selectedPricing.currency === "INR" ? "Required on your GST invoice" : "International (0% GST)"}
                        </span>
                      </div>

                      {selectedPricing.currency === "INR" ? (
                        <Popover
                          open={isStateDropdownOpen}
                          onOpenChange={(open) => {
                            setIsStateDropdownOpen(open)
                            if (!open) setStateSearch("")
                          }}
                        >
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="w-full rounded-2xl border border-border/80 bg-accent/40 px-5 py-3.5 text-sm text-foreground flex items-center justify-between hover:border-primary/50 transition cursor-pointer"
                            >
                              <span>{billingState}</span>
                              <ChevronDown
                                className={`w-4 h-4 text-muted-foreground transition-transform ${
                                  isStateDropdownOpen ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                          </PopoverTrigger>

                          <PopoverContent
                            align="start"
                            sideOffset={6}
                            collisionPadding={16}
                            onWheel={(e) => e.stopPropagation()}
                            className="w-[var(--radix-popover-trigger-width)] rounded-2xl border border-border/80 bg-popover/95 text-popover-foreground p-2 shadow-2xl backdrop-blur-2xl z-[100]"
                          >
                            <div className="relative mb-1.5">
                              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input
                                type="text"
                                value={stateSearch}
                                onChange={(e) => setStateSearch(e.target.value)}
                                placeholder="Search state or UT..."
                                className="w-full rounded-xl border border-border/70 bg-accent/30 pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                              />
                            </div>

                            <div className="max-h-52 overflow-y-auto overscroll-contain space-y-0.5 pr-0.5">
                              {filteredBillingStates.length > 0 ? (
                                filteredBillingStates.map((state) => (
                                  <button
                                    type="button"
                                    key={state}
                                    onClick={() => {
                                      setBillingState(state)
                                      setIsStateDropdownOpen(false)
                                      setStateSearch("")
                                    }}
                                    className={`w-full px-3.5 py-2 text-xs rounded-xl cursor-pointer transition flex items-center justify-between text-left ${
                                      billingState === state
                                        ? "bg-primary/20 text-primary font-semibold"
                                        : "text-foreground/80 hover:bg-accent hover:text-foreground"
                                    }`}
                                  >
                                    <span>{state}</span>
                                    {billingState === state && (
                                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                                    )}
                                  </button>
                                ))
                              ) : (
                                <div className="px-3.5 py-3 text-xs text-muted-foreground text-center">
                                  No matching state found
                                </div>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <div className="w-full rounded-2xl border border-border/80 bg-accent/40 px-5 py-3.5 text-sm text-foreground/80 font-mono">
                          International ({selectedPricing.currency}) · GST Exempt
                        </div>
                      )}
                    </div>

                    {/* 3. PROMO CODE */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 font-semibold">
                          PROMO CODE
                        </span>
                        {coupons.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setIsCouponsModalOpen(true)}
                            className="text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition cursor-pointer"
                          >
                            VIEW ALL COUPONS &gt;
                          </button>
                        )}
                      </div>

                      {isPromoApplicable && !isPromoInputVisible ? (
                        <div className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3.5 flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2.5">
                            <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                            <span className="text-foreground font-mono font-semibold tracking-wider">
                              {appliedPromo}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Applied</span>
                            <button
                              type="button"
                              onClick={handleRemovePromo}
                              className="text-muted-foreground hover:text-foreground cursor-pointer ml-1 p-0.5"
                              aria-label="Remove promo code"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Enter coupon code"
                            value={promoInput}
                            onChange={(e) => setPromoInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                handleApplyPromo()
                              }
                            }}
                            className="flex-1 rounded-2xl border border-border/80 bg-accent/40 px-5 py-3 text-xs text-foreground uppercase placeholder:text-muted-foreground focus:outline-none focus:border-primary font-mono"
                          />
                          <Button
                            type="button"
                            onClick={() => handleApplyPromo()}
                            className="bg-accent hover:bg-accent/80 text-foreground border border-border/80 text-xs px-5 rounded-2xl cursor-pointer h-auto"
                          >
                            Apply
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Order Cost Breakdown & Razorpay CTA */}
                  <div className="md:col-span-5 flex flex-col justify-between">
                    <div className="bg-accent/40 border border-border/80 rounded-2xl p-5 sm:p-6 space-y-4">
                      <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground block">
                        ORDER BREAKDOWN
                      </span>

                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center text-foreground/80">
                          <span>
                            {selectedPack.credits}{" "}
                            {selectedPack.credits === 1 ? "Report Credit" : "Report Credits"}
                          </span>
                          <span className="font-mono">
                            {formatCurrency(subtotal, selectedPricing.currency)}
                          </span>
                        </div>

                        {isPromoApplicable && discount > 0 && (
                          <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                            <span className="text-xs">{appliedPromo} discount</span>
                            <span className="font-mono">
                              − {formatCurrency(discount, selectedPricing.currency)}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-muted-foreground text-xs">
                          <span>Taxes and fees</span>
                          <span>
                            {selectedPricing.currency === "INR"
                              ? "Included (18% GST)"
                              : "Included (0% Tax)"}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-border/80 my-4" />

                      <div className="flex justify-between items-baseline">
                        <div>
                          <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground block">
                            TOTAL
                          </span>
                          <span className="text-[10px] text-muted-foreground mt-0.5 block">
                            {selectedPricing.currency === "INR"
                              ? "GST included"
                              : "All taxes included"}
                          </span>
                        </div>
                        <div className="font-serif text-3xl sm:text-[40px] font-normal text-foreground tracking-tight">
                          {formatCurrency(finalPrice, selectedPricing.currency)}
                        </div>
                      </div>

                      <div className="pt-2 space-y-2.5">
                        <Button
                          type="button"
                          disabled={isInitiating}
                          onClick={handleProceedToRazorpay}
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3.5 sm:py-4 rounded-full font-medium shadow-md transition flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-60"
                        >
                          {isInitiating ? (
                            <span>Connecting to Gateway...</span>
                          ) : (
                            <>
                              <span>Proceed to Pay</span>
                              <span className="text-lg">→</span>
                            </>
                          )}
                        </Button>

                        <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground pt-1">
                          <Lock className="w-3 h-3 text-muted-foreground" />
                          <span>RAZORPAY SECURED</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Available Coupons Modal */}
      {isCouponsModalOpen && (
        <Dialog open={isCouponsModalOpen} onOpenChange={setIsCouponsModalOpen}>
          <DialogContent className="max-w-[440px] bg-card/95 backdrop-blur-2xl border border-border/80 text-foreground p-6 rounded-3xl shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-serif text-lg font-medium text-foreground">Available Coupons</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCouponsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-accent/40 flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {coupons.map((coupon) => {
                const isApplicable = doesCouponMatchPack(coupon, selectedPack)

                return (
                  <div
                    key={coupon.code}
                    className={`p-3.5 rounded-2xl border transition flex items-center justify-between ${
                      isApplicable
                        ? "border-emerald-500/30 bg-emerald-500/10 hover:border-emerald-500/50"
                        : "border-border/40 bg-accent/20 opacity-40"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-foreground uppercase tracking-wider">
                          {coupon.code}
                        </span>
                        {appliedPromo === coupon.code && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">{coupon.description}</p>
                    </div>

                    {isApplicable && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleApplyPromo(coupon.code)}
                        className="bg-emerald-500 hover:bg-emerald-400 text-primary-foreground font-semibold text-xs px-3.5 py-1.5 rounded-xl cursor-pointer h-auto"
                      >
                        Apply
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
