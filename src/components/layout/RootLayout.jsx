import { useState, useEffect, useRef } from "react"
import { Outlet, ScrollRestoration, useNavigate, useLocation } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import Sidebar from "@/components/layout/Sidebar"
import MobileHeader from "@/components/layout/MobileHeader"
import Footer from "@/components/layout/Footer"
import AuthModal from "@/features/auth/AuthModal"
import QuestionPacksModal from "@/components/common/QuestionPacksModal"
import ReportPacksModal from "@/features/reports/components/ReportPacksModal"
import MyBirthDetailsModal from "@/features/user/components/MyBirthDetailsModal"
import { openAuthModal, closeAuthModal, fetchUserProfile, logout } from "@/features/auth/authSlice"
import { getStoredAccessToken, AUTH_CHANNEL_NAME } from "@/lib/api-client"
import { setUserContext } from "@/lib/analytics"

export default function RootLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false)
  const [buyModalOptions, setBuyModalOptions] = useState(null)
  const [isBuyReportsModalOpen, setIsBuyReportsModalOpen] = useState(false)
  const [buyReportsModalOptions, setBuyReportsModalOptions] = useState(null)
  const [isBirthDetailsModalOpen, setIsBirthDetailsModalOpen] = useState(false)
  const pendingActionRef = useRef(null)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user, isAuthModalOpen } = useSelector((state) => state.auth || {})
  const { activeConversationId, activeThreadId, isGenerating } = useSelector((state) => state.jyotish || {})

  const isChatActive =
    location.pathname === "/" &&
    Boolean(activeConversationId || activeThreadId || isGenerating)
  const isExcludedRoute = location.pathname === "/onboarding"
  const shouldShowFooter = !isChatActive && !isExcludedRoute

  const handleOpenBuyModal = (options) => {
    setBuyModalOptions(options || null)
    setIsBuyModalOpen(true)
  }

  const handleOpenBuyReportsModal = (options) => {
    setBuyReportsModalOptions(options || null)
    setIsBuyReportsModalOpen(true)
  }

  // App load: Fetch user profile (/auth/me) if access token exists in storage
  useEffect(() => {
    const token = getStoredAccessToken()
    if (token) {
      dispatch(fetchUserProfile())
    }
  }, [dispatch])

  // GA4 session stitching: sync user identity when authenticated profile is loaded
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      setUserContext(user)
    }
  }, [isAuthenticated, user?.id])

  // Force onboarding route if user is authenticated but onboarding is incomplete
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.onboardingCompleted === false) {
        if (location.pathname !== "/onboarding") {
          navigate("/onboarding", { replace: true })
        }
      } else if (user.onboardingCompleted === true && location.pathname === "/onboarding") {
        navigate("/", { replace: true })
      }
    } else if (!isAuthenticated && location.pathname === "/onboarding") {
      // Unauthenticated users attempting to access /onboarding are routed home with auth modal
      navigate("/", { replace: true })
      dispatch(openAuthModal())
    }
  }, [isAuthenticated, user, user?.onboardingCompleted, location.pathname, navigate, dispatch])

  // Handle shared promotion link or direct pricing URL (e.g. ?coupon=CODE or ?promo=CODE or ?pricing=1)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const promoCode = searchParams.get("coupon") || searchParams.get("promo")
    const isPricing = searchParams.get("pricing")

    if (promoCode || isPricing) {
      handleOpenBuyModal({ promoCode: promoCode ? promoCode.trim().toUpperCase() : undefined })

      searchParams.delete("coupon")
      searchParams.delete("promo")
      searchParams.delete("pricing")
      const remainingSearch = searchParams.toString()
      const newUrl = `${location.pathname}${remainingSearch ? `?${remainingSearch}` : ""}`
      navigate(newUrl, { replace: true })
    }
  }, [location.pathname, location.search, navigate])

  const handleOpenAuth = (actionCallback) => {
    if (isAuthenticated) {
      if (typeof actionCallback === "function") {
        actionCallback()
      }
      return
    }
    if (typeof actionCallback === "function") {
      pendingActionRef.current = actionCallback
    }
    dispatch(openAuthModal())
  }

  // When user completes login, execute any queued action
  useEffect(() => {
    if (isAuthenticated && pendingActionRef.current) {
      const action = pendingActionRef.current
      pendingActionRef.current = null
      action()
    }
  }, [isAuthenticated])

  // Listen for cross-tab auth state changes via Broadcast Channel API
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
      return
    }

    const channel = new BroadcastChannel(AUTH_CHANNEL_NAME)

    channel.onmessage = (event) => {
      const data = event.data
      if (!data) return

      if (data.type === "UNAUTHORIZED" || data.type === "LOGOUT") {
        dispatch(logout())
      } else if (data.type === "LOGIN") {
        dispatch(fetchUserProfile())
      }
    }

    return () => {
      channel.close()
    }
  }, [dispatch])

  return (
    <div className="h-screen w-full overflow-hidden bg-background text-foreground flex flex-col md:flex-row font-sans selection:bg-primary/30 selection:text-foreground transition-colors duration-200 print:h-auto print:overflow-visible print:block">
      <ScrollRestoration />

      {/* Desktop Collapsible Left Sidebar */}
      <div className="hidden md:flex shrink-0 print:hidden">
        <Sidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          onOpenBindModal={handleOpenAuth}
          onOpenBirthDetailsModal={() => setIsBirthDetailsModalOpen(true)}
          onOpenBuyQuestionsModal={() => handleOpenBuyModal()}
          onOpenBuyReportsModal={() => handleOpenBuyReportsModal()}
        />
      </div>

      {/* Main Viewport Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-jagannatha-aura relative transition-colors duration-200 print:h-auto print:overflow-visible print:block">
        {/* Mobile Top Header */}
        <div className="print:hidden">
          <MobileHeader
            onOpenBindModal={handleOpenAuth}
            onOpenBirthDetailsModal={() => setIsBirthDetailsModalOpen(true)}
            onOpenBuyQuestionsModal={() => handleOpenBuyModal()}
            onOpenBuyReportsModal={() => handleOpenBuyReportsModal()}
          />
        </div>

        {/* Dynamic Page Outlet with Centralized Sticky Footer */}
        <main className="flex-1 flex flex-col min-h-0 relative overflow-y-auto print:h-auto print:overflow-visible print:block">
          <div className="flex-1 flex flex-col print:block">
            <Outlet
              context={{
                onOpenBindModal: handleOpenAuth,
                onOpenAuthModal: handleOpenAuth,
                onOpenBuyModal: handleOpenBuyModal,
                onOpenBuyQuestionsModal: handleOpenBuyModal,
                onOpenBuyReportsModal: handleOpenBuyReportsModal,
                onOpenBirthDetailsModal: () => setIsBirthDetailsModalOpen(true),
              }}
            />
          </div>
          {shouldShowFooter && (
            <div className="print:hidden">
              <Footer />
            </div>
          )}
        </main>
      </div>

      {/* Global Onboarding & Chart Binding Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => dispatch(closeAuthModal())}
      />

      {/* Global Question Packs 2-Step Purchase Modal (Razorpay) */}
      <QuestionPacksModal
        isOpen={isBuyModalOpen}
        onClose={() => {
          setIsBuyModalOpen(false)
          setBuyModalOptions(null)
        }}
        onOpenAuth={handleOpenAuth}
        initialPromoCode={buyModalOptions?.promoCode}
        initialPackId={buyModalOptions?.packId}
        currency={buyModalOptions?.currency || user?.currency || "INR"}
      />

      {/* Global Report Packs 2-Step Purchase Modal */}
      <ReportPacksModal
        isOpen={isBuyReportsModalOpen}
        onClose={() => {
          setIsBuyReportsModalOpen(false)
          setBuyReportsModalOptions(null)
        }}
        onOpenAuth={handleOpenAuth}
        initialPromoCode={buyReportsModalOptions?.promoCode}
        initialPackId={buyReportsModalOptions?.packId}
        currency={buyReportsModalOptions?.currency || user?.currency || "INR"}
      />

      {/* My Birth Details Edit Modal */}
      <MyBirthDetailsModal
        isOpen={isBirthDetailsModalOpen}
        onClose={() => setIsBirthDetailsModalOpen(false)}
      />
    </div>
  )
}

