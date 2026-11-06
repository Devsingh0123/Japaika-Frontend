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
import { addQuestionQuota, setQuestionQuota } from "@/features/jyotish"
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

function parseApplicableProducts(coupon) {
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

function isPackMatch(pkg, targetId) {
  if (!pkg || !targetId) return false
  const target = String(targetId).trim().toLowerCase()
  return [pkg.id, pkg.code, pkg.packDbId].some(
    (id) => id && String(id).trim().toLowerCase() === target
  )
}

function findPack(packOrId, packList) {
  if (!packOrId || !Array.isArray(packList)) return null
  if (typeof packOrId === "object") return packOrId
  return packList.find((p) => isPackMatch(p, packOrId)) || null
}

function doesCouponMatchPack(coupon, pkg) {
  if (!coupon || coupon.is_active === false || !pkg) return false
  const applicable = parseApplicableProducts(coupon)
  if (applicable.length === 0) return true
  return applicable.some((code) => isPackMatch(pkg, code))
}

function getCouponsForPack(pkg, coupons) {
  if (!pkg || !Array.isArray(coupons)) return []
  return coupons
    .filter((c) => doesCouponMatchPack(c, pkg))
    .sort((a, b) => {
      const aSpecific = parseApplicableProducts(a).length > 0 ? 1 : 0
      const bSpecific = parseApplicableProducts(b).length > 0 ? 1 : 0
      return bSpecific - aSpecific
    })
}

function getPrimaryCouponForPack(pkg, coupons) {
  if (!pkg) return null
  const matching = getCouponsForPack(pkg, coupons)
  if (pkg.defaultPromoCode) {
    const explicit = matching.find(
      (c) =>
        c.code?.toUpperCase() ===
        String(pkg.defaultPromoCode).trim().toUpperCase()
    )
    if (explicit) return explicit
  }
  return matching[0] || null
}

function computePackWithCouponPricing(pkg, coupon, activeCurrency = "INR") {
  const basePricing = getPackPricing(pkg, activeCurrency)
  const subtotal = Number(basePricing.originalPrice || 0)
  const curr = basePricing.currency

  if (!pkg) {
    return { currency: curr, subtotal: 0, finalPrice: 0, discountAmount: 0 }
  }

  // 1. If no coupon is provided or coupon doesn't match this pack
  if (!coupon || !doesCouponMatchPack(coupon, pkg)) {
    return {
      currency: curr,
      subtotal,
      finalPrice: subtotal,
      discountAmount: 0,
    }
  }

  // 2. If coupon matches this pack's default offer promo code, use the backend pre-calculated offer price
  const isDefaultPromo =
    pkg.defaultPromoCode &&
    String(coupon.code || "").toUpperCase() === String(pkg.defaultPromoCode).toUpperCase()

  if (isDefaultPromo && typeof pkg.offerPrice === "number" && pkg.offerPrice < subtotal) {
    const finalPrice = Math.max(0, Number(pkg.offerPrice))
    const discountAmount = Number(
      (pkg.discountAmount !== undefined && pkg.discountAmount !== null)
        ? pkg.discountAmount
        : Math.max(0, subtotal - finalPrice)
    )
    return {
      currency: curr,
      subtotal,
      finalPrice,
      discountAmount: Number(discountAmount.toFixed(2)),
    }
  }

  // 3. For other coupons (percentage or flat)
  const discountType = String(coupon.discount_type || "").toLowerCase()
  const discountVal = Number(coupon.discount_value || 0)
  let discount = 0

  if (discountType === "percentage" && discountVal > 0) {
    discount = Math.round(subtotal * (discountVal / 100) * 100) / 100
  } else if (discountType === "flat" && discountVal > 0) {
    // If USD and flat discount is in INR currency units (e.g. 1600 > subtotal 29.99)
    if (curr === "USD" && discountVal > subtotal) {
      const parsedPrices =
        typeof pkg.prices === "string"
          ? (() => {
              try {
                return JSON.parse(pkg.prices)
              } catch {
                return {}
              }
            })()
          : pkg.prices || {}
      const inrPrices = parsedPrices["INR"] || {}
      const inrBase = Number(inrPrices?.basePrice ?? inrPrices?.originalPrice ?? 0)
      const fallbackInrBases = { 7: 1399, 12: 2399, 20: 3999, silver: 1399, gold: 2399, diamond: 3999 }
      const effectiveInrBase = inrBase || fallbackInrBases[pkg.credits] || fallbackInrBases[pkg.tier] || 2399

      if (effectiveInrBase > 0) {
        const ratio = Math.min(1, discountVal / effectiveInrBase)
        discount = Math.round(subtotal * ratio * 100) / 100
      } else if (typeof pkg.discountAmount === "number" && pkg.discountAmount > 0) {
        discount = Math.min(subtotal, pkg.discountAmount)
      } else {
        const approxUsd = Math.round((discountVal / 80) * 100) / 100
        discount = Math.min(subtotal, approxUsd)
      }
    } else {
      discount = Math.min(subtotal, discountVal)
    }
  }

  const finalTotal = Math.max(0, Math.round((subtotal - discount) * 100) / 100)
  const discountAmount = Math.max(0, Math.round((subtotal - finalTotal) * 100) / 100)

  return {
    currency: curr,
    subtotal,
    finalPrice: finalTotal,
    discountAmount,
  }
}

function formatCouponBadgeText(coupon, currency = "INR", discountAmount = null) {
  if (!coupon) return ""
  const type = String(coupon.discount_type || "").toLowerCase()
  const val = Number(coupon.discount_value || 0)
  if (type === "percentage" && val > 0) return `${val}% OFF`
  if (type === "flat") {
    if (typeof discountAmount === "number" && discountAmount > 0) {
      return `${formatCurrency(discountAmount, currency)} OFF`
    }
    if (currency === "USD" && val > 100) {
      const approxUsd = Math.round(val / 80)
      return `$${approxUsd} OFF`
    }
    if (val > 0) return `${formatCurrency(val, currency)} OFF`
  }
  return ""
}

export default function QuestionPacksModal({
  isOpen,
  onClose,
  onOpenAuth,
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
  const [promoRemovedManually, setPromoRemovedManually] = useState(false)
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

  const questionPackCoupons = useMemo(() => {
    if (!Array.isArray(coupons) || coupons.length === 0) return []
    return coupons.filter((coupon) => {
      if (coupon.is_active === false) return false
      const applicable = parseApplicableProducts(coupon)
      if (applicable.length === 0) return true
      return packs.some((pkg) => doesCouponMatchPack(coupon, pkg))
    })
  }, [coupons, packs])

  const loadCatalog = useCallback(
    async (targetCurr) => {
      setIsLoadingPacks(true)
      setPacksError(null)

      try {
        const response = await fetchBillingCatalog(targetCurr)
        const catalogData = response?.data || response
        const questionPacks = catalogData?.questionPacks || []
        const availableCoupons = catalogData?.coupons || []
        const backendCurrency = normalizeCurrency(catalogData?.currency || targetCurr)
        const rawCurrencies = catalogData?.supportedCurrencies || SUPPORTED_CURRENCIES
        const availableCurrencies = Array.isArray(rawCurrencies)
          ? rawCurrencies.filter((c) => SUPPORTED_CURRENCIES.includes(c))
          : SUPPORTED_CURRENCIES

        setActiveCurrency(backendCurrency)
        setSupportedCurrencies(
          availableCurrencies.length > 0 ? availableCurrencies : SUPPORTED_CURRENCIES
        )
        setPacks(questionPacks)
        setCoupons(availableCoupons)

        const defaultPack =
          findPack(initialPackId, questionPacks) ||
          questionPacks.find((p) => p.tier === "gold" || p.code?.includes("gold")) ||
          questionPacks[0]

        if (defaultPack) {
          setSelectedPackId(defaultPack.code || defaultPack.id)
          setPromoRemovedManually(false)

          if (initialPromoCode) {
            setAppliedPromo(String(initialPromoCode).trim().toUpperCase())
          } else {
            const primary = getPrimaryCouponForPack(defaultPack, availableCoupons)
            setAppliedPromo(primary?.code || "")
          }
        }
      } catch (err) {
        setPacksError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load question packages from server."
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
    setPromoRemovedManually(false)
    setServerBreakdown(null)
    onClose()
  }

  const selectedPack = useMemo(
    () => findPack(selectedPackId, packs) || packs[0] || null,
    [selectedPackId, packs]
  )

  const selectedPricing = getPackPricing(selectedPack, activeCurrency)

  const selectedPackCoupons = useMemo(
    () => getCouponsForPack(selectedPack, questionPackCoupons),
    [selectedPack, questionPackCoupons]
  )

  const getBadgeForPack = (pkg) => {
    if (pkg.tier === "gold" || pkg.code?.includes("gold")) return "POPULAR"
    if (pkg.tier === "diamond" || pkg.code?.includes("diamond")) return "BEST VALUE"
    return null
  }

  const activeCoupon = useMemo(
    () =>
      questionPackCoupons.find(
        (c) => c.code?.toUpperCase() === appliedPromo?.trim().toUpperCase()
      ) || null,
    [questionPackCoupons, appliedPromo]
  )

  const isServerBreakdownFresh = Boolean(
    serverBreakdown &&
      selectedPack &&
      isPackMatch(selectedPack, serverBreakdown.packId) &&
      String(serverBreakdown.couponCode || "").toUpperCase() ===
        String(appliedPromo || "").toUpperCase() &&
      serverBreakdown.currency === selectedPricing.currency &&
      serverBreakdown.billingState ===
        (selectedPricing.currency === "INR" ? billingState : "International")
  )

  const isPromoApplicable = Boolean(
    (activeCoupon && selectedPack && doesCouponMatchPack(activeCoupon, selectedPack)) ||
    (isServerBreakdownFresh && appliedPromo)
  )

  const effectiveCouponForSelected = useMemo(() => {
    if (promoRemovedManually) return null
    if (activeCoupon && selectedPack && doesCouponMatchPack(activeCoupon, selectedPack)) {
      return activeCoupon
    }
    return getPrimaryCouponForPack(selectedPack, questionPackCoupons)
  }, [promoRemovedManually, activeCoupon, selectedPack, questionPackCoupons])

  const computedPricing = useMemo(
    () =>
      computePackWithCouponPricing(
        selectedPack,
        effectiveCouponForSelected,
        activeCurrency
      ),
    [selectedPack, effectiveCouponForSelected, activeCurrency]
  )

  const subtotal = isServerBreakdownFresh
    ? serverBreakdown.subtotal
    : computedPricing.subtotal

  const discount = isServerBreakdownFresh
    ? serverBreakdown.discountAmount
    : computedPricing.discountAmount

  const finalPrice = isServerBreakdownFresh
    ? serverBreakdown.totalAmount
    : computedPricing.finalPrice

  useEffect(() => {
    if (
      step !== 2 ||
      !isAuthenticated ||
      !selectedPack ||
      !appliedPromo ||
      isServerBreakdownFresh
    ) {
      return
    }

    let cancelled = false

    validateCoupon({
      packId: selectedPack.code || selectedPack.id,
      couponCode: appliedPromo,
      currency: selectedPricing.currency,
      billingState:
        selectedPricing.currency === "INR" ? billingState : "International",
    })
      .then((res) => {
        if (!cancelled && res?.data) {
          setServerBreakdown(res.data)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn("Could not validate coupon on step 2:", err)
        }
      })

    return () => {
      cancelled = true
    }
  }, [
    step,
    isAuthenticated,
    selectedPack,
    appliedPromo,
    selectedPricing.currency,
    billingState,
    isServerBreakdownFresh,
  ])

  const handleSelectPack = (pkg) => {
    if (!pkg) return
    setSelectedPackId(pkg.code || pkg.id)
    setServerBreakdown(null)
    setPromoRemovedManually(false)
    setIsPromoInputVisible(false)

    const relatedCoupon = getPrimaryCouponForPack(pkg, questionPackCoupons)
    if (relatedCoupon) {
      setAppliedPromo(relatedCoupon.code)
    } else if (activeCoupon && doesCouponMatchPack(activeCoupon, pkg)) {
      setAppliedPromo(activeCoupon.code)
    } else {
      setAppliedPromo("")
    }
  }

  const handleContinueToStep2 = () => {
    if (!selectedPack) return
    if (!promoRemovedManually && (!appliedPromo || !isPromoApplicable)) {
      const primary = getPrimaryCouponForPack(selectedPack, questionPackCoupons)
      if (primary?.code) {
        setAppliedPromo(primary.code)
      }
    }
    setStep(2)
  }

  const handleApplyPromo = async (codeToApply, targetPackOverride = null) => {
    const code = (codeToApply || promoInput).trim().toUpperCase()
    if (!code) return

    const packToValidate = targetPackOverride || selectedPack
    if (!packToValidate) return

    const matchedCoupon = questionPackCoupons.find(
      (c) => c.code?.toUpperCase() === code
    )

    if (matchedCoupon) {
      if (!doesCouponMatchPack(matchedCoupon, packToValidate)) {
        toast.error(`Coupon "${code}" is not valid for ${packToValidate.name} Pack.`)
        return
      }

      setPromoRemovedManually(false)
      setAppliedPromo(code)
      setServerBreakdown(null)
      setIsPromoInputVisible(false)
      setIsCouponsModalOpen(false)
      setPromoInput("")
      toast.success(`Coupon code ${code} applied to ${packToValidate.name} Pack!`)

      if (isAuthenticated) {
        try {
          const breakdownRes = await validateCoupon({
            packId: packToValidate.code || packToValidate.id,
            couponCode: code,
            currency: selectedPricing.currency,
            billingState:
              selectedPricing.currency === "INR" ? billingState : "International",
          })
          if (breakdownRes?.data) {
            setServerBreakdown(breakdownRes.data)
          }
        } catch {
          // Client-side pricing remains active
        }
      }
      return
    }

    // Fallback: Validate secret/hidden coupon directly with backend API
    try {
      const breakdownRes = await validateCoupon({
        packId: packToValidate.code || packToValidate.id,
        couponCode: code,
        currency: selectedPricing.currency,
        billingState:
          selectedPricing.currency === "INR" ? billingState : "International",
      })

      if (breakdownRes?.data) {
        setPromoRemovedManually(false)
        setAppliedPromo(code)
        setServerBreakdown(breakdownRes.data)
        setIsPromoInputVisible(false)
        setIsCouponsModalOpen(false)
        setPromoInput("")
        toast.success(`Special coupon "${code}" applied to ${packToValidate.name} Pack!`)
      } else {
        toast.error(`Invalid or expired coupon code "${code}".`)
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message || `Invalid or expired coupon code "${code}".`
      )
    }
  }

  const handleRemovePromo = () => {
    setAppliedPromo("")
    setPromoRemovedManually(true)
    setServerBreakdown(null)
    toast.info("Coupon code removed.")
  }

  const formatApplicablePackNames = (coupon) => {
    const applicable = parseApplicableProducts(coupon)
    if (applicable.length === 0) return "All Question Packs"
    const labels = applicable
      .map((code) => {
        const matchedPack = findPack(code, packs)
        return matchedPack
          ? `${matchedPack.name} Pack (${matchedPack.credits} Qs)`
          : null
      })
      .filter(Boolean)

    return labels.length > 0 ? labels.join(", ") : applicable.join(", ")
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
        itemType: "questions",
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
          description: `${selectedPack.name} Pack (${selectedPack.credits} questions)`,
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

              const creditsRemaining = verifyRes?.data?.creditsRemaining
              if (typeof creditsRemaining === "number") {
                dispatch(setQuestionQuota(creditsRemaining))
                dispatch(updateUserProfile({ creditBalance: creditsRemaining }))
              } else {
                dispatch(addQuestionQuota(selectedPack.credits))
                dispatch(
                  updateUserProfile({
                    creditBalance: (user?.creditBalance || 0) + selectedPack.credits,
                  })
                )
              }

              toast.success(
                `Payment successful! ${selectedPack.credits} questions added to your account.`
              )
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
              reason: "User closed checkout modal",
            })
            toast.info("Payment window dismissed.")
          },
        })
      }, 50)
    } catch (orderErr) {
      toast.error(
        orderErr?.response?.data?.message ||
          orderErr?.message ||
          "Could not initialize checkout. Please try again."
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
          className="sm:max-w-[880px] md:max-w-[900px] w-[95vw] max-w-[95vw] max-h-[92vh] p-0 overflow-hidden border border-border/80 bg-card/90 backdrop-blur-2xl text-foreground rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col"
        >
          {/* ================= STEP 1: PACKAGES POPUP ================= */}
          {step === 1 && (
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="pt-5 sm:pt-8 px-5 sm:px-9 pb-3 sm:pb-2 shrink-0 border-b border-border/40 sm:border-b-0">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-xl sm:text-[32px] font-normal text-foreground tracking-tight leading-tight">
                      Buy more questions
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1.5 font-sans leading-relaxed">
                      One-time purchase · never expires · every answer stays chart-bound.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <div className="flex items-center gap-0.5 sm:gap-1 bg-accent/50 border border-border/80 rounded-full p-0.5 sm:p-1 shadow-xs">
                      {supportedCurrencies.map((curr) => {
                        const isCurrActive = activeCurrency === curr
                        const label = curr === "INR" ? "₹ INR" : "$ USD"
                        return (
                          <button
                            key={curr}
                            type="button"
                            onClick={() => handleCurrencyChange(curr)}
                            disabled={isLoadingPacks}
                            className={`px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-mono rounded-full transition cursor-pointer disabled:opacity-50 ${
                              isCurrActive
                                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
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
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-accent/60 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition cursor-pointer shrink-0"
                      aria-label="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 sm:px-9 py-4 sm:py-7 min-h-0 overscroll-contain">
                {isLoadingPacks && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5">
                    {[1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl p-4 sm:p-7 border border-border/80 bg-accent/20 flex flex-col justify-between min-h-[170px] sm:min-h-[320px]"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-5 w-5 rounded-full" />
                          </div>
                          <div className="mt-4 sm:mt-5 space-y-2">
                            <Skeleton className="h-10 sm:h-14 w-20" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                        <div>
                          <div className="border-t border-border/60 my-3 sm:my-5" />
                          <Skeleton className="h-6 sm:h-8 w-32" />
                          <Skeleton className="h-4 w-24 mt-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!isLoadingPacks && packsError && (
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 sm:p-8 text-center flex flex-col items-center justify-center gap-3">
                    <AlertCircle className="w-8 h-8 text-destructive" />
                    <h3 className="text-foreground font-medium text-base">Unable to load packages</h3>
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5">
                    {packs.map((pkg) => {
                      const isSelected = isPackMatch(pkg, selectedPack?.code || selectedPack?.id)
                      const badge = getBadgeForPack(pkg)
                      const packCoupons = getCouponsForPack(pkg, questionPackCoupons)
                      const primaryCoupon =
                        isSelected && isPromoApplicable
                          ? activeCoupon
                          : getPrimaryCouponForPack(pkg, questionPackCoupons)
                      const cardPricing = computePackWithCouponPricing(
                        pkg,
                        primaryCoupon,
                        activeCurrency
                      )
                      const unitPriceNum =
                        Number(cardPricing.finalPrice || 0) / Number(pkg.credits || 1)

                      return (
                        <div
                          key={pkg.id || pkg.code}
                          onClick={() => handleSelectPack(pkg)}
                          className={`relative rounded-2xl sm:rounded-3xl p-4 sm:p-7 border cursor-pointer transition-all duration-200 flex flex-col justify-between min-h-[170px] sm:min-h-[320px] ${
                            isSelected
                              ? "border-2 border-primary bg-primary/10 shadow-xl ring-1 ring-primary/40"
                              : "border-border/80 bg-accent/20 hover:border-border hover:bg-accent/40 shadow-xs"
                          }`}
                        >
                          {badge && (
                            <span className="absolute -top-2.5 left-4 sm:-top-3 sm:left-5 bg-amber-500 text-white dark:text-black font-bold text-[9px] sm:text-[10px] font-mono uppercase tracking-wider px-2 sm:px-2.5 py-0.5 rounded-full shadow-xs">
                              {badge}
                            </span>
                          )}

                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                                {pkg.name || pkg.tier}
                              </span>
                              <div
                                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border flex items-center justify-center transition-all ${
                                  isSelected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border/80 bg-transparent"
                                }`}
                              >
                                {isSelected && <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />}
                              </div>
                            </div>

                            <div className="mt-2.5 sm:mt-4 flex sm:block items-baseline gap-2 sm:gap-0">
                              <div className="font-serif text-3xl sm:text-[56px] md:text-[62px] font-light text-foreground tracking-tight leading-none">
                                {pkg.credits}
                              </div>
                              <div className="text-xs sm:text-sm text-muted-foreground sm:mt-1 font-sans">
                                questions
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="border-t border-border/60 my-3 sm:my-5" />

                            <div className="flex items-baseline gap-2">
                              <span className="font-mono text-xl sm:text-2xl md:text-[26px] font-semibold text-foreground">
                                {formatCurrency(cardPricing.finalPrice, cardPricing.currency)}
                              </span>
                              {cardPricing.subtotal > cardPricing.finalPrice && (
                                <span className="font-mono text-xs text-muted-foreground/60 line-through">
                                  {formatCurrency(cardPricing.subtotal, cardPricing.currency)}
                                </span>
                              )}
                            </div>

                            <div className="text-xs text-muted-foreground mt-0.5 sm:mt-1 font-sans">
                              {cardPricing.currency === "INR"
                                ? formatCurrency(Math.round(unitPriceNum), cardPricing.currency)
                                : formatCurrency(unitPriceNum, cardPricing.currency)}{" "}
                              per question
                            </div>

                            {primaryCoupon && (
                              <div className="mt-2.5 sm:mt-4 flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                                    isSelected
                                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-semibold"
                                      : "bg-accent/50 border-border/80 text-muted-foreground"
                                  }`}
                                >
                                  <Tag className="w-2.5 h-2.5 shrink-0" />
                                  <span>CODE {primaryCoupon.code}</span>
                                </span>
                                {formatCouponBadgeText(
                                  primaryCoupon,
                                  cardPricing.currency,
                                  cardPricing.discountAmount
                                ) && (
                                  <span className="text-[10px] font-mono font-semibold text-amber-600 dark:text-amber-400">
                                    {formatCouponBadgeText(
                                      primaryCoupon,
                                      cardPricing.currency,
                                      cardPricing.discountAmount
                                    )}
                                  </span>
                                )}
                                {packCoupons.length > 1 && (
                                  <span className="text-[10px] font-mono text-muted-foreground">
                                    +{packCoupons.length - 1} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="shrink-0 bg-card/95 backdrop-blur-md px-5 sm:px-9 py-3.5 sm:py-5 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.15em] sm:tracking-[0.2em] uppercase text-muted-foreground text-center sm:text-left">
                  SECURE PAYMENT · {selectedPricing.currency === "INR" ? "GST INVOICE" : "TAX INVOICE"} · INSTANT CREDIT
                </span>

                <Button
                  type="button"
                  disabled={!selectedPack || isLoadingPacks}
                  onClick={handleContinueToStep2}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-medium shadow-md shadow-primary/20 hover:brightness-105 transition flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer disabled:opacity-50"
                >
                  {selectedPack ? (
                    <>
                      <span>Continue with {selectedPack.credits} questions</span>
                      <span className="text-primary-foreground/40">·</span>
                      <span>{formatCurrency(finalPrice, selectedPricing.currency)}</span>
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
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="pt-5 sm:pt-8 px-5 sm:px-9 pb-3.5 sm:pb-4 flex items-center justify-between border-b border-border/60 shrink-0">
                <div className="flex items-center gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-border/80 bg-accent/60 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition cursor-pointer"
                    aria-label="Back to packages"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground block leading-tight mb-0.5">
                      STEP 2 OF 2
                    </span>
                    <h2 className="font-serif text-xl sm:text-[28px] font-normal text-foreground">
                      Payment summary
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleModalClose}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-accent/60 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 sm:px-9 py-5 sm:py-7 min-h-0 overscroll-contain">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
                <div className="md:col-span-7 space-y-6">
                  {/* 1. YOUR PACK & QUICK SWITCH */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                        SELECT RECHARGE PACK
                      </span>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-[11px] font-mono uppercase tracking-[0.15em] text-primary hover:underline transition cursor-pointer font-semibold"
                      >
                        FULL DETAILS &gt;
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      {packs.map((pkg) => {
                        const isSelected = isPackMatch(pkg, selectedPack?.code || selectedPack?.id)
                        const badge = getBadgeForPack(pkg)
                        const relatedCoupon =
                          isSelected && isPromoApplicable
                            ? activeCoupon
                            : getPrimaryCouponForPack(pkg, questionPackCoupons)
                        const pPricing = computePackWithCouponPricing(
                          pkg,
                          relatedCoupon,
                          activeCurrency
                        )
                        return (
                          <div
                            key={pkg.id || pkg.code}
                            onClick={() => handleSelectPack(pkg)}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                              isSelected
                                ? "border-primary bg-primary/10 ring-1 ring-primary/40 shadow-md"
                                : "border-border/80 bg-accent/20 hover:border-border hover:bg-accent/40"
                            }`}
                          >
                            {badge && (
                              <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded-full text-[8px] font-mono font-bold uppercase bg-amber-500 text-white dark:text-black">
                                {badge}
                              </span>
                            )}
                            <div className="flex items-center justify-between w-full">
                              <span
                                className={`text-[11px] font-mono uppercase tracking-wider font-semibold ${
                                  isSelected ? "text-primary" : "text-muted-foreground"
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
                                <span className="text-xs font-sans text-muted-foreground">Qs</span>
                              </div>
                              <div className="font-mono text-xs text-foreground font-medium mt-1">
                                {formatCurrency(pPricing.finalPrice, pPricing.currency)}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-2 font-sans flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>{selectedPack.name} Pack ({selectedPack.credits} questions) · never expires</span>
                    </div>
                  </div>

                  {/* 2. BILLING STATE / REGION */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
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
                            className="w-full rounded-2xl border border-border/80 bg-accent/30 px-5 py-3.5 text-sm text-foreground flex items-center justify-between hover:border-primary/40 transition cursor-pointer"
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
                          className="w-[var(--radix-popover-trigger-width)] rounded-2xl border border-border/80 bg-popover/95 text-popover-foreground p-2 shadow-2xl backdrop-blur-xl z-[100]"
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
                                      ? "bg-primary/15 text-primary font-semibold"
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
                      <div className="w-full rounded-2xl border border-border/80 bg-accent/30 px-5 py-3.5 text-sm text-foreground/80 font-mono">
                        International ({selectedPricing.currency}) · GST Exempt
                      </div>
                    )}
                  </div>

                  {/* 3. PROMO CODE */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 font-semibold">
                        PROMO CODE
                      </span>
                      {questionPackCoupons.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setIsCouponsModalOpen(true)}
                          className="text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition cursor-pointer"
                        >
                          VIEW ALL COUPONS ({questionPackCoupons.length}) &gt;
                        </button>
                      )}
                    </div>

                    {isPromoApplicable && !isPromoInputVisible ? (
                      <div className="space-y-2">
                        <div className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3.5 flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                            <div className="truncate">
                              <span className="text-foreground font-mono font-semibold tracking-wider">
                                {appliedPromo}
                              </span>
                              {(activeCoupon || serverBreakdown) && (
                                <span className="ml-2 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                                  ({activeCoupon
                                    ? formatCouponBadgeText(
                                        activeCoupon,
                                        selectedPricing.currency,
                                        discount
                                      )
                                    : `${formatCurrency(discount, selectedPricing.currency)} OFF`})
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                              Applied
                            </span>
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

                        {selectedPackCoupons.length > 1 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mr-1">
                              Pack Coupons:
                            </span>
                            {selectedPackCoupons.map((c) => {
                              const isCurrent =
                                c.code?.toUpperCase() ===
                                appliedPromo?.trim().toUpperCase()
                              return (
                                <button
                                  key={c.code}
                                  type="button"
                                  onClick={() => handleApplyPromo(c.code)}
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border transition cursor-pointer ${
                                    isCurrent
                                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-semibold"
                                      : "bg-accent/40 border-border/80 text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  {c.code}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2.5">
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
                            className="flex-1 rounded-2xl border border-border/80 bg-accent/30 px-5 py-3 text-xs text-foreground uppercase placeholder:text-muted-foreground focus:outline-none focus:border-primary font-mono"
                          />
                          <Button
                            type="button"
                            onClick={() => handleApplyPromo()}
                            className="bg-accent hover:bg-accent/80 text-foreground text-xs px-5 rounded-2xl cursor-pointer h-auto border border-border/80"
                          >
                            Apply
                          </Button>
                        </div>

                        {selectedPackCoupons.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mr-1">
                              Available for {selectedPack.name}:
                            </span>
                            {selectedPackCoupons.map((c) => (
                              <button
                                key={c.code}
                                type="button"
                                onClick={() => handleApplyPromo(c.code)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold transition cursor-pointer"
                              >
                                <Tag className="w-2.5 h-2.5" />
                                <span>{c.code}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Order Cost Breakdown & Razorpay CTA */}
                <div className="md:col-span-5 flex flex-col justify-between pt-1">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground block mb-4">
                      ORDER
                    </span>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center text-foreground/80">
                        <span>{selectedPack.credits} Questions</span>
                        <span className="font-mono">{formatCurrency(subtotal, selectedPricing.currency)}</span>
                      </div>

                      {isPromoApplicable && (
                        <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                          <span className="text-xs">
                            {appliedPromo} coupon applied
                          </span>
                          <span className="font-mono">
                            {discount > 0
                              ? `− ${formatCurrency(discount, selectedPricing.currency)}`
                              : "Active"}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-muted-foreground text-xs">
                        <span>Taxes and fees</span>
                        <span>{selectedPricing.currency === "INR" ? "Included (18% GST)" : "Included (0% Tax)"}</span>
                      </div>
                    </div>

                    <div className="border-t border-border/60 my-5" />

                    <div className="flex justify-between items-baseline">
                      <div>
                        <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground block">
                          TOTAL
                        </span>
                        <span className="text-[10px] text-muted-foreground/60 mt-0.5 block">
                          {selectedPricing.currency === "INR" ? "GST included" : "All taxes included"}
                        </span>
                      </div>
                      <div className="font-serif text-4xl sm:text-[44px] font-normal text-foreground tracking-tight">
                        {formatCurrency(finalPrice, selectedPricing.currency)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 space-y-2.5">
                    <Button
                      type="button"
                      disabled={isInitiating}
                      onClick={handleProceedToRazorpay}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-full font-medium shadow-md shadow-primary/20 hover:brightness-105 transition flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-60"
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
          )}
        </DialogContent>
      </Dialog>

      {/* Dynamic Coupons List Modal */}
      <Dialog open={isCouponsModalOpen} onOpenChange={setIsCouponsModalOpen}>
        <DialogContent className="sm:max-w-[460px] w-[92vw] max-w-[92vw] bg-card/90 border border-border/80 text-foreground p-5 sm:p-6 rounded-2xl sm:rounded-3xl backdrop-blur-2xl shadow-2xl max-h-[85vh] flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-border/60 shrink-0">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-500" />
              <h3 className="font-serif text-base sm:text-lg font-medium text-foreground">Available Coupons</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsCouponsModalOpen(false)}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 py-3 overflow-y-auto flex-1 min-h-0 overscroll-contain">
            {questionPackCoupons.map((coupon) => {
              const applicable = parseApplicableProducts(coupon)
              const matchesSelected =
                selectedPack && doesCouponMatchPack(coupon, selectedPack)
              const isCurrentlyApplied =
                isPromoApplicable &&
                appliedPromo?.trim().toUpperCase() ===
                  coupon.code?.toUpperCase()

              return (
                <div
                  key={coupon.code}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 shadow-xs transition-colors ${
                    isCurrentlyApplied
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : "border-border/80 bg-accent/20"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
                        {coupon.code}
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {(() => {
                          const targetPackForCoupon = matchesSelected
                            ? selectedPack
                            : (packs.find((p) => doesCouponMatchPack(coupon, p)) || selectedPack)
                          const couponPreviewPricing = computePackWithCouponPricing(
                            targetPackForCoupon,
                            coupon,
                            selectedPricing.currency
                          )
                          return formatCouponBadgeText(
                            coupon,
                            selectedPricing.currency,
                            couponPreviewPricing.discountAmount
                          )
                        })()}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/80 mt-1.5 font-medium">
                      {coupon.description || `${coupon.code} special discount`}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                      Valid on: {formatApplicablePackNames(coupon)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={isCurrentlyApplied ? "default" : "outline"}
                    onClick={() => {
                      let targetPack = selectedPack
                      if (!matchesSelected && applicable.length > 0) {
                        const firstMatchingPack =
                          findPack(applicable[0], packs) ||
                          packs.find((p) => doesCouponMatchPack(coupon, p))
                        if (firstMatchingPack) {
                          targetPack = firstMatchingPack
                          setSelectedPackId(
                            firstMatchingPack.code || firstMatchingPack.id
                          )
                        }
                      }
                      handleApplyPromo(coupon.code, targetPack)
                    }}
                    className={`text-xs shrink-0 cursor-pointer rounded-xl ${
                      isCurrentlyApplied
                        ? "bg-emerald-600 hover:bg-emerald-600/90 text-white"
                        : "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                    }`}
                  >
                    {isCurrentlyApplied ? "Applied" : "Apply"}
                  </Button>
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
