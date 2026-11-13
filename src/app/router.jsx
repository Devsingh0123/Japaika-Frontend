import { lazy } from "react"
import { createBrowserRouter, Navigate, useLocation } from "react-router-dom"
import RootLayout from "@/components/layout/RootLayout"
import HomePage from "@/pages/HomePage"
import ProtectedRoute from "@/components/common/ProtectedRoute"
import NotFoundPage from "@/pages/NotFoundPage"

// Lazy-loaded route components (downloaded on demand per route)
const HoroscopesListingPage = lazy(() => import("@/pages/HoroscopesListingPage"))
const HoroscopeDetailPage = lazy(() => import("@/pages/HoroscopeDetailPage"))
const CalculatorsListingPage = lazy(() => import("@/pages/CalculatorsListingPage"))
const FreeKundliPage = lazy(() => import("@/pages/FreeKundliPage"))
const KundliDisplayPage = lazy(() => import("@/pages/KundliDisplayPage"))
const OnboardingPage = lazy(() => import("@/pages/OnboardingPage"))
const ReportsListingPage = lazy(() => import("@/pages/ReportsListingPage"))
const ReportDetailPage = lazy(() => import("@/pages/ReportDetailPage"))
const InvoicesPage = lazy(() => import("@/pages/InvoicesPage"))
const MyReportsPage = lazy(() => import("@/pages/MyReportsPage"))
const BlogsListingPage = lazy(() => import("@/pages/BlogsListingPage"))
const BlogDetailPage = lazy(() => import("@/pages/BlogDetailPage"))
const CompatibilityPage = lazy(() => import("@/pages/CompatibilityPage"))
const CalculatorRunnerPage = lazy(() => import("@/pages/CalculatorRunnerPage"))
const ContactPage = lazy(() => import("@/pages/ContactPage"))
const ReviewPage = lazy(() => import("@/pages/ReviewPage"))
const FaqPage = lazy(() => import("@/pages/FaqPage"))
const LegalPage = lazy(() => import("@/pages/LegalPage"))
const ComingSoonPage = lazy(() => import("@/pages/ComingSoonPage"))
const DoshasListingPage = lazy(() => import("@/pages/DoshasListingPage"))
const DoshaDetailPage = lazy(() => import("@/pages/DoshaDetailPage"))

function JyotishRedirect() {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  if (!searchParams.get("engine")) {
    searchParams.set("engine", "jyotish")
  }
  return <Navigate to={`/?${searchParams.toString()}`} replace />
}

function PricingRedirect() {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  if (!searchParams.get("pricing")) {
    searchParams.set("pricing", "1")
  }
  return <Navigate to={`/?${searchParams.toString()}`} replace />
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "onboarding",
        element: <OnboardingPage />,
      },
      {
        path: "kundli",
        element: (
          <ProtectedRoute>
            <KundliDisplayPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "chart",
        element: (
          <ProtectedRoute>
            <KundliDisplayPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "chat",
        element: <JyotishRedirect />,
      },
      {
        path: "jyotish",
        element: <JyotishRedirect />,
      },
      {
        path: "pricing",
        element: <PricingRedirect />,
      },
      {
        path: "calculators",
        element: <CalculatorsListingPage />,
      },
      {
        path: "calculators/free-kundli-maker",
        element: <FreeKundliPage />,
      },
      {
        path: "calculators/kundli",
        element: <FreeKundliPage />,
      },
      {
        path: "calculators/kundli-milan",
        element: <CompatibilityPage />,
      },
      {
        path: "calculators/:toolName",
        element: <CalculatorRunnerPage />,
      },
      {
        path: "reports",
        element: <ReportsListingPage />,
      },
      {
        path: "reports/:slug",
        element: <ReportDetailPage />,
      },
      {
        path: "my-reports",
        element: (
          <ProtectedRoute>
            <MyReportsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "blogs",
        element: <BlogsListingPage />,
      },
      {
        path: "blogs/:slug",
        element: <BlogDetailPage />,
      },
      {
        path: "blog",
        element: <Navigate to="/blogs" replace />,
      },
      {
        path: "blog/:slug",
        element: <BlogDetailPage />,
      },
      {
        path: "doshas",
        element: <DoshasListingPage />,
      },
      {
        path: "dosha",
        element: <Navigate to="/doshas" replace />,
      },
      {
        path: "doshas/:slug",
        element: <DoshaDetailPage />,
      },
      {
        path: "dosha/:slug",
        element: <DoshaDetailPage />,
      },
      {
        path: "invoices",
        element: <InvoicesPage />,
      },
      {
        path: "horoscope",
        element: <HoroscopesListingPage />,
      },
      {
        path: "horoscopes",
        element: <HoroscopesListingPage />,
      },
      {
        path: "horoscopes/:sign/:timeframe",
        element: <HoroscopeDetailPage />,
      },
      {
        path: "horoscope/:sign/:timeframe",
        element: <HoroscopeDetailPage />,
      },
      {
        path: "horoscopes/:sign",
        element: <HoroscopeDetailPage />,
      },
      {
        path: "horoscope/:sign",
        element: <HoroscopeDetailPage />,
      },
      {
        path: "compatibility",
        element: <CompatibilityPage />,
      },
      {
        path: "contact",
        element: <ContactPage />,
      },
      {
        path: "contact-us",
        element: <ContactPage />,
      },
      {
        path: "review",
        element: <ReviewPage />,
      },
      {
        path: "reviews",
        element: <ReviewPage />,
      },
      {
        path: "faq",
        element: <FaqPage />,
      },
      {
        path: "faqs",
        element: <FaqPage />,
      },
      {
        path: "privacy-policy",
        element: <LegalPage defaultSlug="privacy-policy" />,
      },
      {
        path: "terms-and-conditions",
        element: <LegalPage defaultSlug="terms" />,
      },
      {
        path: "terms",
        element: <LegalPage defaultSlug="terms" />,
      },
      {
        path: "refund-policy",
        element: <LegalPage defaultSlug="refund-policy" />,
      },
      {
        path: "disclaimer",
        element: <LegalPage defaultSlug="disclaimer" />,
      },
      {
        path: "legal/:slug",
        element: <LegalPage />,
      },
      {
        path: "coming-soon",
        element: <ComingSoonPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
])

export default router
