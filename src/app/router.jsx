import { createBrowserRouter, Navigate, useLocation } from "react-router-dom"
import RootLayout from "@/components/layout/RootLayout"
import HomePage from "@/pages/HomePage"
import HoroscopesListingPage from "@/pages/HoroscopesListingPage"
import HoroscopeDetailPage from "@/pages/HoroscopeDetailPage"
import CalculatorsListingPage from "@/pages/CalculatorsListingPage"
import FreeKundliPage from "@/pages/FreeKundliPage"
import KundliDisplayPage from "@/pages/KundliDisplayPage"
import OnboardingPage from "@/pages/OnboardingPage"
import ReportsListingPage from "@/pages/ReportsListingPage"
import ReportDetailPage from "@/pages/ReportDetailPage"
import InvoicesPage from "@/pages/InvoicesPage"
import MyReportsPage from "@/pages/MyReportsPage"
import BlogsListingPage from "@/pages/BlogsListingPage"
import BlogDetailPage from "@/pages/BlogDetailPage"
import ProtectedRoute from "@/components/common/ProtectedRoute"
import CompatibilityPage from "@/pages/CompatibilityPage"
import CalculatorRunnerPage from "@/pages/CalculatorRunnerPage"
import FaqPage from "@/pages/FaqPage"
import LegalPage from "@/pages/LegalPage"
import NotFoundPage from "@/pages/NotFoundPage"

function JyotishRedirect() {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  if (!searchParams.get("engine")) {
    searchParams.set("engine", "jyotish")
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
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
])

export default router
